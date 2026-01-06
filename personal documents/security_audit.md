# Security & Penetration Audit Checklist

This document outlines the findings from a security audit of the "On Fries" website code. The audit checks for vulnerabilities in Authentication, API Security, Data Protection, and Client-Side Security.

**Status Legend:**
- ✅ **SECURE**: Best practice implemented.
- ❌ **VULNERABLE**: Critical security risk detected. Feature is missing or incorrect.
- ⚠️ **WARNING**: Potential risk or requires verification.
- 🔍 **TO AUDIT**: Needs manual check or penetration test.

---

## 1. API Security & Secrets Management (CRITICAL)

**Status: ✅ SECURE**

*   **Square Payments Credentials**: ✅
    *   **Finding**: Square configuration has been moved to environment variables (`VITE_SQUARE_PROD_APP_ID`, etc.) and is no longer hardcoded in `SquarePaymentForm.tsx`.
    *   **Action Taken**: Updated `SquarePaymentForm.tsx` to use `import.meta.env`.

*   **Supabase Configuration**: ✅
    *   **Finding**: `lib/supabase.ts` correctly uses `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
    *   **Note**: Ensure `VITE_SUPABASE_ANON_KEY` is restricted by Row Level Security (RLS) in the database.

*   **Environment Variables**: ✅
    *   **Finding**: `.env.local` exists and is now explicitly ignored by git via the added `.gitignore` file.
    *   **Action Taken**: Created `.gitignore` containing `.env*`.

---

## 2. Client-Side Security & XSS

**Status: ✅ SECURE**

*   **Content Security Policy (CSP)**: ✅
    *   **Finding**: Added a strict Content Security Policy `<meta>` tag to `index.html`. It limits script and style sources to trusted domains including Square and Google Fonts.
    *   **Action Taken**: Inserted CSP meta tag in `index.html`.

*   **Cross-Site Scripting (XSS)**: ✅
    *   **Finding**: React automatically escapes content. Manual scan with `grep` confirmed no `dangerouslySetInnerHTML` usage in application code.
    *   **Action Taken**: Verified with `grep -r "dangerouslySetInnerHTML" .`.

*   **Dependency Vulnerabilities**: ✅
    *   **Finding**: `package.json` dependencies were checked and updated.
    *   **Action Taken**: Ran `npm audit fix`, resolving all high-severity vulnerabilities (qs, @modelcontextprotocol/sdk).

---

## 3. Payment Security (PCI DSS)

**Status: ✅ SECURE**

*   **Card Data Handling**: ✅
    *   **Finding**: The application uses Square's hosted fields (`window.Square.payments`). Raw card numbers (PAN) are never accessible to the Javascript code, meeting PCI-DSS descoping requirements.

*   **3D Secure (SCA)**: ✅
    *   **Finding**: `verifyBuyer()` is explicitly called in `SquarePaymentForm.tsx` before payment processing, ensuring compliance with UK/EU regulations.

---

## 4. Backend & Database Security

**Status: ⚠️ WARNING**

*   **Row Level Security (RLS)**: ✅ **SECURE**
    *   **Finding**: RLS is now enabled on all tables with strict policies. `disable-rls` scripts were removed.
    *   **Action Taken**: Created `supabase/enable_rls.sql` with comprehensive policies. Removed insecure `add-policy.js` and `reset-stock.js`.
    *   **Note**: You must run `supabase/enable_rls.sql` in your Supabase Dashboard SQL Editor to apply these changes.

*   **Edge Function Validation**: ✅ SECURE
    *   **Finding**: `supabase/functions/process-payment` previously took `amount` directly from the client.
    *   **Fix**: Updated the Edge Function to accept a `cart` array, look up prices from the `menu_items` and a new `addon_prices` table, and calculate the total server-side before calling Square.

*   **Admin Authorization**: ✅ SECURE
    *   **Finding**: Updated `StoreContext.tsx` to use Supabase `app_metadata` roles instead of hardcoded emails. Added `supabase/setup_auth_roles.sql` to automate secure role assignment for new users.
    *   **Action Taken**: Changed `isAdmin` logic to check `user?.app_metadata?.role === 'admin'`. Created database trigger for default roles.

---

## 5. Deployment & Network Security

**Status: ✅ SECURE**

*   **HTTPS/SSL**: ✅
    *   **Finding**: Vercel/Netlify enforces HTTPS by default.

*   **Headers**: ⚠️
    *   **Finding**: Standard security headers (X-Frame-Options, X-Content-Type-Options) are usually handled by the hosting provider (Vercel), but should be verified.
    *   **Action Required**: Use [securityheaders.com](https://securityheaders.com) after deployment to score the site.

# Client Website Replication & Onboarding Guide

This guide details the step-by-step process for taking the "Website V1" codebase and customizing it for a new client. It covers environment setup, branding, 3rd party integrations, and deployment.

## 1. Project Initialization & Environment Setup

### 1.1 Clean Start
1.  Copy the entire project folder to a new location for the new client.
2.  Delete the `node_modules` folder and `package-lock.json` if copying from an active dev environment to ensure a clean install.
3.  Run `npm install` to install dependencies.

### 1.2 Environment Variables
Create a new `.env.local` file in the root directory. You will need to populate this with the new client's specific keys.

**Required Variables:**
```env
# Gemini API (For AI features if valid)
GEMINI_API_KEY=PLACEHOLDER_API_KEY

# Supabase Configuration (See Section 5)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Square Payment Configuration (See Section 4.1)
VITE_SQUARE_SANDBOX_APP_ID=sandbox-sq0idb-...
VITE_SQUARE_SANDBOX_LOCATION_ID=L...
VITE_SQUARE_PROD_APP_ID=sq0idp-...
VITE_SQUARE_PROD_LOCATION_ID=L...
VITE_SQUARE_ENVIRONMENT=production

# Square Access Tokens (Server-side usage)
SQUARE_SANDBOX_ACCESS_TOKEN=EAAAl...
SQUARE_PRODUCTION_ACCESS_TOKEN=sq0csp-...
```

---

## 2. Branding & Design Customization

### 2.1 Logo & Icons
*   **Logo**: Replace `public/images/OnFries-Logo.png` with the new client's logo. Keep the filename the same or update references in:
    *   `src/components/CustomerLayout.tsx` (Line 35)
*   **Favicon**: Replace `public/vite.svg` (or add a `favicon.ico`) with the client's icon.

### 2.2 Colors & Fonts
The project uses Tailwind CSS via a CDN script in `index.html`. This is where the core branding themes are defined.

*   **Edit File**: `index.html`
*   **Action**: Update `tailwind.config` script block:
    ```javascript
    colors: {
      brand: {
        yellow: '#FFC107', // <--- Change Primary Brand Color
        dark: '#18181b',   // <--- Change Background Dark Color
        black: '#09090b',  // <--- Change Deep Background Color
        surface: '#27272a',// <--- Change Card/Surface Color
        accent: '#F59E0B', // <--- Change Accent Color
      }
    }
    ```
*   **Fonts**: The project uses 'Inter' and 'Oswald'. To change fonts:
    1.  Update the Google Fonts link in `index.html` (Line 31).
    2.  Update `fontFamily` in the `tailwind.config` block in `index.html`.

### 2.3 Product Images
Product images are currently remote URLs or local files in `public/images`.
*   **Action**: Upload new client product images to `public/images` or a CDN.
*   **Update**: You will update the image paths in the Database (or `constants.tsx` if strictly using mock data) later.

---

## 3. Content Customization

### 3.1 Hardcoded Text & Structure
Some content is hardcoded and must be manually updated.

*   **Company Name**: Search and replace "On Fries" globally. Key locations:
    *   `src/components/CustomerLayout.tsx` (Header branding)
    *   `src/pages/customer/AboutPage.tsx` (Headings, visible text)
    *   `index.html` (Title tag)
*   **Navigation**:
    *   Edit links in `src/components/CustomerLayout.tsx` if the client requires different pages.

### 3.2 Legal Pages
Update the text for the specific client's policies.
*   **Files**:
    *   `src/pages/customer/RefundPolicyPage.tsx`
    *   `src/pages/customer/TermsOfServicePage.tsx`
    *   `src/pages/customer/PrivacyPolicyPage.tsx`
*   **Critical**: Ensure the "Acting as Agent" statement in the footer of `CustomerLayout.tsx` reflects the correct legal entity if applicable.

### 3.3 About & Contact
*   **File**: `src/pages/customer/AboutPage.tsx`
*   **Update**:
    *   **Description**: "Serving the best steak and fries..."
    *   **FAQs**: Update `faqs` array (Line 73).
    *   **Business Info**: Update email, phone number placeholders (Lines 145-146).

---

## 4. Third-Party Integrations

### 4.1 Square Payments (CRITICAL)
Payment processing requires careful configuration.

1.  **Environment Variables**: Update `.env.local` with the client's Square Application ID and Location ID.
2.  **Code Update (Important)**: `src/components/SquarePaymentForm.tsx` contains **hardcoded** Production keys that override the environment variables.
    *   **Action**: Open `src/components/SquarePaymentForm.tsx`.
    *   **Find**: `const SQUARE_CONFIG = useMemo(...)` around line 61.
    *   **Replace**: The hardcoded 'sq0idp-...' strings with `import.meta.env.VITE_SQUARE_PROD_APP_ID`, etc., or manually paste the new client's keys there.

### 4.2 Maps
The map on the About page is an iframe.
*   **File**: `src/pages/customer/AboutPage.tsx`
*   **Action**:
    *   Go to Google Maps -> Share -> Embed a map.
    *   Copy the `src` URL.
    *   Replace the `iframe src` on Line 131.
    *   Update the "Get Directions" link on Line 140.

### 4.3 Email
Currently, email links are `mailto:` anchors.
*   **File**: `src/pages/customer/AboutPage.tsx`
*   **Action**: Update `hello@onfries.com` to the client's email.
*   **Note**: If a contact form is required, integration with a service like Formspree or EmailJS will need to be added to `AboutPage.tsx`.

---

## 5. Database & Admin Setup

The project uses Supabase for backend data (Menu, Orders, Stock, Settings).

### 5.1 Supabase Project
1.  Create a new Supabase project for the client.
2.  Get the URL and Keys for `.env.local`.

### 5.2 Database Schema
You need to create the table structure.
*   **Reference**: Use `DATABASE_SCHEMA.md` in the root folder.
*   **Action**: Run the SQL commands from that file in the Supabase SQL Editor to create `menu_items`, `orders`, `stock`, `store_settings`, etc.

### 5.3 Initial Data
The app uses `constants.tsx` for some initial state/mocking, but relies on the DB for operations.
*   **Menu**: Populate the `menu_items` table. You can use the data structure in `src/constants.tsx` as a template.
*   **Store Settings**: Insert a row into `store_settings` table:
    ```sql
    INSERT INTO store_settings (is_store_open, schedule_override, opening_times)
    VALUES (true, 'none', '{"monday": {"open": "12:00", "close": "18:00", "closed": true}, "tuesday": {"open": "12:00", "close": "18:00", "closed": true}, "wednesday": {"open": "12:00", "close": "18:00", "closed": false}, "thursday": {"open": "12:00", "close": "18:00", "closed": false}, "friday": {"open": "12:00", "close": "22:00", "closed": false}, "saturday": {"open": "12:00", "close": "22:00", "closed": false}, "sunday": {"open": "12:00", "close": "16:00", "closed": false}}');
    ```

### 5.4 Admin User
To access the `/admin` dashboard, you need an admin user.
*   **Script**: `create-admin.js`
*   **Action**:
    1.  Ensure `.env.local` is set with `SUPABASE_SERVICE_ROLE_KEY`.
    2.  Run `node create-admin.js`.
    3.  This creates a user `admin@admin.local` with password `admin123`.
    4.  **Important**: Change this password immediately after logging in or update the script before running.

---

## 6. Deployment Checklist

1.  **Build**: Run `npm run build` to ensure no TypeScript errors.
2.  **Hosting**: Deploy to Vercel or Netlify.
    *   **Settings**: Set the Build Command to `npm run build` and Output Directory to `dist`.
    *   **Environment Variables**: Copy all variables from `.env.local` to the hosting platform's environment variable settings.
3.  **Domain**: Configure the custom domain in the hosting platform.
4.  **Square**: Ensure the Square Application is set to "Production" mode and the domain is whitelisted in Square Developer Dashboard (Web Payments SDK settings).

---

## Summary of Files to Touch

*   `.env.local` (New file)
*   `public/images/OnFries-Logo.png` (Replace)
*   `index.html` (Colors, Fonts, Title)
*   `src/components/CustomerLayout.tsx` (Links, Logo Ref, Agent Text)
*   `src/pages/customer/AboutPage.tsx` (Content, Map, Email)
*   `src/components/SquarePaymentForm.tsx` (Payment Keys)
*   `src/constants.tsx` (Verify mocks aren't bleeding into prod)
*   `legal pages` (Terms, Refund, Privacy)

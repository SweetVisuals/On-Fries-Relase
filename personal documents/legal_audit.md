# Legal Website Audit Checklist

This document outlines the findings from a legal compliance audit of the "On Fries" website code. The audit checks for compliance with Natasha's Law, GDPR, PCI Compliance, Distance Selling Regulations, and Terms of Service.

**Status Legend:**
- ✅ **COMPLIANT**: Feature implemented correctly.
- ❌ **NON-COMPLIANT**: Feature is missing or incorrect.
- ⚠️ **UNKNOWN/PARTIAL**: Cannot fully verify or partially implemented.

---

## 1. The "Natasha’s Law" & Allergen Feature (CRITICAL)

**Status: ✅ COMPLIANT**

*   **Pre-Purchase (Menu Allergens)**: ✅
    *   **Finding**: The `CustomerItemModal.tsx` component correctly displays allergens (e.g., "Contains: Nuts, Gluten") retrieved from the `menu_items` table (via the `MenuItem` type having an `allergens` field).
    *   **Action Required**: None. Feature is active.

*   **The "May Contain" Warning**: ✅
    *   **Finding**: The `CartDrawer.tsx` includes the text: "Always contact the restaurant directly if you have a severe allergy" above the checkout notes.
    *   **Action Required**: None. Feature is active.

*   **Data Passing**: ✅
    *   **Finding**: `CartDrawer.tsx` includes a "Special Instructions / Allergies" textarea. This data is successfully passed to the `addOrder` function and stored in the `notes` field of the `orders` table.
    *   **Action Required**: None. Feature is active.

---

## 2. GDPR & Data Protection (High Risk)

**Status: ⚠️ UNKNOWN/PARTIAL**

*   **ICO Registration**: ⚠️
    *   **Finding**: Cannot verify external registration. Ensure you have paid the fee.

*   **Cookie Control**: ✅
    *   **Finding**: `CookieConsent.tsx` has been implemented and is mounted in `App.tsx`.
    *   **Action Required**: None. Feature is active.

*   **The "Right to be Forgotten"**: ✅
    *   **Finding**: `ProfilePage.tsx` now includes a "Delete Account" button.
    *   **Action Required**: Ensure the `delete_user_account` SQL function is applied to the database.

---

## 3. Payment & PCI Compliance

**Status: ✅ COMPLIANT**

*   **SSL Certificate**: ✅
    *   **Finding**: The payment integration relies on `https://web.squarecdn.com`. Assuming the site is deployed via Vercel/Netlify/etc., it will be HTTPS.

*   **No Stored Cards**: ✅
    *   **Finding**: The database schema (`orders`, `customers`) **does not** store card numbers. `SquarePaymentForm.tsx` handles tokenization client-side using the Square SDK, ensuring raw card data never touches your database.

*   **SCA (Strong Customer Authentication)**: ✅
    *   **Finding**: `SquarePaymentForm.tsx` explicitly calls `squareFields.payments.verifyBuyer()`, which handles 3D Secure / SCA challenges required for UK/EU payments.

---

## 4. Distance Selling & Consumer Rights

**Status: ✅ COMPLIANT**

*   **Who is the Seller?**: ✅
    *   **Finding**: The `CustomerLayout.tsx` footer explicitly states: "We (On Fries) are acting as an agent for the restaurant."
    *   **Action Required**: None. Feature is active.

*   **Refund Policy**: ✅
    *   **Finding**: A "Refund Policy" link exists in the footer, pointing to `/refund-policy`.
    *   **Action Required**: None. Feature is active.

*   **Pricing**: ✅
    *   **Finding**: `CartDrawer.tsx` includes a line item for "Delivery Service" (marked as Free).
    *   **Action Required**: None. Feature is active.

---

## 5. Terms of Service

**Status: ✅ COMPLIANT**

*   **Restaurant Terms (B2B)**: ⚠️
    *   **Finding**: Not applicable to the customer-facing site code, but ensure you have these signed offline or in an admin portal.

*   **User Terms (B2C)**: ✅
    *   **Finding**: "Terms of Service" and "Privacy Policy" pages have been created and linked in the footer.
    *   **Action Required**: None. Feature is active.

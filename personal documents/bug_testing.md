# Bug Testing & Pre-Launch Cleanup Checklist

Use this guide to manually verify the website's functionality and prepare for the final push.

## 🧹 Pre-Launch Cleanup
Items to remove or clean up before deployment.

### 🗑️ Files & Folders to Delete
- [ ] **`REFERENCE/` folder**: Contains old versions of `SquarePaymentForm` and `CartDrawer`. Delete the entire directory.
- [ ] **`create-admin.js`**: Setup script. Can be deleted if admin is created, or moved to a `scripts/` folder and gitignored.
- [ ] **`create_addon_prices_table.sql`**, **`update_menu_order.sql`**, etc.: SQL scripts. Safe to keep for reference, but ensure they are not exposed if deploying static assets (Vite excludes them from build usually, so this is ensuring repo hygiene).

### 🔍 Console Logs & Code Cleanup
Remove identifying or debug logs from these files:
- [ ] **`components/SquarePaymentForm.tsx`**:
  - `console.log('SquarePaymentForm rendered with amount:', amount);`
  - `console.log('Cart data for payment:', cart);`
  - `console.log('Initializing Square with config:', ...)`
  - `console.log('Initializing Square with:', ...)`
  - `console.log('No verification token produced ...')`
  - *Keep `console.error` for critical failures if desired, or replace with toast notifications only.*
- [ ] **`components/CartDrawer.tsx`**:
  - `console.log('Starting order creation process...', ...)`

---

## 🧪 Manual Bug Testing List

### 👤 Customer Experience

#### 1. Navigation & Access
- [ ] **Landing Page**: Verify all sections load (Hero, Bento Grid, Features).
- [ ] **Footer Links**: Test "Refund Policy", "Terms of Service", "Privacy Policy", "About Us" links work.
- [ ] **Responsive Design**: Resize window to mobile width. Check hamburger menu (if applicable) or bottom nav.

#### 2. Ordering Flow (The Critical Path)
- [ ] **Menu Page**:
  - Scroll through categories.
  - Click an item to open **CustomerItemModal**.
  - Select "Add-ons" (if any).
  - Adjust Quantity.
  - **Add to Order**: Verify cart badge count updates.
- [ ] **Cart Drawer**:
  - Open cart.
  - Verify items, quantities, and prices match.
  - Test **Trash Icon**: Remove an item.
  - **Special Instructions**: Type a note (e.g., "No onions").
- [ ] **Checkout (Square Payment)**:
  - Click "Pay Securely" (ensure you are logged in, or test "Log In to Order" flow).
  - **Test Mode**: Verify blue "TEST" badge is visible (if in sandbox).
  - Enter Test Card: `4111 1111 1111 1111`.
  - Submit Payment.
  - **Success State**: Verify "Order Confirmed" screen appears *inside* the drawer or modal.
  - Close confirmation. Verify Cart is now empty.

#### 3. User Profile
- [ ] **Login/Signup**: Log out and log back in.
- [ ] **Profile Page**:
  - Check "Current Orders": Should show the order you just placed.
  - Check "Order History": Verify past orders load.
  - Update details (if feature exists): Try changing name/email.

---

### 🛡️ Admin Dashboard (`/admin`)

#### 1. Live Operations
- [ ] **Current Orders**:
  - Locate the new order placed in the User test.
  - **Status Change**: Move status from "Received" -> "Cooking" -> "Ready".
  - Verify order moves to the correct column/list.
  - **Order Details**: Click order to view details (notes, addons).
  - **Complete Order**: Mark as "Completed". Verify it vanishes from "Current" and moves to "Past".

#### 2. Menu Management
- [ ] **Stock Management**:
  - Go to **Stock** tab.
  - Toggle "In Stock" / "Out of Stock" for an item.
  - *Verification*: Go to Customer Menu (incognito window) and verify item updates immediately.
- [ ] **Edit Item** (if available): Change a price or description. Verify reflection on Menu.

#### 3. Data & Settings
- [ ] **Past Orders**: Verify the completed test order appears here.
- [ ] **Customers**: Check if the test user appears in the customer list.
- [ ] **Settings**:
  - **Store Status**: Toggle "Store Open" / "Store Closed".
  - *Verification*: as Customer, try to checkout. Should see "Store Closed" button.

### 🔌 Edge Cases & Errors
- [ ] **Empty Cart**: Try to checkout with nothing.
- [ ] **Declined Card**: Use test card `4000 0000 0000 0002` (Square decline test). Verify error message appears nicely.
- [ ] **Network Error**: Disconnect Wifi, try to load a page or submit form. (Optional: check for graceful degradation).

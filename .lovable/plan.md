

# BizNep — All-in-One Commerce Management Platform for Nepal

## Overview
A complete commerce management web app built with React + Vite + Tailwind + shadcn/ui, powered by Supabase (Lovable Cloud) for auth, database, and edge functions. All UI is original — no copied branding or layouts. No subscription/pricing/paywall logic anywhere.

---

## Architecture

**Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Radix UI
**State**: React Query (server state) + Zustand (UI state like POS cart)
**Forms**: React Hook Form + Zod validation
**Charts**: Recharts
**Backend**: Supabase (Lovable Cloud) — Auth, PostgreSQL, Edge Functions, Row Level Security
**PDF**: Client-side invoice generation

---

## Database Schema (Supabase Tables)

- **businesses** — name, address, phone, email, logo_url, tax_id, currency (NPR default)
- **branches** — business_id, name, address, phone, is_main
- **profiles** — user_id (FK auth.users), business_id, full_name, phone, avatar
- **user_roles** — user_id, role (admin/manager/cashier), branch_id
- **categories** — business_id, name, description, parent_id
- **products** — business_id, name, sku, barcode, category_id, cost_price, selling_price, tax_rate, image_url, status, tags
- **product_variants** — product_id, name, sku, barcode, price_override, attributes (JSONB)
- **inventory_items** — product_id (or variant_id), branch_id, quantity, low_stock_threshold
- **inventory_movements** — inventory_item_id, type (in/out/transfer/adjustment), quantity, reference, notes, created_by
- **customers** — business_id, name, phone, email, address, notes
- **orders** — business_id, branch_id, customer_id, order_number, status, subtotal, discount, tax, total, payment_status, notes, created_by
- **order_items** — order_id, product_id (nullable for custom items), variant_id, custom_name, custom_price, quantity, unit_price, discount, total, notes
- **payments** — order_id, method (cash/qr/manual), amount, reference, status, paid_at
- **invoices** — order_id, invoice_number, business_info (JSONB), customer_info (JSONB), items (JSONB), totals (JSONB), generated_at
- **shipments** — order_id, courier, tracking_number, status (pending/picked_up/in_transit/delivered), estimated_delivery, notes
- **notifications** — user_id, business_id, title, message, type, read, data (JSONB)

---

## Pages & Modules

### 1. Landing Page
- Hero section with value proposition for Nepal-based businesses
- Feature highlights (POS, Inventory, Analytics, Multi-branch)
- CTA to sign up — NO pricing section

### 2. Auth (Login / Signup / Reset Password)
- Email + password auth via Supabase
- Post-signup onboarding: business name, branch setup

### 3. Dashboard
- Revenue cards (today, this week, this month)
- Orders summary (pending, completed, cancelled)
- Sales trend chart (Recharts line chart)
- Top 5 products bar chart
- Low stock alerts list
- Recent orders table
- Branch performance comparison (if multi-branch)

### 4. Products Module
- Product list with search, filter by category/status, sort
- Create/edit product form (name, SKU, barcode, category, prices, image, variants)
- Bulk actions (delete, update status)
- Category management sub-page

### 5. Inventory Module
- Stock levels table per branch
- Stock transfer form (branch to branch)
- Stock adjustment form (add/remove with reason)
- Low stock alerts dashboard
- Movement history log with filters

### 6. Orders Module
- Order list with status filters, search, date range
- Order detail page: items, payment, delivery timeline, status updates
- Manual order creation form
- Order status workflow (pending → confirmed → processing → completed/cancelled)

### 7. POS System (Advanced)
- Split layout: product grid/search on left, cart on right
- Quick product search + barcode-ready input field
- Add to cart with quantity adjustment
- **Custom product entry**: name + price + optional quantity + optional note — appears only in that order, not saved to product DB
- Cart supports mix of catalog products + custom items
- Customer selector (search existing or create new inline)
- Discount support (% or fixed, per-item or order-level)
- Payment: select method (cash, QR, manual), enter amount, calculate change
- Checkout generates order + invoice automatically
- Print/download invoice after checkout

### 8. Customer Module
- Customer list with search
- Customer profile page:
  - Info card (name, phone, email, address)
  - Stats: total spend, order count, last purchase
  - Transaction history table (all orders)
  - Payment history
  - Notes section (add/edit notes)
  - Invoice list with view/download per order

### 9. Invoices
- Auto-generated on order completion
- Includes: business info, customer info, all items (including custom POS items), subtotal, discount, tax, total, payment method, date
- PDF-ready view with download button
- Invoice number auto-increment

### 10. Payments Module
- Transaction log (all payments across orders)
- Filter by method, status, date range
- Payment status tracking (pending/completed/failed)
- Manual payment recording

### 11. Logistics / Delivery
- Delivery list with status filters
- Create delivery for an order
- Status updates (pending → picked up → in transit → delivered)
- Courier and tracking number fields

### 12. Analytics & Reports
- Sales report with date range picker
- Revenue trend line chart
- Top products bar chart
- Branch comparison chart
- Payment method breakdown pie chart
- Export-ready table views

### 13. Staff & Roles
- Staff list with role badges
- Invite staff (email)
- Role assignment (Admin / Manager / Cashier)
- Role-based access control on routes and actions

### 14. Settings
- Business info (name, logo, address, tax ID)
- Branch management (add/edit/delete branches)
- Receipt/invoice customization (logo, footer text)
- Tax settings placeholder
- Notification preferences

---

## Design System
- Sidebar navigation with collapsible icon mode
- Light & dark mode toggle
- Card-based dashboard layout
- Loading skeletons on all data-fetching views
- Toast notifications for all actions
- Empty states with illustrations
- Responsive: desktop sidebar, mobile bottom nav or sheet
- Nepali Rupee (NPR) formatting throughout

---

## Demo/Seed Data
- 20+ sample products across categories (electronics, clothing, grocery)
- 10+ customers with varied purchase histories
- 30+ orders with mixed statuses
- Payment records across methods
- Inventory across 2 sample branches
- All with Nepal-relevant context (Kathmandu, Pokhara branches, NPR currency)

---

## Implementation Order
1. Set up Lovable Cloud backend + database schema + RLS policies
2. Auth + onboarding flow
3. App shell (sidebar, routing, theme toggle)
4. Dashboard with charts
5. Products + Categories CRUD
6. Inventory management
7. Orders system
8. POS system with custom products + invoicing
9. Customer module with profiles
10. Payments module
11. Logistics module
12. Analytics/Reports
13. Staff & roles
14. Settings
15. Landing page
16. Seed data


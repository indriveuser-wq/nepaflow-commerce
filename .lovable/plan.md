

## Plan: Fix Staff Removal, Invoice Business Info, and Add Stock Purchase with Vendors

### Problem Analysis

**1. Staff removal fails** — The `profiles` table RLS UPDATE policy only allows `id = auth.uid()`, meaning admins can only update their own profile. When an admin tries to remove another staff member (setting `business_id: null`), the RLS policy blocks it silently.

**2. Invoice shows wrong business info** — `InvoiceView.tsx` imports hardcoded `mockBusiness` from mock data instead of fetching the real business record from the database.

**3. Stock purchase with vendor tracking** — New feature requiring a `vendors` table and a `stock_purchases` table to record purchase history with vendor details.

---

### Step 1: Fix staff removal/editing via database function

Create a `SECURITY DEFINER` function `admin_update_staff` that allows admins to update other profiles within their business. Also create `admin_remove_staff` to handle the full removal flow (unlink profile + delete role) atomically.

**Migration SQL:**
- `admin_update_staff(_target_user_id, _full_name, _branch_id, _status)` — verifies caller is admin and target is in same business
- `admin_remove_staff(_target_user_id)` — sets profile inactive, nulls business_id/branch_id, deletes role

**Code change in `Staff.tsx`:** Replace direct `.update()` / `.delete()` calls with `supabase.rpc('admin_update_staff', ...)` and `supabase.rpc('admin_remove_staff', ...)`.

### Step 2: Fix invoice to use real business data

**`InvoiceView.tsx`:** Remove `mockBusiness` import. Fetch the business record from `businesses` table using the authenticated user's `profile.business_id`. Also fetch the order from the `orders` + `order_items` tables instead of using the mock order store.

### Step 3: Create vendors table

**Migration:**
```sql
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Members can read vendors in their business
CREATE POLICY "Members can read vendors" ON public.vendors
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

-- Admin/manager can manage vendors
CREATE POLICY "Admin/manager manage vendors" ON public.vendors
  FOR ALL TO authenticated
  USING (business_id = get_user_business_id(auth.uid()) AND is_admin_or_manager(auth.uid()));
```

### Step 4: Create stock_purchases table

**Migration:**
```sql
CREATE TABLE public.stock_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  product_id uuid NOT NULL,
  vendor_id uuid REFERENCES public.vendors(id),
  quantity integer NOT NULL,
  purchase_price numeric NOT NULL DEFAULT 0,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_purchases ENABLE ROW LEVEL SECURITY;

-- Similar RLS policies scoped to business
```

### Step 5: Add "Add Stock" dialog to Inventory page

Enhance `Inventory.tsx` with a new "Add Stock" dialog containing:
- **Product selection** — dropdown of existing products, or fields to create a new product (name, SKU)
- **Quantity and purchase price** inputs
- **Branch selection** dropdown
- **Purchase date** — date picker defaulting to today
- **Vendor section:**
  - A combined dropdown/input: if vendors exist, show a searchable dropdown with an "Add new vendor" option
  - When "new vendor" is selected, show inline fields for vendor name, phone (optional), email (optional)
- On submit: create vendor if new, insert `stock_purchases` record, and upsert `inventory_items` (increase quantity or create new row)
- Immediately refresh inventory list after submission

### Files to modify
- **New migration** — `admin_update_staff`, `admin_remove_staff` functions + `vendors` table + `stock_purchases` table
- **`src/pages/Staff.tsx`** — use RPC calls for edit/remove
- **`src/pages/InvoiceView.tsx`** — fetch real business + order data from DB
- **`src/pages/Inventory.tsx`** — add "Add Stock" dialog with vendor support


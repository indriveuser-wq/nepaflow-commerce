export const mockBusiness = {
  id: '1', name: 'Himalayan Traders', address: 'Thamel, Kathmandu', phone: '+977-1-4123456',
  email: 'info@himalayantraders.com.np', tax_id: 'PAN-123456789', currency: 'NPR',
  logo_url: '',
};

export const mockBranches = [
  { id: '1', business_id: '1', name: 'Kathmandu Main', address: 'Thamel, Kathmandu', phone: '+977-1-4123456', is_main: true },
  { id: '2', business_id: '1', name: 'Pokhara Branch', address: 'Lakeside, Pokhara', phone: '+977-61-456789', is_main: false },
];

export const mockCategories = [
  { id: '1', name: 'Electronics', description: 'Electronic devices and accessories' },
  { id: '2', name: 'Clothing', description: 'Apparel and fashion items' },
  { id: '3', name: 'Grocery', description: 'Food and daily essentials' },
  { id: '4', name: 'Home & Kitchen', description: 'Home decor and kitchen items' },
  { id: '5', name: 'Sports', description: 'Sports equipment and gear' },
];

export const mockProducts = [
  { id: '1', name: 'Samsung Galaxy A15', sku: 'ELEC-001', barcode: '8801234567890', category_id: '1', cost_price: 18000, selling_price: 22500, tax_rate: 13, image_url: '', status: 'active', tags: ['phone', 'samsung'] },
  { id: '2', name: 'Laptop Bag Premium', sku: 'ELEC-002', barcode: '8801234567891', category_id: '1', cost_price: 1200, selling_price: 1800, tax_rate: 13, image_url: '', status: 'active', tags: ['bag', 'laptop'] },
  { id: '3', name: 'Dhaka Topi', sku: 'CLO-001', barcode: '8801234567892', category_id: '2', cost_price: 350, selling_price: 650, tax_rate: 13, image_url: '', status: 'active', tags: ['traditional', 'cap'] },
  { id: '4', name: 'Pashmina Shawl', sku: 'CLO-002', barcode: '8801234567893', category_id: '2', cost_price: 2500, selling_price: 4500, tax_rate: 13, image_url: '', status: 'active', tags: ['shawl', 'luxury'] },
  { id: '5', name: 'Basmati Rice 5kg', sku: 'GRO-001', barcode: '8801234567894', category_id: '3', cost_price: 480, selling_price: 620, tax_rate: 0, image_url: '', status: 'active', tags: ['rice', 'staple'] },
  { id: '6', name: 'Wai Wai Noodles (30pk)', sku: 'GRO-002', barcode: '8801234567895', category_id: '3', cost_price: 750, selling_price: 900, tax_rate: 0, image_url: '', status: 'active', tags: ['noodles', 'snack'] },
  { id: '7', name: 'Copper Water Bottle', sku: 'HK-001', barcode: '8801234567896', category_id: '4', cost_price: 800, selling_price: 1350, tax_rate: 13, image_url: '', status: 'active', tags: ['bottle', 'copper'] },
  { id: '8', name: 'Himalayan Tea Set', sku: 'HK-002', barcode: '8801234567897', category_id: '4', cost_price: 1500, selling_price: 2800, tax_rate: 13, image_url: '', status: 'active', tags: ['tea', 'set'] },
  { id: '9', name: 'Cricket Bat (Kashmir)', sku: 'SPT-001', barcode: '8801234567898', category_id: '5', cost_price: 3200, selling_price: 5500, tax_rate: 13, image_url: '', status: 'active', tags: ['cricket', 'bat'] },
  { id: '10', name: 'Trekking Backpack 60L', sku: 'SPT-002', barcode: '8801234567899', category_id: '5', cost_price: 4500, selling_price: 7200, tax_rate: 13, image_url: '', status: 'active', tags: ['trekking', 'backpack'] },
  { id: '11', name: 'USB-C Charger', sku: 'ELEC-003', barcode: '8801234568001', category_id: '1', cost_price: 400, selling_price: 750, tax_rate: 13, image_url: '', status: 'active', tags: ['charger', 'usb'] },
  { id: '12', name: 'Kurta Suruwal Set', sku: 'CLO-003', barcode: '8801234568002', category_id: '2', cost_price: 1800, selling_price: 3200, tax_rate: 13, image_url: '', status: 'active', tags: ['traditional', 'set'] },
  { id: '13', name: 'Sel Roti Mix 1kg', sku: 'GRO-003', barcode: '8801234568003', category_id: '3', cost_price: 180, selling_price: 280, tax_rate: 0, image_url: '', status: 'active', tags: ['mix', 'traditional'] },
  { id: '14', name: 'Brass Singing Bowl', sku: 'HK-003', barcode: '8801234568004', category_id: '4', cost_price: 2200, selling_price: 4000, tax_rate: 13, image_url: '', status: 'active', tags: ['singing bowl', 'brass'] },
  { id: '15', name: 'Bluetooth Speaker', sku: 'ELEC-004', barcode: '8801234568005', category_id: '1', cost_price: 2800, selling_price: 4200, tax_rate: 13, image_url: '', status: 'active', tags: ['speaker', 'bluetooth'] },
  { id: '16', name: 'Nepali Handmade Paper', sku: 'HK-004', barcode: '8801234568006', category_id: '4', cost_price: 150, selling_price: 320, tax_rate: 13, image_url: '', status: 'low_stock', tags: ['paper', 'handmade'] },
  { id: '17', name: 'Himalayan Pink Salt 1kg', sku: 'GRO-004', barcode: '8801234568007', category_id: '3', cost_price: 200, selling_price: 380, tax_rate: 0, image_url: '', status: 'active', tags: ['salt', 'himalayan'] },
  { id: '18', name: 'Yak Wool Blanket', sku: 'CLO-004', barcode: '8801234568008', category_id: '2', cost_price: 5500, selling_price: 9800, tax_rate: 13, image_url: '', status: 'active', tags: ['blanket', 'yak'] },
  { id: '19', name: 'Madal Drum', sku: 'SPT-003', barcode: '8801234568009', category_id: '5', cost_price: 3000, selling_price: 5200, tax_rate: 13, image_url: '', status: 'active', tags: ['drum', 'traditional'] },
  { id: '20', name: 'Khukuri Knife', sku: 'HK-005', barcode: '8801234568010', category_id: '4', cost_price: 2800, selling_price: 4800, tax_rate: 13, image_url: '', status: 'active', tags: ['knife', 'traditional'] },
];

export const mockCustomers = [
  { id: '1', name: 'Ram Bahadur Thapa', phone: '+977-9841234567', email: 'ram@email.com', address: 'Baneshwor, Kathmandu', notes: 'Regular wholesale buyer', total_spent: 125000, order_count: 15 },
  { id: '2', name: 'Sita Sharma', phone: '+977-9851234568', email: 'sita@email.com', address: 'Lakeside, Pokhara', notes: 'Prefers COD', total_spent: 45000, order_count: 8 },
  { id: '3', name: 'Bikash Gurung', phone: '+977-9861234569', email: 'bikash@email.com', address: 'New Road, Kathmandu', notes: '', total_spent: 78000, order_count: 12 },
  { id: '4', name: 'Anita Rai', phone: '+977-9801234570', email: 'anita@email.com', address: 'Mahendrapool, Pokhara', notes: 'Corporate client', total_spent: 210000, order_count: 22 },
  { id: '5', name: 'Deepak Shrestha', phone: '+977-9811234571', email: 'deepak@email.com', address: 'Putalisadak, Kathmandu', notes: '', total_spent: 32000, order_count: 5 },
  { id: '6', name: 'Kamala Poudel', phone: '+977-9821234572', email: 'kamala@email.com', address: 'Biratnagar', notes: 'Seasonal buyer', total_spent: 18500, order_count: 3 },
  { id: '7', name: 'Nabin KC', phone: '+977-9841234573', email: 'nabin@email.com', address: 'Dharan', notes: '', total_spent: 56000, order_count: 9 },
  { id: '8', name: 'Puja Maharjan', phone: '+977-9851234574', email: 'puja@email.com', address: 'Patan, Lalitpur', notes: 'VIP customer', total_spent: 340000, order_count: 35 },
  { id: '9', name: 'Sunil Tamang', phone: '+977-9861234575', email: 'sunil@email.com', address: 'Bhaktapur', notes: '', total_spent: 22000, order_count: 4 },
  { id: '10', name: 'Gita Adhikari', phone: '+977-9801234576', email: 'gita@email.com', address: 'Butwal', notes: 'Bulk orders monthly', total_spent: 165000, order_count: 18 },
];

export type OrderItem = {
  id: string;
  product_id: string | null;
  custom_name: string | null;
  custom_price: number | null;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  notes: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  branch_id: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_status: string;
  payment_method: string;
  items: OrderItem[];
  notes: string;
  created_at: string;
  created_by: string;
};

export const mockOrders: Order[] = [
  { id: '1', order_number: 'BN-KTM001', customer_id: '1', customer_name: 'Ram Bahadur Thapa', branch_id: '1', status: 'completed', subtotal: 27000, discount: 1000, tax: 3380, total: 29380, payment_status: 'paid', payment_method: 'cash', items: [
    { id: '1', product_id: '1', custom_name: null, custom_price: null, quantity: 1, unit_price: 22500, discount: 500, total: 22000, notes: '' },
    { id: '2', product_id: '2', custom_name: null, custom_price: null, quantity: 2, unit_price: 1800, discount: 500, total: 3100, notes: '' },
    { id: '3', product_id: null, custom_name: 'Screen Protector', custom_price: 500, quantity: 2, unit_price: 500, discount: 0, total: 1000, notes: 'Custom item at POS' },
  ], notes: '', created_at: '2026-03-25T10:30:00', created_by: 'admin' },
  { id: '2', order_number: 'BN-KTM002', customer_id: '4', customer_name: 'Anita Rai', branch_id: '1', status: 'processing', subtotal: 14300, discount: 0, tax: 1859, total: 16159, payment_status: 'paid', payment_method: 'qr', items: [
    { id: '4', product_id: '4', custom_name: null, custom_price: null, quantity: 2, unit_price: 4500, discount: 0, total: 9000, notes: '' },
    { id: '5', product_id: '3', custom_name: null, custom_price: null, quantity: 1, unit_price: 650, discount: 0, total: 650, notes: '' },
    { id: '6', product_id: '12', custom_name: null, custom_price: null, quantity: 1, unit_price: 3200, discount: 0, total: 3200, notes: '' },
    { id: '7', product_id: null, custom_name: 'Gift Wrapping', custom_price: 200, quantity: 1, unit_price: 200, discount: 0, total: 200, notes: 'Special packaging' },
  ], notes: 'Corporate gift order', created_at: '2026-03-25T14:00:00', created_by: 'admin' },
  { id: '3', order_number: 'BN-PKR001', customer_id: '2', customer_name: 'Sita Sharma', branch_id: '2', status: 'pending', subtotal: 7200, discount: 500, tax: 871, total: 7571, payment_status: 'pending', payment_method: 'cash', items: [
    { id: '8', product_id: '10', custom_name: null, custom_price: null, quantity: 1, unit_price: 7200, discount: 500, total: 6700, notes: '' },
  ], notes: 'Will pick up tomorrow', created_at: '2026-03-26T09:15:00', created_by: 'cashier1' },
  { id: '4', order_number: 'BN-KTM003', customer_id: '8', customer_name: 'Puja Maharjan', branch_id: '1', status: 'completed', subtotal: 9600, discount: 0, tax: 1248, total: 10848, payment_status: 'paid', payment_method: 'qr', items: [
    { id: '9', product_id: '14', custom_name: null, custom_price: null, quantity: 2, unit_price: 4000, discount: 0, total: 8000, notes: '' },
    { id: '10', product_id: '7', custom_name: null, custom_price: null, quantity: 1, unit_price: 1350, discount: 0, total: 1350, notes: '' },
  ], notes: '', created_at: '2026-03-24T16:45:00', created_by: 'admin' },
  { id: '5', order_number: 'BN-KTM004', customer_id: '3', customer_name: 'Bikash Gurung', branch_id: '1', status: 'confirmed', subtotal: 5200, discount: 200, tax: 650, total: 5650, payment_status: 'partial', payment_method: 'cash', items: [
    { id: '11', product_id: '19', custom_name: null, custom_price: null, quantity: 1, unit_price: 5200, discount: 200, total: 5000, notes: '' },
  ], notes: 'Advance payment received', created_at: '2026-03-26T11:30:00', created_by: 'admin' },
  { id: '6', order_number: 'BN-PKR002', customer_id: '6', customer_name: 'Kamala Poudel', branch_id: '2', status: 'completed', subtotal: 1520, discount: 0, tax: 0, total: 1520, payment_status: 'paid', payment_method: 'cash', items: [
    { id: '12', product_id: '5', custom_name: null, custom_price: null, quantity: 1, unit_price: 620, discount: 0, total: 620, notes: '' },
    { id: '13', product_id: '6', custom_name: null, custom_price: null, quantity: 1, unit_price: 900, discount: 0, total: 900, notes: '' },
  ], notes: '', created_at: '2026-03-23T13:00:00', created_by: 'cashier2' },
  { id: '7', order_number: 'BN-KTM005', customer_id: '5', customer_name: 'Deepak Shrestha', branch_id: '1', status: 'cancelled', subtotal: 9800, discount: 0, tax: 1274, total: 11074, payment_status: 'pending', payment_method: 'manual', items: [
    { id: '14', product_id: '18', custom_name: null, custom_price: null, quantity: 1, unit_price: 9800, discount: 0, total: 9800, notes: '' },
  ], notes: 'Customer cancelled', created_at: '2026-03-22T10:00:00', created_by: 'admin' },
  { id: '8', order_number: 'BN-KTM006', customer_id: '10', customer_name: 'Gita Adhikari', branch_id: '1', status: 'completed', subtotal: 4620, discount: 300, tax: 561, total: 4881, payment_status: 'paid', payment_method: 'qr', items: [
    { id: '15', product_id: '15', custom_name: null, custom_price: null, quantity: 1, unit_price: 4200, discount: 300, total: 3900, notes: '' },
    { id: '16', product_id: null, custom_name: 'Aux Cable', custom_price: 120, quantity: 1, unit_price: 120, discount: 0, total: 120, notes: '' },
    { id: '17', product_id: '5', custom_name: null, custom_price: null, quantity: 1, unit_price: 620, discount: 0, total: 620, notes: '' },
  ], notes: 'Bulk order', created_at: '2026-03-21T15:30:00', created_by: 'admin' },
];

export const mockPayments = mockOrders.filter(o => o.payment_status === 'paid').map((o, i) => ({
  id: String(i + 1), order_id: o.id, order_number: o.order_number, method: o.payment_method,
  amount: o.total, reference: o.payment_method === 'qr' ? `QR-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : '',
  status: 'completed', paid_at: o.created_at, customer_name: o.customer_name,
}));

export const mockInventory = mockProducts.map((p, i) => ({
  id: String(i + 1), product_id: p.id, product_name: p.name, sku: p.sku, branch_id: '1', branch_name: 'Kathmandu Main',
  quantity: Math.floor(Math.random() * 100) + 5, low_stock_threshold: 10,
})).concat(mockProducts.slice(0, 10).map((p, i) => ({
  id: String(20 + i + 1), product_id: p.id, product_name: p.name, sku: p.sku, branch_id: '2', branch_name: 'Pokhara Branch',
  quantity: Math.floor(Math.random() * 50) + 2, low_stock_threshold: 5,
})));

export const mockShipments = [
  { id: '1', order_id: '2', order_number: 'BN-KTM002', customer_name: 'Anita Rai', courier: 'Nepal Express', tracking_number: 'NE-2026-001', status: 'in_transit', estimated_delivery: '2026-03-28', created_at: '2026-03-25T16:00:00' },
  { id: '2', order_id: '3', order_number: 'BN-PKR001', customer_name: 'Sita Sharma', courier: 'FastCargo Nepal', tracking_number: 'FC-2026-042', status: 'pending', estimated_delivery: '2026-03-29', created_at: '2026-03-26T10:00:00' },
  { id: '3', order_id: '4', order_number: 'BN-KTM003', customer_name: 'Puja Maharjan', courier: 'Nepal Express', tracking_number: 'NE-2026-002', status: 'delivered', estimated_delivery: '2026-03-26', created_at: '2026-03-24T17:00:00' },
];

export const mockStaff = [
  { id: '1', name: 'Admin User', email: 'admin@himalayantraders.com.np', role: 'admin', branch: 'All Branches', status: 'active' },
  { id: '2', name: 'Rajesh Khadka', email: 'rajesh@himalayantraders.com.np', role: 'manager', branch: 'Kathmandu Main', status: 'active' },
  { id: '3', name: 'Mina Bhandari', email: 'mina@himalayantraders.com.np', role: 'cashier', branch: 'Kathmandu Main', status: 'active' },
  { id: '4', name: 'Hari Dahal', email: 'hari@himalayantraders.com.np', role: 'cashier', branch: 'Pokhara Branch', status: 'active' },
  { id: '5', name: 'Sunita Thakuri', email: 'sunita@himalayantraders.com.np', role: 'manager', branch: 'Pokhara Branch', status: 'inactive' },
];

export const salesChartData = [
  { month: 'Magh', revenue: 285000, orders: 42 },
  { month: 'Falgun', revenue: 320000, orders: 48 },
  { month: 'Chaitra', revenue: 410000, orders: 62 },
  { month: 'Baisakh', revenue: 380000, orders: 55 },
  { month: 'Jestha', revenue: 450000, orders: 68 },
  { month: 'Ashadh', revenue: 520000, orders: 78 },
];

export const paymentMethodData = [
  { name: 'Cash', value: 45, fill: 'hsl(var(--chart-1))' },
  { name: 'QR Payment', value: 35, fill: 'hsl(var(--chart-2))' },
  { name: 'Manual', value: 20, fill: 'hsl(var(--chart-3))' },
];

export const branchPerformanceData = [
  { branch: 'Kathmandu Main', revenue: 380000, orders: 55 },
  { branch: 'Pokhara Branch', revenue: 140000, orders: 23 },
];

import { create } from 'zustand';

export type CartItem = {
  id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  is_custom: boolean;
  notes: string;
};

type POSStore = {
  items: CartItem[];
  customer: { id: string; name: string; phone: string } | null;
  orderDiscount: number;
  paymentMethod: 'cash' | 'qr' | 'manual';
  amountPaid: number;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  setCustomer: (c: { id: string; name: string; phone: string } | null) => void;
  setOrderDiscount: (d: number) => void;
  setPaymentMethod: (m: 'cash' | 'qr' | 'manual') => void;
  setAmountPaid: (a: number) => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getChange: () => number;
  clearCart: () => void;
};

export const usePOSStore = create<POSStore>((set, get) => ({
  items: [],
  customer: null,
  orderDiscount: 0,
  paymentMethod: 'cash',
  amountPaid: 0,
  addItem: (item) => {
    const existing = get().items.find(i => !i.is_custom && i.product_id === item.product_id && item.product_id);
    if (existing) {
      set({ items: get().items.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i) });
    } else {
      set({ items: [...get().items, { ...item, id: crypto.randomUUID() }] });
    }
  },
  removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
  updateQuantity: (id, qty) => set({ items: get().items.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i) }),
  updateItemDiscount: (id, discount) => set({ items: get().items.map(i => i.id === id ? { ...i, discount } : i) }),
  setCustomer: (c) => set({ customer: c }),
  setOrderDiscount: (d) => set({ orderDiscount: d }),
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  setAmountPaid: (a) => set({ amountPaid: a }),
  getSubtotal: () => get().items.reduce((sum, i) => sum + (i.price * i.quantity - i.discount), 0),
  getTotal: () => get().getSubtotal() - get().orderDiscount,
  getChange: () => Math.max(0, get().amountPaid - get().getTotal()),
  clearCart: () => set({ items: [], customer: null, orderDiscount: 0, paymentMethod: 'cash', amountPaid: 0 }),
}));

import { create } from 'zustand';
import { mockOrders, type Order } from '@/lib/mock-data';

type OrderStore = {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id'>) => string;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  getOrder: (id: string) => Order | undefined;
  getNextOrderNumber: (branchCode: string) => string;
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [...mockOrders],
  addOrder: (order) => {
    const id = crypto.randomUUID();
    set({ orders: [{ ...order, id }, ...get().orders] });
    return id;
  },
  updateOrder: (id, updates) => {
    set({ orders: get().orders.map(o => o.id === id ? { ...o, ...updates } : o) });
  },
  getOrder: (id) => get().orders.find(o => o.id === id),
  getNextOrderNumber: (branchCode) => {
    const existing = get().orders.filter(o => o.order_number.includes(branchCode));
    const num = existing.length + 1;
    return `BN-${branchCode}${String(num).padStart(3, '0')}`;
  },
}));

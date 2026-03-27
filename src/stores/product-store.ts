import { create } from 'zustand';
import { mockProducts, mockCategories } from '@/lib/mock-data';

export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category_id: string;
  cost_price: number;
  selling_price: number;
  tax_rate: number;
  image_url: string;
  status: string;
  tags: string[];
};

export type Category = {
  id: string;
  name: string;
  description: string;
};

type ProductStore = {
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getActiveProducts: () => Product[];
};

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [...mockProducts],
  categories: [...mockCategories],
  addProduct: (product) => {
    const id = crypto.randomUUID();
    set({ products: [...get().products, { ...product, id }] });
  },
  updateProduct: (id, updates) => {
    set({ products: get().products.map(p => p.id === id ? { ...p, ...updates } : p) });
  },
  deleteProduct: (id) => {
    set({ products: get().products.filter(p => p.id !== id) });
  },
  getProduct: (id) => get().products.find(p => p.id === id),
  getActiveProducts: () => get().products.filter(p => p.status === 'active'),
}));

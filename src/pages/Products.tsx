import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { formatNPR, getStatusColor } from "@/lib/formatters";
import { useProductStore, type Product } from "@/stores/product-store";
import { toast } from "sonner";

const emptyForm = { name: '', sku: '', barcode: '', category_id: '', cost_price: '', selling_price: '', tax_rate: '13', status: 'active' };

export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { products, categories, addProduct, updateProduct, deleteProduct } = useProductStore();

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, p) => {
    const catName = categories.find(c => c.id === p.category_id)?.name ?? "Uncategorized";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(p);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort();

  const openAddForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode, category_id: p.category_id,
      cost_price: String(p.cost_price), selling_price: String(p.selling_price),
      tax_rate: String(p.tax_rate), status: p.status,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.sku || !form.selling_price) {
      toast.error("Name, SKU, and selling price are required");
      return;
    }
    const data = {
      name: form.name, sku: form.sku, barcode: form.barcode, category_id: form.category_id,
      cost_price: Number(form.cost_price) || 0, selling_price: Number(form.selling_price),
      tax_rate: Number(form.tax_rate) || 13, image_url: '', status: form.status, tags: [],
    };
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
      toast.success("Product updated");
    } else {
      addProduct(data);
      toast.success("Product created");
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setDeleteConfirm(null);
    toast.success("Product deleted");
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">{products.length} products in catalog</p>
        </div>
        <Button onClick={openAddForm}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingProduct(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>{editingProduct ? 'Update product details below.' : 'Fill in the details to add a new product.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Product name" /></div>
              <div className="space-y-2"><Label>SKU *</Label><Input value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="SKU-001" /></div>
            </div>
            <div className="space-y-2"><Label>Selling Price (NPR) *</Label><Input type="number" value={form.selling_price} onChange={e => updateField('selling_price', e.target.value)} placeholder="0" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => updateField('category_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Barcode</Label><Input value={form.barcode} onChange={e => updateField('barcode', e.target.value)} placeholder="Barcode" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleSubmit}>{editingProduct ? 'Update Product' : 'Create Product'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Delete Product</DialogTitle>
            <DialogDescription>Are you sure you want to delete this product? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Products grouped by category */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No products found</p>
        </div>
      ) : (
        sortedCategories.map(catName => (
          <div key={catName} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display font-semibold">{catName}</h2>
              <Badge variant="secondary" className="text-xs">{grouped[catName].length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {grouped[catName].map(p => (
                <Card key={p.id} className="group hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                        <Package className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <Badge variant="outline" className={getStatusColor(p.status)}>{p.status}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{p.sku} · {p.barcode}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Cost {formatNPR(p.cost_price)}</p>
                        <p className="text-base font-bold font-display">{formatNPR(p.selling_price)}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditForm(p); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

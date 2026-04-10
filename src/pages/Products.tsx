import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Package, FolderOpen } from "lucide-react";
import { formatNPR, getStatusColor } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Product = {
  id: string; name: string; sku: string | null; barcode: string | null;
  category_id: string | null; cost_price: number; selling_price: number;
  tax_rate: number; image_url: string | null; status: string; tags: string[] | null;
};
type Category = { id: string; name: string; description: string | null };

const emptyProduct = { name: '', sku: '', barcode: '', category_id: '', cost_price: '', selling_price: '', tax_rate: '13', status: 'active' };
const emptyCategory = { name: '', description: '' };

export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState(emptyCategory);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const { profile, role } = useAuth();
  const canManage = role === 'admin' || role === 'manager';

  const loadData = useCallback(async () => {
    if (!profile?.business_id) return;
    const [pRes, cRes] = await Promise.all([
      supabase.from('products').select('*').eq('business_id', profile.business_id),
      supabase.from('categories').select('*').eq('business_id', profile.business_id),
    ]);
    setProducts((pRes.data || []) as Product[]);
    setCategories((cRes.data || []) as Category[]);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
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

  const openAddForm = () => { setEditingProduct(null); setForm(emptyProduct); setShowForm(true); };
  const openEditForm = (p: Product) => {
    setEditingProduct(p);
    setForm({ name: p.name, sku: p.sku || '', barcode: p.barcode || '', category_id: p.category_id || '', cost_price: String(p.cost_price), selling_price: String(p.selling_price), tax_rate: String(p.tax_rate), status: p.status });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.selling_price) { toast.error("Name and selling price are required"); return; }
    const data = {
      name: form.name, sku: form.sku || null, barcode: form.barcode || null,
      category_id: form.category_id || null, cost_price: Number(form.cost_price) || 0,
      selling_price: Number(form.selling_price), tax_rate: Number(form.tax_rate) || 13,
      status: form.status, business_id: profile!.business_id!,
    };
    if (editingProduct) {
      const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from('products').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success("Product created");
    }
    setShowForm(false); setEditingProduct(null); setForm(emptyProduct);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setDeleteConfirm(null); toast.success("Product deleted"); await loadData();
  };

  // Category CRUD
  const openAddCat = () => { setEditingCat(null); setCatForm(emptyCategory); setShowCatForm(true); };
  const openEditCat = (c: Category) => { setEditingCat(c); setCatForm({ name: c.name, description: c.description || '' }); setShowCatForm(true); };

  const handleCatSubmit = async () => {
    if (!catForm.name) { toast.error("Category name is required"); return; }
    const data = { name: catForm.name, description: catForm.description || null, business_id: profile!.business_id! };
    if (editingCat) {
      const { error } = await supabase.from('categories').update(data).eq('id', editingCat.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Category updated");
    } else {
      const { error } = await supabase.from('categories').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success("Category created");
    }
    setShowCatForm(false); setEditingCat(null); setCatForm(emptyCategory);
    await loadData();
  };

  const handleDeleteCat = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setDeleteCatConfirm(null); toast.success("Category deleted"); await loadData();
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">{products.length} products in catalog</p>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4 mt-4">
          {canManage && (
            <div className="flex justify-end">
              <Button onClick={openAddForm}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No products found</p>
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
                          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center"><Package className="h-6 w-6 text-accent-foreground" /></div>
                          <Badge variant="outline" className={getStatusColor(p.status)}>{p.status}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{p.sku} · {p.barcode}</p>
                        <div className="flex items-end justify-between">
                          <p className="text-base font-bold font-display">{formatNPR(p.selling_price)}</p>
                          {canManage && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openEditForm(p); }}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); setDeleteConfirm(p.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          {canManage && (
            <div className="flex justify-end">
              <Button onClick={openAddCat}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
            </div>
          )}
          {categories.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No categories yet</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">{c.description || '—'}</TableCell>
                        <TableCell className="text-right">{products.filter(p => p.category_id === c.id).length}</TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCat(c)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteCatConfirm(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditingProduct(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>{editingProduct ? 'Update product details below.' : 'Fill in the details to add a new product.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Product name" /></div>
              <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="SKU-001" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cost Price (NPR)</Label><Input type="number" value={form.cost_price} onChange={e => updateField('cost_price', e.target.value)} placeholder="0" /></div>
              <div className="space-y-2"><Label>Selling Price (NPR) *</Label><Input type="number" value={form.selling_price} onChange={e => updateField('selling_price', e.target.value)} placeholder="0" /></div>
            </div>
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
                <Label>Tax Rate (%)</Label>
                <Input type="number" value={form.tax_rate} onChange={e => updateField('tax_rate', e.target.value)} placeholder="13" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleSubmit}>{editingProduct ? 'Update Product' : 'Create Product'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Delete Product</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Add/Edit Dialog */}
      <Dialog open={showCatForm} onOpenChange={open => { if (!open) { setShowCatForm(false); setEditingCat(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>{editingCat ? 'Update category details.' : 'Create a new product category.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" /></div>
            <Button className="w-full" onClick={handleCatSubmit}>{editingCat ? 'Update Category' : 'Create Category'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation */}
      <Dialog open={!!deleteCatConfirm} onOpenChange={open => { if (!open) setDeleteCatConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Delete Category</DialogTitle>
            <DialogDescription>Products in this category will become uncategorized.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteCatConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteCatConfirm && handleDeleteCat(deleteCatConfirm)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

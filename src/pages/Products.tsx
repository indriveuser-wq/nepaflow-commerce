import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Package, FolderOpen, Eye, ScanBarcode, X } from "lucide-react";
import { formatNPR, getStatusColor } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { normalizeBarcode } from "@/lib/barcode";

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

  // ---------- Barcode scanner (for filling Barcode field) ----------
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try { if (s.isScanning) await s.stop(); } catch {}
      try { await s.clear(); } catch {}
    }
    setScannerOpen(false);
  };

  const startScanner = async () => {
    setScannerOpen(true);
    await new Promise(r => requestAnimationFrame(() => r(null)));
    const region = document.getElementById("product-barcode-scanner-region");
    if (!region) { toast.error("Scanner region missing"); setScannerOpen(false); return; }
    try {
      const scanner = new Html5Qrcode("product-barcode-scanner-region", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;
      const onSuccess = (text: string) => {
        const code = normalizeBarcode(text);
        updateField('barcode', code);
        toast.success(`Scanned: ${code}`);
        stopScanner();
      };
      const onErr = () => {};
      try {
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 260, height: 160 } }, onSuccess, onErr);
      } catch {
        const cams = await Html5Qrcode.getCameras();
        if (!cams || cams.length === 0) throw new Error("No camera found");
        const back = cams.find(c => /back|rear|environment/i.test(c.label)) || cams[cams.length - 1];
        await scanner.start(back.id, { fps: 10, qrbox: { width: 260, height: 160 } }, onSuccess, onErr);
      }
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? "Camera permission denied. Allow camera access in browser settings."
        : err?.message || "Unable to access camera";
      toast.error(msg);
      stopScanner();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{products.length} products across {categories.length} categories</p>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="products" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm font-medium">Products</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm font-medium">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4 md:space-y-5 mt-4">
          {/* Search/Filter Bar */}
          <Card className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-card"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-10 bg-muted/40 border-0"><SelectValue /></SelectTrigger>
                  <SelectContent>{[<SelectItem key="all" value="all">All Categories</SelectItem>, ...categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)]}</SelectContent>
                </Select>
                {canManage && (
                  <Button onClick={openAddForm} className="shrink-0 h-10 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
                    <Plus className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Add Product</span>
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                <Package className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No products found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            sortedCategories.map((catName, catIdx) => (
              <div key={catName} className="space-y-3 animate-fade-in" style={{ animationDelay: `${catIdx * 100}ms`, animationFillMode: 'backwards' }}>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm md:text-base font-display font-bold text-foreground/80">{catName}</h2>
                  <Badge variant="secondary" className="text-[10px] md:text-xs font-semibold bg-primary/8 text-primary border-0">{grouped[catName].length}</Badge>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                  {grouped[catName].map(p => (
                    <Card key={p.id} className="group card-interactive overflow-hidden">
                      {/* Image area */}
                      <div className="aspect-square bg-gradient-to-br from-accent to-muted/50 flex items-center justify-center relative overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 md:h-12 md:w-12 text-muted-foreground/25" />
                        )}
                        {/* Hover overlay */}
                        {canManage && (
                          <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
                            <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full shadow-lg" onClick={e => { e.stopPropagation(); openEditForm(p); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full shadow-lg" onClick={e => { e.stopPropagation(); setDeleteConfirm(p.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {/* Status badge */}
                        <Badge variant="outline" className={`${getStatusColor(p.status)} absolute top-1.5 right-1.5 md:top-2 md:right-2 text-[8px] md:text-xs font-semibold backdrop-blur-md bg-card/80 px-1.5 py-0 md:px-2 md:py-0.5`}>
                          {p.status}
                        </Badge>
                      </div>
                      <CardContent className="p-2 md:p-4">
                        <h3 className="font-semibold text-[11px] md:text-sm leading-tight mb-0.5 line-clamp-2">{p.name}</h3>
                        {p.sku && <p className="text-[9px] md:text-xs text-muted-foreground mb-1 md:mb-2 truncate font-mono">{p.sku}</p>}
                        <div className="flex items-end justify-between mt-1 md:mt-2">
                          <div>
                            <p className="text-xs md:text-lg font-bold font-display text-primary leading-tight">{formatNPR(p.selling_price)}</p>
                            {p.cost_price > 0 && (
                              <p className="text-[9px] md:text-[10px] text-muted-foreground">Cost: {formatNPR(p.cost_price)}</p>
                            )}
                          </div>
                          {/* Mobile edit buttons */}
                          {canManage && (
                            <div className="flex gap-0.5 md:hidden">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); openEditForm(p); }}><Edit className="h-2.5 w-2.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); setDeleteConfirm(p.id); }}><Trash2 className="h-2.5 w-2.5" /></Button>
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
              <Button onClick={openAddCat} className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />Add Category
              </Button>
            </div>
          )}
          {categories.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground animate-fade-in">
              <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="font-medium">No categories yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create categories to organize your products</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Description</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Products</TableHead>
                      {canManage && <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(c => (
                      <TableRow key={c.id} className="group transition-colors">
                        <TableCell className="font-semibold">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{c.description || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-primary/8 text-primary border-0 font-semibold">
                            {products.filter(p => p.category_id === c.id).length}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => openEditCat(c)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteCatConfirm(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
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
            <DialogTitle className="font-display text-xl">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>{editingProduct ? 'Update product details below.' : 'Fill in the details to add a new product.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Name *</Label><Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Product name" className="bg-muted/40 border-0 focus-visible:ring-1" /></div>
              <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">SKU</Label><Input value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="SKU-001" className="bg-muted/40 border-0 focus-visible:ring-1 font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Cost Price (NPR)</Label><Input type="number" value={form.cost_price} onChange={e => updateField('cost_price', e.target.value)} placeholder="0" className="bg-muted/40 border-0 focus-visible:ring-1" /></div>
              <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Selling Price (NPR) *</Label><Input type="number" value={form.selling_price} onChange={e => updateField('selling_price', e.target.value)} placeholder="0" className="bg-muted/40 border-0 focus-visible:ring-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Category</Label>
                <Select value={form.category_id} onValueChange={v => updateField('category_id', v)}>
                  <SelectTrigger className="bg-muted/40 border-0"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Barcode</Label>
                <div className="flex gap-2">
                  <Input value={form.barcode} onChange={e => updateField('barcode', e.target.value)} placeholder="Barcode" className="bg-muted/40 border-0 focus-visible:ring-1 font-mono" />
                  <Button type="button" variant="outline" size="icon" onClick={startScanner} title="Scan barcode">
                    <ScanBarcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Tax Rate (%)</Label>
                <Input type="number" value={form.tax_rate} onChange={e => updateField('tax_rate', e.target.value)} placeholder="13" className="bg-muted/40 border-0 focus-visible:ring-1" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Status</Label>
                <Select value={form.status} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger className="bg-muted/40 border-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity shadow-md shadow-primary/20 font-semibold" onClick={handleSubmit}>
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
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
            <DialogTitle className="font-display text-xl">{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>{editingCat ? 'Update category details.' : 'Create a new product category.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Name *</Label><Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" className="bg-muted/40 border-0 focus-visible:ring-1" /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Description</Label><Input value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="bg-muted/40 border-0 focus-visible:ring-1" /></div>
            <Button className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity shadow-md shadow-primary/20 font-semibold" onClick={handleCatSubmit}>
              {editingCat ? 'Update Category' : 'Create Category'}
            </Button>
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

      {/* Barcode Scanner Overlay */}
      {scannerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={stopScanner}>
          <div className="w-full max-w-md bg-card rounded-xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display font-bold">
                <ScanBarcode className="h-5 w-5" /> Scan Barcode
              </div>
              <Button variant="ghost" size="icon" onClick={stopScanner}><X className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">Point your rear camera at a barcode or QR code.</p>
            <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-video">
              <div id="product-barcode-scanner-region" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
            </div>
            <Button variant="outline" className="w-full" onClick={stopScanner}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

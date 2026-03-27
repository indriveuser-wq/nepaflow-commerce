import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { formatNPR, getStatusColor } from "@/lib/formatters";
import { mockProducts, mockCategories } from "@/lib/mock-data";
import { toast } from "sonner";

export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = mockProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, p) => {
    const catName = mockCategories.find(c => c.id === p.category_id)?.name ?? "Uncategorized";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(p);
    return acc;
  }, {});

  // Sort category names alphabetically
  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">{mockProducts.length} products in catalog</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Add New Product</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input placeholder="Product name" /></div>
                <div className="space-y-2"><Label>SKU</Label><Input placeholder="SKU-001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Cost Price (NPR)</Label><Input type="number" placeholder="0" /></div>
                <div className="space-y-2"><Label>Selling Price (NPR)</Label><Input type="number" placeholder="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{mockCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Barcode</Label><Input placeholder="Barcode" /></div>
              </div>
              <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" placeholder="13" defaultValue="13" /></div>
              <Button className="w-full" onClick={() => { setShowForm(false); toast.success("Product created successfully"); }}>Create Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
            {mockCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
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

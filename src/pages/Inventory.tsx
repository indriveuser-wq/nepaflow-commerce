import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, ArrowRightLeft, Plus, AlertTriangle, Warehouse } from "lucide-react";
import AddStockDialog from "@/components/inventory/AddStockDialog";
import { getStatusColor } from "@/lib/formatters";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type InventoryRow = {
  id: string; product_id: string; branch_id: string; quantity: number;
  low_stock_threshold: number; product_name: string; sku: string; branch_name: string;
};

export default function Inventory() {
  const { profile, role } = useAuth();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [transferProduct, setTransferProduct] = useState("");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferQty, setTransferQty] = useState("");

  const [adjustProduct, setAdjustProduct] = useState("");
  const [adjustBranch, setAdjustBranch] = useState("");
  const [adjustType, setAdjustType] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const canManage = role === 'admin' || role === 'manager';

  const loadData = useCallback(async () => {
    if (!profile?.business_id) return;
    const [invRes, branchRes, prodRes] = await Promise.all([
      supabase.from('inventory_items').select('id, product_id, branch_id, quantity, low_stock_threshold, products(name, sku), branches(name)').order('quantity', { ascending: true }),
      supabase.from('branches').select('id, name').eq('business_id', profile.business_id),
      supabase.from('products').select('id, name').eq('business_id', profile.business_id),
    ]);
    setBranches(branchRes.data || []);
    setProducts(prodRes.data || []);
    const rows: InventoryRow[] = (invRes.data || []).map((r: any) => ({
      id: r.id, product_id: r.product_id, branch_id: r.branch_id, quantity: r.quantity,
      low_stock_threshold: r.low_stock_threshold, product_name: r.products?.name || 'Unknown',
      sku: r.products?.sku || '', branch_name: r.branches?.name || 'Unknown',
    }));
    setInventory(rows);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTransfer = async () => {
    if (!transferProduct || !transferFrom || !transferTo || !transferQty || transferFrom === transferTo) { toast.error("Please fill all fields correctly"); return; }
    const qty = Number(transferQty);
    if (qty <= 0) { toast.error("Quantity must be positive"); return; }
    const source = inventory.find(i => i.product_id === transferProduct && i.branch_id === transferFrom);
    if (!source || source.quantity < qty) { toast.error("Insufficient stock"); return; }
    await supabase.from('inventory_items').update({ quantity: source.quantity - qty }).eq('id', source.id);
    const dest = inventory.find(i => i.product_id === transferProduct && i.branch_id === transferTo);
    if (dest) await supabase.from('inventory_items').update({ quantity: dest.quantity + qty }).eq('id', dest.id);
    else await supabase.from('inventory_items').insert({ product_id: transferProduct, branch_id: transferTo, quantity: qty });
    toast.success("Stock transferred");
    setShowTransfer(false); setTransferProduct(""); setTransferFrom(""); setTransferTo(""); setTransferQty("");
    await loadData();
  };

  const handleAdjust = async () => {
    if (!adjustProduct || !adjustBranch || !adjustType || !adjustQty) { toast.error("Please fill all fields"); return; }
    const qty = Number(adjustQty);
    if (qty <= 0) { toast.error("Quantity must be positive"); return; }
    const item = inventory.find(i => i.product_id === adjustProduct && i.branch_id === adjustBranch);
    if (adjustType === 'remove' && (!item || item.quantity < qty)) { toast.error("Insufficient stock"); return; }
    if (item) {
      const newQty = adjustType === 'add' ? item.quantity + qty : item.quantity - qty;
      await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', item.id);
    } else if (adjustType === 'add') {
      await supabase.from('inventory_items').insert({ product_id: adjustProduct, branch_id: adjustBranch, quantity: qty });
    }
    toast.success("Stock adjusted");
    setShowAdjust(false); setAdjustProduct(""); setAdjustBranch(""); setAdjustType(""); setAdjustQty(""); setAdjustReason("");
    await loadData();
  };

  const filtered = inventory.filter(i => {
    const matchesSearch = i.product_name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter === "all" || i.branch_id === branchFilter;
    return matchesSearch && matchesBranch;
  });
  const lowStock = filtered.filter(i => i.quantity <= i.low_stock_threshold);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Manage stock across branches</p>
        </div>
        {canManage && (
          <div className="flex gap-1.5 md:gap-2 flex-wrap justify-end">
            <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><ArrowRightLeft className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Transfer</span></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">Stock Transfer</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Product</Label>
                    <Select value={transferProduct} onValueChange={setTransferProduct}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>From</Label>
                      <Select value={transferFrom} onValueChange={setTransferFrom}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>To</Label>
                      <Select value={transferTo} onValueChange={setTransferTo}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={transferQty} onChange={e => setTransferQty(e.target.value)} placeholder="0" /></div>
                  <Button className="w-full" onClick={handleTransfer}>Transfer Stock</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Adjust</span></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">Stock Adjustment</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Product</Label>
                    <Select value={adjustProduct} onValueChange={setAdjustProduct}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Branch</Label>
                    <Select value={adjustBranch} onValueChange={setAdjustBranch}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Type</Label>
                      <Select value={adjustType} onValueChange={setAdjustType}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="add">Add Stock</SelectItem><SelectItem value="remove">Remove Stock</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="0" /></div>
                  </div>
                  <div className="space-y-2"><Label>Reason</Label><Input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Reason" /></div>
                  <Button className="w-full" onClick={handleAdjust}>Save Adjustment</Button>
                </div>
              </DialogContent>
            </Dialog>
            <AddStockDialog businessId={profile!.business_id!} products={products} branches={branches} onComplete={loadData} />
          </div>
        )}
      </div>

      {lowStock.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center gap-2 text-warning text-sm font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />{lowStock.length} low stock items
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lowStock.slice(0, 5).map(i => (
                <Badge key={i.id} variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                  {i.product_name} ({i.quantity})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="p-3 md:p-6 pb-3 md:pb-4">
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 md:h-10" />
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {/* Mobile */}
          <div className="md:hidden divide-y">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No inventory items found</p>
            ) : filtered.map(item => {
              const status = item.quantity === 0 ? 'out_of_stock' : item.quantity <= item.low_stock_threshold ? 'low_stock' : 'active';
              return (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Warehouse className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.branch_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <Badge variant="outline" className={`${getStatusColor(status)} text-[10px] px-1.5 py-0`}>{status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium">Branch</th>
                  <th className="pb-2 font-medium text-right">Quantity</th>
                  <th className="pb-2 font-medium text-right">Threshold</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No inventory items found</td></tr>
                ) : filtered.map(item => {
                  const status = item.quantity === 0 ? 'out_of_stock' : item.quantity <= item.low_stock_threshold ? 'low_stock' : 'active';
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2.5"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center"><Warehouse className="h-4 w-4 text-accent-foreground" /></div><span className="font-medium text-sm">{item.product_name}</span></div></td>
                      <td className="py-2.5 text-sm text-muted-foreground">{item.sku}</td>
                      <td className="py-2.5 text-sm">{item.branch_name}</td>
                      <td className="py-2.5 text-sm text-right font-medium">{item.quantity}</td>
                      <td className="py-2.5 text-sm text-right">{item.low_stock_threshold}</td>
                      <td className="py-2.5"><Badge variant="outline" className={getStatusColor(status)}>{status.replace('_', ' ')}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

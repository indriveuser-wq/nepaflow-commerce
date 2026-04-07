import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  businessId: string;
  products: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  onComplete: () => void;
};

type Vendor = { id: string; name: string; phone: string | null; email: string | null };

export default function AddStockDialog({ businessId, products, branches, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [productId, setProductId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Vendor state
  const [vendorMode, setVendorMode] = useState<"existing" | "new">("existing");
  const [vendorId, setVendorId] = useState("");
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");

  useEffect(() => {
    if (open) {
      supabase.from('vendors').select('id, name, phone, email').eq('business_id', businessId)
        .then(({ data }) => {
          setVendors(data || []);
          if (!data || data.length === 0) setVendorMode("new");
        });
    }
  }, [open, businessId]);

  const reset = () => {
    setProductId(""); setBranchId(""); setQuantity(""); setPurchasePrice("");
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setVendorMode("existing"); setVendorId("");
    setNewVendorName(""); setNewVendorPhone(""); setNewVendorEmail("");
  };

  const handleSubmit = async () => {
    if (!productId || !branchId || !quantity || Number(quantity) <= 0) {
      toast.error("Please fill product, branch, and quantity");
      return;
    }
    setLoading(true);

    let finalVendorId: string | null = null;

    // Create vendor if new
    if (vendorMode === "new" && newVendorName.trim()) {
      const { data, error } = await supabase.from('vendors').insert({
        business_id: businessId,
        name: newVendorName.trim(),
        phone: newVendorPhone || null,
        email: newVendorEmail || null,
      }).select('id').single();
      if (error) { toast.error("Failed to create vendor: " + error.message); setLoading(false); return; }
      finalVendorId = data.id;
    } else if (vendorMode === "existing" && vendorId) {
      finalVendorId = vendorId;
    }

    // Record stock purchase
    const { error: purchaseError } = await supabase.from('stock_purchases').insert({
      business_id: businessId,
      branch_id: branchId,
      product_id: productId,
      vendor_id: finalVendorId,
      quantity: Number(quantity),
      purchase_price: Number(purchasePrice) || 0,
      purchase_date: purchaseDate,
      created_by: (await supabase.auth.getUser()).data.user?.id || null,
    });
    if (purchaseError) { toast.error("Failed to record purchase: " + purchaseError.message); setLoading(false); return; }

    // Upsert inventory
    const { data: existing } = await supabase.from('inventory_items')
      .select('id, quantity').eq('product_id', productId).eq('branch_id', branchId).maybeSingle();

    if (existing) {
      await supabase.from('inventory_items').update({ quantity: existing.quantity + Number(quantity) }).eq('id', existing.id);
    } else {
      await supabase.from('inventory_items').insert({ product_id: productId, branch_id: branchId, quantity: Number(quantity) });
    }

    toast.success("Stock added successfully");
    setLoading(false);
    setOpen(false);
    reset();
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button><PackagePlus className="h-4 w-4 mr-2" />Add Stock</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Add Stock Purchase</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* Product */}
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Purchase Price (per unit)</Label>
              <Input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label>Purchase Date</Label>
            <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          </div>

          {/* Vendor Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <Label className="text-sm font-semibold">Vendor Information</Label>
            {vendors.length > 0 && (
              <div className="flex gap-2">
                <Button type="button" variant={vendorMode === "existing" ? "default" : "outline"} size="sm" onClick={() => setVendorMode("existing")}>Existing Vendor</Button>
                <Button type="button" variant={vendorMode === "new" ? "default" : "outline"} size="sm" onClick={() => setVendorMode("new")}>New Vendor</Button>
              </div>
            )}

            {vendorMode === "existing" && vendors.length > 0 ? (
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Vendor Name</Label>
                  <Input value={newVendorName} onChange={e => setNewVendorName(e.target.value)} placeholder="Vendor name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Phone (optional)</Label>
                    <Input value={newVendorPhone} onChange={e => setNewVendorPhone(e.target.value)} placeholder="Phone" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email (optional)</Label>
                    <Input value={newVendorEmail} onChange={e => setNewVendorEmail(e.target.value)} placeholder="Email" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Add Stock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

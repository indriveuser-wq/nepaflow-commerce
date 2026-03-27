import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Minus, Trash2, User, ShoppingBag, CreditCard, Banknote, QrCode } from "lucide-react";
import { formatNPR } from "@/lib/formatters";
import { mockProducts, mockCustomers, mockCategories } from "@/lib/mock-data";
import { usePOSStore, type CartItem } from "@/stores/pos-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function POS() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCustomProduct, setShowCustomProduct] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customNote, setCustomNote] = useState("");
  const navigate = useNavigate();

  const store = usePOSStore();

  const filteredProducts = mockProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory && p.status === 'active';
  });

  const filteredCustomers = mockCustomers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  );

  const addProduct = (product: typeof mockProducts[0]) => {
    store.addItem({ product_id: product.id, name: product.name, price: product.selling_price, quantity: 1, discount: 0, is_custom: false, notes: '' });
  };

  const addCustomProduct = () => {
    if (!customName || !customPrice) { toast.error("Name and price required"); return; }
    store.addItem({ product_id: null, name: customName, price: Number(customPrice), quantity: Number(customQty) || 1, discount: 0, is_custom: true, notes: customNote });
    setCustomName(""); setCustomPrice(""); setCustomQty("1"); setCustomNote(""); setShowCustomProduct(false);
    toast.success("Custom item added");
  };

  const handleCheckout = () => {
    if (store.items.length === 0) { toast.error("Cart is empty"); return; }
    if (store.amountPaid < store.getTotal() && store.paymentMethod === 'cash') { toast.error("Insufficient payment"); return; }
    toast.success("Order completed! Invoice generated.");
    store.clearCart();
    setShowPayment(false);
    navigate('/orders');
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products or scan barcode..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" autoFocus />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {mockCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(p => (
              <Card key={p.id} className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" onClick={() => addProduct(p)}>
                <CardContent className="p-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-2">
                    <ShoppingBag className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <p className="font-medium text-sm line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.sku}</p>
                  <p className="font-bold text-sm mt-1">{formatNPR(p.selling_price)}</p>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">No products found</div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <Card className="w-[380px] flex flex-col shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg">Cart</CardTitle>
            <div className="flex gap-1">
              <Dialog open={showCustomProduct} onOpenChange={setShowCustomProduct}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Custom</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">Add Custom Product</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2"><Label>Product Name *</Label><Input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Screen Protector" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>Price (NPR) *</Label><Input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="0" /></div>
                      <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={customQty} onChange={e => setCustomQty(e.target.value)} /></div>
                    </div>
                    <div className="space-y-2"><Label>Note (optional)</Label><Textarea value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="Any notes..." rows={2} /></div>
                    <Button className="w-full" onClick={addCustomProduct}>Add to Cart</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {/* Customer */}
          <div className="mt-2">
            {store.customer ? (
              <div className="flex items-center justify-between bg-accent rounded-lg p-2">
                <div className="flex items-center gap-2"><User className="h-4 w-4" /><span className="text-sm font-medium">{store.customer.name}</span></div>
                <Button size="sm" variant="ghost" onClick={() => store.setCustomer(null)}>×</Button>
              </div>
            ) : (
              <Dialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full"><User className="h-3 w-3 mr-1" />Select Customer</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">Select Customer</DialogTitle></DialogHeader>
                  <Input placeholder="Search by name or phone..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                  <div className="max-h-60 overflow-auto space-y-1 mt-2">
                    {filteredCustomers.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer" onClick={() => { store.setCustomer({ id: c.id, name: c.name, phone: c.phone }); setShowCustomerSearch(false); }}>
                        <div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.phone}</p></div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto px-4">
          {store.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingBag className="h-8 w-8 mb-2" /><p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {store.items.map(item => (
                <div key={item.id} className="flex gap-3 p-2 rounded-lg bg-accent/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.is_custom && <Badge variant="outline" className="text-[10px] px-1 py-0 bg-secondary/10 text-secondary border-secondary/20">Custom</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatNPR(item.price)} each</p>
                    {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => store.updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => store.updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-medium">{formatNPR(item.price * item.quantity)}</p>
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => store.removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {store.items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNPR(store.getSubtotal())}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (13%)</span><span>{formatNPR(store.getTax())}</span></div>
              {store.orderDiscount > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-{formatNPR(store.orderDiscount)}</span></div>}
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatNPR(store.getTotal())}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="Discount" className="w-24" value={store.orderDiscount || ''} onChange={e => store.setOrderDiscount(Number(e.target.value))} />
              <Dialog open={showPayment} onOpenChange={setShowPayment}>
                <DialogTrigger asChild>
                  <Button className="flex-1" size="lg"><CreditCard className="h-4 w-4 mr-2" />Checkout</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">Payment</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-3xl font-bold font-display">{formatNPR(store.getTotal())}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'cash' as const, label: 'Cash', icon: Banknote },
                          { value: 'qr' as const, label: 'QR', icon: QrCode },
                          { value: 'manual' as const, label: 'Manual', icon: CreditCard },
                        ].map(m => (
                          <Button key={m.value} variant={store.paymentMethod === m.value ? 'default' : 'outline'} onClick={() => store.setPaymentMethod(m.value)} className="flex-col h-16">
                            <m.icon className="h-5 w-5 mb-1" /><span className="text-xs">{m.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    {store.paymentMethod === 'cash' && (
                      <div className="space-y-2">
                        <Label>Amount Received</Label>
                        <Input type="number" value={store.amountPaid || ''} onChange={e => store.setAmountPaid(Number(e.target.value))} placeholder="0" className="text-lg" />
                        {store.amountPaid > 0 && (
                          <div className="flex justify-between bg-accent p-3 rounded-lg">
                            <span className="text-sm">Change</span>
                            <span className="font-bold">{formatNPR(store.getChange())}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <Button className="w-full" size="lg" onClick={handleCheckout}>Complete Order</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

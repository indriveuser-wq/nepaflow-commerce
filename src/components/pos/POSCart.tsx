import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Trash2, User, ShoppingBag, CreditCard, Banknote, QrCode } from "lucide-react";
import { formatNPR } from "@/lib/formatters";
import { mockCustomers } from "@/lib/mock-data";
import { usePOSStore } from "@/stores/pos-store";
import { useOrderStore } from "@/stores/order-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface POSCartProps {
  className?: string;
}

export function POSCart({ className }: POSCartProps) {
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
  const { addOrder, getNextOrderNumber } = useOrderStore();

  const filteredCustomers = mockCustomers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  );

  const addCustomProduct = () => {
    if (!customName || !customPrice) { toast.error("Name and price required"); return; }
    store.addItem({ product_id: null, name: customName, price: Number(customPrice), quantity: Number(customQty) || 1, discount: 0, is_custom: true, notes: customNote });
    setCustomName(""); setCustomPrice(""); setCustomQty("1"); setCustomNote(""); setShowCustomProduct(false);
    toast.success("Custom item added");
  };

  const handleCheckout = () => {
    if (store.items.length === 0) { toast.error("Cart is empty"); return; }
    if (store.amountPaid < store.getTotal() && store.paymentMethod === 'cash') { toast.error("Insufficient payment"); return; }

    const orderNumber = getNextOrderNumber('KTM');
    addOrder({
      order_number: orderNumber,
      customer_id: store.customer?.id || null,
      customer_name: store.customer?.name || 'Walk-in Customer',
      branch_id: '1',
      status: 'completed',
      subtotal: store.getSubtotal(),
      discount: store.orderDiscount,
      tax: 0,
      total: store.getTotal(),
      payment_status: 'paid',
      payment_method: store.paymentMethod,
      items: store.items.map(i => ({
        id: crypto.randomUUID(),
        product_id: i.product_id,
        custom_name: i.is_custom ? i.name : null,
        custom_price: i.is_custom ? i.price : null,
        quantity: i.quantity,
        unit_price: i.price,
        discount: i.discount,
        total: i.price * i.quantity - i.discount,
        notes: i.notes,
      })),
      notes: '',
      created_at: new Date().toISOString(),
      created_by: 'admin',
    });

    toast.success(`Order ${orderNumber} completed!`);
    store.clearCart();
    setShowPayment(false);
    navigate('/orders');
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-lg font-bold">Cart</h2>
          <Dialog open={showCustomProduct} onOpenChange={setShowCustomProduct}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Custom</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Add Custom Product</DialogTitle>
                <DialogDescription>Add a custom item not in the catalog.</DialogDescription>
              </DialogHeader>
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
        {/* Customer */}
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
              <DialogHeader>
                <DialogTitle className="font-display">Select Customer</DialogTitle>
                <DialogDescription>Choose a customer for this order.</DialogDescription>
              </DialogHeader>
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

      {/* Items */}
      <div className="flex-1 overflow-auto px-3">
        {store.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingBag className="h-8 w-8 mb-2" /><p className="text-sm">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-2">
            {store.items.map(item => (
              <div key={item.id} className="flex gap-2 p-2 rounded-lg bg-accent/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.is_custom && <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">Custom</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatNPR(item.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => store.updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                  <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
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
      </div>

      {/* Footer */}
      {store.items.length > 0 && (
        <div className="border-t p-3 space-y-2">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNPR(store.getSubtotal())}</span></div>
            {store.orderDiscount > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-{formatNPR(store.orderDiscount)}</span></div>}
            <Separator />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatNPR(store.getTotal())}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" placeholder="Discount" className="w-20" value={store.orderDiscount || ''} onChange={e => store.setOrderDiscount(Number(e.target.value))} />
            <Dialog open={showPayment} onOpenChange={setShowPayment}>
              <DialogTrigger asChild>
                <Button className="flex-1"><CreditCard className="h-4 w-4 mr-2" />Checkout</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Payment</DialogTitle>
                  <DialogDescription>Complete payment for this order.</DialogDescription>
                </DialogHeader>
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
    </div>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Search, UserPlus } from "lucide-react";
import { formatNPR } from "@/lib/formatters";
import { mockCustomers, mockBranches, type OrderItem } from "@/lib/mock-data";
import { useProductStore } from "@/stores/product-store";
import { useOrderStore } from "@/stores/order-store";
import { toast } from "sonner";

type LineItem = {
  id: string;
  product_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  discount: number;
};

export default function NewOrder() {
  const navigate = useNavigate();
  const { products } = useProductStore();
  const { addOrder, getNextOrderNumber } = useOrderStore();

  const [items, setItems] = useState<LineItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [branchId, setBranchId] = useState("1");
  const [notes, setNotes] = useState("");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const activeProducts = products.filter(p => p.status === 'active');
  const filteredPickerProducts = activeProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const customer = mockCustomers.find(c => c.id === customerId);

  const addLineItem = (product: typeof products[0]) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      setItems(items.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { id: crypto.randomUUID(), product_id: product.id, name: product.name, unit_price: product.selling_price, quantity: 1, discount: 0 }]);
    }
    setShowProductPicker(false);
    setProductSearch("");
  };

  const addCustomLine = () => {
    setItems([...items, { id: crypto.randomUUID(), product_id: null, name: '', unit_price: 0, quantity: 1, discount: 0 }]);
  };

  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeLine = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.unit_price * i.quantity - i.discount), 0), [items]);
  const total = useMemo(() => subtotal - orderDiscount, [subtotal, orderDiscount]);

  const handleSubmit = (status: string) => {
    if (items.length === 0) { toast.error("Add at least one item"); return; }
    if (items.some(i => !i.name || i.unit_price <= 0)) { toast.error("All items need a name and price"); return; }

    const branchCode = branchId === '1' ? 'KTM' : 'PKR';
    const orderNumber = getNextOrderNumber(branchCode);

    const orderItems: OrderItem[] = items.map(i => ({
      id: crypto.randomUUID(),
      product_id: i.product_id,
      custom_name: i.product_id ? null : i.name,
      custom_price: i.product_id ? null : i.unit_price,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount: i.discount,
      total: i.unit_price * i.quantity - i.discount,
      notes: '',
    }));

    addOrder({
      order_number: orderNumber,
      customer_id: customerId || null,
      customer_name: customer?.name || 'Walk-in Customer',
      branch_id: branchId,
      status,
      subtotal,
      discount: orderDiscount,
      tax: 0,
      total,
      payment_status: status === 'completed' ? 'paid' : 'pending',
      payment_method: paymentMethod,
      items: orderItems,
      notes,
      created_at: new Date().toISOString(),
      created_by: 'admin',
    });

    toast.success(`Order ${orderNumber} created`);
    navigate('/orders');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">New Order</h1>
          <p className="text-muted-foreground text-sm">Create a manual order with line items</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">Line Items</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={addCustomLine}><Plus className="h-3 w-3 mr-1" />Custom Item</Button>
                  <Button size="sm" onClick={() => setShowProductPicker(true)}><Plus className="h-3 w-3 mr-1" />From Catalog</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No items added yet. Add products from catalog or create custom line items.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Item</TableHead>
                      <TableHead className="w-[15%]">Price</TableHead>
                      <TableHead className="w-[12%]">Qty</TableHead>
                      <TableHead className="w-[15%]">Discount</TableHead>
                      <TableHead className="text-right w-[15%]">Total</TableHead>
                      <TableHead className="w-[8%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.product_id ? (
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <Badge variant="outline" className="text-[10px]">Catalog</Badge>
                            </div>
                          ) : (
                            <Input value={item.name} onChange={e => updateLine(item.id, 'name', e.target.value)} placeholder="Item name" className="h-8 text-sm" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.unit_price || ''} onChange={e => updateLine(item.id, 'unit_price', Number(e.target.value))} className="h-8 text-sm w-24" disabled={!!item.product_id} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.quantity} onChange={e => updateLine(item.id, 'quantity', Math.max(1, Number(e.target.value)))} className="h-8 text-sm w-16" min={1} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.discount || ''} onChange={e => updateLine(item.id, 'discount', Number(e.target.value))} className="h-8 text-sm w-20" placeholder="0" />
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {formatNPR(item.unit_price * item.quantity - item.discount)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLine(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Order notes (optional)..." rows={3} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Walk-in Customer" /></SelectTrigger>
                <SelectContent>
                  {mockCustomers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customer && (
                <div className="text-sm bg-accent/50 rounded-lg p-2">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-muted-foreground text-xs">{customer.phone} · {customer.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{mockBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="qr">QR Payment</SelectItem>
                    <SelectItem value="manual">Manual / Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatNPR(subtotal)}</span></div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <Input type="number" value={orderDiscount || ''} onChange={e => setOrderDiscount(Number(e.target.value))} className="h-7 w-24 text-sm text-right" placeholder="0" />
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatNPR(total)}</span></div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => handleSubmit('pending')}>Save as Draft</Button>
                <Button className="flex-1" onClick={() => handleSubmit('completed')}>Complete Order</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Picker Dialog */}
      <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add Product</DialogTitle>
            <DialogDescription>Search and select a product from your catalog.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9" autoFocus />
          </div>
          <div className="max-h-72 overflow-auto space-y-1">
            {filteredPickerProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent cursor-pointer transition-colors" onClick={() => addLineItem(p)}>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <span className="font-semibold text-sm">{formatNPR(p.selling_price)}</span>
              </div>
            ))}
            {filteredPickerProducts.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">No products found</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

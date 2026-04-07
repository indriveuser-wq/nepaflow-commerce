import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { formatNPR, formatDateTime } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Business = { name: string; address: string | null; phone: string | null; email: string | null; tax_id: string | null };
type OrderRow = { id: string; order_number: string; customer_name: string; created_at: string; subtotal: number; discount: number; total: number; payment_method: string };
type OrderItem = { id: string; product_id: string | null; custom_name: string | null; unit_price: number; quantity: number; discount: number; total: number; notes: string | null };

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !profile?.business_id) return;
    const load = async () => {
      const [bizRes, orderRes, itemsRes] = await Promise.all([
        supabase.from('businesses').select('name, address, phone, email, tax_id').eq('id', profile.business_id!).single(),
        supabase.from('orders').select('*').eq('id', id).single(),
        supabase.from('order_items').select('*').eq('order_id', id),
      ]);
      setBusiness(bizRes.data as Business | null);
      setOrder(orderRes.data as OrderRow | null);
      const orderItems = (itemsRes.data || []) as OrderItem[];
      setItems(orderItems);

      // Fetch product names for items with product_id
      const productIds = orderItems.map(i => i.product_id).filter(Boolean) as string[];
      if (productIds.length > 0) {
        const { data } = await supabase.from('products').select('id, name').in('id', productIds);
        const map: Record<string, string> = {};
        (data || []).forEach((p: any) => { map[p.id] = p.name; });
        setProductNames(map);
      }
      setLoading(false);
    };
    load();
  }, [id, profile?.business_id]);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!order || !business) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-muted-foreground">Invoice not found</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/orders')}>Back</Button>
    </div>
  );

  const invoiceNumber = `INV-${order.order_number}`;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button><Download className="h-4 w-4 mr-2" />Download PDF</Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-0" id="invoice">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary">{business.name}</h1>
              {business.address && <p className="text-sm text-muted-foreground mt-1">{business.address}</p>}
              {business.phone && <p className="text-sm text-muted-foreground">{business.phone}</p>}
              {business.email && <p className="text-sm text-muted-foreground">{business.email}</p>}
              {business.tax_id && <p className="text-sm text-muted-foreground">PAN: {business.tax_id}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-display font-bold">INVOICE</h2>
              <p className="text-sm text-muted-foreground mt-1">{invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">Date: {formatDateTime(order.created_at)}</p>
              <p className="text-sm text-muted-foreground">Order: {order.order_number}</p>
            </div>
          </div>

          <div className="bg-accent/50 rounded-lg p-4 mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bill To</p>
            <p className="font-medium">{order.customer_name}</p>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Item</th>
                <th className="text-right py-2 font-medium">Price</th>
                <th className="text-right py-2 font-medium">Qty</th>
                <th className="text-right py-2 font-medium">Discount</th>
                <th className="text-right py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-2">
                    {item.custom_name || (item.product_id && productNames[item.product_id]) || 'Product'}
                    {item.custom_name && <span className="text-xs text-muted-foreground ml-1">(Custom)</span>}
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  </td>
                  <td className="text-right py-2">{formatNPR(item.unit_price)}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">{item.discount > 0 ? formatNPR(item.discount) : '—'}</td>
                  <td className="text-right py-2 font-medium">{formatNPR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNPR(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatNPR(order.discount)}</span></div>}
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatNPR(order.total)}</span></div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
            <p>Payment Method: <span className="capitalize">{order.payment_method}</span></p>
            <p className="mt-2">Thank you for your business!</p>
            <p>{business.name} · {business.address || ''} · {business.phone || ''}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

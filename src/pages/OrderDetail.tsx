import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Package } from "lucide-react";
import { formatNPR, formatDateTime, getStatusColor } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type OrderRow = { id: string; order_number: string; customer_name: string; customer_id: string | null; branch_id: string; created_at: string; subtotal: number; discount: number; tax: number; total: number; status: string; payment_status: string; payment_method: string; notes: string | null };
type OrderItemRow = { id: string; product_id: string | null; custom_name: string | null; unit_price: number; quantity: number; discount: number; total: number; notes: string | null };

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).single(),
        supabase.from('order_items').select('*').eq('order_id', id),
      ]);
      const o = orderRes.data as OrderRow | null;
      setOrder(o);
      const oi = (itemsRes.data || []) as OrderItemRow[];
      setItems(oi);

      if (o?.branch_id) {
        supabase.from('branches').select('name').eq('id', o.branch_id).single().then(({ data }) => {
          if (data) setBranchName((data as { name: string }).name);
        });
      }

      const productIds = oi.map(i => i.product_id).filter(Boolean) as string[];
      if (productIds.length > 0) {
        const { data } = await supabase.from('products').select('id, name').in('id', productIds);
        const map: Record<string, string> = {};
        (data || []).forEach((p: any) => { map[p.id] = p.name; });
        setProductNames(map);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!order) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-muted-foreground">Order not found</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/orders')}>Back to Orders</Button>
    </div>
  );

  const timeline = [
    { label: 'Order Created', time: formatDateTime(order.created_at), done: true },
    { label: 'Confirmed', time: ['confirmed', 'processing', 'completed'].includes(order.status) ? 'Completed' : '', done: ['confirmed', 'processing', 'completed'].includes(order.status) },
    { label: 'Processing', time: '', done: ['processing', 'completed'].includes(order.status) },
    { label: 'Completed', time: '', done: order.status === 'completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold tracking-tight">{order.order_number}</h1>
          <p className="text-muted-foreground text-sm">{formatDateTime(order.created_at)} · {branchName}</p>
        </div>
        <Badge variant="outline" className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>{order.status}</Badge>
        <Button variant="outline" onClick={() => navigate(`/invoices/${order.id}`)}><FileText className="h-4 w-4 mr-2" />Invoice</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Order Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.custom_name ? (
                            <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">Custom</Badge>
                          ) : <Package className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{item.custom_name || (item.product_id && productNames[item.product_id]) || 'Product'}</span>
                        </div>
                        {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                      </TableCell>
                      <TableCell className="text-right">{formatNPR(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.discount > 0 ? formatNPR(item.discount) : '—'}</TableCell>
                      <TableCell className="text-right font-medium">{formatNPR(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNPR(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatNPR(order.discount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatNPR(order.tax)}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatNPR(order.total)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Customer</CardTitle></CardHeader>
            <CardContent>
              <p className="font-medium">{order.customer_name}</p>
              {order.customer_id && <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate(`/customers/${order.customer_id}`)}>View Profile →</Button>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground text-sm">Method</span><Badge variant="outline">{order.payment_method}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground text-sm">Status</span><Badge variant="outline" className={getStatusColor(order.payment_status)}>{order.payment_status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground text-sm">Amount</span><span className="font-medium">{formatNPR(order.total)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${step.done ? 'bg-primary' : 'bg-muted'}`} />
                    <div>
                      <p className={`text-sm font-medium ${step.done ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                      {step.time && <p className="text-xs text-muted-foreground">{step.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Package, Truck } from "lucide-react";
import { formatNPR, formatDateTime, getStatusColor } from "@/lib/formatters";
import { mockBranches } from "@/lib/mock-data";
import { useOrderStore } from "@/stores/order-store";
import { useProductStore } from "@/stores/product-store";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = useOrderStore(s => s.orders.find(o => o.id === id));
  const { products } = useProductStore();

  if (!order) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-muted-foreground">Order not found</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/orders')}>Back to Orders</Button>
    </div>
  );

  const branch = mockBranches.find(b => b.id === order.branch_id);
  const timeline = [
    { label: 'Order Created', time: formatDateTime(order.created_at), done: true },
    { label: 'Confirmed', time: order.status !== 'pending' && order.status !== 'cancelled' ? 'Completed' : '', done: ['confirmed', 'processing', 'completed'].includes(order.status) },
    { label: 'Processing', time: '', done: ['processing', 'completed'].includes(order.status) },
    { label: 'Completed', time: '', done: order.status === 'completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold tracking-tight">{order.order_number}</h1>
          <p className="text-muted-foreground text-sm">{formatDateTime(order.created_at)} · {branch?.name}</p>
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
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.custom_name ? (
                            <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">Custom</Badge>
                          ) : <Package className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{item.custom_name || `Product #${item.product_id}`}</span>
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
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (13%)</span><span>{formatNPR(order.tax)}</span></div>
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
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate(`/customers/${order.customer_id}`)}>View Profile →</Button>
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

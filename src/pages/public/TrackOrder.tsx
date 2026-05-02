import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, ArrowLeft, CheckCircle2, Clock, PackageCheck, Truck } from "lucide-react";
import { formatNPR, formatDateTime } from "@/lib/formatters";
import { toast } from "sonner";

const STATUS_STEPS = [
  { key: 'received', label: 'Order Received', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed', icon: PackageCheck },
  { key: 'completed', label: 'Completed', icon: Truck },
];

const statusIndex = (s: string) => {
  const idx = STATUS_STEPS.findIndex(x => x.key === s);
  return idx === -1 ? 0 : idx;
};

type OrderData = {
  order_number: string; customer_name: string; status: string; total: number;
  created_at: string; updated_at: string; business_name: string; branch_name: string;
  items: { name: string; quantity: number; unit_price: number; total: number }[];
  notes: string | null;
};

export default function TrackOrder() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get('order') || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = async () => {
    if (!orderNumber || !phone) { toast.error("Enter order ID and phone"); return; }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_public_order', { _order_number: orderNumber.trim().toUpperCase(), _phone: phone });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (!data) { toast.error("Order not found. Check your details."); setOrder(null); return; }
    setOrder(data as OrderData);
  };

  // Realtime: re-fetch when underlying order updates
  useEffect(() => {
    if (!order) return;
    const channel = supabase
      .channel(`track-${order.order_number}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_number=eq.${order.order_number}` },
        () => { fetchOrder(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.order_number]);

  const currentStep = order ? statusIndex(order.status) : 0;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-3 md:px-6 py-3 flex items-center gap-3">
          <Link to={`/shop/${slug}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="font-display font-bold text-base md:text-lg">Track Your Order</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 md:px-6 py-4 md:py-8 space-y-4">
        {!order && (
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Find your order</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Order ID</Label>
                <Input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="e.g. KAP-0042" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number</Label>
                <Input inputMode="numeric" maxLength={10} value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98XXXXXXXX" />
              </div>
              <Button className="w-full" onClick={fetchOrder} disabled={loading}>{loading ? 'Looking up...' : 'Track Order'}</Button>
            </CardContent>
          </Card>
        )}

        {order && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Order ID</p>
                    <CardTitle className="font-display text-xl">{order.order_number}</CardTitle>
                  </div>
                  <Badge variant="outline" className={isCancelled ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Customer:</span> {order.customer_name}</p>
                <p><span className="text-muted-foreground">Shop:</span> {order.business_name} — {order.branch_name}</p>
                <p className="text-xs text-muted-foreground">Placed {formatDateTime(order.created_at)}</p>
              </CardContent>
            </Card>

            {!isCancelled && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="font-display text-base">Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {STATUS_STEPS.map((step, i) => {
                      const reached = i <= currentStep;
                      const isCurrent = i === currentStep;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex gap-3 items-start">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${reached ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className={`text-sm font-medium ${reached ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                            {isCurrent && <p className="text-xs text-muted-foreground">Updated {formatDateTime(order.updated_at)}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3"><CardTitle className="font-display text-base">Items</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {order.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{it.name}</p>
                      <p className="text-xs text-muted-foreground">{formatNPR(it.unit_price)} × {it.quantity}</p>
                    </div>
                    <span className="font-semibold">{formatNPR(it.total)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold"><span>Total</span><span>{formatNPR(order.total)}</span></div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => { setOrder(null); setPhone(''); }}>Track another order</Button>
          </>
        )}
      </main>
    </div>
  );
}
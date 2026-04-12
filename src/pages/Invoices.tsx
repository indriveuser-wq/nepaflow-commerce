import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, ChevronRight } from "lucide-react";
import { formatNPR, formatDate, getStatusColor } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type InvoiceRow = {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  payment_status: string;
  created_at: string;
};

export default function Invoices() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.business_id) return;
    const load = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, total, payment_status, created_at')
        .eq('business_id', profile.business_id!)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });
      setOrders((data as InvoiceRow[]) || []);
      setLoading(false);
    };
    load();
  }, [profile?.business_id]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground text-xs md:text-sm">{orders.length} invoices generated</p>
      </div>

      <Card>
        <CardContent className="p-0 md:pt-6 md:px-6 md:pb-6">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No invoices yet. Create orders to generate invoices.</div>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden divide-y">
                {orders.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 px-3 py-3 active:bg-accent/50 cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">INV-{inv.order_number}</p>
                        <Badge variant="outline" className={`${getStatusColor(inv.payment_status)} text-[10px] px-1.5 py-0`}>{inv.payment_status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{inv.customer_name} · {formatDate(inv.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-semibold">{formatNPR(inv.total)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-2 font-medium">Invoice #</th>
                      <th className="pb-2 font-medium">Customer</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Payment</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(inv => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="py-2.5 text-sm font-medium">INV-{inv.order_number}</td>
                        <td className="py-2.5 text-sm">{inv.customer_name}</td>
                        <td className="py-2.5 text-sm text-muted-foreground">{formatDate(inv.created_at)}</td>
                        <td className="py-2.5"><Badge variant="outline" className={getStatusColor(inv.payment_status)}>{inv.payment_status}</Badge></td>
                        <td className="py-2.5 text-sm text-right font-medium">{formatNPR(inv.total)}</td>
                        <td className="py-2.5 text-right">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/${inv.id}`)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

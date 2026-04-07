import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Download } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground text-sm">{orders.length} invoices generated</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No invoices yet. Create orders to generate invoices.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">INV-{inv.order_number}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.order_number}</TableCell>
                    <TableCell>{inv.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusColor(inv.payment_status)}>{inv.payment_status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatNPR(inv.total)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/${inv.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

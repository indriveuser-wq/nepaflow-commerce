import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Download } from "lucide-react";
import { formatNPR, formatDate, getStatusColor } from "@/lib/formatters";
import { useOrderStore } from "@/stores/order-store";

export default function Invoices() {
  const navigate = useNavigate();
  const orders = useOrderStore(s => s.orders);
  const invoices = orders.filter(o => o.status !== 'cancelled').map(o => ({
    id: o.id, invoice_number: `INV-2026-${o.id.padStart(4, '0')}`, order_number: o.order_number,
    customer_name: o.customer_name, total: o.total, payment_status: o.payment_status, date: o.created_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground text-sm">{invoices.length} invoices generated</p>
      </div>

      <Card>
        <CardContent className="pt-6">
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
              {invoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.order_number}</TableCell>
                  <TableCell>{inv.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(inv.date)}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}

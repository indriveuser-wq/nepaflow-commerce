import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, ShoppingCart, DollarSign, FileText, Phone, Mail, MapPin } from "lucide-react";
import { formatNPR, formatDate, getStatusColor } from "@/lib/formatters";
import { mockCustomers, mockOrders, mockPayments } from "@/lib/mock-data";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = mockCustomers.find(c => c.id === id);

  if (!customer) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-muted-foreground">Customer not found</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/customers')}>Back</Button>
    </div>
  );

  const customerOrders = mockOrders.filter(o => o.customer_id === customer.id);
  const customerPayments = mockPayments.filter(p => customerOrders.some(o => o.id === p.order_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">Customer since 2025</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total Spent</p><p className="text-xl font-bold font-display">{formatNPR(customer.total_spent)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-secondary" /></div>
              <div><p className="text-sm text-muted-foreground">Orders</p><p className="text-xl font-bold font-display">{customer.order_count}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center"><FileText className="h-5 w-5 text-accent-foreground" /></div>
              <div><p className="text-sm text-muted-foreground">Avg Order</p><p className="text-xl font-bold font-display">{formatNPR(customer.order_count > 0 ? customer.total_spent / customer.order_count : 0)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center"><User className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Status</p><p className="text-xl font-bold font-display">Active</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display">Transaction History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerOrders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium cursor-pointer hover:text-primary" onClick={() => navigate(`/orders/${o.id}`)}>{o.order_number}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                      <TableCell><Badge variant="outline" className={getStatusColor(o.status)}>{o.status}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={getStatusColor(o.payment_status)}>{o.payment_status}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatNPR(o.total)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${o.id}`)}><FileText className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {customerOrders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orders yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display">Payment History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Order</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {customerPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.order_number}</TableCell>
                      <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.paid_at)}</TableCell>
                      <TableCell className="text-right font-medium">{formatNPR(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {customerPayments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No payments recorded</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display">Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{customer.phone}</span></div>
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{customer.email}</span></div>
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{customer.address}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{customer.notes || 'No notes added'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

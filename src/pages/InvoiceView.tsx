import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { formatNPR, formatDateTime } from "@/lib/formatters";
import { mockOrders, mockBusiness } from "@/lib/mock-data";
import { useProductStore } from "@/stores/product-store";

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useProductStore();
  const order = mockOrders.find(o => o.id === id);

  if (!order) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-muted-foreground">Invoice not found</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/orders')}>Back</Button>
    </div>
  );

  const invoiceNumber = `INV-2026-${order.id.padStart(4, '0')}`;

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
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary">{mockBusiness.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{mockBusiness.address}</p>
              <p className="text-sm text-muted-foreground">{mockBusiness.phone}</p>
              <p className="text-sm text-muted-foreground">{mockBusiness.email}</p>
              <p className="text-sm text-muted-foreground">PAN: {mockBusiness.tax_id}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-display font-bold">INVOICE</h2>
              <p className="text-sm text-muted-foreground mt-1">{invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">Date: {formatDateTime(order.created_at)}</p>
              <p className="text-sm text-muted-foreground">Order: {order.order_number}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-accent/50 rounded-lg p-4 mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bill To</p>
            <p className="font-medium">{order.customer_name}</p>
          </div>

          {/* Items */}
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
              {order.items.map(item => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-2">
                    {item.custom_name || `Product #${item.product_id}`}
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

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNPR(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatNPR(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (13%)</span><span>{formatNPR(order.tax)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatNPR(order.total)}</span></div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
            <p>Payment Method: <span className="capitalize">{order.payment_method}</span></p>
            <p className="mt-2">Thank you for your business!</p>
            <p>{mockBusiness.name} · {mockBusiness.address} · {mockBusiness.phone}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

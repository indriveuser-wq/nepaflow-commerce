import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, ShoppingCart, Package, AlertTriangle, DollarSign } from "lucide-react";
import { formatNPR, formatDate, getStatusColor } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, paidCount: 0, orderCount: 0, completedCount: 0, productCount: 0, activeProducts: 0, lowStockCount: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.business_id) return;
    const biz = profile.business_id;

    Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, status, payment_status, total, created_at').eq('business_id', biz).order('created_at', { ascending: false }).limit(5),
      supabase.from('orders').select('total, payment_status, status').eq('business_id', biz),
      supabase.from('products').select('id, status').eq('business_id', biz),
      supabase.from('inventory_items').select('id, quantity, low_stock_threshold, product_id, branch_id, products(name, sku), branches(name)').lte('quantity', 10),
    ]).then(([recentRes, allOrdersRes, prodRes, invRes]) => {
      const allOrders = allOrdersRes.data || [];
      const prods = prodRes.data || [];
      const revenue = allOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total), 0);

      setStats({
        revenue,
        paidCount: allOrders.filter(o => o.payment_status === 'paid').length,
        orderCount: allOrders.length,
        completedCount: allOrders.filter(o => o.status === 'completed').length,
        productCount: prods.length,
        activeProducts: prods.filter(p => p.status === 'active').length,
        lowStockCount: (invRes.data || []).filter((i: any) => i.quantity <= i.low_stock_threshold).length,
      });
      setRecentOrders(recentRes.data || []);
      setLowStockItems((invRes.data || []).filter((i: any) => i.quantity <= i.low_stock_threshold).slice(0, 5));
      setLoading(false);
    });
  }, [profile?.business_id]);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const statCards = [
    { label: "Total Revenue", value: formatNPR(stats.revenue), change: `${stats.paidCount} paid`, up: true, icon: DollarSign },
    { label: "Total Orders", value: String(stats.orderCount), change: `${stats.completedCount} completed`, up: true, icon: ShoppingCart },
    { label: "Products", value: String(stats.productCount), change: `${stats.activeProducts} active`, up: true, icon: Package },
    { label: "Low Stock Items", value: String(stats.lowStockCount), change: "Needs attention", up: false, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your business performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{s.value}</div>
              <p className={`text-xs mt-1 flex items-center gap-1 ${s.up ? 'text-success' : 'text-warning'}`}>
                {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{s.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display">Recent Orders</CardTitle><CardDescription>Latest transactions</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentOrders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.order_number}</TableCell>
                    <TableCell>{o.customer_name}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusColor(o.status)}>{o.status}</Badge></TableCell>
                    <TableCell className="text-right">{formatNPR(o.total)}</TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No orders yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Low Stock Alerts</CardTitle><CardDescription>Products that need restocking</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Branch</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Threshold</TableHead></TableRow></TableHeader>
              <TableBody>
                {lowStockItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.products?.name || 'Unknown'}</TableCell>
                    <TableCell>{item.branches?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.low_stock_threshold}</TableCell>
                  </TableRow>
                ))}
                {lowStockItems.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">All stock levels are healthy</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

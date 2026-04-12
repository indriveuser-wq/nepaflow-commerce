import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    { label: "Low Stock", value: String(stats.lowStockCount), change: "Needs attention", up: false, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-xs md:text-sm">Overview of your business performance</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-[11px] md:text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold font-display">{s.value}</div>
              <p className={`text-[10px] md:text-xs mt-0.5 md:mt-1 flex items-center gap-1 ${s.up ? 'text-success' : 'text-warning'}`}>
                {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{s.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="font-display text-sm md:text-base">Recent Orders</CardTitle>
            <CardDescription className="text-xs">Latest transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            {/* Mobile: card list */}
            <div className="md:hidden divide-y">
              {recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No orders yet</p>
              ) : recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{o.order_number}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{o.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`${getStatusColor(o.status)} text-[10px] px-1.5 py-0`}>{o.status}</Badge>
                    <span className="text-xs font-medium">{formatNPR(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead><tr className="border-b text-left text-sm text-muted-foreground"><th className="pb-2 font-medium">Order</th><th className="pb-2 font-medium">Customer</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium text-right">Total</th></tr></thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2.5 text-sm font-medium">{o.order_number}</td>
                      <td className="py-2.5 text-sm">{o.customer_name}</td>
                      <td className="py-2.5"><Badge variant="outline" className={getStatusColor(o.status)}>{o.status}</Badge></td>
                      <td className="py-2.5 text-sm text-right">{formatNPR(o.total)}</td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && <tr><td colSpan={4} className="text-center text-muted-foreground py-8">No orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="font-display text-sm md:text-base">Low Stock Alerts</CardTitle>
            <CardDescription className="text-xs">Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            <div className="md:hidden divide-y">
              {lowStockItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">All stock levels are healthy</p>
              ) : lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{item.products?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-muted-foreground">{item.branches?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-destructive">{item.quantity}</span>
                    <span className="text-[10px] text-muted-foreground"> / {item.low_stock_threshold}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <table className="w-full">
                <thead><tr className="border-b text-left text-sm text-muted-foreground"><th className="pb-2 font-medium">Product</th><th className="pb-2 font-medium">Branch</th><th className="pb-2 font-medium text-right">Stock</th><th className="pb-2 font-medium text-right">Threshold</th></tr></thead>
                <tbody>
                  {lowStockItems.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2.5 text-sm font-medium">{item.products?.name || 'Unknown'}</td>
                      <td className="py-2.5 text-sm">{item.branches?.name || 'Unknown'}</td>
                      <td className="py-2.5 text-sm text-right text-destructive font-medium">{item.quantity}</td>
                      <td className="py-2.5 text-sm text-right">{item.low_stock_threshold}</td>
                    </tr>
                  ))}
                  {lowStockItems.length === 0 && <tr><td colSpan={4} className="text-center text-muted-foreground py-8">All stock levels are healthy</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

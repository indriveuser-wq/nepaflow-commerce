import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, ShoppingCart, Package, AlertTriangle, DollarSign,
  ArrowUpRight, ArrowDownRight, BarChart3,
} from "lucide-react";
import { formatNPR, formatDate, getStatusColor } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function MiniSparkline({ data, color = "hsl(var(--primary))" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, paidCount: 0, orderCount: 0, completedCount: 0, productCount: 0, activeProducts: 0, lowStockCount: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<number[]>([]);
  const [dailyOrders, setDailyOrders] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.business_id) return;
    const biz = profile.business_id;

    Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, status, payment_status, total, created_at').eq('business_id', biz).order('created_at', { ascending: false }).limit(5),
      supabase.from('orders').select('total, payment_status, status, created_at').eq('business_id', biz),
      supabase.from('products').select('id, status').eq('business_id', biz),
      supabase.from('inventory_items').select('id, quantity, low_stock_threshold, product_id, branch_id, products(name, sku), branches(name)').lte('quantity', 10),
    ]).then(([recentRes, allOrdersRes, prodRes, invRes]) => {
      const allOrders = allOrdersRes.data || [];
      const prods = prodRes.data || [];
      const revenue = allOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total), 0);

      // Build 7-day sparkline data
      const now = new Date();
      const revByDay: number[] = [];
      const ordByDay: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        const dayOrders = allOrders.filter(o => o.created_at?.slice(0, 10) === dayStr);
        ordByDay.push(dayOrders.length);
        revByDay.push(dayOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total), 0));
      }
      setDailyRevenue(revByDay);
      setDailyOrders(ordByDay);

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

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );

  const statCards = [
    {
      label: "Total Revenue", value: formatNPR(stats.revenue),
      sub: `${stats.paidCount} paid orders`, up: true,
      icon: DollarSign, sparkline: dailyRevenue,
      accent: "from-primary/10 to-primary/5 border-primary/15",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      label: "Total Orders", value: String(stats.orderCount),
      sub: `${stats.completedCount} completed`, up: true,
      icon: ShoppingCart, sparkline: dailyOrders,
      accent: "from-secondary/10 to-secondary/5 border-secondary/15",
      iconBg: "bg-secondary/10 text-secondary",
    },
    {
      label: "Products", value: String(stats.productCount),
      sub: `${stats.activeProducts} active`, up: true,
      icon: Package, sparkline: [],
      accent: "from-chart-3/10 to-chart-3/5 border-chart-3/15",
      iconBg: "bg-chart-3/10 text-chart-3",
    },
    {
      label: "Low Stock", value: String(stats.lowStockCount),
      sub: "Needs attention", up: false,
      icon: AlertTriangle, sparkline: [],
      accent: stats.lowStockCount > 0 ? "from-warning/10 to-warning/5 border-warning/15" : "from-success/10 to-success/5 border-success/15",
      iconBg: stats.lowStockCount > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success",
    },
  ];

  return (
    <div className="space-y-5 md:space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your business performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-5 lg:grid-cols-4">
        {statCards.map((s, idx) => (
          <Card
            key={s.label}
            className={`relative overflow-hidden bg-gradient-to-br ${s.accent} border animate-slide-up`}
            style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'backwards' }}
          >
            <CardContent className="p-2.5 md:p-5">
              <div className="flex items-start justify-between mb-2 md:mb-4">
                <div className={`h-7 w-7 md:h-10 md:w-10 rounded-lg md:rounded-xl ${s.iconBg} flex items-center justify-center`}>
                  <s.icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
                </div>
                {s.sparkline.length > 1 && (
                  <div className="scale-75 md:scale-100 origin-top-right -mt-0.5">
                    <MiniSparkline data={s.sparkline} />
                  </div>
                )}
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-[9px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{s.label}</p>
                <p className="text-base md:text-3xl font-bold font-display animate-count-up leading-tight truncate">{s.value}</p>
                <div className={`flex items-center gap-0.5 text-[9px] md:text-xs font-medium ${s.up ? 'text-success' : 'text-warning'}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="truncate">{s.sub}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tables Section */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="card-elevated animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
          <CardHeader className="p-4 md:p-6 pb-3 md:pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-base md:text-lg">Recent Orders</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest transactions</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-0 md:px-6 md:pb-6">
            {/* Mobile */}
            <div className="md:hidden divide-y">
              {recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 text-sm">No orders yet</p>
              ) : recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-accent/30">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{o.order_number}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{o.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge variant="outline" className={`${getStatusColor(o.status)} text-[10px] px-1.5 py-0`}>{o.status}</Badge>
                    <span className="text-xs font-bold font-display">{formatNPR(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium text-right">Total</th>
                </tr></thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} className="border-b last:border-0 group transition-colors hover:bg-accent/30">
                      <td className="py-3 text-sm font-semibold">{o.order_number}</td>
                      <td className="py-3 text-sm text-muted-foreground">{o.customer_name}</td>
                      <td className="py-3"><Badge variant="outline" className={getStatusColor(o.status)}>{o.status}</Badge></td>
                      <td className="py-3 text-sm text-right font-bold font-display">{formatNPR(o.total)}</td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && <tr><td colSpan={4} className="text-center text-muted-foreground py-10">No orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="card-elevated animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
          <CardHeader className="p-4 md:p-6 pb-3 md:pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-base md:text-lg">Low Stock Alerts</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Products that need restocking</p>
            </div>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stats.lowStockCount > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
              <AlertTriangle className={`h-4 w-4 ${stats.lowStockCount > 0 ? 'text-warning' : 'text-success'}`} />
            </div>
          </CardHeader>
          <CardContent className="p-0 md:px-6 md:pb-6">
            <div className="md:hidden divide-y">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                    <Package className="h-5 w-5 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
                </div>
              ) : lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{item.products?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-muted-foreground">{item.branches?.name || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-destructive rounded-full" style={{ width: `${Math.min(100, (item.quantity / Math.max(item.low_stock_threshold, 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-destructive">{item.quantity}</span>
                    <span className="text-[10px] text-muted-foreground">/ {item.low_stock_threshold}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <table className="w-full">
                <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 font-medium">Product</th><th className="pb-3 font-medium">Branch</th><th className="pb-3 font-medium">Level</th><th className="pb-3 font-medium text-right">Stock</th>
                </tr></thead>
                <tbody>
                  {lowStockItems.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="py-3 text-sm font-semibold">{item.products?.name || 'Unknown'}</td>
                      <td className="py-3 text-sm text-muted-foreground">{item.branches?.name || 'Unknown'}</td>
                      <td className="py-3">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${Math.min(100, (item.quantity / Math.max(item.low_stock_threshold, 1)) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="py-3 text-sm text-right">
                        <span className="font-bold text-destructive">{item.quantity}</span>
                        <span className="text-muted-foreground"> / {item.low_stock_threshold}</span>
                      </td>
                    </tr>
                  ))}
                  {lowStockItems.length === 0 && <tr><td colSpan={4} className="text-center text-muted-foreground py-10">All stock levels are healthy</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

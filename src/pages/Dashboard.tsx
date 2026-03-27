import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, ShoppingCart, Package, AlertTriangle, DollarSign } from "lucide-react";
import { formatNPR, formatDate, getStatusColor } from "@/lib/formatters";
import { mockInventory, salesChartData, paymentMethodData, branchPerformanceData } from "@/lib/mock-data";
import { useProductStore } from "@/stores/product-store";
import { useOrderStore } from "@/stores/order-store";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { products } = useProductStore();
  const { orders } = useOrderStore();

  const lowStockItems = mockInventory.filter(i => i.quantity <= i.low_stock_threshold);
  const recentOrders = orders.slice(0, 5);
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: "Total Revenue", value: formatNPR(totalRevenue), change: `${orders.filter(o => o.payment_status === 'paid').length} paid`, up: true, icon: DollarSign },
    { label: "Total Orders", value: String(orders.length), change: `${orders.filter(o => o.status === 'completed').length} completed`, up: true, icon: ShoppingCart },
    { label: "Products", value: String(products.length), change: `${products.filter(p => p.status === 'active').length} active`, up: true, icon: Package },
    { label: "Low Stock Items", value: String(lowStockItems.length), change: "Needs attention", up: false, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your business performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{s.value}</div>
              <p className={`text-xs mt-1 flex items-center gap-1 ${s.up ? 'text-success' : 'text-warning'}`}>
                {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {s.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-display">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue in NPR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [formatNPR(v), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display">Payment Methods</CardTitle>
            <CardDescription>Distribution by method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                    {paymentMethodData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-display">Recent Orders</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.order_number}</TableCell>
                    <TableCell>{o.customer_name}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusColor(o.status)}>{o.status}</Badge></TableCell>
                    <TableCell className="text-right">{formatNPR(o.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display">Branch Performance</CardTitle>
            <CardDescription>Revenue by branch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="branch" className="text-xs fill-muted-foreground" width={120} />
                  <Tooltip formatter={(v: number) => [formatNPR(v), 'Revenue']} />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Low Stock Alerts</CardTitle>
          <CardDescription>Products that need restocking</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.slice(0, 5).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.branch_name}</TableCell>
                  <TableCell className="text-right text-destructive font-medium">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.low_stock_threshold}</TableCell>
                </TableRow>
              ))}
              {lowStockItems.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">All stock levels are healthy</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

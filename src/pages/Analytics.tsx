import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Analytics() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.business_id) return;
    Promise.all([
      supabase.from('orders').select('total, payment_status, payment_method, branch_id, created_at').eq('business_id', profile.business_id),
      supabase.from('branches').select('id, name').eq('business_id', profile.business_id),
    ]).then(([oRes, bRes]) => {
      setOrders(oRes.data || []);
      setBranches(bRes.data || []);
      setLoading(false);
    });
  }, [profile?.business_id]);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  // Payment method breakdown
  const methodCounts: Record<string, number> = {};
  orders.filter(o => o.payment_status === 'paid').forEach(o => { methodCounts[o.payment_method] = (methodCounts[o.payment_method] || 0) + 1; });
  const total = Object.values(methodCounts).reduce((a, b) => a + b, 0) || 1;
  const paymentData = Object.entries(methodCounts).map(([name, count], i) => ({ name, value: Math.round((count / total) * 100), fill: COLORS[i % COLORS.length] }));

  // Branch comparison
  const branchData = branches.map(b => {
    const branchOrders = orders.filter(o => o.branch_id === b.id && o.payment_status === 'paid');
    return { branch: b.name, revenue: branchOrders.reduce((s, o) => s + Number(o.total), 0), orders: branchOrders.length };
  });

  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = orders.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Analytics & Reports</h1>
        <p className="text-muted-foreground text-sm">Business performance insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold font-display">{formatNPR(totalRevenue)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold font-display">{totalOrders}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Avg Order Value</p><p className="text-2xl font-bold font-display">{formatNPR(totalOrders > 0 ? totalRevenue / totalOrders : 0)}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display">Payment Method Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {paymentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                      {paymentData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground">No payment data yet</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Branch Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {branchData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="branch" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [formatNPR(v)]} />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground">No branch data yet</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Plus, ChevronRight } from "lucide-react";
import { formatNPR, formatDate, getStatusColor } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  created_at: string;
  status: string;
  payment_status: string;
  total: number;
};

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.business_id) return;
    const load = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, created_at, status, payment_status, total')
        .eq('business_id', profile.business_id!)
        .order('created_at', { ascending: false });
      setOrders((data as OrderRow[]) || []);
      setLoading(false);
    };
    load();
  }, [profile?.business_id]);

  const filtered = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-xs md:text-sm">{orders.length} total orders</p>
        </div>
        <div className="flex gap-1.5 md:gap-2">
          <Button variant="outline" size="sm" className="md:size-default" onClick={() => navigate('/pos')}>
            <ShoppingCart className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">POS</span>
          </Button>
          <Button size="sm" className="md:size-default" onClick={() => navigate('/orders/new')}>
            <Plus className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">New Order</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-3 md:p-6 pb-3 md:pb-4">
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 md:h-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] h-9 md:h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {/* Mobile: card list */}
          <div className="md:hidden divide-y">
            {filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No orders found</p>
            ) : filtered.map(o => (
              <div key={o.id} className="flex items-center gap-3 px-3 py-3 active:bg-accent/50 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{o.order_number}</p>
                    <Badge variant="outline" className={`${getStatusColor(o.status)} text-[10px] px-1.5 py-0`}>{o.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{o.customer_name} · {formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm font-semibold">{formatNPR(o.total)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-2 font-medium">Order #</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Payment</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b last:border-0 cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/orders/${o.id}`)}>
                    <td className="py-2.5 text-sm font-medium">{o.order_number}</td>
                    <td className="py-2.5 text-sm">{o.customer_name}</td>
                    <td className="py-2.5 text-sm text-muted-foreground">{formatDate(o.created_at)}</td>
                    <td className="py-2.5"><Badge variant="outline" className={getStatusColor(o.status)}>{o.status}</Badge></td>
                    <td className="py-2.5"><Badge variant="outline" className={getStatusColor(o.payment_status)}>{o.payment_status}</Badge></td>
                    <td className="py-2.5 text-sm text-right font-medium">{formatNPR(o.total)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

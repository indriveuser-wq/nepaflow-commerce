import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, ShoppingCart, Plus } from "lucide-react";
import { formatNPR, formatDate, getStatusColor } from "@/lib/formatters";
import { useOrderStore } from "@/stores/order-store";

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { orders } = useOrderStore();

  const filtered = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/pos')}><ShoppingCart className="h-4 w-4 mr-2" />POS</Button>
          <Button onClick={() => navigate('/orders/new')}><Plus className="h-4 w-4 mr-2" />New Order</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                  <TableCell className="font-medium">{o.order_number}</TableCell>
                  <TableCell>{o.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                  <TableCell><Badge variant="outline" className={getStatusColor(o.status)}>{o.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={getStatusColor(o.payment_status)}>{o.payment_status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatNPR(o.total)}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

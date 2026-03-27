import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CreditCard } from "lucide-react";
import { formatNPR, formatDate, getStatusColor } from "@/lib/formatters";
import { mockPayments } from "@/lib/mock-data";

export default function Payments() {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const filtered = mockPayments.filter(p => {
    const matchesSearch = p.order_number.toLowerCase().includes(search.toLowerCase()) || p.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === "all" || p.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalRevenue = mockPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground text-sm">Total: {formatNPR(totalRevenue)} from {mockPayments.length} transactions</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="qr">QR</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.order_number}</TableCell>
                  <TableCell>{p.customer_name}</TableCell>
                  <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.paid_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.reference || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={getStatusColor(p.status === 'completed' ? 'paid' : p.status)}>{p.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatNPR(p.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

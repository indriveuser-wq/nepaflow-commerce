import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Package, MapPin } from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/formatters";
import { mockShipments } from "@/lib/mock-data";

export default function Logistics() {
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = mockShipments.filter(s => statusFilter === "all" || s.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Logistics</h1>
          <p className="text-muted-foreground text-sm">Delivery management</p>
        </div>
        <Button><Truck className="h-4 w-4 mr-2" />Create Delivery</Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Est. Delivery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.order_number}</TableCell>
                  <TableCell>{s.customer_name}</TableCell>
                  <TableCell>{s.courier}</TableCell>
                  <TableCell className="text-muted-foreground">{s.tracking_number}</TableCell>
                  <TableCell><Badge variant="outline" className={getStatusColor(s.status)}>{s.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(s.estimated_delivery)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

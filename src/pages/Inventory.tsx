import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, ArrowRightLeft, Plus, Minus, AlertTriangle, Warehouse } from "lucide-react";
import { getStatusColor } from "@/lib/formatters";
import { mockInventory, mockBranches } from "@/lib/mock-data";
import { toast } from "sonner";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);

  const filtered = mockInventory.filter(i => {
    const matchesSearch = i.product_name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter === "all" || i.branch_id === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const lowStock = filtered.filter(i => i.quantity <= i.low_stock_threshold);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-sm">Manage stock across branches</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
            <DialogTrigger asChild><Button variant="outline"><ArrowRightLeft className="h-4 w-4 mr-2" />Transfer</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Stock Transfer</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Product</Label><Input placeholder="Search product" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>From Branch</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{mockBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>To Branch</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{mockBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Quantity</Label><Input type="number" placeholder="0" /></div>
                <Button className="w-full" onClick={() => { setShowTransfer(false); toast.success("Stock transferred"); }}>Transfer Stock</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" />Adjust</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Stock Adjustment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Product</Label><Input placeholder="Search product" /></div>
                <div className="space-y-2"><Label>Branch</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{mockBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Type</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="add">Add Stock</SelectItem><SelectItem value="remove">Remove Stock</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" placeholder="0" /></div>
                </div>
                <div className="space-y-2"><Label>Reason</Label><Input placeholder="Reason for adjustment" /></div>
                <Button className="w-full" onClick={() => { setShowAdjust(false); toast.success("Stock adjusted"); }}>Save Adjustment</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />{lowStock.length} items with low stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.slice(0, 5).map(i => (
                <Badge key={i.id} variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  {i.product_name} ({i.branch_name}: {i.quantity})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {mockBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const status = item.quantity === 0 ? 'out_of_stock' : item.quantity <= item.low_stock_threshold ? 'low_stock' : 'active';
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center"><Warehouse className="h-4 w-4 text-accent-foreground" /></div>
                        <span className="font-medium">{item.product_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                    <TableCell>{item.branch_name}</TableCell>
                    <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.low_stock_threshold}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusColor(status)}>{status.replace('_', ' ')}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

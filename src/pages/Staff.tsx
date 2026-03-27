import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, UserCog } from "lucide-react";
import { getStatusColor } from "@/lib/formatters";
import { mockStaff } from "@/lib/mock-data";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  manager: 'bg-secondary/10 text-secondary border-secondary/20',
  cashier: 'bg-accent text-accent-foreground border-border',
};

export default function Staff() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Staff & Roles</h1>
          <p className="text-muted-foreground text-sm">Manage team members and permissions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-2" />Invite Staff</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Invite Staff Member</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Name" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@example.com" /></div>
              <div className="space-y-2"><Label>Role</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="cashier">Cashier</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Branch</Label><Input placeholder="Branch name" /></div>
              <Button className="w-full" onClick={() => toast.success("Invitation sent")}>Send Invitation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {['admin', 'manager', 'cashier'].map(role => (
          <Card key={role}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center"><Shield className="h-5 w-5 text-accent-foreground" /></div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{role}s</p>
                  <p className="text-xl font-bold font-display">{mockStaff.filter(s => s.role === role).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStaff.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.email}</TableCell>
                  <TableCell><Badge variant="outline" className={roleColors[s.role]}>{s.role}</Badge></TableCell>
                  <TableCell>{s.branch}</TableCell>
                  <TableCell><Badge variant="outline" className={getStatusColor(s.status)}>{s.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

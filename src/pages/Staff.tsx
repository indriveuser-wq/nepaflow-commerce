import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield } from "lucide-react";
import { getStatusColor } from "@/lib/formatters";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  manager: 'bg-secondary/10 text-secondary border-secondary/20',
  cashier: 'bg-accent text-accent-foreground border-border',
};

type StaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  branch_id: string | null;
  branch_name?: string;
  role?: string;
};

export default function Staff() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteBranch, setInviteBranch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.business_id) return;
    loadData();
  }, [profile?.business_id]);

  const loadData = async () => {
    const [profilesRes, rolesRes, branchesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('business_id', profile!.business_id!),
      supabase.from('user_roles').select('*'),
      supabase.from('branches').select('id, name').eq('business_id', profile!.business_id!),
    ]);

    const branchList = branchesRes.data || [];
    setBranches(branchList);

    const profiles = (profilesRes.data || []) as StaffMember[];
    const roles = rolesRes.data || [];

    setStaff(profiles.map(p => ({
      ...p,
      branch_name: branchList.find(b => b.id === p.branch_id)?.name || 'All Branches',
      role: (roles.find((r: any) => r.user_id === p.id) as any)?.role || 'unknown',
    })));
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole || !inviteBranch) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('staff_invitations').insert({
      business_id: profile!.business_id!,
      branch_id: inviteBranch,
      email: inviteEmail,
      role: inviteRole as any,
      invited_by: profile!.id,
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to send invitation: " + error.message);
      return;
    }
    toast.success(`Invitation sent to ${inviteEmail}. They can now sign up and will be automatically assigned the ${inviteRole} role.`);
    setShowInvite(false);
    setInviteEmail("");
    setInviteRole("");
    setInviteBranch("");
  };

  const roleCounts = { admin: 0, manager: 0, cashier: 0 };
  staff.forEach(s => { if (s.role && s.role in roleCounts) roleCounts[s.role as keyof typeof roleCounts]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Staff & Roles</h1>
          <p className="text-muted-foreground text-sm">Manage team members and permissions</p>
        </div>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-2" />Invite Staff</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Invite Staff Member</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" /></div>
              <div className="space-y-2"><Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Branch</Label>
                <Select value={inviteBranch} onValueChange={setInviteBranch}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleInvite} disabled={loading}>
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
              <p className="text-xs text-muted-foreground">The invited person should sign up with this email address. They'll be automatically assigned the selected role and branch.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {(['admin', 'manager', 'cashier'] as const).map(role => (
          <Card key={role}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center"><Shield className="h-5 w-5 text-accent-foreground" /></div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{role}s</p>
                  <p className="text-xl font-bold font-display">{roleCounts[role]}</p>
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
              {staff.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No staff members yet. Invite your team!</TableCell></TableRow>
              ) : staff.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name || 'Unnamed'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.email}</TableCell>
                  <TableCell><Badge variant="outline" className={roleColors[s.role || ''] || ''}>{s.role}</Badge></TableCell>
                  <TableCell>{s.branch_name}</TableCell>
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

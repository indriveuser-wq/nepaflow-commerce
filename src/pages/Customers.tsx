import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Users, Plus, ChevronRight } from "lucide-react";
import { formatNPR } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Customer = {
  id: string; name: string; phone: string | null; email: string | null;
  address: string | null; notes: string | null; total_spent: number; order_count: number;
};

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Customers() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const loadData = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase.from('customers').select('*').eq('business_id', profile.business_id).order('created_at', { ascending: false });
    setCustomers((data || []) as Customer[]);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    const { error } = await supabase.from('customers').insert({
      name: form.name, phone: form.phone || null, email: form.email || null,
      address: form.address || null, notes: form.notes || null,
      business_id: profile!.business_id!, branch_id: profile!.branch_id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Customer added");
    setShowForm(false); setForm(emptyForm); await loadData();
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-xs md:text-sm">{customers.length} registered</p>
        </div>
        <Button size="sm" className="md:size-default" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Add Customer</span>
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={open => { if (!open) setShowForm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add Customer</DialogTitle>
            <DialogDescription>Add a new customer to your directory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleAdd}>Add Customer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="p-3 md:p-6 pb-3 md:pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 md:h-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {/* Mobile */}
          <div className="md:hidden divide-y">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No customers found</p>
            ) : filtered.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-3 active:bg-accent/50 cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-accent-foreground">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.phone || c.email || 'No contact'} · {c.order_count} orders</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs font-medium">{formatNPR(c.total_spent)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Phone</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium text-right">Orders</th>
                  <th className="pb-2 font-medium text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b last:border-0 cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/customers/${c.id}`)}>
                    <td className="py-2.5 text-sm font-medium">{c.name}</td>
                    <td className="py-2.5 text-sm text-muted-foreground">{c.phone || '—'}</td>
                    <td className="py-2.5 text-sm text-muted-foreground">{c.email || '—'}</td>
                    <td className="py-2.5 text-sm text-right">{c.order_count}</td>
                    <td className="py-2.5 text-sm text-right font-medium">{formatNPR(c.total_spent)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No customers found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

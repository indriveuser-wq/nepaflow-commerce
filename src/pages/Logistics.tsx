import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Edit, Trash2, Plus, Package } from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Shipment = {
  id: string; order_id: string | null; order_number: string | null;
  customer_name: string; courier: string; tracking_number: string | null;
  status: string; estimated_delivery: string | null; notes: string | null;
  branch_id: string;
};

const emptyForm = { order_id: '', order_number: '', customer_name: '', courier: '', tracking_number: '', status: 'pending', estimated_delivery: '', notes: '' };

export default function Logistics() {
  const { profile, role } = useAuth();
  const canManage = role === 'admin' || role === 'manager';
  const [statusFilter, setStatusFilter] = useState("all");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<{ id: string; order_number: string; customer_name: string; branch_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.business_id) return;
    const [sRes, oRes] = await Promise.all([
      supabase.from('shipments').select('*').eq('business_id', profile.business_id).order('created_at', { ascending: false }),
      supabase.from('orders').select('id, order_number, customer_name, branch_id').eq('business_id', profile.business_id).order('created_at', { ascending: false }).limit(200),
    ]);
    setShipments((sRes.data || []) as Shipment[]);
    setOrders(oRes.data || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { load(); }, [load]);

  const filtered = shipments.filter(s => statusFilter === "all" || s.status === statusFilter);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (s: Shipment) => {
    setEditing(s);
    setForm({
      order_id: s.order_id || '', order_number: s.order_number || '', customer_name: s.customer_name,
      courier: s.courier, tracking_number: s.tracking_number || '', status: s.status,
      estimated_delivery: s.estimated_delivery || '', notes: s.notes || '',
    });
    setShowForm(true);
  };

  const onOrderPick = (orderId: string) => {
    const o = orders.find(x => x.id === orderId);
    setForm(prev => ({ ...prev, order_id: orderId, order_number: o?.order_number || '', customer_name: o?.customer_name || prev.customer_name }));
  };

  const handleSubmit = async () => {
    if (!form.customer_name || !form.courier) { toast.error("Customer and courier required"); return; }
    const linkedOrder = orders.find(o => o.id === form.order_id);
    const data: any = {
      business_id: profile!.business_id!,
      branch_id: linkedOrder?.branch_id || profile!.branch_id!,
      order_id: form.order_id || null,
      order_number: form.order_number || null,
      customer_name: form.customer_name,
      courier: form.courier,
      tracking_number: form.tracking_number || null,
      status: form.status,
      estimated_delivery: form.estimated_delivery || null,
      notes: form.notes || null,
      created_by: profile!.id,
    };
    if (editing) {
      const { error } = await supabase.from('shipments').update(data).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Shipment updated");
    } else {
      const { error } = await supabase.from('shipments').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success("Shipment created");
    }
    setShowForm(false); setEditing(null); setForm(emptyForm);
    await load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('shipments').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("Shipment removed");
    setDeleteId(null);
    await load();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Logistics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{shipments.length} shipments</p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="bg-gradient-to-r from-primary to-primary-glow shadow-md shadow-primary/20">
            <Plus className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Create Delivery</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="p-3 md:p-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 bg-muted/40 border-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0 md:p-4 md:pt-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No shipments yet</p>
            </div>
          ) : (<>
            {/* Mobile list */}
            <div className="md:hidden divide-y">
              {filtered.map(s => (
                <div key={s.id} className="px-3 py-3 active:bg-accent/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold truncate">{s.order_number || '—'}</p>
                        <Badge variant="outline" className={`${getStatusColor(s.status)} text-[9px] px-1.5 py-0`}>{s.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{s.customer_name}</p>
                      <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">{s.courier}{s.tracking_number ? ` · ${s.tracking_number}` : ''}</p>
                      {s.estimated_delivery && <p className="text-[10px] text-muted-foreground/80 mt-0.5">ETA: {formatDate(s.estimated_delivery)}</p>}
                    </div>
                    {canManage && (
                      <div className="flex gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Courier</TableHead>
                    <TableHead>Tracking</TableHead><TableHead>Status</TableHead><TableHead>Est. Delivery</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id} className="group">
                      <TableCell className="font-medium">{s.order_number || '—'}</TableCell>
                      <TableCell>{s.customer_name}</TableCell>
                      <TableCell>{s.courier}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{s.tracking_number || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className={getStatusColor(s.status)}>{s.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{s.estimated_delivery ? formatDate(s.estimated_delivery) : '—'}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>)}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit Shipment' : 'Create Delivery'}</DialogTitle>
            <DialogDescription>{editing ? 'Update delivery details.' : 'Add a new delivery to track.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Linked Order (optional)</Label>
              <Select value={form.order_id || 'none'} onValueChange={v => v === 'none' ? setForm(p => ({ ...p, order_id: '', order_number: '' })) : onOrderPick(v)}>
                <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No linked order —</SelectItem>
                  {orders.map(o => <SelectItem key={o.id} value={o.id}>{o.order_number} · {o.customer_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Customer Name *</Label><Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Courier *</Label><Input value={form.courier} onChange={e => setForm(p => ({ ...p, courier: e.target.value }))} placeholder="e.g. Nepal Express" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tracking #</Label><Input value={form.tracking_number} onChange={e => setForm(p => ({ ...p, tracking_number: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Est. Delivery</Label><Input type="date" value={form.estimated_delivery} onChange={e => setForm(p => ({ ...p, estimated_delivery: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={handleSubmit} className="w-full">{editing ? 'Update Shipment' : 'Create Shipment'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Remove shipment?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

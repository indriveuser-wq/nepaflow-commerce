import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, MapPin, Receipt, Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { profile } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for business
  const [bizName, setBizName] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizTaxId, setBizTaxId] = useState("");
  const [bizAddress, setBizAddress] = useState("");

  useEffect(() => {
    if (!profile?.business_id) return;
    loadData();
  }, [profile?.business_id]);

  const loadData = async () => {
    setLoading(true);
    const [bizRes, branchRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', profile!.business_id!).single(),
      supabase.from('branches').select('*').eq('business_id', profile!.business_id!).order('is_main', { ascending: false }),
    ]);
    if (bizRes.data) {
      const b = bizRes.data;
      setBusiness(b);
      setBizName(b.name || "");
      setBizEmail(b.email || "");
      setBizPhone(b.phone || "");
      setBizTaxId(b.tax_id || "");
      setBizAddress(b.address || "");
    }
    setBranches(branchRes.data || []);
    setLoading(false);
  };

  const saveBusiness = async () => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from('businesses').update({
      name: bizName,
      email: bizEmail,
      phone: bizPhone,
      tax_id: bizTaxId,
      address: bizAddress,
    }).eq('id', profile.business_id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Settings saved");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your business configuration</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business"><Building className="h-4 w-4 mr-1" />Business</TabsTrigger>
          <TabsTrigger value="branches"><MapPin className="h-4 w-4 mr-1" />Branches</TabsTrigger>
          <TabsTrigger value="receipt"><Receipt className="h-4 w-4 mr-1" />Receipt</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" />Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Business Information</CardTitle>
              <CardDescription>Your business details shown on invoices and receipts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Business Name</Label><Input value={bizName} onChange={e => setBizName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={bizEmail} onChange={e => setBizEmail(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={bizPhone} onChange={e => setBizPhone(e.target.value)} /></div>
                <div className="space-y-2"><Label>Tax ID (PAN)</Label><Input value={bizTaxId} onChange={e => setBizTaxId(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={bizAddress} onChange={e => setBizAddress(e.target.value)} /></div>
              <Button onClick={saveBusiness}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Branch Management</CardTitle>
              <CardDescription>Manage your business locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branches.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-muted-foreground">{b.address} · {b.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.is_main && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Main</span>}
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
                {branches.length === 0 && <p className="text-muted-foreground text-sm">No branches found.</p>}
                <Button variant="outline"><MapPin className="h-4 w-4 mr-2" />Add Branch</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Receipt & Invoice Settings</CardTitle>
              <CardDescription>Customize your receipts and invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Footer Text</Label><Input defaultValue="Thank you for your business!" /></div>
              <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" defaultValue="13" /></div>
              <div className="flex items-center justify-between">
                <div><Label>Show Logo on Invoice</Label><p className="text-sm text-muted-foreground">Display your business logo</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Auto-generate Invoice</Label><p className="text-sm text-muted-foreground">Create invoice on order completion</p></div>
                <Switch defaultChecked />
              </div>
              <Button onClick={() => toast.success("Receipt settings saved")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Low Stock Alerts', desc: 'Get notified when products are below threshold' },
                { label: 'New Order Notifications', desc: 'Alert for every new order received' },
                { label: 'Payment Confirmations', desc: 'Notify on successful payments' },
                { label: 'Daily Summary', desc: 'End-of-day business summary' },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div><Label>{n.label}</Label><p className="text-sm text-muted-foreground">{n.desc}</p></div>
                  <Switch defaultChecked={i < 2} />
                </div>
              ))}
              <Button onClick={() => toast.success("Notification settings saved")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

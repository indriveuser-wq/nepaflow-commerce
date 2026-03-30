import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (authError || !authData.user) {
      toast.error(authError?.message || "Signup failed");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // 2. Setup business, branch, profile & role via secure RPC
    const { error: setupErr } = await supabase.rpc('setup_business', {
      _business_name: businessName,
      _business_address: businessAddress,
      _business_phone: phone,
      _business_email: email,
      _branch_name: branchName || 'Main Branch',
      _user_full_name: fullName,
    });
    if (setupErr) {
      toast.error("Failed to set up business: " + setupErr.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    toast.success("Account created! Welcome to BizNep.");
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg">B</div>
          </div>
          <CardTitle className="font-display text-2xl">{step === 1 ? "Create Account" : "Set Up Business"}</CardTitle>
          <CardDescription>{step === 1 ? "Start managing your business" : "Tell us about your business"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {step === 1 ? (
              <>
                <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} /></div>
              </>
            ) : (
              <>
                <div className="space-y-2"><Label>Business Name</Label><Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Himalayan Traders" required /></div>
                <div className="space-y-2"><Label>Business Address</Label><Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="e.g. Thamel, Kathmandu" required /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+977-..." required /></div>
                <div className="space-y-2"><Label>Main Branch Name</Label><Input value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="e.g. Kathmandu Main" required /></div>
              </>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : step === 1 ? "Continue" : "Complete Setup"}
            </Button>
          </form>
          {step === 1 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

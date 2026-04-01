import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function SetupBusiness() {
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

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Create account
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

    // Set up business via RPC
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
    toast.success("Business created! Welcome to BizNep.");
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg">B</div>
          </div>
          <CardTitle className="font-display text-2xl">
            {step === 1 ? "Create Your Account" : "Set Up Your Business"}
          </CardTitle>
          <CardDescription>
            {step === 1 ? "First, create your owner account" : "Tell us about your business"}
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} /></div>
              <Button type="submit" className="w-full">
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Business Name</Label><Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Himalayan Traders" required /></div>
              <div className="space-y-2"><Label>Business Address</Label><Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="e.g. Thamel, Kathmandu" required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+977-..." required /></div>
              <div className="space-y-2"><Label>Main Branch Name</Label><Input value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="e.g. Kathmandu Main" required /></div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Invited by your team? <Link to="/signup" className="text-primary hover:underline">Sign up here</Link>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

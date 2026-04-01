import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if this email has a pending invitation
    const { data: invited } = await supabase.rpc('check_invitation', { _email: email.trim().toLowerCase() });

    if (!invited) {
      toast.error("No invitation found for this email. Ask your business owner to invite you first.");
      setLoading(false);
      return;
    }

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

    setLoading(false);
    toast.success("Account created! You've been added to your team.");
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg">B</div>
          </div>
          <CardTitle className="font-display text-2xl">Staff Sign Up</CardTitle>
          <CardDescription>Sign up with the email your business owner invited you with</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Invited email address" required /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} /></div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Want to set up a new business? <Link to="/setup-business" className="text-primary hover:underline">Get Started</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

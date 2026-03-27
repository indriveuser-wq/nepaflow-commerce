import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Signup() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
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
                <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Your name" required /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="you@example.com" required /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" placeholder="••••••••" required /></div>
              </>
            ) : (
              <>
                <div className="space-y-2"><Label>Business Name</Label><Input placeholder="e.g. Himalayan Traders" required /></div>
                <div className="space-y-2"><Label>Business Address</Label><Input placeholder="e.g. Thamel, Kathmandu" required /></div>
                <div className="space-y-2"><Label>Phone</Label><Input placeholder="+977-..." required /></div>
                <div className="space-y-2"><Label>Main Branch Name</Label><Input placeholder="e.g. Kathmandu Main" required /></div>
              </>
            )}
            <Button type="submit" className="w-full">{step === 1 ? "Continue" : "Complete Setup"}</Button>
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

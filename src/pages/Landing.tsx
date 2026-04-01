import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, BarChart3, Package, Users, ShoppingCart, Warehouse, ArrowRight } from "lucide-react";

const features = [
  { icon: ShoppingCart, title: "Point of Sale", desc: "Fast, modern POS with custom product support and instant invoicing" },
  { icon: Package, title: "Product Management", desc: "Full catalog with variants, categories, SKU and barcode tracking" },
  { icon: Warehouse, title: "Multi-Branch Inventory", desc: "Track stock across locations with transfers and alerts" },
  { icon: Users, title: "Customer Profiles", desc: "Complete customer history, transactions, and invoice records" },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Revenue trends, top products, and branch performance" },
  { icon: Store, title: "Multi-Branch Support", desc: "Manage multiple locations from a single dashboard" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-display font-bold">B</div>
            <span className="font-display font-bold text-xl tracking-tight">BizNep</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
            <Button onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-tight">
            The complete commerce
            <br />
            <span className="text-primary">platform for Nepal</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your products, inventory, orders, customers, and payments across multiple branches.
            Built specifically for Nepali businesses.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/setup-business')} className="text-base px-8">
              Start Free <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/setup-business')} className="text-base px-8">
              Set Up Business
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-accent/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold tracking-tight">Everything you need to run your business</h2>
            <p className="text-muted-foreground mt-3">One platform, all your commerce needs</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">{f.title}</h3>
                  <p className="text-muted-foreground text-sm mt-2">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-display font-bold tracking-tight">Ready to streamline your business?</h2>
          <p className="text-muted-foreground mt-3">Join hundreds of Nepali businesses using BizNep to manage their commerce operations.</p>
          <Button size="lg" className="mt-8 text-base px-8" onClick={() => navigate('/signup')}>
            Get Started Today <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xs">B</div>
            <span className="font-display font-semibold">BizNep</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 BizNep. Built for Nepal.</p>
        </div>
      </footer>
    </div>
  );
}

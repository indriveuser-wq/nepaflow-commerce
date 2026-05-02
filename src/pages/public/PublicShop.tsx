import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Search, Trash2, Store, Package, CheckCircle2, MapPin } from "lucide-react";
import { formatNPR } from "@/lib/formatters";
import { toast } from "sonner";

type Branch = { id: string; name: string; address: string | null };
type Shop = { id: string; name: string; phone: string | null; address: string | null; branches: Branch[] };
type Product = { id: string; name: string; selling_price: number; image_url: string | null; category_id: string | null; category_name: string | null };
type CartItem = { product_id: string; name: string; price: number; image_url: string | null; quantity: number };

export default function PublicShop() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const [shopRes, prodRes] = await Promise.all([
        supabase.rpc('get_public_shop', { _slug: slug }),
        supabase.rpc('get_public_products', { _slug: slug }),
      ]);
      if (shopRes.data) {
        const s = shopRes.data as Shop;
        setShop(s);
        if (s.branches.length > 0) setBranchId(s.branches[0].id);
      }
      setProducts((prodRes.data as Product[]) || []);
      setLoading(false);
    })();
  }, [slug]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => { if (p.category_id && p.category_name) map.set(p.category_id, p.category_name); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filtered = products.filter(p =>
    (activeCategory === "all" || p.category_id === activeCategory) &&
    (p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const found = prev.find(i => i.product_id === p.id);
      if (found) return prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: p.id, name: p.name, price: p.selling_price, image_url: p.image_url, quantity: 1 }];
    });
    toast.success(`${p.name} added`, { duration: 1200 });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(i => {
      if (i.product_id !== id) return [i];
      const q = i.quantity + delta;
      return q <= 0 ? [] : [{ ...i, quantity: q }];
    }));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.product_id !== id));

  const handleCheckout = async () => {
    if (!slug || !branchId) return;
    if (name.trim().length < 2) { toast.error("Please enter your full name"); return; }
    if (!/^9\d{9}$/.test(phone)) { toast.error("Enter a valid 10-digit phone starting with 9"); return; }
    if (cart.length === 0) { toast.error("Cart is empty"); return; }

    setSubmitting(true);
    const { data, error } = await supabase.rpc('create_public_order', {
      _slug: slug, _branch_id: branchId, _customer_name: name.trim(),
      _customer_phone: phone, _items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      _notes: notes || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message || "Could not place order"); return; }
    const result = data as { order_number: string };
    setSuccess({ orderNumber: result.order_number });
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Store className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-display font-bold">Shop not found</h1>
        <p className="text-muted-foreground text-sm mt-2">The link you followed may be incorrect.</p>
      </div>
    );
  }

  const initial = shop.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-3 md:px-6 py-3 flex items-center gap-3">
          <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-display font-bold shadow-md">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-base md:text-xl truncate">{shop.name}</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate flex items-center gap-1">
              <MapPin className="h-3 w-3" />{shop.address || 'Online Store'}
            </p>
          </div>
          <Link to={`/shop/${slug}/track`}>
            <Button variant="ghost" size="sm" className="text-xs">Track Order</Button>
          </Link>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="relative gap-1.5">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">{cartCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
              <SheetHeader className="p-4 border-b"><SheetTitle className="font-display">Your Cart</SheetTitle></SheetHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    Your cart is empty
                  </div>
                ) : cart.map(item => (
                  <div key={item.product_id} className="flex gap-3 items-center">
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatNPR(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.product_id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.product_id, 1)}><Plus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.product_id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <SheetFooter className="border-t p-4 flex-col sm:flex-col gap-3">
                  <div className="flex justify-between font-bold text-base w-full">
                    <span>Total</span><span>{formatNPR(cartTotal)}</span>
                  </div>
                  <Button className="w-full" size="lg" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Checkout</Button>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-3 px-3 md:mx-0 md:px-0">
            <Button variant={activeCategory === "all" ? "default" : "outline"} size="sm" className="rounded-full shrink-0 text-xs" onClick={() => setActiveCategory("all")}>All</Button>
            {categories.map(c => (
              <Button key={c.id} variant={activeCategory === c.id ? "default" : "outline"} size="sm" className="rounded-full shrink-0 text-xs" onClick={() => setActiveCategory(c.id)}>{c.name}</Button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <main className="max-w-6xl mx-auto px-3 md:px-6 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No products available</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            {filtered.map(p => {
              const inCart = cart.find(i => i.product_id === p.id);
              return (
                <Card key={p.id} className="overflow-hidden group hover:shadow-md transition-all">
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    ) : <Package className="h-8 w-8 text-muted-foreground/40" />}
                  </div>
                  <CardContent className="p-2 md:p-3 space-y-1.5">
                    <p className="text-xs md:text-sm font-medium leading-tight line-clamp-2 min-h-[2.2em]">{p.name}</p>
                    <p className="text-sm md:text-base font-bold text-primary">{formatNPR(p.selling_price)}</p>
                    {inCart ? (
                      <div className="flex items-center justify-between gap-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(p.id, -1)}><Minus className="h-3 w-3" /></Button>
                        <span className="text-sm font-semibold">{inCart.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(p.id, 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                    ) : (
                      <Button size="sm" className="w-full h-7 text-xs" onClick={() => addToCart(p)}>
                        <Plus className="h-3 w-3 mr-1" />Add
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile sticky checkout bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t p-3 shadow-lg md:hidden">
          <Button className="w-full h-11 justify-between gap-2" onClick={() => setCartOpen(true)}>
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            </span>
            <span className="font-bold">{formatNPR(cartTotal)}</span>
          </Button>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Checkout</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Full Name *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">Phone Number * <span className="text-muted-foreground font-normal">(10 digits, starts with 9)</span></Label>
              <Input id="phone" inputMode="numeric" maxLength={10} value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98XXXXXXXX" />
              {phone.length > 0 && !/^9\d{9}$/.test(phone) && (
                <p className="text-[10px] text-destructive">Enter 10 digits starting with 9</p>
              )}
            </div>
            {shop.branches.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup / Delivery Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {shop.branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}{b.address ? ` — ${b.address}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
              <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions..." />
            </div>
            <Separator />
            <div className="space-y-1.5 text-sm">
              {cart.map(i => (
                <div key={i.product_id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate pr-2">{i.name} × {i.quantity}</span>
                  <span>{formatNPR(i.price * i.quantity)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatNPR(cartTotal)}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={handleCheckout} disabled={submitting}>{submitting ? "Placing..." : "Place Order"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={!!success} onOpenChange={(o) => { if (!o) setSuccess(null); }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="font-display text-center">Order placed!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Save your order ID to track delivery status.</p>
          <div className="bg-accent rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Order ID</p>
            <p className="font-display font-bold text-xl">{success?.orderNumber}</p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" onClick={() => navigate(`/shop/${slug}/track?order=${success?.orderNumber}`)}>Track Order</Button>
            <Button variant="outline" className="w-full" onClick={() => setSuccess(null)}>Continue Shopping</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
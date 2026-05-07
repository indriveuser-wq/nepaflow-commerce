import { useState, useEffect } from "react";
import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingBag, ShoppingCart, ScanBarcode, X } from "lucide-react";
import { formatNPR } from "@/lib/formatters";
import { usePOSStore } from "@/stores/pos-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { POSCart } from "@/components/pos/POSCart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { barcodesMatch, normalizeBarcode } from "@/lib/barcode";

type ProductRow = { id: string; name: string; sku: string | null; barcode: string | null; category_id: string | null; selling_price: number; status: string };
type CategoryRow = { id: string; name: string };

export default function POS() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const productsRef = useRef<ProductRow[]>([]);
  const store = usePOSStore();
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  useEffect(() => { productsRef.current = products; }, [products]);

  useEffect(() => {
    if (!profile?.business_id) return;
    Promise.all([
      supabase.from('products').select('id, name, sku, barcode, category_id, selling_price, status').eq('business_id', profile.business_id!).eq('status', 'active'),
      supabase.from('categories').select('id, name').eq('business_id', profile.business_id!),
    ]).then(([prodRes, catRes]) => {
      setProducts((prodRes.data || []) as ProductRow[]);
      setCategories((catRes.data || []) as CategoryRow[]);
    });
  }, [profile?.business_id]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const addProduct = (product: ProductRow) => {
    store.addItem({ product_id: product.id, name: product.name, price: product.selling_price, quantity: 1, discount: 0, is_custom: false, notes: '' });
  };

  const handleScanned = (code: string) => {
    const trimmed = normalizeBarcode(code);
    const list = productsRef.current;
    const match = list.find(p => barcodesMatch(p.barcode, trimmed))
      || list.find(p => (p.sku || '').trim().toLowerCase() === trimmed.toLowerCase());
    if (match) {
      addProduct(match);
      toast.success(`Added: ${match.name}`);
    } else {
      setSearch(trimmed);
      toast.error(`No product matches "${trimmed}"`);
    }
    stopScanner();
  };

  const stopScanner = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try { if (s.isScanning) await s.stop(); } catch {}
      try { await s.clear(); } catch {}
    }
    setScannerOpen(false);
  };

  const startScanner = async () => {
    // Open the modal first so the region div exists
    setScannerOpen(true);
    // Wait one frame for region to mount
    await new Promise(r => requestAnimationFrame(() => r(null)));
    const region = document.getElementById("pos-barcode-scanner-region");
    if (!region) { toast.error("Scanner region missing"); setScannerOpen(false); return; }
    try {
      const scanner = new Html5Qrcode("pos-barcode-scanner-region", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;
      const onSuccess = (text: string) => handleScanned(text);
      const onErr = () => {};
      try {
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 260, height: 160 } }, onSuccess, onErr);
      } catch (e1) {
        // Fallback: try first available camera
        const cams = await Html5Qrcode.getCameras();
        if (!cams || cams.length === 0) throw new Error("No camera found");
        const back = cams.find(c => /back|rear|environment/i.test(c.label)) || cams[cams.length - 1];
        await scanner.start(back.id, { fps: 10, qrbox: { width: 260, height: 160 } }, onSuccess, onErr);
      }
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? "Camera permission denied. Allow camera access in browser settings."
        : err?.message || "Unable to access camera";
      toast.error(msg);
      stopScanner();
    }
  };

  const productGrid = (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search or scan barcode..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" autoFocus />
        </div>
        <Button variant="outline" size="icon" onClick={startScanner} title="Scan barcode">
          <ScanBarcode className="h-4 w-4" />
        </Button>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[100px] md:w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
          {filteredProducts.map(p => (
            <Card key={p.id} className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.97]" onClick={() => addProduct(p)}>
              <CardContent className="p-2.5 md:p-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-accent flex items-center justify-center mb-1.5">
                  <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-accent-foreground" />
                </div>
                <p className="font-medium text-xs md:text-sm line-clamp-2 leading-tight">{p.name}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{p.sku}</p>
                <p className="font-bold text-xs md:text-sm mt-0.5">{formatNPR(p.selling_price)}</p>
              </CardContent>
            </Card>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">No products found</div>
          )}
        </div>
      </div>
    </div>
  );

  const scannerOverlay = scannerOpen && (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={stopScanner}>
      <div className="w-full max-w-md bg-card rounded-xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold">
            <ScanBarcode className="h-5 w-5" /> Scan Barcode
          </div>
          <Button variant="ghost" size="icon" onClick={stopScanner}><X className="h-4 w-4" /></Button>
        </div>
        <p className="text-xs text-muted-foreground">Point your rear camera at a barcode or QR code.</p>
        <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-video">
          <div id="pos-barcode-scanner-region" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
        </div>
        <Button variant="outline" className="w-full" onClick={stopScanner}>Cancel</Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {productGrid}
        {scannerOverlay}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" className="fixed bottom-[4.5rem] right-4 z-40 rounded-full h-14 w-14 shadow-lg">
              <ShoppingCart className="h-5 w-5" />
              {store.items.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {store.items.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col p-0">
            <POSCart className="flex flex-col h-full" onScan={startScanner} />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      {productGrid}
      <Card className="w-[380px] flex flex-col shrink-0">
        <POSCart className="flex flex-col h-full" onScan={startScanner} />
      </Card>
      {scannerOverlay}
    </div>
  );
}

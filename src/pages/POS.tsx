import { useState, useEffect } from "react";
import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flashlight, FlashlightOff, Search, ShoppingBag, ShoppingCart, ScanBarcode, X } from "lucide-react";
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
import { createPortal } from "react-dom";

type ProductRow = { id: string; name: string; sku: string | null; barcode: string | null; category_id: string | null; selling_price: number; status: string };
type CategoryRow = { id: string; name: string };

type ScannerCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
  zoom?: { min: number; max: number; step?: number };
  focusMode?: string[];
  exposureMode?: string[];
  whiteBalanceMode?: string[];
};

type ScannerConstraint = MediaTrackConstraintSet & {
  torch?: boolean;
  zoom?: number;
  focusMode?: string;
  exposureMode?: string;
  whiteBalanceMode?: string;
};

type ScannerMediaConstraints = MediaTrackConstraints & {
  focusMode?: string;
  resizeMode?: string;
};

type CameraStartOption = {
  id: string;
  label: string;
  source: string | MediaTrackConstraints;
  deviceId?: string | null;
  isRear: boolean;
  avoid: boolean;
  score: number;
};

const SCANNER_REGION_ID = "pos-barcode-scanner-region";
const MIN_ACCEPTABLE_VIDEO_WIDTH = 1280;
const MIN_ACCEPTABLE_VIDEO_HEIGHT = 720;

const createHighQualityVideoConstraints = (cameraId?: string | null): ScannerMediaConstraints => ({
  ...(cameraId ? { deviceId: { exact: cameraId } } : { facingMode: { ideal: "environment" } }),
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30 },
  resizeMode: "none",
  focusMode: "continuous",
});

const createBarcodeScanConfig = (cameraId?: string | null) => ({
  fps: 20,
  qrbox: (vw: number, vh: number) => {
    const minEdge = Math.min(vw, vh);
    const isSmallViewport = minEdge < 520;
    const width = Math.floor(minEdge * (isSmallViewport ? 0.96 : 0.9));
    return { width, height: Math.floor(width * (isSmallViewport ? 0.62 : 0.45)) };
  },
  aspectRatio: 1.7777,
  disableFlip: true,
  videoConstraints: createHighQualityVideoConstraints(cameraId),
});

const getVideoInputDevices = async () => {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === "videoinput");
};

const buildCameraStartOptions = (devices: MediaDeviceInfo[]): CameraStartOption[] => {
  const scoredDevices = devices.map((device, index) => {
    const label = device.label || `Camera ${index + 1}`;
    const isRear = /back|rear|environment|world|main/i.test(label);
    const isFront = /front|user|selfie|facetime/i.test(label);
    const avoid = /ultra|wide|macro|depth|virtual/i.test(label);
    const isUnlabeled = !device.label;
    let score = 0;
    if (isRear) score += 60;
    if (/main/i.test(label)) score += 20;
    if (isFront) score -= 60;
    if (avoid) score -= 120;
    if (isUnlabeled) score -= index;
    return { device, label, isRear, avoid, score };
  });

  const sortedDevices = [...scoredDevices].sort((a, b) => b.score - a.score);
  const rearOptions = sortedDevices
    .filter(({ isRear, avoid }) => isRear && !avoid)
    .map(({ device, label, isRear, avoid, score }) => ({
      id: device.deviceId,
      label,
      source: device.deviceId,
      deviceId: device.deviceId,
      isRear,
      avoid,
      score,
    }));

  const environmentFallback: CameraStartOption = {
    id: "environment-fallback",
    label: "Environment camera",
    source: createHighQualityVideoConstraints(),
    deviceId: null,
    isRear: true,
    avoid: false,
    score: 30,
  };

  const deviceOptions = sortedDevices
    .filter(({ avoid }) => !avoid)
    .map(({ device, label, isRear, avoid, score }) => ({
      id: device.deviceId,
      label,
      source: device.deviceId,
      deviceId: device.deviceId,
      isRear,
      avoid,
      score,
    }));

  const hasUsefulLabels = sortedDevices.some(({ device }) => Boolean(device.label));
  const queue = rearOptions.length > 0
    ? [...rearOptions, ...deviceOptions, environmentFallback]
    : hasUsefulLabels
      ? [...deviceOptions, environmentFallback]
      : [environmentFallback, ...deviceOptions];

  return queue.filter((option, index, all) => option.id && all.findIndex(item => item.id === option.id) === index);
};

const getPreferredRearCameraId = async () => {
  try {
    const cameras = await getVideoInputDevices();
    const labelledRearCameras = cameras
      .filter(camera => /back|rear|environment|world/i.test(camera.label || ""))
      .map(camera => {
        const label = camera.label || "";
        let score = 0;
        if (/main|back|rear|environment|world/i.test(label)) score += 20;
        if (/ultra|wide|macro|depth|virtual|front|user|selfie/i.test(label)) score -= 30;
        return { id: camera.deviceId, score };
      })
      .sort((a, b) => b.score - a.score);
    return labelledRearCameras[0]?.id ?? null;
  } catch {
    return null;
  }
};

const getScannerVideoElement = () => (
  document.querySelector(`#${SCANNER_REGION_ID} video`) as HTMLVideoElement | null
);

const prepareScannerVideoElement = (video: HTMLVideoElement) => {
  video.setAttribute("playsinline", "true");
  video.setAttribute("autoplay", "true");
  video.setAttribute("muted", "true");
  video.playsInline = true;
  video.autoplay = true;
  video.muted = true;
  video.style.objectFit = "cover";
  video.style.transform = "none";
  video.style.filter = "none";
};

const waitForScannerVideoReady = async (timeoutMs = 3000): Promise<HTMLVideoElement> => {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const video = getScannerVideoElement();
      if (video) {
        prepareScannerVideoElement(video);
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0) {
          resolve(video);
          return;
        }
      }
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Camera preview did not become ready. Try the manual barcode field."));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
};

const stopRegionVideoTracks = () => {
  document.querySelectorAll<HTMLVideoElement>(`#${SCANNER_REGION_ID} video`).forEach(video => {
    const stream = video.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  });
};

const hasLowActualResolution = (width?: number, height?: number) => {
  if (!width || !height) return true;
  return Math.max(width, height) < MIN_ACCEPTABLE_VIDEO_WIDTH || Math.min(width, height) < MIN_ACCEPTABLE_VIDEO_HEIGHT;
};

export default function POS() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
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
    setTorchSupported(false);
    setTorchOn(false);
    if (s) {
      try { if (s.isScanning) await s.applyVideoConstraints({ advanced: [{ torch: false } as ScannerConstraint] }); } catch { /* ignore torch shutdown errors */ }
      try { if (s.isScanning) await s.stop(); } catch { /* ignore scanner stop errors */ }
      try { await s.clear(); } catch { /* ignore scanner cleanup errors */ }
    }
    stopRegionVideoTracks();
    setScannerOpen(false);
  };

  const improveCameraForBarcode = async (scanner: Html5Qrcode) => {
    try {
      const capabilities = scanner.getRunningTrackCapabilities() as ScannerCapabilities;
      const advanced: ScannerConstraint[] = [];
      if (capabilities.focusMode?.includes("continuous")) advanced.push({ focusMode: "continuous" });
      else if (capabilities.focusMode?.includes("auto")) advanced.push({ focusMode: "auto" });
      if (capabilities.exposureMode?.includes("continuous")) advanced.push({ exposureMode: "continuous" });
      if (capabilities.whiteBalanceMode?.includes("continuous")) advanced.push({ whiteBalanceMode: "continuous" });
      if (capabilities.zoom && capabilities.zoom.min < capabilities.zoom.max) {
        const zoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, 2));
        advanced.push({ zoom });
      }
      setTorchSupported(Boolean(capabilities.torch));
      if (advanced.length) await scanner.applyVideoConstraints({ advanced });
    } catch {
      setTorchSupported(false);
    }
  };

  const toggleTorch = async () => {
    const scanner = scannerRef.current;
    if (!scanner?.isScanning) return;
    const next = !torchOn;
    try {
      await scanner.applyVideoConstraints({ advanced: [{ torch: next } as ScannerConstraint] });
      setTorchOn(next);
    } catch {
      toast.error("Flash is not supported on this phone/browser.");
      setTorchSupported(false);
      setTorchOn(false);
    }
  };

  const submitManualBarcode = () => {
    const value = normalizeBarcode(manualBarcode);
    if (!value) {
      toast.error("Enter a barcode first.");
      return;
    }
    setManualBarcode("");
    handleScanned(value);
  };

  const startScanner = async () => {
    // Open the modal first so the region div exists
    setTorchSupported(false);
    setTorchOn(false);
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
      const preferredCameraId = await getPreferredRearCameraId();
      try {
        await scanner.start(
          preferredCameraId || { facingMode: { ideal: "environment" } },
          createBarcodeScanConfig(preferredCameraId),
          onSuccess,
          onErr
        );
        await improveCameraForBarcode(scanner);
      } catch (e1) {
        // Fallback: try first available camera
        const cams = await Html5Qrcode.getCameras();
        if (!cams || cams.length === 0) throw new Error("No camera found");
        const back = cams.find(c => /main|back|rear|environment/i.test(c.label) && !/ultra|wide|macro|front|selfie/i.test(c.label))
          || cams.find(c => /back|rear|environment/i.test(c.label))
          || cams[cams.length - 1];
        await scanner.start(back.id, createBarcodeScanConfig(back.id), onSuccess, onErr);
        await improveCameraForBarcode(scanner);
      }
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      const msg = error?.name === "NotAllowedError"
        ? "Camera permission denied. Allow camera access in browser settings."
        : error?.message || "Unable to access camera";
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

  const scannerOverlay = scannerOpen && createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
      style={{ pointerEvents: "auto" }}
      onClick={stopScanner}
    >
      <div
        className="w-full max-w-md bg-card rounded-xl p-4 space-y-3"
        style={{ pointerEvents: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold">
            <ScanBarcode className="h-5 w-5" /> Scan Barcode
          </div>
          <div className="flex items-center gap-1">
            {torchSupported && (
              <Button variant={torchOn ? "secondary" : "ghost"} size="icon" onClick={toggleTorch} title={torchOn ? "Turn flash off" : "Turn flash on"}>
                {torchOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={stopScanner}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Point your rear camera at a barcode or QR code.</p>
        <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-[3/4] sm:aspect-video">
          <div
            id="pos-barcode-scanner-region"
            className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:filter-none"
          />
        </div>
        <Button variant="outline" className="w-full" onClick={stopScanner}>Cancel</Button>
      </div>
    </div>,
    document.body
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

import { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  scannerRef: React.MutableRefObject<Html5Qrcode | null>;
}

export const SCANNER_REGION_ID = "pos-barcode-scanner-region";

export function BarcodeScanner({ open, onClose, onDetected, scannerRef }: BarcodeScannerProps) {
  const detectedRef = useRef(false);

  useEffect(() => {
    if (open) {
      detectedRef.current = false;
      // Wire detection callback via patching: scanner is started outside, but
      // we expose handler globally on the ref via window event.
      const handler = (e: Event) => {
        const code = (e as CustomEvent<string>).detail;
        if (detectedRef.current) return;
        detectedRef.current = true;
        onDetected(code);
      };
      window.addEventListener("pos-barcode-detected", handler);
      return () => window.removeEventListener("pos-barcode-detected", handler);
    }
  }, [open, onDetected]);

  const handleClose = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try {
        if (s.isScanning) await s.stop();
        await s.clear();
      } catch {}
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md p-4">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" /> Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your rear camera at a barcode or QR code.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-video">
          <div id={SCANNER_REGION_ID} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
        </div>
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
      </DialogContent>
    </Dialog>
  );
}

export { Html5Qrcode, Html5QrcodeSupportedFormats };
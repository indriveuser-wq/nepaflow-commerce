import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (code: string) => void;
}

const REGION_ID = "pos-barcode-scanner-region";

export function BarcodeScanner({ open, onOpenChange, onDetected }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStarting(true);

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(REGION_ID, {
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

        await scanner.start(
          { facingMode: { exact: "environment" } as any },
          { fps: 10, qrbox: { width: 260, height: 160 }, aspectRatio: 1.7778 },
          (decodedText) => {
            if (cancelled) return;
            cancelled = true;
            onDetected(decodedText);
            stop();
          },
          () => {}
        ).catch(async () => {
          // Fallback when exact environment isn't available
          await scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 260, height: 160 } },
            (decodedText) => {
              if (cancelled) return;
              cancelled = true;
              onDetected(decodedText);
              stop();
            },
            () => {}
          );
        });
      } catch (err: any) {
        toast.error(err?.message || "Unable to access camera");
        onOpenChange(false);
      } finally {
        setStarting(false);
      }
    };

    const stop = async () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      try {
        if (s.isScanning) await s.stop();
        await s.clear();
      } catch {}
      onOpenChange(false);
    };

    // Defer to ensure region div is mounted
    const t = setTimeout(start, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        (async () => {
          try {
            if (s.isScanning) await s.stop();
            await s.clear();
          } catch {}
        })();
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <div id={REGION_ID} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Starting camera...
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
      </DialogContent>
    </Dialog>
  );
}

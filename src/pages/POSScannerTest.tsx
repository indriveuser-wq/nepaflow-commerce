import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScanBarcode, CheckCircle2, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "pending" | "pass" | "fail";
type Step = {
  id: string;
  title: string;
  goal: string;
  steps: string[];
  expect: string;
};

const STEPS: Step[] = [
  {
    id: "open",
    title: "Open the scanner",
    goal: "Camera permission + live preview",
    steps: [
      "Go to /pos and tap the Scan button (search bar or cart header).",
      "Allow camera access when prompted.",
    ],
    expect: "Live rear-camera feed appears inside the modal within ~2s.",
  },
  {
    id: "single",
    title: "Single barcode scan",
    goal: "Detection + confirmation dialog",
    steps: [
      "Hold a known product barcode steady in the framing box.",
      "Wait for the beep / dialog.",
    ],
    expect: "Confirm dialog appears with correct product, qty defaults to 1, qty input is auto-focused.",
  },
  {
    id: "qty-keyboard",
    title: "Quantity via keyboard",
    goal: "Auto-focus + Enter to confirm",
    steps: [
      "After the dialog opens, type a number (e.g. 3) without tapping the input.",
      "Press Enter.",
    ],
    expect: "Qty updates to 3, item added to cart, dialog closes, scanner resumes automatically.",
  },
  {
    id: "paused",
    title: "Scanner is paused during dialog",
    goal: "No frame capture while confirming",
    steps: [
      "Open the confirm dialog by scanning a product.",
      "Wave another barcode in front of the camera before confirming.",
    ],
    expect: "No new dialog appears and no extra item is added to the cart.",
  },
  {
    id: "resume",
    title: "Resume after confirm",
    goal: "Seamless next-scan flow",
    steps: [
      "Confirm the pending product.",
      "Immediately scan a different product.",
    ],
    expect: "Second product is detected within ~1s and a fresh confirm dialog appears.",
  },
  {
    id: "duplicate",
    title: "Repeated barcode (same code)",
    goal: "Debounce + intentional re-scan",
    steps: [
      "Scan product A, confirm with qty 1.",
      "Scan product A again right after.",
    ],
    expect: "Same product opens a new dialog (debounce should not block intentional re-scan after confirm).",
  },
  {
    id: "cancel",
    title: "Cancel resumes scanning",
    goal: "Cancel path also unpauses",
    steps: [
      "Scan a product, then press Cancel in the dialog.",
      "Scan another product.",
    ],
    expect: "Dialog closes, scanner resumes, next scan is detected normally.",
  },
  {
    id: "unknown",
    title: "Unknown barcode",
    goal: "Graceful failure, scanner stays open",
    steps: [
      "Scan a barcode that does not exist in your catalog.",
    ],
    expect: "Toast: \"No product matches ...\" appears; scanner keeps running; no dialog shown.",
  },
  {
    id: "close",
    title: "Close scanner cleans up",
    goal: "Camera released",
    steps: [
      "Press the X or Cancel on the scanner overlay.",
    ],
    expect: "Modal closes, camera light turns off, no console errors.",
  },
];

const STORAGE_KEY = "pos-scanner-test-checklist-v1";

export default function POSScannerTest() {
  const [results, setResults] = useState<Record<string, Status>>({});
  const [active, setActive] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setResults(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(results)); } catch {}
  }, [results]);

  const totals = useMemo(() => {
    const pass = STEPS.filter(s => results[s.id] === "pass").length;
    const fail = STEPS.filter(s => results[s.id] === "fail").length;
    return { pass, fail, total: STEPS.length };
  }, [results]);

  const setStatus = (id: string, status: Status) => {
    setResults(r => ({ ...r, [id]: status }));
    const idx = STEPS.findIndex(s => s.id === id);
    if (status !== "pending" && idx < STEPS.length - 1) setActive(idx + 1);
  };

  const reset = () => { setResults({}); setActive(0); };

  const pct = Math.round(((totals.pass + totals.fail) / totals.total) * 100);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ScanBarcode className="h-6 w-6 text-primary" />
            POS Scanner Test
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Run each step on a real device and mark pass/fail. Progress is saved locally.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/pos">Open POS <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">
              {totals.pass + totals.fail}/{totals.total} ·{" "}
              <span className="text-emerald-600">{totals.pass} pass</span> ·{" "}
              <span className="text-destructive">{totals.fail} fail</span>
            </span>
          </div>
          <Progress value={pct} />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {STEPS.map((s, i) => {
          const status = results[s.id] || "pending";
          const isActive = i === active;
          return (
            <Card
              key={s.id}
              className={cn(
                "transition-all",
                isActive && "ring-2 ring-primary/40",
                status === "pass" && "border-emerald-500/40",
                status === "fail" && "border-destructive/50"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={status === "pass"}
                      onCheckedChange={(v) => setStatus(s.id, v ? "pass" : "pending")}
                      className="mt-1"
                    />
                    <div>
                      <CardTitle className="text-base">
                        {i + 1}. {s.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.goal}</p>
                    </div>
                  </div>
                  {status === "pass" && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Pass
                    </Badge>
                  )}
                  {status === "fail" && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" /> Fail
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <ol className="list-decimal list-inside text-sm space-y-1 text-foreground/90">
                  {s.steps.map((line, idx) => <li key={idx}>{line}</li>)}
                </ol>
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="font-semibold">Expected: </span>
                  <span className="text-muted-foreground">{s.expect}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setStatus(s.id, "pass")}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Pass
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setStatus(s.id, "fail")}>
                    <XCircle className="h-4 w-4 mr-1" /> Fail
                  </Button>
                  {status !== "pending" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(s.id, "pending")}>
                      Reset step
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totals.pass + totals.fail === totals.total && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-sm">
            {totals.fail === 0 ? (
              <span className="text-emerald-600 font-medium">All checks passed — scanner flow verified ✅</span>
            ) : (
              <span className="text-destructive font-medium">
                {totals.fail} check(s) failed — review the failing steps above.
              </span>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

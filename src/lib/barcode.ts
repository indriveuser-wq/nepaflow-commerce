// Barcode normalization helpers for reliable matching across EAN/UPC formats.
// - Strips whitespace and non-digits for numeric symbologies
// - Returns a set of equivalent representations so callers can match either way

export function normalizeBarcode(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim();
}

/**
 * Returns equivalent numeric representations for EAN/UPC.
 * - UPC-A (12) <-> EAN-13 (13) by prefixing/stripping leading 0
 * - UPC-E (8)  <-> UPC-A (12) expansion (best-effort)
 * - EAN-8 stays as-is
 * - Strips leading zeros variant for fuzzy matches
 */
export function barcodeVariants(raw: string | null | undefined): string[] {
  const trimmed = normalizeBarcode(raw);
  if (!trimmed) return [];
  const variants = new Set<string>();
  variants.add(trimmed);
  variants.add(trimmed.toLowerCase());

  const digits = trimmed.replace(/\D/g, "");
  if (digits) {
    variants.add(digits);
    // EAN-13 <-> UPC-A
    if (digits.length === 13 && digits.startsWith("0")) variants.add(digits.slice(1));
    if (digits.length === 12) variants.add("0" + digits);
    // UPC-E -> UPC-A expansion
    if (digits.length === 8) {
      const expanded = expandUpcE(digits);
      if (expanded) {
        variants.add(expanded);
        variants.add("0" + expanded); // EAN-13 form
      }
    }
    // Drop leading zeros variant (helps when DB has "12345" but scanner gives "0000012345")
    variants.add(digits.replace(/^0+/, ""));
  }
  return Array.from(variants).filter(Boolean);
}

/** Expand UPC-E (8 digits incl. number system + check) to UPC-A (12 digits). */
function expandUpcE(upcE: string): string | null {
  if (!/^\d{8}$/.test(upcE)) return null;
  const numberSystem = upcE[0];
  if (numberSystem !== "0" && numberSystem !== "1") return null;
  const body = upcE.slice(1, 7);
  const check = upcE[7];
  const d = body.split("");
  let mfg = "", prod = "";
  switch (d[5]) {
    case "0": case "1": case "2":
      mfg = d[0] + d[1] + d[5] + "00";
      prod = "00" + d[2] + d[3] + d[4];
      break;
    case "3":
      mfg = d[0] + d[1] + d[2] + "00";
      prod = "000" + d[3] + d[4];
      break;
    case "4":
      mfg = d[0] + d[1] + d[2] + d[3] + "0";
      prod = "0000" + d[4];
      break;
    default:
      mfg = d[0] + d[1] + d[2] + d[3] + d[4];
      prod = "0000" + d[5];
  }
  return numberSystem + mfg + prod + check;
}

/** True if two raw codes refer to the same product across format variants. */
export function barcodesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const A = barcodeVariants(a);
  const B = new Set(barcodeVariants(b));
  return A.some(v => B.has(v));
}

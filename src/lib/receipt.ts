/** ESC/POS helpers for 58/80mm thermal printers (Bluetooth SPP). */

const ESC = "\x1B";
const GS = "\x1D";

export function escPosInit(): string {
  return `${ESC}@`;
}

export function escPosBold(on: boolean): string {
  return `${ESC}E${String.fromCharCode(on ? 1 : 0)}`;
}

/** 0 left, 1 center, 2 right */
export function escPosAlign(align: 0 | 1 | 2): string {
  return `${ESC}a${String.fromCharCode(align)}`;
}

export function escPosNewlines(n: number): string {
  return "\n".repeat(n);
}

/** Partial cut (common on ESC/POS) */
export function escPosCut(): string {
  return `${GS}V${String.fromCharCode(1)}`;
}

export type ReceiptLine =
  | { kind: "text"; text: string; bold?: boolean; align?: 0 | 1 | 2 }
  | { kind: "rule" };

export function linesToEscPos(lines: ReceiptLine[]): string {
  let out = escPosInit();
  out += escPosAlign(0);
  for (const line of lines) {
    if (line.kind === "rule") {
      out += escPosBold(false);
      out += "--------------------------------\n";
      continue;
    }
    out += escPosAlign(line.align ?? 0);
    out += escPosBold(!!line.bold);
    out += `${line.text}\n`;
    out += escPosBold(false);
  }
  out += escPosNewlines(2);
  out += escPosCut();
  return out;
}

export function buildReceiptLines(params: {
  storeName: string;
  address?: string | null;
  orderNumber: string;
  createdAt: Date;
  paymentMethod: string;
  rows: { name: string; qty: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  footer?: string | null;
}): ReceiptLine[] {
  const fmt = (n: number) => n.toFixed(2);
  const lines: ReceiptLine[] = [
    { kind: "text", text: params.storeName, bold: true, align: 1 },
  ];
  if (params.address) {
    lines.push({ kind: "text", text: params.address, align: 1 });
  }
  lines.push(
    { kind: "text", text: params.createdAt.toLocaleString(), align: 1 },
    { kind: "rule" },
    { kind: "text", text: `Order: ${params.orderNumber}`, bold: true },
    { kind: "text", text: `Payment: ${params.paymentMethod}` },
    { kind: "rule" },
  );
  for (const r of params.rows) {
    lines.push({
      kind: "text",
      text: `${r.name} x${r.qty}  Rs.${fmt(r.unitPrice)} -> Rs.${fmt(r.lineTotal)}`,
    });
  }
  lines.push(
    { kind: "rule" },
    { kind: "text", text: `Subtotal: Rs.${fmt(params.subtotal)}` },
    { kind: "text", text: `Tax: Rs.${fmt(params.tax)}` },
    { kind: "text", text: `Discount: Rs.${fmt(params.discount)}` },
    { kind: "text", text: `TOTAL: Rs.${fmt(params.total)}`, bold: true },
    { kind: "rule" },
  );
  if (params.footer) {
    lines.push({ kind: "text", text: params.footer, align: 1 });
  }
  return lines;
}

/** UTF-8 bytes as base64 for native Bluetooth plugins that accept binary */
export function escPosToBase64(payload: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(payload, "utf8").toString("base64");
  }
  const bytes = new TextEncoder().encode(payload);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

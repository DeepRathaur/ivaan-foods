/**
 * Send ESC/POS payload to a USB thermal printer via Web Serial (Chrome/Edge).
 * Falls back to downloading raw bytes if Serial is unavailable or user cancels.
 */

export type PrintResult =
  | { ok: true; method: "serial" }
  | { ok: true; method: "download" }
  | { ok: false; method: "unsupported"; message: string }
  | { ok: false; method: "cancelled" | "error"; message: string };

function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** Default baud rates for common ESC/POS USB-serial adapters */
const BAUD_CANDIDATES = [9600, 115200, 57600, 38400] as const;

export async function printEscPosOverSerial(escPosUtf8: string): Promise<PrintResult> {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    return { ok: false, method: "unsupported", message: "Web Serial not available (use Chrome/Edge, HTTPS or localhost)." };
  }

  type SerialNav = Navigator & {
    serial: { requestPort: (opts?: object) => Promise<SerialPortLike> };
  };
  type SerialPortLike = {
    open: (opts: { baudRate: number }) => Promise<void>;
    close: () => Promise<void>;
    writable?: WritableStream<Uint8Array> | null;
  };

  const serial = (navigator as SerialNav).serial;

  let port: SerialPortLike;
  try {
    port = await serial.requestPort();
  } catch {
    return { ok: false, method: "cancelled", message: "No port selected." };
  }

  let lastErr: unknown;
  for (const baudRate of BAUD_CANDIDATES) {
    try {
      await port.open({ baudRate });
      const writer = port.writable?.getWriter();
      if (!writer) {
        await port.close().catch(() => {});
        return { ok: false, method: "error", message: "Port has no writable stream." };
      }
      try {
        await writer.write(enc(escPosUtf8));
      } finally {
        writer.releaseLock();
      }
      await port.close();
      return { ok: true, method: "serial" };
    } catch (e) {
      lastErr = e;
      await port.close().catch(() => {});
    }
  }

  return {
    ok: false,
    method: "error",
    message: lastErr instanceof Error ? lastErr.message : "Could not write to printer.",
  };
}

export function downloadEscPosFile(escPosUtf8: string, filenameHint: string): PrintResult {
  if (typeof document === "undefined") {
    return { ok: false, method: "unsupported", message: "Not in browser." };
  }
  const bytes = enc(escPosUtf8);
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${filenameHint.replace(/[^\w-]+/g, "_")}.bin`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { ok: true, method: "download" };
}

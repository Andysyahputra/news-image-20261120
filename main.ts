import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const dst = join(outDir, "entry.png");

const bytes = readFileSync(src);
if (bytes.length === 0 || bytes.length > 1048576) {
  throw new Error(`entry.png must be 1..1048576 bytes, got ${bytes.length}`);
}
if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
  throw new Error("entry.png is not a PNG (bad magic bytes)");
}
// PNG IHDR: width at byte 16, height at byte 20 (big-endian uint32).
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width === 0 || width > 1024 || height === 0 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}
mkdirSync(outDir, { recursive: true });
writeFileSync(dst, bytes);
// The two runs must write the same bytes: verify the copy round-trips.
const back = readFileSync(dst);
if (!back.equals(bytes)) {
  throw new Error("entry.png copy did not round-trip byte-identically");
}

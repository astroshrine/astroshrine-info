import type { SheetRow } from "@/lib/jyotish";
import { lonOf } from "./kundliData";

// The traditional Avakahada tables, by Moon nakshatra (0..26) and Moon sign: the same ones the kundli milan page matches with.
const GANA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0];
const NADI = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];
const YONI = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
const VARNA = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0];
type Vashya = "C" | "M" | "J" | "V" | "K";

/** Indexes into the name lists of the copy, from the Moon's row of the kundli sheet. */
export function avakahada(moon: SheetRow) {
  const lon = lonOf(moon);
  const r = moon.rashi - 1;
  const d = lon % 30;
  const vashya = (["C", "C", "M", "J", "V", "M", "M", "K", d < 15 ? "M" : "C", d < 15 ? "C" : "J", "M", "J"] as Vashya[])[r];
  const n = moon.nakshatra - 1;
  return { varna: VARNA[r], vashya, yoni: YONI[n], gana: GANA[n], nadi: NADI[n] };
}

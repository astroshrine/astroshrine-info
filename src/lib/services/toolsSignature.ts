import { apiForm, type SavedTool } from "./tools";
import type { YearAhead } from "./toolsMansik";

// Signature Reading (React-native-app: features/signatureAnalysis): one photo, measured on the server and
// read by fixed graphology rules (no AI model). Rate-capped at 20 an hour.

export type SignatureFeatureKey = "size" | "slant" | "pressure" | "speed" | "complexity" | "baseline" | "underline" | "legibility";
export const SIGNATURE_FEATURES: SignatureFeatureKey[] = ["size", "slant", "pressure", "speed", "complexity", "baseline", "underline", "legibility"];
export type SignatureFeature = { score: number; band: string; observation: string; meaning: string };

export type SignatureAnalysis = {
  valid: true;
  image_quality: "good" | "fair" | "poor";
  features: Record<SignatureFeatureKey, SignatureFeature>;
  traits: { confidence: number; creativity: number; energy: number };
  summary: string;
  strengths: string[];
  tip: string;
  year_ahead?: YearAhead;
  disclaimer: string;
  savedId?: string;
};
export type SignatureInvalid = { valid: false; reason: string; retake_tip: string };
export type SignatureResult = SignatureAnalysis | SignatureInvalid;

export const SIGNATURE_SAVED: SavedTool = "signature_analysis";

/** POST /v1/signature-analysis/analyze, multipart: `image` and `lang`. */
export function analyzeSignature(image: File, lang: "en" | "hi", signal?: AbortSignal) {
  const form = new FormData();
  form.append("image", image, image.type === "image/png" ? "signature.png" : "signature.jpg");
  form.append("lang", lang);
  return apiForm<SignatureResult>("/v1/signature-analysis/analyze", form, signal);
}

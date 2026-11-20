import { api } from "@/lib/api";
import { apiForm } from "./tools";
import type { YearAhead } from "./toolsMansik";

// Face Reading (React-native-app: features/faceReading). Customer-facing when the backend's
// FACE_READING_ENABLED_FOR_USERS switch is on (403 face_reading_disabled_for_users otherwise); astrologers always pass.
// A customer may be charged points when FACE_READING_PAID_FOR_USERS is on (402 insufficient_balance).

export type FaceLang = "en" | "hi";
export type FaceSubject = { name: string; dateOfBirth: string; gender: "male" | "female" | "other"; language: FaceLang };
export const FACE_CONSENT_VERSION = "v1";

export type Confidence = "high" | "medium" | "low";
export type NamedMeaning = { value: string; meaning: string };
export type Zone = { observations: string[]; meaning: string };
export type Feature = { observation: string; meaning: string; confidence: Confidence; visible: boolean };
export const FACE_FEATURES = ["forehead", "eyebrows", "eyes", "nose", "cheeks", "lips", "chin", "jaw"] as const;
export type FaceFeatureKey = (typeof FACE_FEATURES)[number];

export type FaceOutput = {
  image_quality: "good" | "fair" | "poor";
  issues: string[];
  face_shape: NamedMeaning;
  zones: { forehead: Zone; middle_third: Zone; lower_third: Zone };
  features: Record<FaceFeatureKey, Feature> & { ears?: Feature };
  face_thirds_balance: NamedMeaning;
  strengths: string[];
  growth_areas: string[];
  personality_summary: string;
  career_inclinations?: string[];
  relationship_style?: string;
  remedies_or_practices: string[];
  parent_note?: string;
  year_ahead?: YearAhead;
};

export type FaceReading = {
  id: string;
  subject: { name: string; dateOfBirth?: string; gender: string; language: FaceLang };
  status: "retake_needed" | "ready";
  output: FaceOutput;
  disclaimer: string;
  createdAt: string;
  pointsBalance?: number;
};
export type FaceReadingSummary = { id: string; name: string; status: "retake_needed" | "ready"; createdAt: string };

/** POST /v1/face-reading/readings, multipart: `subject` and `consent` as JSON text, photos `front` (required), `profile`, `smiling`. */
export function createFaceReading(
  subject: FaceSubject,
  consent: { accepted: true; textVersion: string; guardianName?: string },
  photos: { front: File; profile?: File | null; smiling?: File | null },
  signal?: AbortSignal,
) {
  const form = new FormData();
  form.append("subject", JSON.stringify(subject));
  form.append("consent", JSON.stringify(consent));
  for (const [field, file] of Object.entries(photos)) {
    if (file) form.append(field, file, `${field}.${file.type === "image/png" ? "png" : "jpg"}`);
  }
  return apiForm<FaceReading>("/v1/face-reading/readings", form, signal);
}

/** GET /v1/face-reading/readings, newest first. */
export async function listFaceReadings(offset = 0, signal?: AbortSignal) {
  const r = await api<{ readings?: FaceReadingSummary[]; hasMore?: boolean }>(`/v1/face-reading/readings?limit=20&offset=${offset}`, { signal });
  return { readings: r?.readings ?? [], hasMore: Boolean(r?.hasMore) };
}

export function getFaceReading(id: string, signal?: AbortSignal) {
  return api<FaceReading>(`/v1/face-reading/readings/${encodeURIComponent(id)}`, { signal });
}

export function deleteFaceReading(id: string) {
  return api<unknown>(`/v1/face-reading/readings/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export const faceReadingPrintPath = (id: string) => `/v1/face-reading/readings/${encodeURIComponent(id)}/pdf`;

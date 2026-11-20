import { api } from "@/lib/api";

// Sanskar Muhurat (Annaprashan and Mundan) on the shared backend (/v1/sanskar-muhurat). The muhurats themselves are
// computed in the browser by the app's own engine (see src/app/[lang]/tools/sanskar-muhurat/_logic); the backend
// serves the rule base (GET /kb), the second-source panchang cross-check (POST /crosscheck, in _logic/crosscheck.ts)
// and the one charge.

/** POST /charge: takes the price (config.price_points) once per key. 402 insufficient_balance, 403 switched off. */
export function chargeSanskar(idempotencyKey: string) {
  return api<unknown>("/v1/sanskar-muhurat/charge", { method: "POST", body: { idempotencyKey } });
}

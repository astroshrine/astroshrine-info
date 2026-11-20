import { saveResult } from "@/lib/services/toolsBSaved";
import { analyse, blank, type Consultant, type Project } from "@/lib/vastu/mahavastu/engine";

// MahaVastu analyser (45-devta score). Like the app, the projects live on the device (here: this browser, scoped
// to the signed in account) and are autosaved; the analysis is computed in the browser by the app's own engine
// (src/lib/vastu/mahavastu/engine.ts). The only network call is the explicit "Save to my results" button, which
// stores the analysis in the account's saved results (tool "mahavastu_analyser"), as the app does at its report step.

export type IndexEntry = { id: string; name: string; type: "res" | "ind"; updated: number };

const key = (scope: string, k: string) => `mahavastu:${scope}:${k}`;

function read<T>(scope: string, k: string): T | null {
  try {
    const raw = localStorage.getItem(key(scope, k));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(scope: string, k: string, v: unknown): boolean {
  try {
    localStorage.setItem(key(scope, k), JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}

export const EMPTY_CONSULTANT: Consultant = { name: "", title: "", org: "", contact: "" };
export const consultantOf = (scope: string): Consultant => ({ ...EMPTY_CONSULTANT, ...read<Consultant>(scope, "consultant") });

/** Saves the project; false when the browser's storage is full (a large plan photo is the usual cause). */
export function saveProject(scope: string, p: Project, unnamed: string): boolean {
  const updated = Date.now();
  const ok = write(scope, `proj:${p.id}`, { ...p, updated });
  const index = (read<IndexEntry[]>(scope, "index") ?? []).filter((e) => e.id !== p.id);
  index.unshift({ id: p.id, name: p.name || unnamed, type: p.type, updated });
  write(scope, "index", index.slice(0, 60));
  write(scope, "last", p.id);
  write(scope, "consultant", p.consultant);
  return ok;
}
export const listProjects = (scope: string) => read<IndexEntry[]>(scope, "index") ?? [];
export const loadProject = (scope: string, id: string) => {
  const p = read<Project>(scope, `proj:${id}`);
  return p ? { ...blank(consultantOf(scope)), ...p } : null;
};
export const lastProject = (scope: string) => {
  const id = read<string>(scope, "last");
  return id ? loadProject(scope, id) : null;
};
export function deleteProject(scope: string, id: string) {
  try {
    localStorage.removeItem(key(scope, `proj:${id}`));
  } catch {
    // Nothing to remove.
  }
  write(scope, "index", listProjects(scope).filter((e) => e.id !== id));
}

/** POST /v1/tool-results: the analysis and the project (without its photo), as the app stores them. */
export function saveAnalysis(p: Project) {
  return saveResult("mahavastu_analyser", analyse(p), { ...p, img: null }, p.name || p.client || undefined);
}

/** A picked plan photo as a data URL no larger than 1600 px on its long side, so it fits the browser's storage. */
export function photoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { toolMetadata } from "../_b/meta";
import KhoyaView from "./KhoyaView";
import { text } from "./messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return toolMetadata("/tools/khoya-paya", t.pageTitle, t.pageDesc);
}

export default function KhoyaPayaPage() {
  return <KhoyaView />;
}

import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import ProfileView from "./ProfileView";

const text = defineMessages({
  hi: { title: "Profile · AstroShrine" },
  en: { title: "Profile · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false } };
}

export default function ProfilePage() {
  return <ProfileView />;
}

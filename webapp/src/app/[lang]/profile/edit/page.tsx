import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import ProfileForm from "./ProfileForm";

const text = defineMessages({
  hi: { title: "प्रोफ़ाइल बदलें · AstroShrine" },
  en: { title: "Edit profile · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false } };
}

export default function ProfileEditPage() {
  return <ProfileForm />;
}

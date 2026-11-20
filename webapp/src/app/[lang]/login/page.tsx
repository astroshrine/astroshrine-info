import type { Metadata } from "next";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import LoginForm from "./LoginForm";

const text = defineMessages({
  hi: {
    title: "Login · AstroShrine",
    description: "AstroShrine ऐप वाले मोबाइल नंबर और OTP से लॉगिन करें।",
  },
  en: {
    title: "Log in · AstroShrine",
    description: "Log in with the mobile number you use in the AstroShrine app and an OTP.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getT(text);
  return { title, description, robots: { index: false } };
}

export default function LoginPage() {
  return <LoginForm />;
}

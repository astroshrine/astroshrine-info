import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Login · AstroShrine",
  description: "AstroShrine ऐप वाले मोबाइल नंबर और OTP से लॉगिन करें।",
  robots: { index: false },
};

export default function LoginPage() {
  return <LoginForm />;
}

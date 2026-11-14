import type { Metadata } from "next";
import ProfileView from "./ProfileView";

export const metadata: Metadata = {
  title: "Profile · AstroShrine",
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}

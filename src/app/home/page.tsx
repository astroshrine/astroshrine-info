import type { Metadata } from "next";
import HomeView from "./HomeView";

export const metadata: Metadata = {
  title: "Home · AstroShrine",
  robots: { index: false },
};

export default function HomePage() {
  return <HomeView />;
}

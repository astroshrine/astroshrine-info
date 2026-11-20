import type { Metadata } from "next";
import ConsoleShell from "./_console/ConsoleShell";

// The console is for verified astrologers only: keep it out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AstrologerLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}

import { Suspense } from "react";
import ChatShell from "./ChatShell";

export default function ChatLayout({ children }: LayoutProps<"/chat">) {
  return (
    // The shell reads the URL (open conversation): runtime data, so it streams in behind a fallback.
    <Suspense
      fallback={
        <div aria-busy="true" className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pb-8 pt-4 md:px-8 lg:h-[calc(100dvh-9rem)] lg:grid-cols-3 lg:pt-8">
          <div className="h-64 animate-pulse rounded-3xl bg-surface-sunken lg:h-full" />
          <div className="hidden animate-pulse rounded-3xl bg-surface-sunken lg:col-span-2 lg:block" />
        </div>
      }
    >
      <ChatShell>{children}</ChatShell>
    </Suspense>
  );
}

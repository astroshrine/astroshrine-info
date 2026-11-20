import { Suspense } from "react";
import ChatShell from "./ChatShell";

export default function ChatLayout({ children }: LayoutProps<"/[lang]/chat">) {
  return (
    // The shell reads the URL (open conversation): runtime data, so it streams in behind a fallback.
    <Suspense
      fallback={
        // The same frame as ChatShell (it cannot tell yet whether a conversation is open).
        <div
          aria-busy="true"
          data-fills-screen="wide"
          className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pb-8 pt-4 md:px-8 lg:h-[calc(100dvh-5rem)] lg:grid-cols-3 lg:pt-8"
        >
          <div className="h-64 animate-pulse rounded-3xl bg-surface-sunken lg:h-full" />
          <div className="hidden animate-pulse rounded-3xl bg-surface-sunken lg:col-span-2 lg:block" />
        </div>
      }
    >
      <ChatShell>{children}</ChatShell>
    </Suspense>
  );
}

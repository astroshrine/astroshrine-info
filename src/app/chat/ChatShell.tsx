"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import ChatList from "./ChatList";

/**
 * /chat and /chat/<astrologer>: the list beside the open conversation on wide screens; on phones, the list
 * alone at /chat and the conversation alone at /chat/<astrologer> (each its own URL, Back works).
 * Both panes always render (only CSS hides one on phones); each handles loading and signed out itself, so
 * the page segment is never dropped while the session is still being read.
 */
export default function ChatShell({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const roomOpen = !!segment;

  return (
    <div
      className={`mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pb-8 pt-4 md:px-8 lg:h-[calc(100dvh-9rem)] lg:grid-cols-3 lg:pt-8 ${
        roomOpen ? "h-[calc(100dvh-7rem)]" : ""
      }`}
    >
      <div className={`${roomOpen ? "hidden lg:flex" : "flex"} min-h-0 flex-col`}>
        <ChatList activeId={segment} />
      </div>
      <div className={`${roomOpen ? "flex" : "hidden lg:flex"} min-h-0 flex-col lg:col-span-2`}>{children}</div>
    </div>
  );
}

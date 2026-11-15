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
    // Fills the screen under the header exactly (5rem = main's pt-20): always on wide screens, on phones while a
    // conversation is open. Messages scroll inside the room, the composer stays at the bottom, and the site
    // footer is not shown below (data-fills-screen, see globals.css), so the page itself never scrolls.
    <div
      data-fills-screen={roomOpen ? "always" : "wide"}
      className={`mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pt-4 md:px-8 lg:h-[calc(100dvh-5rem)] lg:grid-cols-3 lg:pb-8 lg:pt-8 ${
        roomOpen ? "h-[calc(100dvh-5rem)] pb-4" : "pb-8"
      }`}
    >
      <div className={`${roomOpen ? "hidden lg:flex" : "flex"} min-h-0 flex-col`}>
        <ChatList activeId={segment} />
      </div>
      <div className={`${roomOpen ? "flex" : "hidden lg:flex"} min-h-0 flex-col lg:col-span-2`}>{children}</div>
    </div>
  );
}

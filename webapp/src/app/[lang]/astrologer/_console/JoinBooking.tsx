"use client";

import { useEffect, useState } from "react";
import { PiChatCircleText, PiPhone, PiWarningCircle } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { canJoinNow, joinBookedChat, NoChatRoom } from "@/lib/services/astrologerJoin";
import { Button } from "./ui";

const text = defineMessages({
  hi: {
    joinChat: "चैट में जुड़ें",
    joining: "खुल रहा है…",
    callInApp: "कॉल से जुड़ने के लिए ऐप खोलें",
    outside: "यह बुकिंग का समय नहीं है।",
    noRoom: "इस ग्राहक की चैट नहीं मिली। कुछ देर बाद फिर कोशिश करें।",
    failed: "जुड़ नहीं सके। इंटरनेट देखें और फिर कोशिश करें।",
  },
  en: {
    joinChat: "Join chat",
    joining: "Opening…",
    callInApp: "Open the app to join the call",
    outside: "It is not time for this booking.",
    noRoom: "This customer's chat was not found. Try again in a moment.",
    failed: "Could not join. Check your connection and try again.",
  },
});

/**
 * Join a booked session when it is time (5 minutes before the start until the end). A chat opens in the console;
 * a call cannot be taken in the browser by an astrologer, so it says so and points to the app.
 */
export default function JoinBooking({
  bookingId,
  userId,
  selfId,
  kind,
  status,
  startsAt,
  endsAt,
  size = "sm",
}: {
  bookingId: string;
  userId: string;
  selfId: string;
  kind: "chat" | "call";
  status: string;
  startsAt: number | null;
  endsAt: number | null;
  size?: "sm" | "md";
}) {
  const t = useT(text);
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(h);
  }, []);

  if (!canJoinNow(status, startsAt, endsAt, now)) return null;

  if (kind === "call") {
    return (
      <span className="inline-flex items-center gap-2 rounded-[14px] bg-surface-sunken px-3.5 py-2 text-sm font-bold text-brand-strong">
        <PiPhone className="h-[18px] w-[18px] shrink-0" aria-hidden />
        {t.callInApp}
      </span>
    );
  }

  const join = async () => {
    if (busy || !userId) return;
    setBusy(true);
    setError(null);
    try {
      router.push(await joinBookedChat(bookingId, selfId, userId));
    } catch (e) {
      setError(e instanceof NoChatRoom ? t.noRoom : e instanceof ApiError && e.status === 400 ? t.outside : t.failed);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button size={size} onClick={join} disabled={busy || !userId}>
        <PiChatCircleText className="h-[18px] w-[18px] text-brand" aria-hidden />
        {busy ? t.joining : t.joinChat}
      </Button>
      {error && (
        <p role="alert" className="m-0 flex items-center gap-1.5 text-sm font-bold text-danger">
          <PiWarningCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { PiStar, PiStarFill } from "react-icons/pi";
import { primaryButton } from "@/components/consult/Dialog";
import WithName from "@/components/consult/WithName";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { addReview } from "@/lib/services/astrologers";

const text = defineMessages({
  hi: {
    thanks: (name: string) => `रेटिंग के लिए धन्यवाद। यह ${name} की प्रोफ़ाइल पर दिखेगी।`,
    question: (name: string) => `${name} के साथ चैट कैसी रही?`,
    stars: (n: number) => `${n} स्टार`,
    comment: "कुछ लिखना चाहें (ज़रूरी नहीं)",
    failed: "रेटिंग नहीं भेजी जा सकी। कृपया फिर से कोशिश करें।",
    sending: "भेजी जा रही है…",
    send: "रेटिंग भेजें",
  },
  en: {
    thanks: (name) => `Thank you for your rating. It will show on ${name}'s profile.`,
    question: (name) => `How was your chat with ${name}?`,
    stars: (n) => (n === 1 ? "1 star" : `${n} stars`),
    comment: "Add a comment (optional)",
    failed: "Your rating could not be sent. Please try again.",
    sending: "Sending…",
    send: "Send rating",
  },
});

/** After a chat: rate the astrologer (shown on their profile under the account's first name). */
export default function RateAstrologer({ astrologerId, name }: { astrologerId: string; name: string }) {
  const t = useT(text);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  if (state === "done") {
    return (
      <p role="status" className="caption-2 rounded-2xl bg-success-soft px-3 py-2 text-success">
        <WithName text={t.thanks(name)} name={name} />
      </p>
    );
  }

  const submit = async () => {
    if (!rating || state === "sending") return;
    setState("sending");
    try {
      await addReview(astrologerId, rating, comment);
      setState("done");
    } catch {
      setState("error");
    }
  };

  const shown = hover || rating;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-card p-4"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="title-4 mb-2 text-ink">
          <WithName text={t.question(name)} name={name} />
        </legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-pressed={rating === n}
              aria-label={t.stars(n)}
              className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-surface-sunken active:scale-98"
            >
              {n <= shown ? <PiStarFill className="h-6 w-6 text-brand" aria-hidden /> : <PiStar className="h-6 w-6 text-ink-muted" aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="caption-2 text-ink-soft">{t.comment}</span>
        <textarea
          value={comment}
          maxLength={500}
          rows={2}
          onChange={(e) => setComment(e.target.value)}
          className="body-6 resize-none rounded-xl border border-line-strong bg-surface-page px-3 py-2 text-ink"
        />
      </label>
      {state === "error" && (
        <p role="alert" className="caption-2 text-danger">
          {t.failed}
        </p>
      )}
      <button type="submit" disabled={!rating || state === "sending"} className={`${primaryButton} w-fit`}>
        {state === "sending" ? t.sending : t.send}
      </button>
    </form>
  );
}

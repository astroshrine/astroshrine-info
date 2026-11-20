"use client";

import { useEffect, useState } from "react";
import { PiRobot, PiSparkle, PiTrash } from "react-icons/pi";
import Dialog, { primaryButton, quietButton, secondaryButton } from "@/components/consult/Dialog";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { listPersonas, listAiSessions, deleteAiSession, type AiSession, type Persona } from "@/lib/services/aiAstrologers";
import { EmptyState, ListSkeleton, LoadError, PageFrame, shortDate, useRequireSignIn } from "../bookings/_parts/shared";
import { PersonaIcon, personaName, personaTopic } from "./personaUi";

const text = defineMessages({
  hi: {
    title: "AI ज्योतिषी",
    intro: "हर AI ज्योतिषी एक विषय में माहिर है। अपना सवाल पूछें और जवाब तुरंत पाएं। ये असली इंसान नहीं, AI हैं, और ये सलाह के लिए हैं, पक्की भविष्यवाणी नहीं।",
    badge: "AI",
    chat: "चैट करें",
    loadFailed: "AI ज्योतिषी लोड नहीं हो सके।",
    none: "अभी कोई AI ज्योतिषी उपलब्ध नहीं है।",
    noneBody: "थोड़ी देर बाद फिर देखें।",
    recent: "आपकी पिछली बातचीत",
    recentFailed: "पिछली बातचीत लोड नहीं हो सकी।",
    untitled: "नई बातचीत",
    messages: (n: number) => `${n} संदेश`,
    delete: "हटाएं",
    deleteTitle: "यह बातचीत हटाएं?",
    deleteBody: "यह बातचीत आपके account से हमेशा के लिए हट जाएगी।",
    keep: "रहने दें",
    yesDelete: "हां, हटाएं",
    deleteFailed: "बातचीत हटाई नहीं जा सकी।",
    needsFace: "इसके लिए ऐप में बनी फ़ेस रीडिंग चाहिए",
    paidNote: "हर सवाल का शुल्क आपके wallet के पॉइंट्स से लगता है।",
  },
  en: {
    title: "AI astrologers",
    intro: "Each AI astrologer is strong in one topic. Ask your question and get an answer at once. They are an AI, not a person, and give guidance, not guaranteed predictions.",
    badge: "AI",
    chat: "Chat",
    loadFailed: "The AI astrologers could not be loaded.",
    none: "No AI astrologer is available right now.",
    noneBody: "Please check again in a little while.",
    recent: "Your earlier conversations",
    recentFailed: "Your earlier conversations could not be loaded.",
    untitled: "New conversation",
    messages: (n) => (n === 1 ? "1 message" : `${n} messages`),
    delete: "Delete",
    deleteTitle: "Delete this conversation?",
    deleteBody: "It will be removed from your account for good.",
    keep: "Keep it",
    yesDelete: "Yes, delete",
    deleteFailed: "The conversation could not be deleted.",
    needsFace: "Needs a face reading made in the app",
    paidNote: "Each question is charged from your wallet points.",
  },
});

export default function AiAstrologersView() {
  const signedIn = useRequireSignIn();
  if (!signedIn) return <PageFrame><ListSkeleton /></PageFrame>;
  return <SignedIn />;
}

function SignedIn() {
  const t = useT(text);
  const locale = useLocale();
  const { session } = useAuth();
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [sessions, setSessions] = useState<AiSession[] | null>(null);
  const [sessionsFailed, setSessionsFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [toDelete, setToDelete] = useState<AiSession | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listPersonas(controller.signal).then(setPersonas, () => {
      if (!controller.signal.aborted) setFailed(true);
    });
    listAiSessions(controller.signal).then(
      (s) => {
        setSessions(s);
        setSessionsFailed(false);
      },
      () => {
        if (!controller.signal.aborted) setSessionsFailed(true);
      },
    );
    return () => controller.abort();
  }, [attempt, session?.user.id]);

  const byId = new Map((personas ?? []).map((p) => [p.id, p]));

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      await deleteAiSession(toDelete.id);
      setSessions((s) => (s ?? []).filter((x) => x.id !== toDelete.id));
      setToDelete(null);
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageFrame>
      <header className="flex max-w-2xl flex-col gap-2">
        <h1 className="heading-3 inline-flex items-center gap-2 text-ink">
          <PiSparkle className="h-7 w-7 text-brand-strong" aria-hidden />
          {t.title}
        </h1>
        <p className="body-6 text-ink-soft">{t.intro}</p>
        <p className="caption-2 text-ink-soft">{t.paidNote}</p>
      </header>

      {personas === null ? (
        failed ? <LoadError message={t.loadFailed} onRetry={() => {
            setFailed(false);
            setAttempt((a) => a + 1);
          }} /> : <ListSkeleton />
      ) : personas.length === 0 ? (
        <EmptyState icon={<PiRobot className="h-7 w-7" aria-hidden />} title={t.none} body={t.noneBody} />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => {
            const name = personaName(p, locale);
            const needsFace = p.needs.includes("face_report");
            return (
              <li key={p.id}>
                <Link
                  href={`/ai-astrologers/${encodeURIComponent(p.id)}`}
                  className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-surface-card p-4 transition hover:border-line-strong hover:bg-surface-sunken active:scale-98"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-inverse text-brand-on-inverse">
                    <PersonaIcon persona={p} className="h-6 w-6" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="title-4 text-ink">{name}</span>
                      <span className="caption-4 rounded-md bg-surface-inverse px-1.5 py-0.5 text-ink-inverse">{t.badge}</span>
                    </span>
                    <span className="caption-2 text-brand-strong">{personaTopic(p, locale)}</span>
                    {needsFace && <span className="caption-4 text-ink-soft">{t.needsFace}</span>}
                  </span>
                  <span className="button-sm text-ink group-hover:underline">{t.chat}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(sessionsFailed || (sessions && sessions.length > 0)) && (
        <section aria-labelledby="recent" className="flex flex-col gap-3">
          <h2 id="recent" className="heading-6 text-ink">
            {t.recent}
          </h2>
          {sessionsFailed ? (
            <p className="body-6 text-ink-soft">{t.recentFailed}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sessions!.map((s) => {
                const p = s.personaId ? byId.get(s.personaId) : null;
                const href = p ? `/ai-astrologers/${encodeURIComponent(p.id)}?session=${encodeURIComponent(s.id)}` : null;
                const label = s.title || t.untitled;
                const when = s.lastMessageAt ? shortDate(new Date(s.lastMessageAt).toISOString().substring(0, 10), locale) : "";
                return (
                  <li key={s.id} className="flex items-center gap-2 rounded-2xl border border-line bg-surface-card p-3">
                    {href ? (
                      <Link href={href} className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl px-2 py-1 hover:bg-surface-sunken">
                        <span className="body-5 truncate text-ink">{label}</span>
                        <span className="caption-2 text-ink-soft">
                          {p ? personaName(p, locale) : ""} · {t.messages(s.totalMessages)} · {when}
                        </span>
                      </Link>
                    ) : (
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-2 py-1">
                        <span className="body-5 truncate text-ink">{label}</span>
                        <span className="caption-2 text-ink-soft">
                          {t.messages(s.totalMessages)} · {when}
                        </span>
                      </span>
                    )}
                    <button type="button" onClick={() => setToDelete(s)} aria-label={`${t.delete}: ${label}`} className={quietButton}>
                      <PiTrash className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <Dialog open={!!toDelete} onClose={() => (deleting ? undefined : setToDelete(null))} title={t.deleteTitle}>
        <p className="body-6 text-ink-soft">{t.deleteBody}</p>
        {deleteError && (
          <p role="alert" className="caption-2 text-danger">
            {t.deleteFailed}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setToDelete(null)} disabled={deleting} className={secondaryButton}>
            {t.keep}
          </button>
          <button type="button" onClick={remove} disabled={deleting} className={primaryButton}>
            {t.yesDelete}
          </button>
        </div>
      </Dialog>
    </PageFrame>
  );
}

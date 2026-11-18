"use client";

import { useEffect, useState } from "react";
import { PiArrowRight, PiUser } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_CHAT_RATE, priceOf } from "@/lib/endpoints";
import { getOwnAstrologer, saveProfile, type OwnAstrologer } from "@/lib/services/astrologerProfile";
import { Accent, Button, Card, IconBadge, Page, PageTitle, Pill } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";
import { ownNeedsSetup } from "../_console/setup";
import {
  Avatar,
  DetailsInputs,
  EXPERTISE_CHOICES,
  LANGUAGE_CHOICES,
  PhotoField,
  Text,
  canonical,
  checkDetails,
  fieldText,
  labelOf,
  messageOf,
  type DetailsDraft,
} from "../profile/DetailsFields";

const text = defineMessages({
  hi: {
    eyebrow: "पहला साइन इन · केवल एक बार",
    welcome: "स्वागत है, ",
    welcomeNoName: "स्वागत ",
    sub: "शुरू करने से पहले एक बार अपनी प्रोफ़ाइल जाँच लें और ज़रूरी जानकारी भर दें। बाद में इसे प्रोफ़ाइल में बदल सकते हैं।",
    once: "केवल एक बार",
    editTitle: "आपकी प्रोफ़ाइल",
    ckTitle: "शुरू करने से पहले",
    ck1: "प्रोफ़ाइल फ़ोटो",
    ck1o: "सुझाया गया",
    ck2: "आपके बारे में",
    ck3: "विशेषज्ञता और भाषाएँ",
    go: "सहेजें और होम पर जाएँ",
    saving: "सहेज रहे हैं…",
    later: "यह पेज आपको दोबारा नहीं दिखेगा। ये विवरण आप कभी भी प्रोफ़ाइल में बदल सकते हैं।",
    newHere: "कंसोल पर नए हैं?",
    howTo: "उपयोग का तरीका देखें",
    cardTitle: "ग्राहक क्या देखते हैं",
    years: (n: number) => `${n} वर्ष का अनुभव`,
    rating: (r: number) => `★ ${r.toFixed(1)}`,
    noRating: "अभी कोई रेटिंग नहीं",
    chat: (n: number) => `चैट · ₹${n}/मिनट`,
    call: (n: number) => `कॉल · ₹${n}/मिनट`,
    loading: "प्रोफ़ाइल लोड हो रही है…",
    failed: "प्रोफ़ाइल नहीं खुल सकी।",
    retry: "फिर कोशिश करें",
  },
  en: {
    eyebrow: "First sign-in · one time only",
    welcome: "Welcome, ",
    welcomeNoName: "Welcome",
    sub: "Check your profile once before you start and fill in what is missing. You can change it later in Profile.",
    once: "One-time step",
    editTitle: "Your profile",
    ckTitle: "Before you start",
    ck1: "Profile photo",
    ck1o: "Recommended",
    ck2: "About you",
    ck3: "Expertise and languages",
    go: "Save and go to Home",
    saving: "Saving…",
    later: "You will not see this page again. You can change these details any time in Profile.",
    newHere: "New to the console?",
    howTo: "See how to use it",
    cardTitle: "What customers see",
    years: (n) => `${n} years of experience`,
    rating: (r) => `★ ${r.toFixed(1)}`,
    noRating: "No rating yet",
    chat: (n) => `Chat · ₹${n}/min`,
    call: (n) => `Call · ₹${n}/min`,
    loading: "Loading your profile…",
    failed: "Could not load your profile.",
    retry: "Try again",
  },
});

const DEFAULT_CALL_RATE = 10;

const draftOf = (me: OwnAstrologer): DetailsDraft => ({
  name: me.name,
  experience: String(me.experience),
  about: me.aboutMe,
  expertise: me.expertise.map((v) => canonical(EXPERTISE_CHOICES, v)),
  languages: me.languages.map((v) => canonical(LANGUAGE_CHOICES, v)),
});

type Load = { id: string; status: "ready"; me: OwnAstrologer } | { id: string; status: "error" };

export default function SetupView() {
  const t = useT(text);
  const hi = useLocale() === "hi";
  const { id, status } = useAstrologer();
  const { session, refresh } = useAuth();
  const router = useRouter();
  const [load, setLoad] = useState<Load | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [draft, setDraft] = useState<DetailsDraft | null>(null);

  useEffect(() => {
    if (status !== "ready" || !id || !session) return;
    const controller = new AbortController();
    getOwnAstrologer(id, controller.signal).then(
      (me) => {
        setLoad({ id, status: "ready", me });
        setPhoto(me.photo);
        // Setup is one time: an astrologer whose details are already complete goes straight to Home.
        if (ownNeedsSetup(me)) setDraft((d) => d ?? draftOf(me));
        else router.replace("/astrologer");
      },
      () => !controller.signal.aborted && setLoad({ id, status: "error" }),
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status, session, attempt]);

  const current = load && load.id === id ? load : null;
  const header = (title: React.ReactNode) => <PageTitle eyebrow={t.eyebrow} title={title} sub={t.sub} />;

  if (!current || !draft)
    return (
      <Page>
        {header(<Accent>{t.welcomeNoName}</Accent>)}
        {current?.status === "error" ? (
          <Card className="flex flex-wrap items-center justify-between gap-4 p-8" role="alert">
            <p className="text-danger">{t.failed}</p>
            <Button
              variant="line"
              size="sm"
              onClick={() => {
                setLoad(null);
                setAttempt((n) => n + 1);
              }}
            >
              {t.retry}
            </Button>
          </Card>
        ) : (
          <Card className="p-8 text-ink-soft" role="status">
            {t.loading}
          </Card>
        )}
      </Page>
    );
  if (current.status === "error") return null;

  return (
    <Page>
      <Body
        me={current.me}
        photo={photo}
        draft={draft}
        setDraft={setDraft}
        onPhoto={() => getOwnAstrologer(id).then((m) => setPhoto(m.photo), () => {})}
        onSaved={async () => {
          await refresh().catch(() => {});
          router.replace("/astrologer");
        }}
        t={t}
        hi={hi}
        title={header(
          <>
            {t.welcome}
            <Accent>{draft.name.trim() ? <Text>{draft.name.trim()}</Text> : ""}</Accent>
          </>,
        )}
      />
    </Page>
  );
}

function Body({
  me,
  photo,
  draft,
  setDraft,
  onPhoto,
  onSaved,
  t,
  hi,
  title,
}: {
  me: OwnAstrologer;
  photo: string | null;
  draft: DetailsDraft;
  setDraft: (fn: (d: DetailsDraft | null) => DetailsDraft | null) => void;
  onPhoto: () => void;
  onSaved: () => Promise<void>;
  t: (typeof text)["en"];
  hi: boolean;
  title: React.ReactNode;
}) {
  const f = useT(fieldText);
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState("");
  const [tried, setTried] = useState(false);

  const checked = checkDetails(draft, f);
  const ok = "input" in checked;
  const aboutOk = draft.about.trim().length > 0;
  const skillsOk = draft.expertise.length > 0 && draft.languages.length > 0;
  const shownIssue = issue || (tried && !ok ? (checked as { error: string }).error : "");

  const patch = (p: Partial<DetailsDraft>) => {
    setIssue("");
    setDraft((d) => (d ? { ...d, ...p } : d));
  };

  const go = async () => {
    setTried(true);
    if (!("input" in checked)) return;
    setBusy(true);
    setIssue("");
    try {
      await saveProfile(me.id, checked.input);
      await onSaved();
    } catch (e) {
      setIssue(messageOf(e, f.genericError));
      setBusy(false);
    }
  };

  const chat = priceOf(me.pricing.chat, DEFAULT_CHAT_RATE);
  const call = priceOf(me.pricing.call, DEFAULT_CALL_RATE);
  const names = (list: typeof EXPERTISE_CHOICES, values: string[]) => values.map((v) => labelOf(list, v, hi));
  const exp = parseInt(draft.experience, 10);
  const checklist: { done: boolean; label: string; note?: string }[] = [
    { done: !!photo, label: t.ck1, note: t.ck1o },
    { done: aboutOk, label: t.ck2 },
    { done: skillsOk, label: t.ck3 },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-[420px]">{title}</div>
        <Pill tone="navy" className="mb-1">
          {t.once}
        </Pill>
      </div>
      <div className="flex flex-wrap items-start gap-7">
        <Card className="min-w-0 flex-[1_1_560px] p-6 sm:p-7" aria-labelledby="su-edit">
          <div className="mb-5 flex items-center gap-3">
            <IconBadge icon={PiUser} size={42} />
            <h2 id="su-edit" className="font-display text-2xl font-bold">
              {t.editTitle}
            </h2>
          </div>
          <div className="flex flex-col gap-6">
            <PhotoField id={me.id} photo={photo} name={draft.name} onDone={onPhoto} />
            <DetailsInputs draft={draft} onChange={patch} />
          </div>
        </Card>

        <div className="flex min-w-0 flex-[0_1_380px] flex-col gap-6 lg:sticky lg:top-4">
          <div className="rounded-[20px] border border-line bg-surface-page p-[18px]">
            <p className="mb-3 text-[13px] font-semibold text-ink-soft">{t.cardTitle}</p>
            <div className="flex items-center gap-3.5">
              <Avatar photo={photo} name={draft.name} size={64} />
              <div className="min-w-0">
                <p className="text-[17px] font-bold">{draft.name.trim() ? <Text>{draft.name.trim()}</Text> : "—"}</p>
                <p className="text-sm text-ink-soft">
                  {me.rating ? t.rating(me.rating) : t.noRating}
                  {exp > 0 && ` · ${t.years(exp)}`}
                </p>
              </div>
            </div>
            {draft.expertise.length > 0 && (
              <p className="mt-3 text-[14.5px] font-semibold">
                <Text>{names(EXPERTISE_CHOICES, draft.expertise).join(" · ")}</Text>
              </p>
            )}
            {draft.languages.length > 0 && (
              <p className="mt-0.5 text-[13.5px] text-ink-soft">
                <Text>{names(LANGUAGE_CHOICES, draft.languages).join(", ")}</Text>
              </p>
            )}
            {draft.about.trim() && (
              <p className="mt-2.5 line-clamp-4 text-[14.5px] leading-relaxed">
                <Text>{draft.about.trim()}</Text>
              </p>
            )}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <span className="inline-flex h-11 items-center justify-center rounded-[14px] bg-surface-inverse px-2.5 text-[13.5px] font-bold text-ink-inverse">{t.chat(chat.price)}</span>
              <span className="inline-flex h-11 items-center justify-center rounded-[14px] bg-brand px-2.5 text-[13.5px] font-bold text-brand-ink">{t.call(call.price)}</span>
            </div>
          </div>

          <Card className="p-5 sm:px-6" aria-labelledby="su-ck">
            <h2 id="su-ck" className="font-display text-xl font-bold">
              {t.ckTitle}
            </h2>
            <ul className="mt-2.5">
              {checklist.map((c, i) => (
                <li key={c.label} className="flex items-center gap-2.5 border-t border-line py-2 text-[15px]">
                  <span
                    aria-hidden="true"
                    className={`flex size-[26px] shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                      c.done ? "bg-success text-white" : "border-[1.5px] border-dashed border-line-strong bg-neutral-soft text-ink-soft"
                    }`}
                  >
                    {c.done ? "✓" : i + 1}
                  </span>
                  <span className="flex-1">{c.label}</span>
                  {c.note && <span className="text-[12.5px] text-ink-soft">{c.note}</span>}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-3.5 w-full aria-disabled:bg-neutral-soft aria-disabled:text-ink-soft" aria-disabled={!ok || busy} disabled={busy} onClick={go}>
              {busy ? t.saving : t.go}
              {!busy && <PiArrowRight size={18} className="text-brand" aria-hidden="true" />}
            </Button>
            {shownIssue && (
              <p role="alert" className="mt-2 text-sm font-semibold text-danger">
                {shownIssue}
              </p>
            )}
            <p className="mt-3 text-[13.5px] text-ink-soft">{t.later}</p>
            <p className="mt-2 text-sm">
              {t.newHere}{" "}
              <Link href="/astrologer/help" className="font-bold text-brand-strong underline underline-offset-[3px]">
                {t.howTo}
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

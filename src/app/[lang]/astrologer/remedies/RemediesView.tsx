"use client";

import { useEffect, useState } from "react";
import { PiPlus, PiScroll } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import {
  NOTE_MAX,
  getClients,
  getPujas,
  getSentRemedies,
  searchProducts,
  suggestRemedy,
  type Client,
  type Item,
  type RemedyKind,
  type SentRemedy,
} from "@/lib/services/astrologerRemedies";
import { Accent, Button, Card, IconBadge, Page, PageTitle, Pill, fieldClass, labelClass } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "उपाय",
    titleA: "ग्राहकों को ",
    titleB: "उपाय सुझाएँ",
    sub: "जिन ग्राहकों ने आपसे परामर्श लिया है, उन्हें स्टोर का उत्पाद, पूजा या सलाह भेजें। उन्हें सूचना मिलती है।",
    newBtn: "नया उपाय",
    sentTitle: "भेजे गए उपाय",
    loading: "लोड हो रहा है…",
    failed: "उपाय नहीं खुल सके।",
    retry: "फिर कोशिश करें",
    empty: "आपने अभी कोई उपाय नहीं भेजा।",
    to: "को",
    seen: "देखा गया",
    notSeen: "अभी नहीं देखा",
    kinds: { product: "उत्पाद", puja: "पूजा", text: "सलाह" },
    formTitle: "नया उपाय",
    client: "ग्राहक",
    chooseClient: "ग्राहक चुनें",
    noClients: "अभी कोई ग्राहक नहीं। जब कोई ग्राहक आपसे परामर्श लेगा, वह यहाँ दिखेगा।",
    clientsFailed: "ग्राहकों की सूची नहीं खुल सकी।",
    kind: "उपाय का प्रकार",
    item: (k: RemedyKind): string => (k === "puja" ? "पूजा" : "उत्पाद"),
    search: "नाम से खोजें",
    searching: "खोज रहे हैं…",
    noItems: "कुछ नहीं मिला।",
    itemsFailed: "सूची नहीं खुल सकी।",
    note: "सलाह / नोट",
    noteOptional: "(वैकल्पिक)",
    notePh: "ग्राहक के लिए एक छोटा संदेश…",
    needClient: "पहले ग्राहक चुनें।",
    needItem: "एक चुनें।",
    needNote: "सलाह लिखें।",
    send: "भेजें",
    sending: "भेज रहे हैं…",
    cancel: "रद्द करें",
    sent: (n: string) => `${n} को उपाय भेज दिया गया।`,
    genericError: "भेजा नहीं जा सका। फिर कोशिश करें।",
    notClient: "आप केवल उन्हीं ग्राहकों को भेज सकते हैं जिन्होंने आपसे परामर्श लिया है।",
  },
  en: {
    eyebrow: "Remedies",
    titleA: "Suggest ",
    titleB: "remedies",
    sub: "Send a store product, a puja or plain advice to clients who have consulted you. They get a notification.",
    newBtn: "New remedy",
    sentTitle: "Sent remedies",
    loading: "Loading…",
    failed: "Could not load your remedies.",
    retry: "Try again",
    empty: "You have not sent any remedy yet.",
    to: "To",
    seen: "Seen",
    notSeen: "Not seen yet",
    kinds: { product: "Product", puja: "Puja", text: "Advice" },
    formTitle: "New remedy",
    client: "Client",
    chooseClient: "Choose a client",
    noClients: "No clients yet. Anyone who consults you will show up here.",
    clientsFailed: "Could not load your clients.",
    kind: "Type of remedy",
    item: (k) => (k === "puja" ? "Puja" : "Product"),
    search: "Search by name",
    searching: "Searching…",
    noItems: "Nothing found.",
    itemsFailed: "Could not load the list.",
    note: "Advice / note",
    noteOptional: "(optional)",
    notePh: "A short message for the client…",
    needClient: "Choose a client first.",
    needItem: "Choose one.",
    needNote: "Write the advice.",
    send: "Send",
    sending: "Sending…",
    cancel: "Cancel",
    sent: (n) => `Remedy sent to ${n}.`,
    genericError: "Could not send. Please try again.",
    notClient: "You can only send to clients who have consulted you.",
  },
});

const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const Text = ({ children }: { children: string }) => <span lang={hasDevanagari(children) ? "hi" : undefined}>{children}</span>;

type Load = { id: string; status: "ready"; items: SentRemedy[] } | { id: string; status: "error" };

export default function RemediesView() {
  const t = useT(text);
  const intl = INTL_LOCALE[useLocale()];
  const { id, status } = useAstrologer();
  const { session } = useAuth();
  const [load, setLoad] = useState<Load | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => {
    if (status !== "ready" || !id || !session) return;
    const controller = new AbortController();
    getSentRemedies(id, controller.signal).then(
      (items) => setLoad({ id, status: "ready", items }),
      () => !controller.signal.aborted && setLoad({ id, status: "error" }),
    );
    return () => controller.abort();
  }, [id, status, session, attempt]);

  const current = load && load.id === id ? load : null;
  const date = (iso: string) => {
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric" }).format(ms) : "";
  };

  return (
    <Page>
      <PageTitle
        eyebrow={t.eyebrow}
        title={
          <>
            {t.titleA}
            <Accent>{t.titleB}</Accent>
          </>
        }
        sub={t.sub}
      />

      {done && (
        <p role="status" className="rounded-[14px] bg-success-soft px-4 py-3 font-semibold text-success">
          {done}
        </p>
      )}

      {open ? (
        <SuggestForm
          id={id}
          t={t}
          onCancel={() => setOpen(false)}
          onSent={(name) => {
            setOpen(false);
            setDone(t.sent(name));
            setLoad(null);
            setAttempt((n) => n + 1);
          }}
        />
      ) : (
        <div>
          <Button
            onClick={() => {
              setDone("");
              setOpen(true);
            }}
          >
            <PiPlus aria-hidden /> {t.newBtn}
          </Button>
        </div>
      )}

      <Card className="p-6 sm:p-7" aria-labelledby="rm-sent">
        <div className="flex items-center gap-3">
          <IconBadge icon={PiScroll} size={42} />
          <h2 id="rm-sent" className="font-display text-2xl font-bold">
            {t.sentTitle}
          </h2>
        </div>
        {!current ? (
          <p className="mt-4 text-ink-soft" role="status">
            {t.loading}
          </p>
        ) : current.status === "error" ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4" role="alert">
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
          </div>
        ) : current.items.length === 0 ? (
          <p className="mt-4 text-ink-soft">{t.empty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {current.items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="neutral">{t.kinds[r.kind]}</Pill>
                    <span className="font-bold">
                      {t.to} <Text>{r.userName || "—"}</Text>
                    </span>
                    <span className="text-sm text-ink-soft">{date(r.createdAt)}</span>
                  </div>
                  {r.itemName && (
                    <p className="mt-1 font-semibold">
                      <Text>{r.itemName}</Text>
                    </p>
                  )}
                  {r.note && (
                    <p className="mt-1 text-[15px] text-ink-soft">
                      <Text>{r.note}</Text>
                    </p>
                  )}
                </div>
                <Pill tone={r.seenAt ? "green" : "amber"}>{r.seenAt ? t.seen : t.notSeen}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}

type T = (typeof text)["en"];

function SuggestForm({ id, t, onCancel, onSent }: { id: string; t: T; onCancel: () => void; onSent: (name: string) => void }) {
  const [clients, setClients] = useState<Client[] | "error" | null>(null);
  const [clientId, setClientId] = useState("");
  const [kind, setKind] = useState<RemedyKind>("product");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<{ kind: RemedyKind; query: string; list: Item[] | "error" } | null>(null);
  const [itemId, setItemId] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const c = new AbortController();
    getClients(id, c.signal).then(setClients, () => !c.signal.aborted && setClients("error"));
    return () => c.abort();
  }, [id]);

  // Products are searched on the server (debounced); pujas are loaded once and filtered here.
  useEffect(() => {
    if (kind === "text") return;
    const c = new AbortController();
    const timer = setTimeout(
      () => {
        const run = kind === "product" ? searchProducts(query, c.signal) : getPujas(c.signal).then((l) => l.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())));
        run.then(
          (list) => setItems({ kind, query, list }),
          () => !c.signal.aborted && setItems({ kind, query, list: "error" }),
        );
      },
      kind === "product" && query ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [kind, query]);

  const shown = items && items.kind === kind && items.query === query ? items.list : null;
  const needItem = kind !== "text" && !itemId;
  const needNote = kind === "text" && !note.trim();
  const needClient = !clientId;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (needClient || needItem || needNote || busy) return;
    setBusy(true);
    setError("");
    try {
      await suggestRemedy(id, { userId: clientId, kind, itemId: kind === "text" ? null : itemId, note: note.trim() });
      onSent(Array.isArray(clients) ? (clients.find((c) => c.id === clientId)?.name ?? "") : "");
    } catch (err) {
      setError(err instanceof ApiError && err.code === "NotYourClient" ? t.notClient : err instanceof ApiError && err.message ? err.message : t.genericError);
      setBusy(false);
    }
  };

  return (
    <Card as="div" className="p-6 sm:p-7">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <h2 className="font-display text-2xl font-bold">{t.formTitle}</h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rm-client" className={labelClass}>
            {t.client}
          </label>
          {clients === null ? (
            <p className="text-ink-soft" role="status">
              {t.loading}
            </p>
          ) : clients === "error" ? (
            <p className="text-danger" role="alert">
              {t.clientsFailed}
            </p>
          ) : clients.length === 0 ? (
            <p className="text-ink-soft">{t.noClients}</p>
          ) : (
            <select id="rm-client" className={fieldClass} value={clientId} onChange={(e) => setClientId(e.target.value)} aria-invalid={tried && needClient}>
              <option value="">{t.chooseClient}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} lang={hasDevanagari(c.name) ? "hi" : undefined}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {tried && needClient && clients !== null && clients !== "error" && clients.length > 0 && <p className="text-sm text-danger">{t.needClient}</p>}
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className={labelClass}>{t.kind}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {(["product", "puja", "text"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => {
                  setKind(k);
                  setItemId("");
                  setQuery("");
                }}
                className={`h-[42px] cursor-pointer rounded-full border px-5 text-sm font-bold transition ${kind === k ? "border-transparent bg-surface-inverse text-ink-inverse" : "border-line-strong text-ink hover:bg-surface-sunken"}`}
              >
                {t.kinds[k]}
              </button>
            ))}
          </div>
        </fieldset>

        {kind !== "text" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rm-search" className={labelClass}>
              {t.item(kind)}
            </label>
            <input id="rm-search" className={fieldClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} autoComplete="off" />
            {shown === null ? (
              <p className="text-sm text-ink-soft" role="status">
                {t.searching}
              </p>
            ) : shown === "error" ? (
              <p className="text-sm text-danger" role="alert">
                {t.itemsFailed}
              </p>
            ) : shown.length === 0 ? (
              <p className="text-sm text-ink-soft">{t.noItems}</p>
            ) : (
              <ul className="max-h-64 overflow-auto rounded-[14px] border border-line-strong" role="listbox" aria-label={t.item(kind)}>
                {shown.map((it) => (
                  <li key={it.id} role="option" aria-selected={itemId === it.id}>
                    <button
                      type="button"
                      onClick={() => setItemId(it.id)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[15px] hover:bg-surface-sunken ${itemId === it.id ? "bg-surface-sunken font-bold" : ""}`}
                    >
                      <Text>{it.name}</Text>
                      {it.price !== null && <span className="text-ink-soft">₹{it.price.toLocaleString("en-IN")}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {tried && needItem && <p className="text-sm text-danger">{t.needItem}</p>}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rm-note" className={labelClass}>
            {t.note} {kind !== "text" && <span className="font-normal text-ink-soft">{t.noteOptional}</span>}
          </label>
          <textarea
            id="rm-note"
            className={`${fieldClass} h-28 py-3`}
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePh}
            aria-invalid={tried && needNote}
          />
          {tried && needNote && <p className="text-sm text-danger">{t.needNote}</p>}
        </div>

        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? t.sending : t.send}
          </Button>
          <Button variant="line" onClick={onCancel} disabled={busy}>
            {t.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PiArticle, PiImage, PiPencilSimple, PiTrash, PiX } from "react-icons/pi";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import {
  CATEGORIES,
  COVER_MAX_BYTES,
  blocksToText,
  createArticle,
  deleteArticle,
  getMyArticles,
  readMinutes,
  textToBlocks,
  updateArticle,
  uploadCover,
  type Article,
} from "@/lib/services/astrologerArticles";
import { Accent, Button, Card, Page, PageTitle, Pill, fieldClass, labelClass } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "आपके लेख",
    titleA: "ज्ञान ",
    titleB: "साझा करें",
    sub: "आपके लिखे लेख एडमिन की मंज़ूरी के बाद ही पाठकों को दिखते हैं।",
    write: "लेख लिखें",
    loading: "आपके लेख खुल रहे हैं…",
    failed: "लेख नहीं खुल सके।",
    retry: "फिर कोशिश करें",
    emptyTitle: "अभी कोई लेख नहीं",
    emptyBody: "ऐसे विषय पर लिखें जिसके बारे में आपसे अक्सर पूछा जाता है। पाठकों को दिखने से पहले एडमिन इसकी समीक्षा करता है।",
    inReview: "समीक्षा में",
    live: "लाइव",
    sentBack: "वापस भेजा गया",
    inReviewNote: "एडमिन की मंज़ूरी का इंतज़ार है। तब तक पाठकों को यह नहीं दिखेगा।",
    adminReason: (r: string) => `एडमिन: ${r}`,
    published: (d: string) => `${d} को प्रकाशित`,
    minRead: (n: number) => `${n} मिनट में पढ़ें`,
    edit: "एडिट करें",
    editBack: "एडिट करें (फिर से समीक्षा में जाएगा)",
    del: "हटाएँ",
    delTitle: (t: string) => `"${t}" हटाएँ?`,
    delBody: "इसे वापस नहीं लाया जा सकता।",
    delYes: "हाँ, हटाएँ",
    delFailed: "लेख हटाया नहीं जा सका। फिर कोशिश करें।",
    keep: "रहने दें",
    sentTitle: "समीक्षा के लिए भेजा गया",
    sentBody: "एडमिन आपके लेख की समीक्षा करेगा। मंज़ूरी मिलते ही यह पाठकों को दिखने लगेगा।",
    close: "बंद करें",
    formWrite: "लेख लिखें",
    formEdit: "लेख एडिट करें",
    fTitle: "शीर्षक",
    fTitlePh: "यह लेख किस बारे में है?",
    fCategory: "श्रेणी",
    fCover: "कवर इमेज (वैकल्पिक)",
    fUpload: "कवर फोटो अपलोड करें",
    fChange: "फोटो बदलें",
    fRemove: "फोटो हटाएँ",
    fUploading: "अपलोड हो रहा है…",
    fUploadFailed: "इमेज अपलोड नहीं हो सकी। फिर कोशिश करें।",
    fNotImage: "कृपया एक इमेज चुनें।",
    fTooBig: "इमेज 5 MB से छोटी होनी चाहिए।",
    fTags: "टैग (वैकल्पिक, कॉमा से अलग करें)",
    fTagsPh: "करियर, शनि, उपाय",
    fBody: "लेख",
    fBodyPh: "अपना लेख यहाँ लिखें।\n\n## हेडिंग के लिए दो हैश लगाएँ\n- बुलेट के लिए लाइन डैश से शुरू करें\n> कोट के लिए > से शुरू करें\n\nबाकी सब पैराग्राफ बन जाएगा।",
    fNeedTitle: "कृपया शीर्षक जोड़ें।",
    fNeedBody: "कृपया लेख का मुख्य भाग लिखें।",
    fSaveFailed: "लेख सेव नहीं हो सका। फिर कोशिश करें।",
    fLiveNote: "यह लेख लाइव है। सेव करने पर नया वर्ज़न फिर से समीक्षा के लिए जाएगा और तब तक पाठकों को नहीं दिखेगा।",
    fReviewNote: "पाठकों के पढ़ने से पहले एडमिन हर लेख की समीक्षा करता है।",
    fSend: "समीक्षा के लिए भेजें",
    fSaveSend: "सेव करें और समीक्षा के लिए भेजें",
    fSaving: "भेज रहे हैं…",
    cancel: "रद्द करें",
  },
  en: {
    eyebrow: "Your articles",
    titleA: "Share your ",
    titleB: "knowledge",
    sub: "Articles you write reach readers only after an admin approves them.",
    write: "Write article",
    loading: "Opening your articles…",
    failed: "Could not open your articles.",
    retry: "Try again",
    emptyTitle: "No articles yet",
    emptyBody: "Write about a topic you are asked about often. An admin reviews it before readers see it.",
    inReview: "In review",
    live: "Live",
    sentBack: "Sent back",
    inReviewNote: "Waiting for admin approval. Readers cannot see it until then.",
    adminReason: (r) => `Admin: ${r}`,
    published: (d) => `Published ${d}`,
    minRead: (n) => `${n} min read`,
    edit: "Edit",
    editBack: "Edit (goes back to review)",
    del: "Delete",
    delTitle: (t) => `Delete "${t}"?`,
    delBody: "This cannot be undone.",
    delYes: "Yes, delete",
    delFailed: "Could not delete the article. Please try again.",
    keep: "Keep",
    sentTitle: "Sent for review",
    sentBody: "An admin will review your article. It appears for readers once it is approved.",
    close: "Close",
    formWrite: "Write article",
    formEdit: "Edit article",
    fTitle: "Title",
    fTitlePh: "What is this article about?",
    fCategory: "Category",
    fCover: "Cover image (optional)",
    fUpload: "Upload a cover photo",
    fChange: "Change photo",
    fRemove: "Remove photo",
    fUploading: "Uploading…",
    fUploadFailed: "Could not upload the image. Please try again.",
    fNotImage: "Please choose an image file.",
    fTooBig: "The image must be smaller than 5 MB.",
    fTags: "Tags (optional, comma separated)",
    fTagsPh: "career, Saturn, remedies",
    fBody: "Article",
    fBodyPh: "Write your article here.\n\n## Use two hashes for a heading\n- start a line with a dash for a bullet\n> start with an angle bracket for a quote\n\nEverything else becomes a paragraph.",
    fNeedTitle: "Please add a title.",
    fNeedBody: "Please write the article body.",
    fSaveFailed: "Could not save the article. Please try again.",
    fLiveNote: "This article is live. Saving sends the new version back for review, and readers will not see it until it is approved.",
    fReviewNote: "An admin reviews every article before readers can see it.",
    fSend: "Send for review",
    fSaveSend: "Save and send for review",
    fSaving: "Sending…",
    cancel: "Cancel",
  },
});

type Strings = (typeof text)["en"];

/** Text an astrologer typed can be Devanagari on the English page: mark it so the right font is used. */
const langOf = (s: string) => (/[ऀ-ॿ]/.test(s) ? "hi" : undefined);

type Load = { status: "loading" } | { status: "failed" } | { status: "ready"; items: Article[] };

export default function ArticlesView() {
  const t = useT(text);
  const locale = useLocale();
  const { status } = useAstrologer();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [editing, setEditing] = useState<Article | "new" | null>(null);
  const [sent, setSent] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState(false);
  const date = new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric" });

  const fetchAll = useCallback(
    () =>
      getMyArticles().then(
        (items) => setLoad({ status: "ready", items }),
        () => setLoad({ status: "failed" }),
      ),
    [],
  );
  const reload = useCallback(() => {
    setLoad({ status: "loading" });
    void fetchAll();
  }, [fetchAll]);
  useEffect(() => {
    if (status === "ready") void fetchAll();
  }, [status, fetchAll]);

  const remove = async (a: Article) => {
    setDelBusy(true);
    setDelError(false);
    try {
      await deleteArticle(a.id);
      setConfirmDel(null);
      reload();
    } catch {
      setDelError(true);
    } finally {
      setDelBusy(false);
    }
  };

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
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
      {!editing && (
        <Button variant="gold" onClick={() => { setEditing("new"); setSent(false); }}>
          <PiPencilSimple size={20} aria-hidden />
          {t.write}
        </Button>
      )}
    </div>
  );

  if (editing) {
    return (
      <Page>
        {header}
        <ArticleForm
          key={editing === "new" ? "new" : editing.id}
          t={t}
          article={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setSent(true);
            reload();
          }}
        />
      </Page>
    );
  }

  return (
    <Page>
      {header}
      {sent && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-success bg-success-soft p-5" role="status">
          <div>
            <p className="font-bold text-success">{t.sentTitle}</p>
            <p className="text-[15px] text-ink-soft">{t.sentBody}</p>
          </div>
          <Button variant="line" size="sm" onClick={() => setSent(false)}>
            {t.close}
          </Button>
        </Card>
      )}
      {load.status === "loading" ? (
        <Card className="p-8 text-ink-soft" role="status">
          {t.loading}
        </Card>
      ) : load.status === "failed" ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-8" role="alert">
          <p className="text-danger">{t.failed}</p>
          <Button variant="line" size="sm" onClick={reload}>
            {t.retry}
          </Button>
        </Card>
      ) : load.items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 border-dashed px-5 py-12 text-center">
          <PiArticle size={44} className="text-brand-strong" aria-hidden />
          <h2 className="font-display text-xl font-bold">{t.emptyTitle}</h2>
          <p className="max-w-[460px] text-[15px] text-ink-soft">{t.emptyBody}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {load.items.map((a) => {
            const cat = CATEGORIES.find((c) => c.value === a.category);
            const tone = a.status === "approved" ? "green" : a.status === "rejected" ? "red" : "amber";
            const label = a.status === "approved" ? t.live : a.status === "rejected" ? t.sentBack : t.inReview;
            return (
              <Card as="article" key={a.id} className="flex flex-wrap gap-5 p-5">
                {a.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverImage} alt="" className="h-28 w-full flex-none rounded-2xl object-cover sm:w-44" />
                )}
                <div className="min-w-0 flex-1 basis-72">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={tone}>{label}</Pill>
                    <span className="text-[13px] text-ink-soft" lang={cat ? (locale === "hi" ? "hi" : undefined) : langOf(a.category)}>
                      {cat ? (locale === "hi" ? cat.value : cat.en) : a.category}
                      {a.readMinutes ? ` · ${t.minRead(a.readMinutes)}` : ""}
                    </span>
                  </div>
                  <h2 lang={langOf(a.title)} className="mt-2 font-display text-xl leading-snug font-bold">
                    {a.title}
                  </h2>
                  {a.status === "pending" && <p className="mt-1.5 text-sm text-ink-soft">{t.inReviewNote}</p>}
                  {a.status === "rejected" && a.rejectReason && (
                    <p lang={langOf(a.rejectReason)} className="mt-1.5 text-sm text-danger">
                      {t.adminReason(a.rejectReason)}
                    </p>
                  )}
                  {a.status === "approved" && a.reviewedAt && <p className="mt-1.5 text-sm text-ink-soft">{t.published(date.format(new Date(a.reviewedAt)))}</p>}
                  {confirmDel === a.id ? (
                    <div className="mt-3 rounded-2xl border border-danger bg-danger-soft p-4" role="alertdialog" aria-label={t.delTitle(a.title)}>
                      <p className="font-bold">{t.delTitle(a.title)}</p>
                      <p className="text-sm text-ink-soft">{t.delBody}</p>
                      {delError && (
                        <p role="alert" className="mt-1 text-sm text-danger">
                          {t.delFailed}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Button variant="red" size="sm" disabled={delBusy} onClick={() => remove(a)}>
                          {t.delYes}
                        </Button>
                        <Button variant="line" size="sm" disabled={delBusy} onClick={() => setConfirmDel(null)}>
                          {t.keep}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="line" size="sm" onClick={() => { setEditing(a); setSent(false); }}>
                        <PiPencilSimple size={16} aria-hidden />
                        {a.status === "approved" ? t.editBack : t.edit}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setConfirmDel(a.id); setDelError(false); }}>
                        <PiTrash size={16} aria-hidden />
                        {t.del}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}

function ArticleForm({ t, article, onCancel, onSaved }: { t: Strings; article: Article | null; onCancel: () => void; onSaved: () => void }) {
  const locale = useLocale();
  const [title, setTitle] = useState(article?.title ?? "");
  const [category, setCategory] = useState<string>(article?.category || CATEGORIES[0].value);
  const [cover, setCover] = useState(article?.coverImage ?? "");
  const [tags, setTags] = useState((article?.tags ?? []).join(", "));
  const [body, setBody] = useState(article ? blocksToText(article.body) : "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(t.fNotImage);
    if (file.size > COVER_MAX_BYTES) return setError(t.fTooBig);
    setError(null);
    setUploading(true);
    try {
      setCover(await uploadCover(file));
    } catch {
      setError(t.fUploadFailed);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const blocks = textToBlocks(body);
    if (!title.trim()) return setError(t.fNeedTitle);
    if (!blocks.length) return setError(t.fNeedBody);
    setError(null);
    setSaving(true);
    const input = {
      title: title.trim(),
      category,
      body: blocks,
      coverImage: cover.trim() || undefined,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (article) await updateArticle(article.id, input);
      else await createArticle(input);
      onSaved();
    } catch {
      setError(t.fSaveFailed);
      setSaving(false);
    }
  };

  return (
    <Card as="div" className="p-6 sm:p-8">
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <h2 className="font-display text-2xl font-bold">{article ? t.formEdit : t.formWrite}</h2>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="a-title" className={labelClass}>{t.fTitle}</label>
          <input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.fTitlePh} lang={langOf(title)} className={fieldClass} />
        </div>
        <fieldset>
          <legend className={labelClass}>{t.fCategory}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-pressed={category === c.value}
                lang={locale === "hi" ? "hi" : undefined}
                onClick={() => setCategory(c.value)}
                className={`h-10 cursor-pointer rounded-full border px-4 text-sm font-semibold ${category === c.value ? "border-brand bg-surface-sunken text-brand-strong" : "border-line-strong text-ink-soft"}`}
              >
                {locale === "hi" ? c.value : c.en}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-2">
          <span className={labelClass}>{t.fCover}</span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          {cover ? (
            <div className="relative overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" className="h-44 w-full object-cover sm:h-56" />
              <div className="absolute right-3 bottom-3 flex gap-2">
                <Button variant="navy" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? t.fUploading : t.fChange}
                </Button>
                <Button variant="navy" size="sm" aria-label={t.fRemove} onClick={() => setCover("")}>
                  <PiX size={16} aria-hidden />
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="flex h-28 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-brand text-[15px] font-bold text-brand-strong disabled:opacity-60">
              <PiImage size={24} aria-hidden />
              {uploading ? t.fUploading : t.fUpload}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="a-tags" className={labelClass}>{t.fTags}</label>
          <input id="a-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t.fTagsPh} lang={langOf(tags)} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end justify-between">
            <label htmlFor="a-body" className={labelClass}>{t.fBody}</label>
            <span className="text-[13px] text-ink-soft">{t.minRead(readMinutes(body))}</span>
          </div>
          <textarea id="a-body" value={body} onChange={(e) => setBody(e.target.value)} rows={14} placeholder={t.fBodyPh} lang={langOf(body)} className="w-full rounded-[14px] border border-line-strong bg-surface-page px-3.5 py-3 text-base leading-relaxed" />
        </div>
        <p className="text-sm text-ink-soft">{article?.status === "approved" ? t.fLiveNote : t.fReviewNote}</p>
        {error && (
          <p role="alert" className="rounded-2xl border border-danger bg-danger-soft px-4 py-3 text-[15px] text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="gold" disabled={saving || uploading}>
            {saving ? t.fSaving : article ? t.fSaveSend : t.fSend}
          </Button>
          <Button variant="line" disabled={saving} onClick={onCancel}>
            {t.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}

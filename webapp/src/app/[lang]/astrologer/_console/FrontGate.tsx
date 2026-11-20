"use client";

import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import HomeView from "../_home/HomeView";
import WelcomeView from "../welcome/WelcomeView";
import { Page } from "./ui";
import { useAstrologer } from "./useAstrologer";

const text = defineMessages({
  hi: { loading: "कंसोल खुल रहा है…" },
  en: { loading: "Opening the console…" },
});

/** /astrologer: the front page for anyone who is not signed in as an astrologer, Home for those who are. */
export default function FrontGate() {
  const t = useT(text);
  const { status, user } = useAuth();
  const astrologer = useAstrologer();
  if (astrologer.status === "ready") {
    return (
      <Page>
        <HomeView />
      </Page>
    );
  }
  // Waiting for the stored session, or for the account row of a signed-in user.
  if (status === "loading" || (status === "signedIn" && user === null)) {
    return (
      <p role="status" className="m-auto px-5 py-24 text-ink-soft">
        {t.loading}
      </p>
    );
  }
  return <WelcomeView />;
}

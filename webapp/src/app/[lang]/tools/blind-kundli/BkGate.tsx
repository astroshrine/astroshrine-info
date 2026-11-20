"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n/LocaleProvider";
import { loadWalletConfig } from "@/lib/services/walletCache";
import { Notice } from "../../kundli/_components/ui";
import { Gate, PanelSkeleton } from "../_b/shell";
import { bkText } from "./text";

/** Astrologers only, and only while the remote switch (wallet config: blind_kundli_enabled) is on, as in the app. */
export default function BkGate({ children }: { children: React.ReactNode }) {
  const t = useT(bkText);
  return (
    <Gate what={t.what} astrologerOnly>
      <Switch>{children}</Switch>
    </Gate>
  );
}

function Switch({ children }: { children: React.ReactNode }) {
  const t = useT(bkText);
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    loadWalletConfig().then(
      (c) => live && setOn((c as unknown as { blind_kundli_enabled?: boolean }).blind_kundli_enabled === true),
      () => live && setOn(false),
    );
    return () => {
      live = false;
    };
  }, []);
  if (on === null) return <PanelSkeleton />;
  if (!on) return <Notice>{t.off}</Notice>;
  return <>{children}</>;
}

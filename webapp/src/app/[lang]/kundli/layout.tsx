import AppPromoBand from "@/components/AppPromoBand";
import KundliChrome, { CONTENT_ID } from "./_components/KundliChrome";

/** The Jyotish section: banner and tab bar above every page, the app band below. */
export default function KundliLayout({ children }: LayoutProps<"/[lang]/kundli">) {
  return (
    <>
      <KundliChrome />
      <div id={CONTENT_ID} className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pt-8 md:px-8 md:pt-10">
        {children}
      </div>
      <AppPromoBand />
    </>
  );
}

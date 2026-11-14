import KundliNav from "./_components/KundliNav";

/** The Jyotish section: its own tool navigation above every page. */
export default function KundliLayout({ children }: LayoutProps<"/kundli">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <KundliNav />
      <div className="mt-6 md:mt-8">{children}</div>
    </div>
  );
}

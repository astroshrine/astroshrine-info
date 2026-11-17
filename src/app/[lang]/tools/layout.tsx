/** The tools section: a roomy column above every tool page. */
export default function ToolsLayout({ children }: LayoutProps<"/[lang]/tools">) {
  return <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8 md:pt-10">{children}</div>;
}

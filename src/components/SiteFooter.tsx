import Link from "next/link";
import { PiGooglePlayLogo } from "react-icons/pi";
import BrandMark from "@/components/BrandMark";
import { PLAY_STORE_URL, PRIVACY_URL, TERMS_URL } from "@/lib/site";

const link = "caption-2 rounded-sm text-ink-inverse-soft transition hover:text-ink-inverse";

export default function SiteFooter() {
  return (
    <footer className="on-inverse mt-16 bg-surface-inverse py-12 text-ink-inverse">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
        <div className="flex items-start gap-3 lg:col-span-2">
          <BrandMark size={40} />
          <div>
            <p className="title-3">AstroShrine</p>
            <p className="caption-5 mt-1 max-w-xs text-ink-inverse-soft">कुंडली, astrologers और wallet, उसी account से जो AstroShrine ऐप में है।</p>
          </div>
        </div>

        <nav aria-label="Footer">
          <p className="title-5 text-ink-inverse">सेवाएं</p>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link href="/kundli" className={link}>
                कुंडली
              </Link>
            </li>
            <li>
              <Link href="/astrologers" className={link}>
                Astrologers
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="title-5 text-ink-inverse">जानकारी</p>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <a href={PRIVACY_URL} className={link}>
                Privacy policy
              </a>
            </li>
            <li>
              <a href={TERMS_URL} className={link}>
                Terms of service
              </a>
            </li>
            <li>
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={`${link} inline-flex items-center gap-2`}>
                <PiGooglePlayLogo className="h-4 w-4" aria-hidden />
                Android ऐप
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="caption-5 mx-auto mt-12 max-w-6xl px-4 text-ink-inverse-soft md:px-8">© AstroShrine</p>
    </footer>
  );
}

import { PiCaretLeft, PiDotsThreeVertical, PiMicrophone, PiPhone, PiSmiley } from "react-icons/pi";
import { SAMPLE_FOOTER_CHAT } from "@/components/landing/samples/footerChat";

/**
 * A picture of the app's chat on an Android phone, for the footer (decorative, hidden from assistive tech). The
 * screen colours are fixed on purpose: they depict the app's own screen, not the website's theme. Sample chat
 * text is in landing/samples/footerChat.ts.
 */
export default function FooterPhone() {
  const chat = SAMPLE_FOOTER_CHAT;
  return (
    <div
      aria-hidden
      className="relative h-[492px] w-[236px] rounded-[36px] bg-[linear-gradient(145deg,#3A3F4B,#15181E_40%,#2B2F38_70%,#0E1014)] p-[7px] shadow-[0_0_0_1px_#4A505C,0_30px_60px_rgba(20,33,61,.32),0_8px_18px_rgba(0,0,0,.25),inset_0_0_0_1.5px_rgba(255,255,255,.08)]"
    >
      <span className="absolute top-24 -right-[3px] h-[58px] w-[3px] rounded-r-[3px] bg-[#444a56]" />
      <span className="absolute top-[172px] -right-[3px] h-[34px] w-[3px] rounded-r-[3px] bg-[#444a56]" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] bg-[#EFE7DA]">
        <div className="relative flex h-[26px] flex-none items-center justify-between bg-[#14213D] pr-4 pl-[18px] text-white">
          <span className="text-[11px] font-semibold">9:41</span>
          <span className="absolute top-[7px] left-1/2 -ml-[5.5px] h-[11px] w-[11px] rounded-full bg-[#05070A]" />
          <span className="text-[10px] font-semibold">86</span>
        </div>
        <div className="flex flex-none items-center gap-2 bg-[#14213D] py-2 pr-2.5 pl-1.5 text-white shadow-[0_2px_6px_rgba(0,0,0,.18)]">
          <PiCaretLeft className="h-[18px] w-[18px]" />
          <span className="relative grid h-8 w-8 flex-none place-items-center rounded-full border-2 border-brand bg-[#14213D] font-display text-[11px] font-semibold text-brand">
            {chat.initials}
            <i className="absolute -right-px -bottom-px h-2.5 w-2.5 rounded-full border-2 border-[#14213D] bg-online" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[12.5px] leading-[1.2] font-semibold">{chat.astrologer}</b>
            <small className="block text-[10.5px] leading-[1.2] text-brand">online</small>
          </span>
          <PiPhone className="h-4 w-4" />
          <PiDotsThreeVertical className="h-4 w-4" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-[5px] overflow-hidden bg-[#EFE7DA] bg-[radial-gradient(rgba(138,90,0,.10)_1px,transparent_1.2px)] [background-size:14px_14px] px-[9px] py-2 text-[11.5px] leading-[1.38]">
          <span className="my-0.5 mb-1 self-center rounded-[7px] bg-white px-[9px] py-0.5 text-[10px] font-semibold text-[#5A5F6E] shadow-[0_1px_1px_rgba(0,0,0,.06)]">Today</span>
          {chat.messages.map((m) => (
            <div
              key={m.time}
              className={`max-w-[84%] rounded-[9px] px-[9px] pt-1.5 pb-1 text-[#1C2333] shadow-[0_1px_1px_rgba(0,0,0,.08)] ${
                m.from === "user" ? "self-end rounded-tr-[2px] bg-[#FFE8B8]" : "self-start rounded-tl-[2px] bg-white"
              }`}
            >
              {m.text}
              <em className="mt-px block text-right text-[9px] text-[#7B8194] not-italic">{m.time}</em>
            </div>
          ))}
          <div className="flex gap-1 self-start rounded-[9px] rounded-tl-[2px] bg-white px-[11px] py-[9px] shadow-[0_1px_1px_rgba(0,0,0,.08)]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[#8A5A00] opacity-40 motion-safe:animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-none items-center gap-1.5 bg-[#EFE7DA] p-[6px_7px]">
          <span className="flex h-[34px] flex-1 items-center gap-[7px] rounded-full bg-white px-2.5 text-xs text-[#7B8194] shadow-[0_1px_1px_rgba(0,0,0,.08)]">
            <PiSmiley className="h-[17px] w-[17px]" />
            <span className="flex-1">Message</span>
          </span>
          <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-brand text-[#14213D]">
            <PiMicrophone className="h-[17px] w-[17px]" />
          </span>
        </div>
        <div className="flex h-[18px] flex-none items-center justify-center bg-[#EFE7DA]">
          <span className="h-1 w-[84px] rounded-sm bg-[#1C2333] opacity-75" />
        </div>
      </div>
    </div>
  );
}

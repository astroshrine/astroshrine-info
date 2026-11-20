"use client";

import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { toolFailure } from "@/lib/services/tools";

const text = defineMessages({
  hi: {
    notAllowed: "यह टूल केवल सत्यापित ज्योतिषी खाते के लिए है।",
    disabled: "यह सुविधा अभी ग्राहकों के लिए चालू नहीं है।",
    insufficientBalance: "वॉलेट में पॉइंट कम हैं। रिचार्ज करके फिर कोशिश करें।",
    rateLimited: "इस घंटे की सीमा पूरी हो गई। थोड़ी देर बाद फिर कोशिश करें।",
    tooLarge: "फ़ाइल बहुत बड़ी है। छोटी तस्वीर चुनें।",
    failed: "यह नहीं हो सका। कृपया फिर कोशिश करें।",
    slow: "सर्वर ने देर तक जवाब नहीं दिया। रिपोर्ट बन गई हो सकती है: थोड़ी देर में सहेजे नतीजे या पिछली सूची देखें।",
  },
  en: {
    notAllowed: "This tool is only for a verified astrologer account.",
    disabled: "This feature is not open to customers yet.",
    insufficientBalance: "Not enough points in your wallet. Recharge and try again.",
    rateLimited: "The hourly limit is reached. Please try again in a while.",
    tooLarge: "The file is too large. Pick a smaller photo.",
    failed: "That did not work. Please try again.",
    slow: "The server took too long to answer. The report may still have been made: check the saved results or earlier list in a moment.",
  },
});

/** The words for a failed tool call, in the page's language. */
export function useFailureText(): (e: unknown) => string {
  const t = useT(text);
  return (e) => (e instanceof ApiError && (e.status === 504 || e.status === 502) ? t.slow : t[toolFailure(e)]);
}

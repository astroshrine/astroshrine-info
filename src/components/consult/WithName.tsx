import { Fragment } from "react";
import { contentLang } from "@/lib/services/astrologerModel";

/**
 * A translated sentence with an astrologer's name in it. The name is content and keeps its own language: a name
 * written in Devanagari is wrapped in lang="hi", so screen readers read it in a Hindi voice inside an English
 * sentence. Latin-script names, or a sentence without the name, come out as plain text.
 */
export default function WithName({ text, name }: { text: string; name: string }) {
  const lang = contentLang(name);
  if (!lang || !name || !text.includes(name)) return text;
  return text.split(name).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <span lang={lang}>{name}</span>}
      {part}
    </Fragment>
  ));
}

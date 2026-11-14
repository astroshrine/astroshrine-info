import type { Metadata } from "next";
import SheetView from "./SheetView";

export const metadata: Metadata = {
  title: "मेरी विस्तृत कुंडली · AstroShrine",
  description:
    "खाते में सहेजे जन्म विवरण से पूरी कुंडली शीट: लग्न, भाव चलित, चंद्र और नवांश चार्ट, आज का गोचर, शड्बल, कारक, अष्टकवर्ग और पूरी दशा।",
};

export default function SheetPage() {
  return <SheetView />;
}

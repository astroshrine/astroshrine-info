"use client";

import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { A } from "../_console/dz";
import { WithHindiLabel } from "../_console/ui";
import Rails from "../_console/Rails";

const text = defineMessages({
  hi: {
    eyebrow: "सहायता",
    tA: "कंसोल का ",
    tB: "उपयोग कैसे करें",
    sub: "छोटा वीडियो देखें, या नीचे दिए चार आसान चरण पढ़ें।",
    step: "चरण",
    s1: "ऑनलाइन आएँ",
    s1t: "होम पर बड़ा गोल स्थिति बटन दबाएँ। उसका घेरा हरा होकर घूमने लगे तो आप ऑनलाइन हैं और ग्राहक आपसे जुड़ सकते हैं।",
    s1l: "होम खोलें",
    s2: "अनुरोध स्वीकारें",
    s2t: "प्रश्न और कुंडली पढ़ें, फिर स्वीकारें दबाएँ।",
    s2l: "कॉल देखें",
    s3: "कुंडली और नोट्स देखें",
    s3t: "चैट के दौरान ग्राहक की कुंडली और आपके निजी नोट्स बातचीत के ठीक बगल में दिखते हैं।",
    s3l: "चैट खोलें",
    s4: "भुगतान पाएँ",
    s4t: "आपकी कमाई लाइव दिखती है। कमाई पन्ने पर हर सत्र का विवरण देखें।",
    s4l: "कमाई देखें",
    langNote: "ऊपर दिए EN / हिं बटन से कभी भी अंग्रेज़ी और हिंदी के बीच बदलें।",
    vTitle: "वीडियो गाइड देखें",
    vText: "एक छोटा वीडियो जो हर चरण स्क्रीन पर दिखाता है: ऑनलाइन आना, चैट या कॉल लेना, कुंडली टूल्स का उपयोग और अपनी कमाई देखना।",
    vSoon: "जल्द आ रहा है",
    vBtn: "YouTube पर देखें",
    vNote: "वीडियो बन रहा है। तैयार होने पर इसका लिंक यहीं दिखेगा।",
    vAlt: "वीडियो गाइड: ज्योतिषी कंसोल का उपयोग कैसे करें",
    orRead: "या चार चरण पढ़ें",
  },
  en: {
    eyebrow: "Help",
    tA: "How to use the ",
    tB: "console",
    sub: "Watch the short video, or read the four simple steps below.",
    step: "Step",
    s1: "Go online",
    s1t: "On Home, press the big round status button. When its ring turns green and spins, you are online and customers can reach you.",
    s1l: "Open Home",
    s2: "Accept a request",
    s2t: "Read the question and the kundli, then press Accept.",
    s2l: "See a call",
    s3: "Use the kundli and notes",
    s3t: "During a chat, the customer’s kundli and your private notes stay right beside the conversation.",
    s3l: "Open chats",
    s4: "Get paid",
    s4t: "Your earnings update live. See every session on the earnings page.",
    s4l: "See earnings",
    langNote: "Switch between English and Hindi at any time with the EN / हिं button at the top.",
    vTitle: "Watch the video guide",
    vText: "A short video that shows every step on screen: going online, taking a chat or call, using the kundli tools and checking your earnings.",
    vSoon: "Coming soon",
    vBtn: "Watch on YouTube",
    vNote: "The video is being made. The link will appear here when it is ready.",
    vAlt: "Video guide: how to use the astrologer console",
    orRead: "Or read the four steps",
  },
});

/** Help: the video guide placeholder and the four steps to use the console. */
export default function HelpGuide() {
  const t = useT(text);
  return (
    <div className="dz flex flex-1 flex-col">
      <div className="stage pg-in">
        <Rails />
        <div className="wrap">
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"flex-end",justifyContent:"space-between",gap:"16px"}}>
            <div style={{flex:"1 1 520px",minWidth:"0"}}>
              <p className="dv">
                {t.eyebrow}
              </p>
              <h1 className="ttl">
                {t.tA}
                <em>
                  {t.tB}
                </em>
              </h1>
              <p className="sub">
                {t.sub}
              </p>
            </div>
          </div>
          <div className="orn" aria-hidden="true">
          </div>
          <section aria-labelledby="vt" className="card rise d1" style={{padding:"24px",display:"flex",flexWrap:"wrap",gap:"28px",alignItems:"center"}}>
            <div role="img" aria-label={t.vAlt} style={{flex:"1 1 420px",maxWidth:"560px",aspectRatio:"16/9",borderRadius:"18px",position:"relative",overflow:"hidden",background:"#14213D"}}>
              <span aria-hidden="true" className="spin-m" style={{position:"absolute",left:"50%",top:"50%",width:"150px",height:"150px",margin:"-75px 0 0 -75px",display:"block"}}>
                <svg viewBox="0 0 160 160" width="150" height="150" aria-hidden="true" className="" style={{position:"absolute",inset:"0",width:"100%",height:"100%"}}>
                  <circle cx="80" cy="80" r="76" fill="none" stroke="#FFAE00" strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" />
                  <circle cx="80" cy="80" r="67" fill="none" stroke="#FFAE00" strokeWidth="4" strokeDasharray="70 36" strokeLinecap="round" opacity=".55" />
                </svg>
              </span>
              <span aria-hidden="true" className="breathe" style={{position:"absolute",left:"50%",top:"50%",width:"84px",height:"84px",margin:"-42px 0 0 -42px",borderRadius:"50%",background:"#FFAE00",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 0 8px rgba(255,174,0,.25)"}}>
                <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" fill="#14213D" />
                </svg>
              </span>
              <span className="pill" style={{position:"absolute",left:"16px",top:"16px",background:"#FFF0CC",color:"#8A5A00"}}>
                {t.vSoon}
              </span>
              <span style={{position:"absolute",left:"16px",bottom:"14px",right:"16px",color:"#FBF6EC",fontWeight:"700",fontSize:"16px"}}>
                {t.tA}{t.tB}
              </span>
            </div>
            <div style={{flex:"1 1 320px",minWidth:"0"}}>
              <h2 id="vt" className="ep" style={{margin:"0",fontSize:"28px",fontWeight:"700",lineHeight:"1.15"}}>
                {t.vTitle}
              </h2>
              <p style={{margin:"10px 0 18px",fontSize:"16px",lineHeight:"1.6",color:"#555D74"}}>
                {t.vText}
              </p>
              <button type="button" className="btn" aria-disabled="true" style={{height:"52px",background:"#E9E4D8",color:"#555D74",cursor:"not-allowed"}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#555D74" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {t.vBtn} · {t.vSoon}
              </button>
              <p style={{margin:"10px 0 0",fontSize:"14px",color:"#8A5A00",fontWeight:"600"}}>
                {t.vNote}
              </p>
            </div>
          </section>
          <h2 className="lbl" style={{margin:"4px 0 -8px",fontSize:"14px"}}>
            {t.orRead}
          </h2>
          <div style={{display:"flex",flexWrap:"wrap",gap:"24px",alignItems:"stretch"}}>
            <article className="card rise lift" style={{flex:"1 1 240px",minWidth:"0",padding:"40px 22px 24px",borderRadius:"160px 160px 22px 22px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",animationDelay:"0.00s"}}>
              <div style={{position:"relative",width:"120px",height:"120px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span aria-hidden="true" className="pulse" style={{position:"absolute",inset:"14px",borderRadius:"50%",background:"rgba(255,174,0,.35)",animationDelay:"0.0s"}}>
                </span>
                <span className="ico bob" style={{position:"relative",width:"92px",height:"92px",boxShadow:"0 0 0 6px #FFF0CC",animationDelay:"0.0s"}}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2" />
                  </svg>
                </span>
              </div>
              <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                {t.step} 1
              </span>
              <h2 className="ep" style={{margin:"0",fontSize:"23px",fontWeight:"700",lineHeight:"1.2"}}>
                {t.s1}
              </h2>
              <p style={{margin:"0",fontSize:"16px",lineHeight:"1.6",color:"#555D74",flex:"1"}}>
                {t.s1t}
              </p>
              <A href="/astrologer" className="btn b-line tap" style={{height:"46px",width:"100%",fontSize:"14.5px"}}>
                {t.s1l}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </A>
            </article>
            <article className="card rise lift" style={{flex:"1 1 240px",minWidth:"0",padding:"40px 22px 24px",borderRadius:"160px 160px 22px 22px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",animationDelay:"0.08s"}}>
              <div style={{position:"relative",width:"120px",height:"120px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span aria-hidden="true" className="pulse" style={{position:"absolute",inset:"14px",borderRadius:"50%",background:"rgba(255,174,0,.35)",animationDelay:"0.4s"}}>
                </span>
                <span className="ico bob" style={{position:"relative",width:"92px",height:"92px",boxShadow:"0 0 0 6px #FFF0CC",animationDelay:"0.4s"}}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                </span>
              </div>
              <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                {t.step} 2
              </span>
              <h2 className="ep" style={{margin:"0",fontSize:"23px",fontWeight:"700",lineHeight:"1.2"}}>
                {t.s2}
              </h2>
              <p style={{margin:"0",fontSize:"16px",lineHeight:"1.6",color:"#555D74",flex:"1"}}>
                {t.s2t}
              </p>
              <A href="/astrologer/session" className="btn b-line tap" style={{height:"46px",width:"100%",fontSize:"14.5px"}}>
                {t.s2l}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </A>
            </article>
            <article className="card rise lift" style={{flex:"1 1 240px",minWidth:"0",padding:"40px 22px 24px",borderRadius:"160px 160px 22px 22px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",animationDelay:"0.16s"}}>
              <div style={{position:"relative",width:"120px",height:"120px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span aria-hidden="true" className="pulse" style={{position:"absolute",inset:"14px",borderRadius:"50%",background:"rgba(255,174,0,.35)",animationDelay:"0.8s"}}>
                </span>
                <span className="ico bob" style={{position:"relative",width:"92px",height:"92px",boxShadow:"0 0 0 6px #FFF0CC",animationDelay:"0.8s"}}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <rect x="3" y="3" width="18" height="18" rx="1.5" />
                    <path d="M3 3l18 18M21 3 3 21" />
                    <path d="M12 3l9 9-9 9-9-9z" />
                  </svg>
                </span>
              </div>
              <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                {t.step} 3
              </span>
              <h2 className="ep" style={{margin:"0",fontSize:"23px",fontWeight:"700",lineHeight:"1.2"}}>
                {t.s3}
              </h2>
              <p style={{margin:"0",fontSize:"16px",lineHeight:"1.6",color:"#555D74",flex:"1"}}>
                {t.s3t}
              </p>
              <A href="/astrologer/session" className="btn b-line tap" style={{height:"46px",width:"100%",fontSize:"14.5px"}}>
                {t.s3l}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </A>
            </article>
            <article className="card rise lift" style={{flex:"1 1 240px",minWidth:"0",padding:"40px 22px 24px",borderRadius:"160px 160px 22px 22px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",animationDelay:"0.24s"}}>
              <div style={{position:"relative",width:"120px",height:"120px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span aria-hidden="true" className="pulse" style={{position:"absolute",inset:"14px",borderRadius:"50%",background:"rgba(255,174,0,.35)",animationDelay:"1.2s"}}>
                </span>
                <span className="ico bob" style={{position:"relative",width:"92px",height:"92px",boxShadow:"0 0 0 6px #FFF0CC",animationDelay:"1.2s"}}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h15V7" />
                    <circle cx="16" cy="14" r="1.5" />
                  </svg>
                </span>
              </div>
              <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                {t.step} 4
              </span>
              <h2 className="ep" style={{margin:"0",fontSize:"23px",fontWeight:"700",lineHeight:"1.2"}}>
                {t.s4}
              </h2>
              <p style={{margin:"0",fontSize:"16px",lineHeight:"1.6",color:"#555D74",flex:"1"}}>
                {t.s4t}
              </p>
              <A href="/astrologer/earnings" className="btn b-line tap" style={{height:"46px",width:"100%",fontSize:"14.5px"}}>
                {t.s4l}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </A>
            </article>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px",justifyContent:"center",fontSize:"15.5px",color:"#555D74",padding:"4px 0"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
              <path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8" />
              <path d="M11 5c0 4-3 7-7 8" />
              <path d="M13 21l4-9 4 9M14.5 18h5" />
            </svg>
            <span>
              <WithHindiLabel text={t.langNote} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

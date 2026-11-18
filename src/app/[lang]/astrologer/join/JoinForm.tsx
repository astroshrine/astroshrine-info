"use client";

import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { A } from "../_console/dz";
import Rails from "../_console/Rails";

const text = defineMessages({
  hi: {
    eyebrow: "AstroShrine से जुड़ें",
    tA: "",
    tB: "AstroShrine ज्योतिषी",
    tC: " बनें",
    sub: "जुड़ने के चार चरण हैं। आप दो फ़ॉर्म भरते हैं, हमारी टीम उन्हें जाँचकर आपका खाता बनाती है, फिर आप साइन इन करते हैं।",
    step: "चरण",
    j1: "ऑनबोर्डिंग फ़ॉर्म भरें",
    j1t: "आपका नाम, संपर्क विवरण, योग्यता, अनुभव, विशेषज्ञता और भाषाएँ। वही मोबाइल नंबर और ईमेल दें जिससे आप साइन इन करेंगे।",
    j1b: "ऑनबोर्डिंग फ़ॉर्म खोलें",
    j2: "KYC फ़ॉर्म भरें",
    j2t: "पासपोर्ट आकार की फ़ोटो, मास्क किया हुआ आधार और पैन अपलोड करें, बैंक या UPI विवरण दें और अनुबंध पर हस्ताक्षर करें।",
    j2b: "KYC फ़ॉर्म खोलें",
    j3: "हम जाँच कर आपका खाता बनाते हैं",
    j3t: "हमारी टीम आपके विवरण और दस्तावेज़ जाँचती है, फिर आपको AstroShrine पर ज्योतिषी बनाती है। हम आपके दिए नंबर पर संपर्क करेंगे।",
    j4: "साइन इन करें",
    j4t: "फ़ॉर्म में दिए मोबाइल नंबर या ईमेल से साइन इन करें। पहली बार आप एक बार अपनी प्रोफ़ाइल जाँचेंगे, फिर काम शुरू कर सकते हैं।",
    j4b: "साइन इन पर जाएँ",
    newTab: "नए टैब में खुलेगा",
    readyTitle: "ये तैयार रखें",
    payTitle: "भुगतान कैसे होता है",
    payText: "पूरे हुए परामर्शों का भुगतान AstroShrine टीम संभालती है। आप अपनी कमाई कंसोल में देख सकते हैं।",
    whyTitle: "AstroShrine से क्यों जुड़ें",
    w1: "देश भर के जिज्ञासु आप तक आते हैं",
    w2: "अपने चुने हुए समय पर काम करें",
    w3: "कंसोल हिंदी या अंग्रेज़ी में",
    already: "पहले से AstroShrine ज्योतिषी हैं?",
    signInLink: "साइन इन करें",
    r0: "पासपोर्ट आकार की फ़ोटो",
    r1: "आधार कार्ड (मास्क की हुई प्रति, आगे और पीछे)",
    r2: "पैन कार्ड",
    r3: "आपके अपने नाम पर बैंक खाता या UPI",
    r4: "पते का प्रमाण या रद्द किया हुआ चेक",
    r5: "GSTIN, यदि आप पंजीकृत हैं",
  },
  en: {
    eyebrow: "Join AstroShrine",
    tA: "Become an ",
    tB: "AstroShrine astrologer",
    tC: "",
    sub: "Joining takes four steps. You fill two forms, our team checks them and creates your account, and then you sign in.",
    step: "Step",
    j1: "Fill the onboarding form",
    j1t: "Your name, contact details, qualifications, experience, expertise and languages. Give the mobile number and email you will sign in with.",
    j1b: "Open onboarding form",
    j2: "Fill the KYC form",
    j2t: "Upload a passport-size photo, a masked Aadhaar and your PAN, add your bank or UPI details, and sign the agreement.",
    j2b: "Open KYC form",
    j3: "We check your details and create your account",
    j3t: "Our team checks your details and documents, then makes you an astrologer on AstroShrine. We will contact you on the number you gave.",
    j4: "Sign in",
    j4t: "Sign in with the mobile number or email from your form. The first time, you check your profile once, and then you can start.",
    j4b: "Go to sign in",
    newTab: "opens in a new tab",
    readyTitle: "Keep these ready",
    payTitle: "How you are paid",
    payText: "Payouts for completed consultations are handled by the AstroShrine team. You can follow your earnings in the console.",
    whyTitle: "Why join AstroShrine",
    w1: "Seekers from across India come to you",
    w2: "Work at the hours you choose",
    w3: "The console in Hindi or English",
    already: "Already an AstroShrine astrologer?",
    signInLink: "Sign in",
    r0: "Passport-size photo",
    r1: "Aadhaar card (masked copy, front and back)",
    r2: "PAN card",
    r3: "Bank account or UPI in your own name",
    r4: "Address proof or a cancelled cheque",
    r5: "GSTIN, if you are registered",
  },
});

/** Join: the four steps to become an astrologer; the two forms are filled outside the console. */
export default function JoinForm() {
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
                {t.tC}
              </h1>
              <p className="sub">
                {t.sub}
              </p>
            </div>
          </div>
          <div className="orn" aria-hidden="true">
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"32px",alignItems:"flex-start"}}>
            <div style={{flex:"1 1 560px",minWidth:"0"}}>
              <ol style={{listStyle:"none",margin:"0",padding:"0",display:"flex",flexDirection:"column",gap:"26px"}}>
                <li className="rise" style={{position:"relative",display:"flex",gap:"20px",alignItems:"flex-start",animationDelay:"0.10s"}}>
                  <span aria-hidden="true" style={{position:"absolute",left:"31px",top:"70px",bottom:"-26px",width:"2px",background:"repeating-linear-gradient(to bottom,#F2C75A 0 6px,transparent 6px 12px)"}}>
                  </span>
                  <span className="ico bob" style={{width:"64px",height:"64px",flex:"none",boxShadow:"0 0 0 6px #FFF0CC",animationDelay:"0.3s"}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <path d="M14 3v6h6M8 13h8M8 17h5" />
                    </svg>
                  </span>
                  <div className="card lift" style={{flex:"1",minWidth:"0",padding:"20px 22px"}}>
                    <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00",height:"28px",fontSize:"13px"}}>
                      {t.step} 1
                    </span>
                    <h2 className="ep" style={{margin:"8px 0 0",fontSize:"22px",fontWeight:"700",lineHeight:"1.2"}}>
                      {t.j1}
                    </h2>
                    <p style={{margin:"6px 0 0",fontSize:"16px",lineHeight:"1.6",color:"#555D74"}}>
                      {t.j1t}
                    </p>
                    <A href="https://docs.google.com/forms/d/e/1FAIpQLSfAI-qh184n5Dh2aRtdk3zCvQZkQxJGIJaXNw-umWfKuLhexg/viewform" target="_blank" rel="noopener" className="btn b-gold tap lift" style={{marginTop:"14px",height:"48px"}}>
                      {t.j1b}
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none",transform:"rotate(-45deg)"}}>
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                      <span style={{position:"absolute",width:"1px",height:"1px",overflow:"hidden",clip:"rect(0 0 0 0)"}}>
                        ({t.newTab})
                      </span>
                    </A>
                  </div>
                </li>
                <li className="rise" style={{position:"relative",display:"flex",gap:"20px",alignItems:"flex-start",animationDelay:"0.20s"}}>
                  <span aria-hidden="true" style={{position:"absolute",left:"31px",top:"70px",bottom:"-26px",width:"2px",background:"repeating-linear-gradient(to bottom,#F2C75A 0 6px,transparent 6px 12px)"}}>
                  </span>
                  <span className="ico bob" style={{width:"64px",height:"64px",flex:"none",boxShadow:"0 0 0 6px #FFF0CC",animationDelay:"0.6s"}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>
                  <div className="card lift" style={{flex:"1",minWidth:"0",padding:"20px 22px"}}>
                    <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00",height:"28px",fontSize:"13px"}}>
                      {t.step} 2
                    </span>
                    <h2 className="ep" style={{margin:"8px 0 0",fontSize:"22px",fontWeight:"700",lineHeight:"1.2"}}>
                      {t.j2}
                    </h2>
                    <p style={{margin:"6px 0 0",fontSize:"16px",lineHeight:"1.6",color:"#555D74"}}>
                      {t.j2t}
                    </p>
                    <A href="https://www.astroshrine.in/astrologer-onboarding" target="_blank" rel="noopener" className="btn b-gold tap lift" style={{marginTop:"14px",height:"48px"}}>
                      {t.j2b}
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none",transform:"rotate(-45deg)"}}>
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                      <span style={{position:"absolute",width:"1px",height:"1px",overflow:"hidden",clip:"rect(0 0 0 0)"}}>
                        ({t.newTab})
                      </span>
                    </A>
                  </div>
                </li>
                <li className="rise" style={{position:"relative",display:"flex",gap:"20px",alignItems:"flex-start",animationDelay:"0.30s"}}>
                  <span aria-hidden="true" style={{position:"absolute",left:"31px",top:"70px",bottom:"-26px",width:"2px",background:"repeating-linear-gradient(to bottom,#F2C75A 0 6px,transparent 6px 12px)"}}>
                  </span>
                  <span className="ico bob" style={{width:"64px",height:"64px",flex:"none",boxShadow:"0 0 0 6px #FFF0CC",animationDelay:"0.9s"}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5" />
                      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.6 3.5 5.2" />
                    </svg>
                  </span>
                  <div className="card lift" style={{flex:"1",minWidth:"0",padding:"20px 22px"}}>
                    <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00",height:"28px",fontSize:"13px"}}>
                      {t.step} 3
                    </span>
                    <h2 className="ep" style={{margin:"8px 0 0",fontSize:"22px",fontWeight:"700",lineHeight:"1.2"}}>
                      {t.j3}
                    </h2>
                    <p style={{margin:"6px 0 0",fontSize:"16px",lineHeight:"1.6",color:"#555D74"}}>
                      {t.j3t}
                    </p>
                  </div>
                </li>
                <li className="rise" style={{position:"relative",display:"flex",gap:"20px",alignItems:"flex-start",animationDelay:"0.40s"}}>
                  <span className="ico bob" style={{width:"64px",height:"64px",flex:"none",boxShadow:"0 0 0 6px #FFF0CC",animationDelay:"1.2s"}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                  <div className="card lift" style={{flex:"1",minWidth:"0",padding:"20px 22px"}}>
                    <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00",height:"28px",fontSize:"13px"}}>
                      {t.step} 4
                    </span>
                    <h2 className="ep" style={{margin:"8px 0 0",fontSize:"22px",fontWeight:"700",lineHeight:"1.2"}}>
                      {t.j4}
                    </h2>
                    <p style={{margin:"6px 0 0",fontSize:"16px",lineHeight:"1.6",color:"#555D74"}}>
                      {t.j4t}
                    </p>
                    <A href="/astrologer/login" className="btn b-navy tap lift" style={{marginTop:"14px",height:"48px"}}>
                      {t.j4b}
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                    </A>
                  </div>
                </li>
              </ol>
            </div>
            <div style={{flex:"0 1 360px",minWidth:"0",display:"flex",flexDirection:"column",gap:"24px"}}>
              <section aria-labelledby="rdy" className="card rise d2" style={{padding:"22px 24px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <span className="ico " aria-hidden="true" style={{width:"42px",height:"42px"}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <path d="M14 3v6h6M8 13h8M8 17h5" />
                    </svg>
                  </span>
                  <h2 id="rdy" className="h2" style={{fontSize:"21px"}}>
                    {t.readyTitle}
                  </h2>
                </div>
                <ul style={{listStyle:"none",margin:"12px 0 0",padding:"0"}}>
                  <li style={{display:"flex",gap:"10px",alignItems:"flex-start",fontSize:"15px",padding:"8px 0",borderTop:"1px solid #EBDFC6"}}>
                    <span aria-hidden="true" style={{width:"22px",height:"22px",borderRadius:"50%",background:"#FFF0CC",display:"flex",alignItems:"center",justifyContent:"center",flex:"none",marginTop:"1px"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span>
                      {t.r0}
                    </span>
                  </li>
                  <li style={{display:"flex",gap:"10px",alignItems:"flex-start",fontSize:"15px",padding:"8px 0",borderTop:"1px solid #EBDFC6"}}>
                    <span aria-hidden="true" style={{width:"22px",height:"22px",borderRadius:"50%",background:"#FFF0CC",display:"flex",alignItems:"center",justifyContent:"center",flex:"none",marginTop:"1px"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span>
                      {t.r1}
                    </span>
                  </li>
                  <li style={{display:"flex",gap:"10px",alignItems:"flex-start",fontSize:"15px",padding:"8px 0",borderTop:"1px solid #EBDFC6"}}>
                    <span aria-hidden="true" style={{width:"22px",height:"22px",borderRadius:"50%",background:"#FFF0CC",display:"flex",alignItems:"center",justifyContent:"center",flex:"none",marginTop:"1px"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span>
                      {t.r2}
                    </span>
                  </li>
                  <li style={{display:"flex",gap:"10px",alignItems:"flex-start",fontSize:"15px",padding:"8px 0",borderTop:"1px solid #EBDFC6"}}>
                    <span aria-hidden="true" style={{width:"22px",height:"22px",borderRadius:"50%",background:"#FFF0CC",display:"flex",alignItems:"center",justifyContent:"center",flex:"none",marginTop:"1px"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span>
                      {t.r3}
                    </span>
                  </li>
                  <li style={{display:"flex",gap:"10px",alignItems:"flex-start",fontSize:"15px",padding:"8px 0",borderTop:"1px solid #EBDFC6"}}>
                    <span aria-hidden="true" style={{width:"22px",height:"22px",borderRadius:"50%",background:"#FFF0CC",display:"flex",alignItems:"center",justifyContent:"center",flex:"none",marginTop:"1px"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span>
                      {t.r4}
                    </span>
                  </li>
                  <li style={{display:"flex",gap:"10px",alignItems:"flex-start",fontSize:"15px",padding:"8px 0",borderTop:"1px solid #EBDFC6"}}>
                    <span aria-hidden="true" style={{width:"22px",height:"22px",borderRadius:"50%",background:"#FFF0CC",display:"flex",alignItems:"center",justifyContent:"center",flex:"none",marginTop:"1px"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span>
                      {t.r5}
                    </span>
                  </li>
                </ul>
              </section>
              <section aria-labelledby="pay" className="card rise d3" style={{padding:"22px 24px",background:"#EAF6EE",borderColor:"#B9DFC6"}}>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <span className="ico " aria-hidden="true" style={{width:"42px",height:"42px"}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M3 10h18L12 4z" />
                      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" />
                    </svg>
                  </span>
                  <h2 id="pay" className="h2" style={{fontSize:"21px"}}>
                    {t.payTitle}
                  </h2>
                </div>
                <p style={{margin:"10px 0 0",fontSize:"15px",lineHeight:"1.6",color:"#14213D"}}>
                  {t.payText}
                </p>
              </section>
              <section aria-labelledby="why" className="card rise d4" style={{padding:"22px 24px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <span className="ico " aria-hidden="true" style={{width:"42px",height:"42px"}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z" />
                    </svg>
                  </span>
                  <h2 id="why" className="h2" style={{fontSize:"21px"}}>
                    {t.whyTitle}
                  </h2>
                </div>
                <ul style={{listStyle:"none",margin:"12px 0 0",padding:"0",display:"flex",flexDirection:"column",gap:"10px",fontSize:"15px",fontWeight:"600"}}>
                  <li style={{display:"flex",gap:"10px",alignItems:"center"}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5" />
                      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.6 3.5 5.2" />
                    </svg>
                    {t.w1}
                  </li>
                  <li style={{display:"flex",gap:"10px",alignItems:"center"}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    {t.w2}
                  </li>
                  <li style={{display:"flex",gap:"10px",alignItems:"center"}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
                      <path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
                    </svg>
                    {t.w3}
                  </li>
                </ul>
              </section>
              <p style={{margin:"0",textAlign:"center",fontSize:"15px",color:"#555D74"}}>
                {t.already}{" "}
                <A href="/astrologer/login" style={{fontWeight:"700",color:"#8A5A00",textDecoration:"underline",textUnderlineOffset:"3px"}}>
                  {t.signInLink}
                </A>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

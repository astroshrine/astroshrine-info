"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useT } from "@/i18n/LocaleProvider";
import { A, css } from "../_console/dz";
import Rails from "../_console/Rails";
import { text } from "./messages";

const SLIDES = 4;
const SLIDE_MS = 6000;

/** The "Go online" demo cycles Online, Busy, Offline. */
type Demo = "online" | "busy" | "offline";

/**
 * The front page for anyone who is not signed in as an astrologer: the hero carousel, the "Go online" demo,
 * what the console offers, the AstroShrine family, the app, how joining works and the questions astrologers ask.
 * Everything on it is illustration: nothing is sent, and no real customer or figure is shown.
 */
export default function WelcomeView() {
  const t = useT(text);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [flip, setFlip] = useState(false);
  const [tilt3, setTilt3] = useState({ x: 0, y: 0 });
  const [dst, setDst] = useState<Demo>("offline");
  const [dchat, setDchat] = useState(true);
  const [dcall, setDcall] = useState(true);
  const [db, setDb] = useState("");
  const [faq, setFaq] = useState(1);

  // The carousel moves on every 6 s unless it is paused or the pointer is over the hero.
  const stopped = useRef(false);
  useEffect(() => {
    stopped.current = paused || hover;
  }, [paused, hover]);
  useEffect(() => {
    const id = setInterval(() => {
      if (stopped.current) return;
      setIdx((i) => (i + 1) % SLIDES);
      setFlip((f) => !f);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, []);

  const go = (k: number) => {
    setIdx((k + SLIDES) % SLIDES);
    setFlip((f) => !f);
  };
  const isS0 = idx === 0;
  const isS1 = idx === 1;
  const isS2 = idx === 2;
  const isS3 = idx === 3;
  const stoppedNow = paused || hover;
  const dots = [0, 1, 2, 3].map((k) => ({
    on: k === idx,
    label: t.slideN.replace("{n}", String(k + 1)) + ": " + t.tabs[k],
    go: () => go(k),
    name: t.tabs[k],
    tc: k === idx ? "color:#FFE29A" : "color:#AEB4C6",
    fill:
      k < idx
        ? "position:absolute;left:0;top:0;bottom:0;width:100%;background:rgba(255,174,0,.65);border-radius:999px"
        : k === idx
          ? `position:absolute;left:0;top:0;bottom:0;background:#FFAE00;border-radius:999px;animation:${flip ? "progB" : "progA"} 6s linear both;${stoppedNow ? "animation-play-state:paused" : ""}`
          : "display:none",
  }));
  const playing = !paused;
  const togglePlay = () => setPaused((p) => !p);
  const playText = paused ? t.playIc : t.pauseIc;
  const hoverOn = () => setHover(true);
  const hoverOff = () => setHover(false);

  // The duo card tilts towards the pointer.
  const tiltStyle = `transform:perspective(1200px) rotateY(${(tilt3.x * 8).toFixed(2)}deg) rotateX(${(-tilt3.y * 6).toFixed(2)}deg)`;
  const tilt = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt3({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  };
  const untilt = () => setTilt3({ x: 0, y: 0 });

  // The "Go online" demo.
  const dOn = dst === "online";
  const dBusy = dst === "busy";
  const pill = (a: boolean) =>
    "height:44px;border-radius:12px;display:flex;align-items:center;gap:8px;padding:0 10px;transition:background .25s,border-color .25s;" + (a ? "background:#FFF0CC;border:1.5px solid #FFAE00" : "background:#FFFDF8;border:1.5px dashed #C9CDD9");
  const dRes = !dOn ? (dBusy ? t.r5 : t.r6) : dchat && dcall ? t.r1 : dchat ? t.r2 : dcall ? t.r3 : t.r4;
  const dTitle = dOn ? t.dOn : dBusy ? t.dBusy : t.dOff;
  const dPop = db === "bA" ? "popA" : "popB";
  const dCycle = () => {
    setDst(dOn ? "busy" : dBusy ? "offline" : "online");
    setDb(db === "bA" ? "bB" : "bA");
  };
  const dBurst = db;
  const dRing = dOn ? "#1F8A4C" : dBusy ? "#FFAE00" : "#D9B45C";
  const dRingCls = dOn ? "spin-m" : "spin";
  const dPulse1 = "background:" + (dOn ? "rgba(31,138,76,.28)" : "rgba(255,174,0,.28)");
  const dPulse2 = "background:" + (dOn ? "rgba(255,174,0,.3)" : "rgba(255,174,0,.18)");
  const dCore = dOn
    ? "background:#14213D;box-shadow:0 0 0 6px #FFF0CC,0 16px 30px -12px rgba(20,33,61,.7)"
    : dBusy
      ? "background:#FFAE00;box-shadow:0 0 0 6px #FFF0CC"
      : "background:#FFFDF8;box-shadow:0 0 0 2px #E3C27A,0 0 0 8px #FFF0CC,0 14px 26px -14px rgba(20,33,61,.5)";
  const dIcon = dOn ? "#FFAE00" : "#14213D";
  const dChatOn = dchat;
  const dCallOn = dcall;
  const dToggleChat = () => setDchat(!dchat);
  const dToggleCall = () => setDcall(!dcall);
  const dChatState = dchat ? t.on : t.off;
  const dCallState = dcall ? t.on : t.off;
  const track = (a: boolean) => "width:40px;height:24px;border-radius:999px;padding:3px;display:block;flex:none;transition:background .3s;background:" + (a ? "#14213D" : "#B4B9C7");
  const knob = (a: boolean) =>
    "width:18px;height:18px;border-radius:50%;display:block;transition:transform .3s cubic-bezier(.2,1.6,.4,1);background:" + (a ? "#FFAE00" : "#FFFDF8") + ";transform:translateX(" + (a ? "16px" : "0") + ")";
  const dChatPill = pill(dchat);
  const dCallPill = pill(dcall);
  const dChatTrack = track(dchat);
  const dCallTrack = track(dcall);
  const dChatKnob = knob(dchat);
  const dCallKnob = knob(dcall);
  const dResTone = dOn && (dchat || dcall) ? "color:#1F6F3A" : "color:#A3410B";

  // The questions: one open at a time.
  const [fq1, fq2, fq3, fq4, fq5, fq6] = [1, 2, 3, 4, 5, 6].map((k) => {
    const open = faq === k;
    return {
      open,
      go: () => setFaq(open ? 0 : k),
      icon: open ? "background:#14213D;color:#FFAE00;transform:rotate(45deg)" : "background:#FFF0CC;color:#8A5A00",
    };
  });

  return (
    <div className="dz flex flex-1 flex-col">
      <div className="pg-in" style={{display:"flex",flexDirection:"column",flex:"1 1 auto"}}>
        <section className="hero" aria-label={t.eyebrowW} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
          <div aria-hidden="true" style={{position:"absolute",inset:"0",zIndex:"1"}}>
            <span className="star" style={{left:"55.9%",top:"55.7%",width:"2px",height:"2px",animationDelay:"-1.32s"}}>
            </span>
            <span className="star" style={{left:"34.4%",top:"16.0%",width:"3px",height:"3px",animationDelay:"-1.82s"}}>
            </span>
            <span className="star" style={{left:"29.6%",top:"93.6%",width:"3px",height:"3px",animationDelay:"-1.70s"}}>
            </span>
            <span className="star" style={{left:"32.2%",top:"48.5%",width:"3px",height:"3px",animationDelay:"-0.90s"}}>
            </span>
            <span className="star" style={{left:"82.7%",top:"17.3%",width:"3px",height:"3px",animationDelay:"-2.43s"}}>
            </span>
            <span className="star" style={{left:"97.3%",top:"2.3%",width:"2px",height:"2px",animationDelay:"-0.24s"}}>
            </span>
            <span className="star" style={{left:"59.7%",top:"52.1%",width:"3px",height:"3px",animationDelay:"-1.94s"}}>
            </span>
            <span className="star" style={{left:"32.2%",top:"96.1%",width:"4px",height:"4px",animationDelay:"-0.38s"}}>
            </span>
            <span className="star" style={{left:"66.6%",top:"62.1%",width:"2px",height:"2px",animationDelay:"-2.83s"}}>
            </span>
            <span className="star" style={{left:"33.6%",top:"75.1%",width:"4px",height:"4px",animationDelay:"-3.16s"}}>
            </span>
            <span className="star" style={{left:"25.1%",top:"18.2%",width:"4px",height:"4px",animationDelay:"-3.14s"}}>
            </span>
            <span className="star" style={{left:"18.1%",top:"43.2%",width:"2px",height:"2px",animationDelay:"-0.54s"}}>
            </span>
            <span className="star" style={{left:"4.6%",top:"51.9%",width:"2px",height:"2px",animationDelay:"-2.24s"}}>
            </span>
            <span className="star" style={{left:"24.7%",top:"90.1%",width:"2px",height:"2px",animationDelay:"-0.55s"}}>
            </span>
            <span className="star" style={{left:"73.7%",top:"3.4%",width:"3px",height:"3px",animationDelay:"-1.18s"}}>
            </span>
            <span className="star" style={{left:"50.6%",top:"66.0%",width:"4px",height:"4px",animationDelay:"-3.18s"}}>
            </span>
            <span className="star" style={{left:"25.1%",top:"55.9%",width:"3px",height:"3px",animationDelay:"-1.49s"}}>
            </span>
            <span className="star" style={{left:"40.9%",top:"73.2%",width:"2px",height:"2px",animationDelay:"-0.20s"}}>
            </span>
            <span className="star" style={{left:"29.2%",top:"83.9%",width:"2px",height:"2px",animationDelay:"-2.24s"}}>
            </span>
            <span className="star" style={{left:"4.4%",top:"25.9%",width:"2px",height:"2px",animationDelay:"-1.34s"}}>
            </span>
            <span className="star" style={{left:"86.3%",top:"64.0%",width:"2px",height:"2px",animationDelay:"-0.50s"}}>
            </span>
            <span className="star" style={{left:"15.8%",top:"71.9%",width:"2px",height:"2px",animationDelay:"-0.17s"}}>
            </span>
            <span className="star" style={{left:"14.7%",top:"64.4%",width:"3px",height:"3px",animationDelay:"-3.10s"}}>
            </span>
            <span className="star" style={{left:"47.9%",top:"93.5%",width:"3px",height:"3px",animationDelay:"-3.06s"}}>
            </span>
            <span className="star" style={{left:"36.8%",top:"16.8%",width:"4px",height:"4px",animationDelay:"-1.25s"}}>
            </span>
            <span className="star" style={{left:"76.7%",top:"48.5%",width:"3px",height:"3px",animationDelay:"-3.07s"}}>
            </span>
            <span className="star" style={{left:"47.7%",top:"15.3%",width:"2px",height:"2px",animationDelay:"-2.00s"}}>
            </span>
            <span className="star" style={{left:"14.7%",top:"71.2%",width:"3px",height:"3px",animationDelay:"-1.30s"}}>
            </span>
            <span className="star" style={{left:"13.3%",top:"70.7%",width:"4px",height:"4px",animationDelay:"-0.90s"}}>
            </span>
            <span className="star" style={{left:"33.0%",top:"26.0%",width:"3px",height:"3px",animationDelay:"-3.25s"}}>
            </span>
            <span className="star" style={{left:"42.3%",top:"67.6%",width:"2px",height:"2px",animationDelay:"-2.56s"}}>
            </span>
            <span className="star" style={{left:"80.6%",top:"15.3%",width:"3px",height:"3px",animationDelay:"-0.48s"}}>
            </span>
            <span className="star" style={{left:"39.9%",top:"19.9%",width:"2px",height:"2px",animationDelay:"-2.18s"}}>
            </span>
            <span className="star" style={{left:"78.0%",top:"8.9%",width:"2px",height:"2px",animationDelay:"-0.40s"}}>
            </span>
            <span className="star" style={{left:"28.6%",top:"31.2%",width:"2px",height:"2px",animationDelay:"-3.20s"}}>
            </span>
            <span className="star" style={{left:"39.8%",top:"87.2%",width:"2px",height:"2px",animationDelay:"-2.11s"}}>
            </span>
            <span className="star" style={{left:"18.8%",top:"84.3%",width:"2px",height:"2px",animationDelay:"-0.69s"}}>
            </span>
            <span className="star" style={{left:"73.9%",top:"74.7%",width:"3px",height:"3px",animationDelay:"-2.05s"}}>
            </span>
            <span className="star" style={{left:"50.5%",top:"73.6%",width:"2px",height:"2px",animationDelay:"-0.19s"}}>
            </span>
            <span className="star" style={{left:"92.1%",top:"39.2%",width:"4px",height:"4px",animationDelay:"-2.94s"}}>
            </span>
            <span className="star" style={{left:"40.0%",top:"56.4%",width:"3px",height:"3px",animationDelay:"-2.91s"}}>
            </span>
            <span className="star" style={{left:"23.9%",top:"94.5%",width:"3px",height:"3px",animationDelay:"-2.06s"}}>
            </span>
            <span className="star" style={{left:"74.1%",top:"25.5%",width:"3px",height:"3px",animationDelay:"-0.53s"}}>
            </span>
            <span className="star" style={{left:"72.2%",top:"97.1%",width:"2px",height:"2px",animationDelay:"-2.78s"}}>
            </span>
            <span className="star" style={{left:"79.7%",top:"49.0%",width:"2px",height:"2px",animationDelay:"-1.95s"}}>
            </span>
            <span className="star" style={{left:"54.5%",top:"7.8%",width:"2px",height:"2px",animationDelay:"-2.02s"}}>
            </span>
            <span className="star" style={{left:"32.7%",top:"51.6%",width:"3px",height:"3px",animationDelay:"-0.99s"}}>
            </span>
            <span className="star" style={{left:"62.2%",top:"74.8%",width:"2px",height:"2px",animationDelay:"-0.64s"}}>
            </span>
            <span className="star" style={{left:"61.4%",top:"33.3%",width:"2px",height:"2px",animationDelay:"-0.68s"}}>
            </span>
            <span className="star" style={{left:"7.4%",top:"65.2%",width:"2px",height:"2px",animationDelay:"-1.43s"}}>
            </span>
            <span className="star" style={{left:"86.1%",top:"64.6%",width:"2px",height:"2px",animationDelay:"-2.13s"}}>
            </span>
            <span className="star" style={{left:"80.2%",top:"95.8%",width:"4px",height:"4px",animationDelay:"-1.72s"}}>
            </span>
            <span className="star" style={{left:"93.8%",top:"67.3%",width:"2px",height:"2px",animationDelay:"-2.40s"}}>
            </span>
            <span className="star" style={{left:"47.1%",top:"51.2%",width:"2px",height:"2px",animationDelay:"-2.98s"}}>
            </span>
            <span className="comet" style={{left:"0",top:"60%"}}>
            </span>
            <span className="comet c2" style={{left:"10%",top:"85%"}}>
            </span>
          </div>
          <div className="inner">
            <div style={{minWidth:"0"}}>
              <span className="pill" style={{background:"rgba(255,174,0,.14)",color:"#FFE29A",height:"36px"}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                  <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z" />
                </svg>
                {t.eyebrowW}
              </span>
              <div style={{minHeight:"250px"}}>
                {(isS0) && (<>
                  <div aria-live="polite">
                    <h1 className="ep slup" style={{margin:"18px 0 0",fontSize:"50px",fontWeight:"700",lineHeight:"1.08",letterSpacing:"-.015em"}}>
                      {t.s0a}
                      <em style={{fontStyle:"normal",color:"#FFAE00"}}>
                        {t.s0b}
                      </em>
                      {t.s0c}
                    </h1>
                    <p className="slup" style={{margin:"18px 0 0",fontSize:"19px",lineHeight:"1.6",color:"#E7E9F0",maxWidth:"560px",animationDelay:".15s"}}>
                      {t.s0t}
                    </p>
                  </div>
                </>)}
                {(isS1) && (<>
                  <div aria-live="polite">
                    <h1 className="ep slup" style={{margin:"18px 0 0",fontSize:"50px",fontWeight:"700",lineHeight:"1.08",letterSpacing:"-.015em"}}>
                      {t.s1a}
                      <em style={{fontStyle:"normal",color:"#FFAE00"}}>
                        {t.s1b}
                      </em>
                      {t.s1c}
                    </h1>
                    <p className="slup" style={{margin:"18px 0 0",fontSize:"19px",lineHeight:"1.6",color:"#E7E9F0",maxWidth:"560px",animationDelay:".15s"}}>
                      {t.s1t}
                    </p>
                  </div>
                </>)}
                {(isS2) && (<>
                  <div aria-live="polite">
                    <h1 className="ep slup" style={{margin:"18px 0 0",fontSize:"50px",fontWeight:"700",lineHeight:"1.08",letterSpacing:"-.015em"}}>
                      {t.s2a}
                      <em style={{fontStyle:"normal",color:"#FFAE00"}}>
                        {t.s2b}
                      </em>
                      {t.s2c}
                    </h1>
                    <p className="slup" style={{margin:"18px 0 0",fontSize:"19px",lineHeight:"1.6",color:"#E7E9F0",maxWidth:"560px",animationDelay:".15s"}}>
                      {t.s2t}
                    </p>
                  </div>
                </>)}
                {(isS3) && (<>
                  <div aria-live="polite">
                    <h1 className="ep slup" style={{margin:"18px 0 0",fontSize:"50px",fontWeight:"700",lineHeight:"1.08",letterSpacing:"-.015em"}}>
                      {t.s3a}
                      <em style={{fontStyle:"normal",color:"#FFAE00"}}>
                        {t.s3b}
                      </em>
                      {t.s3c}
                    </h1>
                    <p className="slup" style={{margin:"18px 0 0",fontSize:"19px",lineHeight:"1.6",color:"#E7E9F0",maxWidth:"560px",animationDelay:".15s"}}>
                      {t.s3t}
                    </p>
                  </div>
                </>)}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"14px",marginTop:"22px"}}>
                <A href="/astrologer/login" className="bigcta tap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  {t.ctaSign}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </A>
                <A href="/astrologer/join" className="ghostcta tap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z" />
                  </svg>
                  {t.ctaJoin}
                </A>
              </div>
              <ul style={{listStyle:"none",margin:"22px 0 0",padding:"0",display:"flex",flexWrap:"wrap",gap:"10px 22px"}}>
                <li style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"15px",fontWeight:"600",color:"#E7E9F0"}}>
                  <span style={{width:"24px",height:"24px",borderRadius:"50%",background:"rgba(255,174,0,.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {t.trust1}
                </li>
                <li style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"15px",fontWeight:"600",color:"#E7E9F0"}}>
                  <span style={{width:"24px",height:"24px",borderRadius:"50%",background:"rgba(255,174,0,.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {t.trust2}
                </li>
                <li style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"15px",fontWeight:"600",color:"#E7E9F0"}}>
                  <span style={{width:"24px",height:"24px",borderRadius:"50%",background:"rgba(255,174,0,.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {t.trust3}
                </li>
              </ul>
              <div role="group" aria-label={t.sliderLabel} style={{display:"flex",alignItems:"flex-end",gap:"12px",marginTop:"34px",maxWidth:"600px"}}>
                {(dots).map((dt, dtIdx) => (<Fragment key={dtIdx}>
                  <button type="button" className="tap" onClick={dt.go} aria-label={dt.label} aria-current={dt.on} style={{flex:"1",minWidth:"0",textAlign:"left",padding:"6px 0 0"}}>
                    <span style={css(`display:block;font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .25s;${dt.tc}`)}>
                      {dt.name}
                    </span>
                    <span className="sbar">
                      <span style={css(dt.fill)}>
                      </span>
                    </span>
                  </button>
                </Fragment>))}
                <button type="button" className="tap" onClick={togglePlay} aria-label={playText} aria-pressed={paused} style={{flex:"none",width:"40px",height:"40px",borderRadius:"50%",border:"1.5px solid rgba(251,246,236,.35)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {(playing) && (<>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBF6EC" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  </>)}
                  {(paused) && (<>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBF6EC" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </>)}
                </button>
              </div>
            </div>
            <div className="wheelbox" onMouseMove={tilt} onMouseLeave={untilt}>
              <div style={css(`position:absolute;inset:0;transition:transform .25s ease-out;${tiltStyle}`)}>
                <div className="wheel" aria-hidden="true">
                  <span className="band">
                  </span>
                  <span className="band2">
                  </span>
                  <span className="tick" style={{transform:"rotate(15deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(45deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(75deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(105deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(135deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(165deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(195deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(225deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(255deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(285deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(315deg)"}}>
                  </span>
                  <span className="tick" style={{transform:"rotate(345deg)"}}>
                  </span>
                  <span className="zpos" style={{transform:"rotate(0deg) translateY(-227px) rotate(-0deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z0}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(30deg) translateY(-227px) rotate(-30deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z1}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(60deg) translateY(-227px) rotate(-60deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z2}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(90deg) translateY(-227px) rotate(-90deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z3}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(120deg) translateY(-227px) rotate(-120deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z4}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(150deg) translateY(-227px) rotate(-150deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z5}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(180deg) translateY(-227px) rotate(-180deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z6}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(210deg) translateY(-227px) rotate(-210deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z7}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(240deg) translateY(-227px) rotate(-240deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z8}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(270deg) translateY(-227px) rotate(-270deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z9}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(300deg) translateY(-227px) rotate(-300deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z10}
                      </span>
                    </span>
                  </span>
                  <span className="zpos" style={{transform:"rotate(330deg) translateY(-227px) rotate(-330deg)"}}>
                    <span className="zspin">
                      <span className="zlab">
                        {t.z11}
                      </span>
                    </span>
                  </span>
                </div>
                <span className="nak" aria-hidden="true">
                </span>
                <span className="wglow" aria-hidden="true">
                </span>
                <span className="porb o64" style={{left:"50%",top:"50%",width:"500px",height:"500px",margin:"-250px 0 0 -250px"}}>
                  <span className="pl" style={{transform:"rotate(0deg)",transformOrigin:"0 250px"}}>
                    <i>
                      <em style={{position:"absolute",left:"0",top:"0",width:"0",height:"0",transform:"rotate(-0deg)"}}>
                        <b className="">
                          {t.o1}
                        </b>
                      </em>
                    </i>
                  </span>
                  <span className="pl" style={{transform:"rotate(72deg)",transformOrigin:"0 250px"}}>
                    <i>
                      <em style={{position:"absolute",left:"0",top:"0",width:"0",height:"0",transform:"rotate(-72deg)"}}>
                        <b className="n">
                          {t.o2}
                        </b>
                      </em>
                    </i>
                  </span>
                  <span className="pl" style={{transform:"rotate(144deg)",transformOrigin:"0 250px"}}>
                    <i>
                      <em style={{position:"absolute",left:"0",top:"0",width:"0",height:"0",transform:"rotate(-144deg)"}}>
                        <b className="">
                          {t.o3}
                        </b>
                      </em>
                    </i>
                  </span>
                  <span className="pl" style={{transform:"rotate(216deg)",transformOrigin:"0 250px"}}>
                    <i>
                      <em style={{position:"absolute",left:"0",top:"0",width:"0",height:"0",transform:"rotate(-216deg)"}}>
                        <b className="n">
                          {t.o4}
                        </b>
                      </em>
                    </i>
                  </span>
                  <span className="pl" style={{transform:"rotate(288deg)",transformOrigin:"0 250px"}}>
                    <i>
                      <em style={{position:"absolute",left:"0",top:"0",width:"0",height:"0",transform:"rotate(-288deg)"}}>
                        <b className="">
                          {t.o5}
                        </b>
                      </em>
                    </i>
                  </span>
                </span>
                <div className="holder" aria-hidden="true">
                  {(isS0) && (<>
                    <div className="slin" style={{position:"relative"}}>
                      <div className="vcard" style={{padding:"20px 20px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px"}}>
                          <span className="pill" style={{background:"#14213D",color:"#FFAE00"}}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                              <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
                            </svg>
                            {t.reqTitle}
                          </span>
                          <span style={{position:"relative",width:"48px",height:"48px",flex:"none"}}>
                            <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" style={{transform:"rotate(-90deg)"}}>
                              <circle cx="24" cy="24" r="20" fill="none" stroke="#F1ECE1" strokeWidth="5" />
                              <circle className="ring30" cx="24" cy="24" r="20" fill="none" stroke="#FFAE00" strokeWidth="5" strokeLinecap="round" />
                            </svg>
                            <b style={{position:"absolute",inset:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px"}}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                            </b>
                          </span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:"12px",marginTop:"14px"}}>
                          <span style={{width:"50px",height:"50px",borderRadius:"50%",background:"#FFF0CC",color:"#8A5A00",fontWeight:"800",display:"flex",alignItems:"center",justifyContent:"center",flex:"none"}}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
                          </span>
                          <div style={{minWidth:"0"}}>
                            <b style={{display:"block",fontSize:"18px"}}>
                              {t.reqName}
                            </b>
                            <span style={{fontSize:"14.5px",color:"#555D74"}}>
                              {t.reqQ}
                            </span>
                          </div>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginTop:"12px"}}>
                          <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                            {t.topic}
                          </span>
                        </div>
                        <div style={{display:"flex",gap:"10px",marginTop:"16px"}}>
                          <span className="btn b-line" style={{flex:"1",height:"48px",padding:"0 12px"}}>
                            {t.decline}
                          </span>
                          <span className="btn b-navy glowy" style={{flex:"1.4",height:"48px",padding:"0 12px"}}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            {t.accept}
                          </span>
                        </div>
                      </div>
                      <span className="pill bob" style={{position:"absolute",right:"-26px",top:"-48px",background:"#1F6F3A",color:"#FFFFFF",boxShadow:"0 10px 20px -10px rgba(0,0,0,.6)"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                          <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                        </svg>
                        {t.newReq}
                      </span>
                    </div>
                  </>)}
                  {(isS1) && (<>
                    <div className="vcard slin" style={{padding:"18px 18px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",marginBottom:"12px"}}>
                        <b style={{fontSize:"15px"}}>
                          {t.chartCap}
                        </b>
                        <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00",height:"26px",fontSize:"12px"}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                            <rect x="3" y="3" width="18" height="18" rx="1.5" />
                            <path d="M3 3l18 18M21 3 3 21" />
                            <path d="M12 3l9 9-9 9-9-9z" />
                          </svg>
                          D1
                        </span>
                      </div>
                      <div style={{position:"relative",width:"256px",height:"256px",margin:"0 auto"}}>
                        <svg viewBox="0 0 100 100" aria-hidden="true" style={{position:"absolute",inset:"0",width:"100%",height:"100%"}}>
                          <rect x=".6" y=".6" width="98.8" height="98.8" rx="1.6" fill="#FFFDF8" stroke="#FFAE00" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                          <polygon points="50,.6 75,25 50,50 25,25" fill="#FFF0CC" />
                          <path d="M.6 .6 L99.4 99.4 M99.4 .6 L.6 99.4 M50 .6 L99.4 50 L50 99.4 L.6 50 Z" fill="none" stroke="#FFAE00" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <span className="slup" style={{position:"absolute",left:"50.0%",top:"42.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.34s"}}>
                          1
                        </span>
                        <span className="slup" style={{position:"absolute",left:"25.0%",top:"20.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.38s"}}>
                          2
                        </span>
                        <span className="slup" style={{position:"absolute",left:"20.0%",top:"25.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.42s"}}>
                          3
                        </span>
                        <span className="slup" style={{position:"absolute",left:"42.0%",top:"50.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.46s"}}>
                          4
                        </span>
                        <span className="slup" style={{position:"absolute",left:"20.0%",top:"75.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.50s"}}>
                          5
                        </span>
                        <span className="slup" style={{position:"absolute",left:"25.0%",top:"80.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.54s"}}>
                          6
                        </span>
                        <span className="slup" style={{position:"absolute",left:"50.0%",top:"58.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.58s"}}>
                          7
                        </span>
                        <span className="slup" style={{position:"absolute",left:"75.0%",top:"80.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.62s"}}>
                          8
                        </span>
                        <span className="slup" style={{position:"absolute",left:"80.0%",top:"75.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.66s"}}>
                          9
                        </span>
                        <span className="slup" style={{position:"absolute",left:"58.0%",top:"50.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.70s"}}>
                          10
                        </span>
                        <span className="slup" style={{position:"absolute",left:"80.0%",top:"25.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.74s"}}>
                          11
                        </span>
                        <span className="slup" style={{position:"absolute",left:"75.0%",top:"20.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11px",opacity:".7",animationDelay:"0.78s"}}>
                          12
                        </span>
                        <span className="slup" style={{position:"absolute",left:"50.0%",top:"25.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"14px",animationDelay:"0.70s"}}>
                          {t.pl1}
                        </span>
                        <span className="slup" style={{position:"absolute",left:"8.6%",top:"25.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"14px",animationDelay:"0.78s"}}>
                          {t.pl3}
                        </span>
                        <span className="slup" style={{position:"absolute",left:"25.0%",top:"50.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"14px",animationDelay:"0.86s"}}>
                          {t.pl4}
                        </span>
                        <span className="slup" style={{position:"absolute",left:"8.6%",top:"75.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"14px",animationDelay:"0.94s"}}>
                          {t.pl5}
                        </span>
                        <span className="slup" style={{position:"absolute",left:"25.0%",top:"91.4%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"14px",animationDelay:"1.02s"}}>
                          {t.pl6}
                        </span>
                        <span className="slup" style={{position:"absolute",left:"91.4%",top:"75.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"14px",animationDelay:"1.10s"}}>
                          {t.pl9}
                        </span>
                        <span className="slup" style={{position:"absolute",left:"75.0%",top:"50.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"14px",animationDelay:"1.18s"}}>
                          {t.pl10}
                        </span>
                        <span className="slup" style={{position:"absolute",left:"91.4%",top:"25.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"14px",animationDelay:"1.26s"}}>
                          {t.pl11}
                        </span>
                      </div>
                      <div style={{marginTop:"12px"}}>
                        <span className="pill" style={{height:"36px",background:"#14213D",color:"#FFAE00",fontSize:"13.5px"}}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 2" />
                          </svg>
                          {t.dashaChip}
                        </span>
                      </div>
                    </div>
                  </>)}
                  {(isS2) && (<>
                    <div className="vcard slin" style={{padding:"24px 26px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px"}}>
                        <div>
                          <div className="lbl">
                            {t.earnTitle}
                          </div>
                          <div className="ep" style={{fontSize:"42px",fontWeight:"700",lineHeight:"1.05"}}>
                            ₹ ••••
                          </div>
                          <div style={{fontSize:"14px",color:"#1F6F3A",fontWeight:"700"}}>
                            {t.earnSub}
                          </div>
                        </div>
                        <span className="ico bob" style={{width:"54px",height:"54px"}}>
                          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                            <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
                            <path d="M3 5v14a2 2 0 0 0 2 2h15V7" />
                            <circle cx="16" cy="14" r="1.5" />
                          </svg>
                        </span>
                      </div>
                      <div style={{display:"flex",alignItems:"flex-end",gap:"10px",height:"150px",marginTop:"16px",borderBottom:"1.5px solid #EBDFC6"}}>
                        <div style={{flex:"1",height:"45%",borderRadius:"9px 9px 0 0",background:"#F2D58A",transformOrigin:"bottom",animation:"growBar .8s cubic-bezier(.2,1,.3,1) 0.30s both"}}>
                        </div>
                        <div style={{flex:"1",height:"58%",borderRadius:"9px 9px 0 0",background:"#F2D58A",transformOrigin:"bottom",animation:"growBar .8s cubic-bezier(.2,1,.3,1) 0.40s both"}}>
                        </div>
                        <div style={{flex:"1",height:"34%",borderRadius:"9px 9px 0 0",background:"#F2D58A",transformOrigin:"bottom",animation:"growBar .8s cubic-bezier(.2,1,.3,1) 0.50s both"}}>
                        </div>
                        <div style={{flex:"1",height:"78%",borderRadius:"9px 9px 0 0",background:"#F2D58A",transformOrigin:"bottom",animation:"growBar .8s cubic-bezier(.2,1,.3,1) 0.60s both"}}>
                        </div>
                        <div style={{flex:"1",height:"55%",borderRadius:"9px 9px 0 0",background:"#F2D58A",transformOrigin:"bottom",animation:"growBar .8s cubic-bezier(.2,1,.3,1) 0.70s both"}}>
                        </div>
                        <div style={{flex:"1",height:"75%",borderRadius:"9px 9px 0 0",background:"#F2D58A",transformOrigin:"bottom",animation:"growBar .8s cubic-bezier(.2,1,.3,1) 0.80s both"}}>
                        </div>
                        <div style={{flex:"1",height:"96%",borderRadius:"9px 9px 0 0",background:"#FFAE00",transformOrigin:"bottom",animation:"growBar .8s cubic-bezier(.2,1,.3,1) 0.90s both"}}>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:"10px",marginTop:"6px"}}>
                        <span style={{flex:"1",textAlign:"center",fontSize:"11.5px",color:"#555D74"}}>
                          {t.day0}
                        </span>
                        <span style={{flex:"1",textAlign:"center",fontSize:"11.5px",color:"#555D74"}}>
                          {t.day1}
                        </span>
                        <span style={{flex:"1",textAlign:"center",fontSize:"11.5px",color:"#555D74"}}>
                          {t.day2}
                        </span>
                        <span style={{flex:"1",textAlign:"center",fontSize:"11.5px",color:"#555D74"}}>
                          {t.day3}
                        </span>
                        <span style={{flex:"1",textAlign:"center",fontSize:"11.5px",color:"#555D74"}}>
                          {t.day4}
                        </span>
                        <span style={{flex:"1",textAlign:"center",fontSize:"11.5px",color:"#555D74"}}>
                          {t.day5}
                        </span>
                        <span style={{flex:"1",textAlign:"center",fontSize:"11.5px",color:"#555D74"}}>
                          {t.day6}
                        </span>
                      </div>
                      <div style={{marginTop:"14px"}}>
                        <span className="pill" style={{height:"36px",background:"#1F6F3A",color:"#FFFFFF",fontSize:"13.5px"}}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                            <path d="M3 10h18L12 4z" />
                            <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" />
                          </svg>
                          {t.payChip}
                        </span>
                      </div>
                    </div>
                  </>)}
                  {(isS3) && (<>
                    <div className="vcard slin" style={{padding:"24px 26px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px"}}>
                        <Image src="/logo.png" alt="" width="46" height="46" style={{width:"46px",height:"46px",display:"block",flex:"none"}} />
                        <div style={{position:"relative",display:"flex",border:"1px solid #EBDFC6",borderRadius:"14px",padding:"3px",background:"#FFFDF8",width:"120px"}}>
                          <span aria-hidden="true" style={{position:"absolute",top:"3px",left:"3px",width:"57px",height:"38px",borderRadius:"11px",background:"#14213D",animation:"knobSwap 6s ease-in-out infinite"}}>
                          </span>
                          <span style={{position:"relative",flex:"1",height:"38px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"800",color:"#FFAE00"}}>
                            EN
                          </span>
                          <span style={{position:"relative",flex:"1",height:"38px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"800",color:"#8A5A00"}}>
                            <span lang="hi">हिं</span>
                          </span>
                        </div>
                      </div>
                      <div style={{position:"relative",height:"150px",marginTop:"20px"}}>
                        <div style={{position:"absolute",inset:"0",animation:"fadeSwap 6s ease-in-out infinite"}}>
                          <div className="ep" style={{fontSize:"28px",fontWeight:"700",lineHeight:"1.2"}}>
                            {t.hello}
                          </div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginTop:"14px"}}>
                            <span className="pill" style={{background:"#14213D",color:"#FBF6EC"}}>
                              Home
                            </span>
                            <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                              Chats
                            </span>
                            <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                              Earnings
                            </span>
                            <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                              Profile
                            </span>
                          </div>
                        </div>
                        <div lang="hi" style={{position:"absolute",inset:"0",opacity:"0",animation:"fadeSwap2 6s ease-in-out infinite"}}>
                          <div className="ep" style={{fontSize:"28px",fontWeight:"700",lineHeight:"1.2"}}>
                            नमस्ते, पंडित जी
                          </div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginTop:"14px"}}>
                            <span className="pill" style={{background:"#14213D",color:"#FBF6EC"}}>
                              होम
                            </span>
                            <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                              चैट
                            </span>
                            <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                              कमाई
                            </span>
                            <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                              प्रोफ़ाइल
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>)}
                </div>
              </div>
            </div>
          </div>
          <div className="ticker">
            <span className="tklab">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
              </svg>
              {t.tkLabel}
            </span>
            <div className="tkview">
              <div className="tktrack">
                <div style={{display:"flex"}}>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
                    </svg>
                    {t.tk1}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                    </svg>
                    {t.tk2}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <rect x="3" y="8" width="18" height="5" rx="1" />
                      <path d="M5 13v8h14v-8M12 8v13" />
                      <path d="M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z" />
                    </svg>
                    {t.tk3}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <rect x="3" y="3" width="18" height="18" rx="1.5" />
                      <path d="M3 3l18 18M21 3 3 21" />
                      <path d="M12 3l9 9-9 9-9-9z" />
                    </svg>
                    {t.tk4}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M3 10h18L12 4z" />
                      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" />
                    </svg>
                    {t.tk5}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-10-1 12-5 16-10 16z" />
                      <path d="M4 21c4-4 7-7 10-9" />
                    </svg>
                    {t.tk6}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M6 3h12l3 6-9 12L3 9z" />
                      <path d="M3 9h18M9 3l3 6 3-6M12 9v12" />
                    </svg>
                    {t.tk7}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                </div>
                <div aria-hidden="true" style={{display:"flex"}}>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
                    </svg>
                    {t.tk1}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                    </svg>
                    {t.tk2}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <rect x="3" y="8" width="18" height="5" rx="1" />
                      <path d="M5 13v8h14v-8M12 8v13" />
                      <path d="M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z" />
                    </svg>
                    {t.tk3}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <rect x="3" y="3" width="18" height="18" rx="1.5" />
                      <path d="M3 3l18 18M21 3 3 21" />
                      <path d="M12 3l9 9-9 9-9-9z" />
                    </svg>
                    {t.tk4}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M3 10h18L12 4z" />
                      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" />
                    </svg>
                    {t.tk5}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-10-1 12-5 16-10 16z" />
                      <path d="M4 21c4-4 7-7 10-9" />
                    </svg>
                    {t.tk6}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                  <span className="tkitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M6 3h12l3 6-9 12L3 9z" />
                      <path d="M3 9h18M9 3l3 6 3-6M12 9v12" />
                    </svg>
                    {t.tk7}
                    <span aria-hidden="true" style={{color:"#FFAE00",marginLeft:"16px"}}>
                      ✦
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="stage">
          <Rails />
          <div className="wrap" style={{gap:"56px",paddingTop:"56px"}}>
            <section aria-labelledby="bn" style={{display:"flex",flexDirection:"column",gap:"20px"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:"14px",flexWrap:"wrap"}}>
                <span style={{color:"#8A5A00",fontWeight:"700"}}>
                  {t.bnEyebrow}
                </span>
                <h2 id="bn" className="ep" style={{margin:"0",fontSize:"34px",fontWeight:"700"}}>
                  {t.bnTitle}
                </h2>
              </div>
              <div className="bento">
                <article className="card tile bt-a" aria-labelledby="duo" style={{padding:"30px 32px 18px",display:"flex",flexDirection:"column",background:"linear-gradient(180deg,#FFFDF8 0%,#FFF7E3 100%)"}}>
                  <span className="pill" style={{alignSelf:"flex-start",background:"#FFF0CC",color:"#8A5A00"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z" />
                    </svg>
                    {t.duoEyebrow}
                  </span>
                  <h3 id="duo" className="ep" style={{margin:"12px 0 0",fontSize:"34px",fontWeight:"700",lineHeight:"1.12"}}>
                    {t.duoTitle}
                  </h3>
                  <p style={{margin:"10px 0 0",fontSize:"16.5px",lineHeight:"1.6",color:"#555D74",maxWidth:"560px"}}>
                    {t.duoText}
                  </p>
                  <ul style={{listStyle:"none",margin:"14px 0 0",padding:"0",display:"flex",flexWrap:"wrap",gap:"8px"}}>
                    <li className="pill" style={{height:"36px",background:"#FFFDF8",border:"1px solid #E3D2A6",color:"#14213D",fontSize:"14px"}}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                        <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
                      </svg>
                      {t.dp1}
                    </li>
                    <li className="pill" style={{height:"36px",background:"#FFFDF8",border:"1px solid #E3D2A6",color:"#14213D",fontSize:"14px"}}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8" />
                        <path d="M11 5c0 4-3 7-7 8" />
                        <path d="M13 21l4-9 4 9M14.5 18h5" />
                      </svg>
                      {t.dp2}
                    </li>
                    <li className="pill" style={{height:"36px",background:"#FFFDF8",border:"1px solid #E3D2A6",color:"#14213D",fontSize:"14px"}}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      {t.dp3}
                    </li>
                  </ul>
                  <div className="duo">
                    <span aria-hidden="true" className="glowc" style={{width:"420px",height:"420px",left:"50%",top:"50%",margin:"-210px 0 0 -210px"}}>
                    </span>
                    <span aria-hidden="true" className="halo" style={{width:"360px",height:"360px",left:"50%",top:"50%",margin:"-180px 0 0 -180px"}}>
                    </span>
                    <svg className="spk" width="22" height="22" viewBox="0 0 26 26" aria-hidden="true" style={{left:"6%",top:"16%"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <svg className="spk" width="16" height="16" viewBox="0 0 26 26" aria-hidden="true" style={{right:"8%",top:"6%",animationDelay:"-1s"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <svg className="spk" width="18" height="18" viewBox="0 0 26 26" aria-hidden="true" style={{right:"3%",top:"58%",animationDelay:"-2s"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <svg className="spk" width="14" height="14" viewBox="0 0 26 26" aria-hidden="true" style={{left:"3%",top:"64%",animationDelay:"-1.5s"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <div aria-hidden="true" className="bubble r" style={{right:"2%",top:"0",animation:"bubA 8s ease-in-out infinite"}}>
                      {t.duoB1}
                    </div>
                    <div aria-hidden="true" className="bubble gold l" style={{left:"0",top:"8%",animation:"bubB 8s ease-in-out infinite"}}>
                      {t.duoB2}
                    </div>
                    <span aria-hidden="true" className="pill bob" style={{position:"absolute",zIndex:"3",left:"46%",bottom:"5%",background:"#14213D",color:"#FFAE00",boxShadow:"0 12px 22px -12px rgba(0,0,0,.6)"}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <rect x="3" y="3" width="18" height="18" rx="1.5" />
                        <path d="M3 3l18 18M21 3 3 21" />
                        <path d="M12 3l9 9-9 9-9-9z" />
                      </svg>
                      {t.duoB3}
                    </span>
                  </div>
                </article>
                <section className="card tile bt-b" aria-labelledby="try" style={{padding:"24px 26px",display:"flex",flexDirection:"column"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",flexWrap:"wrap"}}>
                    <span className="pill" style={{background:"#FFF0CC",color:"#8A5A00"}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
                        <path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
                      </svg>
                      {t.tryEyebrow}
                    </span>
                    <span style={{fontSize:"12.5px",fontWeight:"700",color:"#8A5A00"}}>
                      {t.tryNote}
                    </span>
                  </div>
                  <h3 id="try" className="ep" style={{margin:"10px 0 0",fontSize:"26px",fontWeight:"700",lineHeight:"1.15"}}>
                    {t.tryTitle}
                  </h3>
                  <p style={{margin:"4px 0 0",fontSize:"15px",color:"#555D74"}}>
                    {t.tryShort}
                  </p>
                  <div style={{display:"flex",gap:"18px",alignItems:"center",marginTop:"auto",paddingTop:"14px"}}>
                    <button type="button" className="tap" onClick={dCycle} aria-label={`${dTitle}. ${t.tapHint}`} style={{width:"124px",height:"124px",borderRadius:"50%",position:"relative",flex:"none",display:"block"}}>
                      <span aria-hidden="true" className="pulse" style={css(`position:absolute;inset:12px;border-radius:50%;${dPulse1}`)}>
                      </span>
                      <span aria-hidden="true" className="pulse" style={css(`position:absolute;inset:12px;border-radius:50%;animation-delay:1.2s;${dPulse2}`)}>
                      </span>
                      <span aria-hidden="true" className={dRingCls} style={{position:"absolute",inset:"0",display:"block"}}>
                        <svg viewBox="0 0 160 160" width="124" height="124" aria-hidden="true" className="" style={{position:"absolute",inset:"0",width:"100%",height:"100%"}}>
                          <circle cx="80" cy="80" r="76" fill="none" stroke={dRing} strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" />
                          <circle cx="80" cy="80" r="67" fill="none" stroke={dRing} strokeWidth="4" strokeDasharray="70 36" strokeLinecap="round" opacity=".55" />
                        </svg>
                      </span>
                      <span style={css(`position:absolute;inset:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .4s,box-shadow .4s;${dCore}`)}>
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={dIcon} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                          <path d="M12 3v8" />
                          <path d="M6.4 6.6a8 8 0 1 0 11.2 0" />
                        </svg>
                      </span>
                      <span className={`burst ${dBurst}`} aria-hidden="true">
                        <i style={css("--a:0deg")}>
                        </i>
                        <i style={css("--a:45deg")}>
                        </i>
                        <i style={css("--a:90deg")}>
                        </i>
                        <i style={css("--a:135deg")}>
                        </i>
                        <i style={css("--a:180deg")}>
                        </i>
                        <i style={css("--a:225deg")}>
                        </i>
                        <i style={css("--a:270deg")}>
                        </i>
                        <i style={css("--a:315deg")}>
                        </i>
                      </span>
                    </button>
                    <div style={{flex:"1",minWidth:"0"}}>
                      <div className={`ep ${dPop}`} style={{fontSize:"21px",fontWeight:"700",lineHeight:"1.15"}}>
                        {dTitle}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"10px"}}>
                        <button type="button" className="tap" role="switch" aria-checked={dChatOn} onClick={dToggleChat} style={css(dChatPill)}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                            <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
                          </svg>
                          <span style={{flex:"1",textAlign:"left",fontSize:"14px",fontWeight:"700",whiteSpace:"nowrap"}}>
                            {t.dChat}
                          </span>
                          <span style={{fontSize:"12.5px",fontWeight:"600",color:"#555D74"}}>
                            {dChatState}
                          </span>
                          <span style={css(dChatTrack)}>
                            <span style={css(dChatKnob)}>
                            </span>
                          </span>
                        </button>
                        <button type="button" className="tap" role="switch" aria-checked={dCallOn} onClick={dToggleCall} style={css(dCallPill)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                          </svg>
                          <span style={{flex:"1",textAlign:"left",fontSize:"14px",fontWeight:"700",whiteSpace:"nowrap"}}>
                            {t.dCall}
                          </span>
                          <span style={{fontSize:"12.5px",fontWeight:"600",color:"#555D74"}}>
                            {dCallState}
                          </span>
                          <span style={css(dCallTrack)}>
                            <span style={css(dCallKnob)}>
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div role="status" style={css(`margin-top:12px;display:flex;gap:8px;align-items:flex-start;font-size:14px;font-weight:600;${dResTone}`)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none",marginTop:"1px"}}>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 11v5M12 8h.01" />
                    </svg>
                    <span>
                      {dRes}
                    </span>
                  </div>
                </section>
                <article className="tile bt-c" aria-labelledby="payt" style={{borderRadius:"22px",padding:"24px 26px",display:"flex",flexDirection:"column",background:"radial-gradient(120% 100% at 100% 0%,#2A3B66,#14213D 60%)",color:"#FBF6EC"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <span className="ico" style={{width:"46px",height:"46px",background:"#FFAE00",boxShadow:"0 0 0 4px rgba(255,174,0,.2)"}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
                        <path d="M3 5v14a2 2 0 0 0 2 2h15V7" />
                        <circle cx="16" cy="14" r="1.5" />
                      </svg>
                    </span>
                    <h3 id="payt" className="ep" style={{margin:"0",flex:"1",fontSize:"23px",fontWeight:"700"}}>
                      {t.f2}
                    </h3>
                  </div>
                  <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:"12px",marginTop:"16px",flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:"13px",color:"#AEB4C6",fontWeight:"600"}}>
                        {t.payLast}
                      </div>
                      <div className="ep" style={{fontSize:"40px",fontWeight:"700",lineHeight:"1.05",color:"#FFE29A"}}>
                        ₹ ••••
                      </div>
                      <div style={{fontSize:"13px",color:"#7FD6A1",fontWeight:"700",display:"flex",alignItems:"center",gap:"6px",marginTop:"2px"}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7FD6A1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {t.payPaid}
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:"13px",color:"#AEB4C6",fontWeight:"600"}}>
                        {t.payNow}
                      </div>
                      <div className="ep" style={{fontSize:"24px",fontWeight:"700"}}>
                        ₹ •••
                      </div>
                    </div>
                  </div>
                  <div style={{height:"8px",borderRadius:"8px",background:"rgba(251,246,236,.12)",marginTop:"12px",overflow:"hidden"}}>
                    <span style={{display:"block",height:"100%",width:"65%",borderRadius:"8px",background:"linear-gradient(90deg,#FFC23D,#FFAE00)",animation:"fillW 1.4s cubic-bezier(.2,1,.3,1) .3s both"}}>
                    </span>
                  </div>
                  <div style={{marginTop:"auto",paddingTop:"16px"}}>
                    <p style={{margin:"10px 0 0",fontSize:"13.5px",color:"#AEB4C6"}}>
                      {t.f2t}
                    </p>
                  </div>
                </article>
                <article className="card tile bt-d" style={{padding:"24px 26px",display:"flex",flexDirection:"column"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <span className="ico bob" aria-hidden="true" style={{width:"46px",height:"46px"}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </span>
                    <h3 className="ep" style={{margin:"0",fontSize:"21px",fontWeight:"700",lineHeight:"1.2"}}>
                      {t.f1}
                    </h3>
                  </div>
                  <ol style={{listStyle:"none",margin:"16px 0 0",padding:"0",display:"flex",flexDirection:"column",gap:"8px"}}>
                    <li className="chk" style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"12px",background:"#FBF6EC",border:"1px solid #EBDFC6",fontWeight:"700",fontSize:"14.5px",animationDelay:"0.8s"}}>
                      <span style={{width:"24px",height:"24px",borderRadius:"50%",background:"#1F6F3A",display:"flex",alignItems:"center",justifyContent:"center",flex:"none"}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      {t.vs1}
                    </li>
                    <li className="chk" style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"12px",background:"#FBF6EC",border:"1px solid #EBDFC6",fontWeight:"700",fontSize:"14.5px",animationDelay:"1.1s"}}>
                      <span style={{width:"24px",height:"24px",borderRadius:"50%",background:"#1F6F3A",display:"flex",alignItems:"center",justifyContent:"center",flex:"none"}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      {t.vs2}
                    </li>
                    <li className="chk" style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"12px",background:"#FBF6EC",border:"1px solid #EBDFC6",fontWeight:"700",fontSize:"14.5px",animationDelay:"1.4s"}}>
                      <span style={{width:"24px",height:"24px",borderRadius:"50%",background:"#1F6F3A",display:"flex",alignItems:"center",justifyContent:"center",flex:"none"}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      {t.vs3}
                    </li>
                  </ol>
                  <p style={{margin:"auto 0 0",paddingTop:"12px",fontSize:"14.5px",lineHeight:"1.55",color:"#555D74"}}>
                    {t.f1t}
                  </p>
                </article>
                <article className="card tile bt-e" style={{padding:"24px 26px",display:"flex",flexDirection:"column"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <span className="ico bob" aria-hidden="true" style={{width:"46px",height:"46px"}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <rect x="3" y="3" width="18" height="18" rx="1.5" />
                        <path d="M3 3l18 18M21 3 3 21" />
                        <path d="M12 3l9 9-9 9-9-9z" />
                      </svg>
                    </span>
                    <h3 className="ep" style={{margin:"0",fontSize:"20px",fontWeight:"700",lineHeight:"1.2"}}>
                      {t.f3}
                    </h3>
                  </div>
                  <div style={{display:"flex",gap:"14px",alignItems:"center",marginTop:"16px",flex:"1"}}>
                    <div role="img" aria-label={t.chartCap} style={{position:"relative",width:"184px",height:"184px",flex:"none"}}>
                      <svg viewBox="0 0 100 100" aria-hidden="true" style={{position:"absolute",inset:"0",width:"100%",height:"100%"}}>
                        <rect x=".6" y=".6" width="98.8" height="98.8" rx="1.6" fill="#FFFDF8" stroke="#FFAE00" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        <polygon points="50,.6 75,25 50,50 25,25" fill="#FFF0CC" />
                        <path d="M.6 .6 L99.4 99.4 M99.4 .6 L.6 99.4 M50 .6 L99.4 50 L50 99.4 L.6 50 Z" fill="none" stroke="#FFAE00" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                      </svg>
                      <span style={{position:"absolute",left:"50.0%",top:"25.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11.5px"}}>
                        {t.pl1}
                      </span>
                      <span style={{position:"absolute",left:"8.6%",top:"25.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11.5px"}}>
                        {t.pl3}
                      </span>
                      <span style={{position:"absolute",left:"25.0%",top:"50.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11.5px"}}>
                        {t.pl4}
                      </span>
                      <span style={{position:"absolute",left:"8.6%",top:"75.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11.5px"}}>
                        {t.pl5}
                      </span>
                      <span style={{position:"absolute",left:"25.0%",top:"91.4%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11.5px"}}>
                        {t.pl6}
                      </span>
                      <span style={{position:"absolute",left:"91.4%",top:"75.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11.5px"}}>
                        {t.pl9}
                      </span>
                      <span style={{position:"absolute",left:"75.0%",top:"50.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11.5px"}}>
                        {t.pl10}
                      </span>
                      <span style={{position:"absolute",left:"91.4%",top:"25.0%",transform:"translate(-50%,-50%)",width:"min-content",textAlign:"center",lineHeight:"1.3",fontWeight:"800",color:"#14213D",fontSize:"11.5px"}}>
                        {t.pl11}
                      </span>
                    </div>
                    <div style={{minWidth:"0",flex:"1",display:"flex",flexDirection:"column",gap:"8px"}}>
                      <span className="pill" style={{height:"30px",fontSize:"12.5px",justifyContent:"center",background:"#14213D",color:"#FFAE00"}}>
                        {t.tabK}
                      </span>
                      <span className="pill" style={{height:"30px",fontSize:"12.5px",justifyContent:"center",background:"#FFF0CC",color:"#8A5A00"}}>
                        {t.tabD}
                      </span>
                      <span className="pill" style={{height:"30px",fontSize:"12.5px",justifyContent:"center",background:"#FFF0CC",color:"#8A5A00"}}>
                        {t.tabT}
                      </span>
                      <span className="pill" style={{height:"30px",fontSize:"12.5px",justifyContent:"center",background:"#FFF0CC",color:"#8A5A00"}}>
                        {t.tabR}
                      </span>
                    </div>
                  </div>
                  <p style={{margin:"12px 0 0",fontSize:"14.5px",lineHeight:"1.55",color:"#555D74"}}>
                    {t.f3t}
                  </p>
                </article>
                <article className="card tile bt-f" style={{padding:"24px 26px",display:"flex",flexDirection:"column"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <span className="ico bob" aria-hidden="true" style={{width:"46px",height:"46px"}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8" />
                        <path d="M11 5c0 4-3 7-7 8" />
                        <path d="M13 21l4-9 4 9M14.5 18h5" />
                      </svg>
                    </span>
                    <h3 className="ep" style={{margin:"0",fontSize:"21px",fontWeight:"700",lineHeight:"1.2"}}>
                      {t.lgT}
                    </h3>
                  </div>
                  <div style={{marginTop:"16px",borderRadius:"16px",background:"#FBF6EC",border:"1px solid #EBDFC6",padding:"14px 16px",flex:"1",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                    <div style={{position:"relative",display:"flex",border:"1px solid #EBDFC6",borderRadius:"14px",padding:"3px",background:"#FFFDF8",width:"120px"}}>
                      <span aria-hidden="true" style={{position:"absolute",top:"3px",left:"3px",width:"57px",height:"34px",borderRadius:"11px",background:"#14213D",animation:"knobSwap 6s ease-in-out infinite"}}>
                      </span>
                      <span style={{position:"relative",flex:"1",height:"34px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"800",color:"#FFAE00"}}>
                        EN
                      </span>
                      <span style={{position:"relative",flex:"1",height:"34px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"800",color:"#8A5A00"}}>
                        <span lang="hi">हिं</span>
                      </span>
                    </div>
                    <div aria-hidden="true" style={{position:"relative",height:"34px",marginTop:"12px"}}>
                      <b className="ep" style={{position:"absolute",inset:"0",fontSize:"20px",animation:"fadeSwap 6s ease-in-out infinite"}}>
                        Namaste, Panditji
                      </b>
                      <b className="ep" lang="hi" style={{position:"absolute",inset:"0",fontSize:"20px",opacity:"0",animation:"fadeSwap2 6s ease-in-out infinite"}}>
                        नमस्ते, पंडित जी
                      </b>
                    </div>
                  </div>
                  <p style={{margin:"12px 0 0",fontSize:"14.5px",lineHeight:"1.55",color:"#555D74"}}>
                    {t.lgText}
                  </p>
                </article>
              </div>
            </section>
            <section aria-labelledby="vis" className="vision rise">
              <div className="yantra" aria-hidden="true">
                <span className="c spin" style={{inset:"0",borderStyle:"dashed"}}>
                </span>
                <span className="c spin-r" style={{inset:"40px",borderStyle:"dotted",borderWidth:"2px"}}>
                </span>
                <span className="c" style={{inset:"90px"}}>
                </span>
                <span className="sq spin" style={{}}>
                </span>
                <span className="sq spin-r" style={{transform:"rotate(45deg)"}}>
                </span>
                <span className="c" style={{inset:"200px",background:"radial-gradient(circle,rgba(255,174,0,.5),rgba(255,174,0,0) 70%)",border:"none"}}>
                </span>
              </div>
              <div style={{position:"relative",maxWidth:"820px"}}>
                <span style={{color:"#FFAE00",fontWeight:"700",fontSize:"15px",letterSpacing:".06em"}}>
                  {t.visEyebrow}
                </span>
                <p id="vis" className="ep" style={{margin:"12px 0 0",fontSize:"36px",lineHeight:"1.28",fontWeight:"700"}}>
                  {t.visA}
                  <em style={{fontStyle:"normal",color:"#FFAE00"}}>
                    {t.visB}
                  </em>
                  {t.visC}
                </p>
              </div>
              <div style={{position:"relative",display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"16px",marginTop:"30px"}}>
                <div className="pillar rise" style={{animationDelay:"0.12s"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span className="pnum ep">
                      01
                    </span>
                    <span className="ico" style={{width:"46px",height:"46px",background:"rgba(255,174,0,.16)",boxShadow:"none"}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-10-1 12-5 16-10 16z" />
                        <path d="M4 21c4-4 7-7 10-9" />
                      </svg>
                    </span>
                  </div>
                  <b className="ep" style={{display:"block",fontSize:"21px",marginTop:"12px"}}>
                    {t.vp1}
                  </b>
                  <span style={{display:"block",marginTop:"4px",fontSize:"15px",lineHeight:"1.55",color:"#E7E9F0"}}>
                    {t.vp1t}
                  </span>
                </div>
                <div className="pillar rise" style={{animationDelay:"0.24s"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span className="pnum ep">
                      02
                    </span>
                    <span className="ico" style={{width:"46px",height:"46px",background:"rgba(255,174,0,.16)",boxShadow:"none"}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </span>
                  </div>
                  <b className="ep" style={{display:"block",fontSize:"21px",marginTop:"12px"}}>
                    {t.vp2}
                  </b>
                  <span style={{display:"block",marginTop:"4px",fontSize:"15px",lineHeight:"1.55",color:"#E7E9F0"}}>
                    {t.vp2t}
                  </span>
                </div>
                <div className="pillar rise" style={{animationDelay:"0.36s"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span className="pnum ep">
                      03
                    </span>
                    <span className="ico" style={{width:"46px",height:"46px",background:"rgba(255,174,0,.16)",boxShadow:"none"}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
                        <path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
                      </svg>
                    </span>
                  </div>
                  <b className="ep" style={{display:"block",fontSize:"21px",marginTop:"12px"}}>
                    {t.vp3}
                  </b>
                  <span style={{display:"block",marginTop:"4px",fontSize:"15px",lineHeight:"1.55",color:"#E7E9F0"}}>
                    {t.vp3t}
                  </span>
                </div>
              </div>
              <div style={{position:"relative",height:"1px",background:"rgba(251,246,236,.14)",margin:"36px 0 28px"}}>
              </div>
              <div style={{position:"relative",display:"flex",alignItems:"baseline",gap:"12px",flexWrap:"wrap"}}>
                <span style={{color:"#FFAE00",fontWeight:"700",fontSize:"15px",letterSpacing:".06em"}}>
                  {t.nxEyebrow}
                </span>
                <h2 className="ep" style={{margin:"0",fontSize:"28px",fontWeight:"700"}}>
                  {t.nxTitle}
                </h2>
              </div>
              <div style={{position:"relative",display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"20px",marginTop:"22px"}}>
                <span aria-hidden="true" className="road">
                </span>
                <span aria-hidden="true" className="roaddot">
                </span>
                <div className="rise" style={{position:"relative",textAlign:"center",animationDelay:"0.15s"}}>
                  <span className="ico breathe" style={{width:"90px",height:"90px",margin:"0 auto",background:"#14213D",boxShadow:"0 0 0 2px #FFAE00,0 0 0 10px rgba(255,174,0,.12)"}}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
                      <path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
                    </svg>
                  </span>
                  <div style={{marginTop:"14px"}}>
                    <span className="pill" style={{height:"26px",fontSize:"12.5px",background:"rgba(255,174,0,.16)",color:"#FFE29A"}}>
                      {t.soon}
                    </span>
                  </div>
                  <b className="ep" style={{display:"block",fontSize:"20px",marginTop:"8px"}}>
                    {t.nx1}
                  </b>
                  <span style={{display:"block",margin:"4px auto 0",maxWidth:"300px",fontSize:"15px",lineHeight:"1.55",color:"#E7E9F0"}}>
                    {t.nx1t}
                  </span>
                </div>
                <div className="rise" style={{position:"relative",textAlign:"center",animationDelay:"0.30s"}}>
                  <span className="ico breathe" style={{width:"90px",height:"90px",margin:"0 auto",background:"#14213D",boxShadow:"0 0 0 2px #FFAE00,0 0 0 10px rgba(255,174,0,.12)"}}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </span>
                  <div style={{marginTop:"14px"}}>
                    <span className="pill" style={{height:"26px",fontSize:"12.5px",background:"rgba(255,174,0,.16)",color:"#FFE29A"}}>
                      {t.soon}
                    </span>
                  </div>
                  <b className="ep" style={{display:"block",fontSize:"20px",marginTop:"8px"}}>
                    {t.nx2}
                  </b>
                  <span style={{display:"block",margin:"4px auto 0",maxWidth:"300px",fontSize:"15px",lineHeight:"1.55",color:"#E7E9F0"}}>
                    {t.nx2t}
                  </span>
                </div>
                <div className="rise" style={{position:"relative",textAlign:"center",animationDelay:"0.45s"}}>
                  <span className="ico breathe" style={{width:"90px",height:"90px",margin:"0 auto",background:"#14213D",boxShadow:"0 0 0 2px #FFAE00,0 0 0 10px rgba(255,174,0,.12)"}}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5" />
                      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.6 3.5 5.2" />
                    </svg>
                  </span>
                  <div style={{marginTop:"14px"}}>
                    <span className="pill" style={{height:"26px",fontSize:"12.5px",background:"rgba(255,174,0,.16)",color:"#FFE29A"}}>
                      {t.soon}
                    </span>
                  </div>
                  <b className="ep" style={{display:"block",fontSize:"20px",marginTop:"8px"}}>
                    {t.nx3}
                  </b>
                  <span style={{display:"block",margin:"4px auto 0",maxWidth:"300px",fontSize:"15px",lineHeight:"1.55",color:"#E7E9F0"}}>
                    {t.nx3t}
                  </span>
                </div>
              </div>
            </section>
            <section aria-labelledby="fam">
              <div style={{textAlign:"center",maxWidth:"760px",margin:"0 auto"}}>
                <span style={{color:"#8A5A00",fontWeight:"700"}}>
                  {t.famEyebrow}
                </span>
                <h2 id="fam" className="ep" style={{margin:"6px 0 0",fontSize:"36px",fontWeight:"700"}}>
                  {t.famTitle}
                </h2>
                <p style={{margin:"8px 0 0",fontSize:"17px",color:"#555D74"}}>
                  {t.famSub}
                </p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:"24px",marginTop:"26px"}}>
                <article className="arch rise" style={{animationDelay:"0.12s"}}>
                  <div className="arch-top" aria-hidden="true">
                    <span className="halo" style={{width:"170px",height:"170px",left:"50%",top:"50%",margin:"-85px 0 0 -85px"}}>
                    </span>
                    <span className="halo" style={{width:"230px",height:"230px",left:"50%",top:"50%",margin:"-115px 0 0 -115px",animationDirection:"reverse",animationDuration:"70s",borderStyle:"dotted"}}>
                    </span>
                    <svg className="spk" width="14" height="14" viewBox="0 0 26 26" aria-hidden="true" style={{left:"22%",top:"30%"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <svg className="spk" width="10" height="10" viewBox="0 0 26 26" aria-hidden="true" style={{right:"24%",top:"24%",animationDelay:"-1.2s"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <svg className="spk" width="12" height="12" viewBox="0 0 26 26" aria-hidden="true" style={{right:"18%",bottom:"22%",animationDelay:"-2s"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <span className="famico">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 2v3" />
                        <path d="M8 9l4-4 4 4" />
                        <path d="M6 13l6-4 6 4" />
                        <path d="M5 13h14v8H5z" />
                        <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
                      </svg>
                    </span>
                  </div>
                  <div style={{padding:"18px 16px 14px",display:"flex",flexDirection:"column",flex:"1",textAlign:"center"}}>
                    <h3 className="ep" style={{margin:"0",fontSize:"24px",fontWeight:"700"}}>
                      {t.fm1}
                    </h3>
                    <p style={{margin:"4px 0 0",fontSize:"15.5px",fontWeight:"700",color:"#A3410B"}}>
                      {t.fm1t}
                    </p>
                    <p style={{margin:"10px 0 16px",fontSize:"15px",lineHeight:"1.6",color:"#555D74"}}>
                      {t.fm1u}
                    </p>
                    <A href="https://shrimahakaldham.com/temple" target="_blank" rel="noopener noreferrer" className="btn b-navy tap" style={{marginTop:"auto",height:"48px",fontSize:"15px",alignSelf:"stretch"}}>
                      {t.visit} {t.fm1}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                    </A>
                  </div>
                </article>
                <article className="arch rise" style={{animationDelay:"0.24s"}}>
                  <div className="arch-top" aria-hidden="true">
                    <span className="halo" style={{width:"170px",height:"170px",left:"50%",top:"50%",margin:"-85px 0 0 -85px"}}>
                    </span>
                    <span className="halo" style={{width:"230px",height:"230px",left:"50%",top:"50%",margin:"-115px 0 0 -115px",animationDirection:"reverse",animationDuration:"70s",borderStyle:"dotted"}}>
                    </span>
                    <svg className="spk" width="14" height="14" viewBox="0 0 26 26" aria-hidden="true" style={{left:"22%",top:"30%"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <svg className="spk" width="10" height="10" viewBox="0 0 26 26" aria-hidden="true" style={{right:"24%",top:"24%",animationDelay:"-1.2s"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <svg className="spk" width="12" height="12" viewBox="0 0 26 26" aria-hidden="true" style={{right:"18%",bottom:"22%",animationDelay:"-2s"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <span className="famico">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M6 3h12l3 6-9 12L3 9z" />
                        <path d="M3 9h18M9 3l3 6 3-6M12 9v12" />
                      </svg>
                    </span>
                  </div>
                  <div style={{padding:"18px 16px 14px",display:"flex",flexDirection:"column",flex:"1",textAlign:"center"}}>
                    <h3 className="ep" style={{margin:"0",fontSize:"24px",fontWeight:"700"}}>
                      {t.fm2}
                    </h3>
                    <p style={{margin:"4px 0 0",fontSize:"15.5px",fontWeight:"700",color:"#8A5A00"}}>
                      {t.fm2t}
                    </p>
                    <p style={{margin:"10px 0 16px",fontSize:"15px",lineHeight:"1.6",color:"#555D74"}}>
                      {t.fm2u}
                    </p>
                    <A href="https://astrogems.astroshrine.in/" target="_blank" rel="noopener noreferrer" className="btn b-navy tap" style={{marginTop:"auto",height:"48px",fontSize:"15px",alignSelf:"stretch"}}>
                      {t.visit} {t.fm2}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                    </A>
                  </div>
                </article>
                <article className="arch rise" style={{animationDelay:"0.36s"}}>
                  <div className="arch-top" aria-hidden="true">
                    <span className="halo" style={{width:"170px",height:"170px",left:"50%",top:"50%",margin:"-85px 0 0 -85px"}}>
                    </span>
                    <span className="halo" style={{width:"230px",height:"230px",left:"50%",top:"50%",margin:"-115px 0 0 -115px",animationDirection:"reverse",animationDuration:"70s",borderStyle:"dotted"}}>
                    </span>
                    <svg className="spk" width="14" height="14" viewBox="0 0 26 26" aria-hidden="true" style={{left:"22%",top:"30%"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <svg className="spk" width="10" height="10" viewBox="0 0 26 26" aria-hidden="true" style={{right:"24%",top:"24%",animationDelay:"-1.2s"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <svg className="spk" width="12" height="12" viewBox="0 0 26 26" aria-hidden="true" style={{right:"18%",bottom:"22%",animationDelay:"-2s"}}>
                      <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
                    </svg>
                    <span className="famico">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
                        <path d="M4 19V5" />
                        <path d="M9 7h6" />
                      </svg>
                    </span>
                  </div>
                  <div style={{padding:"18px 16px 14px",display:"flex",flexDirection:"column",flex:"1",textAlign:"center"}}>
                    <h3 className="ep" style={{margin:"0",fontSize:"24px",fontWeight:"700"}}>
                      {t.fm3}
                    </h3>
                    <p style={{margin:"4px 0 0",fontSize:"15.5px",fontWeight:"700",color:"#1F6F3A"}}>
                      {t.fm3t}
                    </p>
                    <p style={{margin:"10px 0 16px",fontSize:"15px",lineHeight:"1.6",color:"#555D74"}}>
                      {t.fm3u}
                    </p>
                    <A href="https://futureforyou.co/" target="_blank" rel="noopener noreferrer" className="btn b-navy tap" style={{marginTop:"auto",height:"48px",fontSize:"15px",alignSelf:"stretch"}}>
                      {t.visit} {t.fm3}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                    </A>
                  </div>
                </article>
              </div>
            </section>
            <section aria-labelledby="app" className="rise" style={{position:"relative",overflow:"hidden",borderRadius:"32px",padding:"44px 48px",background:"linear-gradient(135deg,#14213D 0%,#1D2D52 60%,#2A3B66 100%)",color:"#FBF6EC",display:"grid",gridTemplateColumns:"minmax(0,1fr) 520px",gap:"30px",alignItems:"center"}}>
              <span aria-hidden="true" className="halo" style={{width:"620px",height:"620px",left:"-260px",bottom:"-360px",borderColor:"rgba(255,174,0,.28)"}}>
              </span>
              <div style={{position:"relative",minWidth:"0"}}>
                <div style={{display:"flex",alignItems:"center",gap:"20px",flexWrap:"wrap"}}>
                  <span className="appicon" role="img" aria-label="AstroShrine app icon">
                    <Image src="/logo.png" alt="" width="88" height="88" style={{width:"88px",height:"88px",display:"block",flex:"none"}} />
                  </span>
                  <div>
                    <span style={{color:"#FFAE00",fontWeight:"700",fontSize:"15px"}}>
                      {t.appEyebrow}
                    </span>
                    <h2 id="app" className="ep" style={{margin:"4px 0 0",fontSize:"38px",fontWeight:"700",lineHeight:"1.1"}}>
                      {t.appTitle}
                    </h2>
                  </div>
                </div>
                <p style={{margin:"18px 0 0",fontSize:"17px",lineHeight:"1.65",color:"#E7E9F0",maxWidth:"540px"}}>
                  {t.appText}
                </p>
                <ul style={{listStyle:"none",margin:"18px 0 0",padding:"0",display:"flex",flexDirection:"column",gap:"12px",fontWeight:"700",fontSize:"16px"}}>
                  <li style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <span style={{width:"36px",height:"36px",borderRadius:"11px",background:"rgba(255,174,0,.12)",border:"1px solid rgba(255,174,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                      </svg>
                    </span>
                    {t.ap1}
                  </li>
                  <li style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <span style={{width:"36px",height:"36px",borderRadius:"11px",background:"rgba(255,174,0,.12)",border:"1px solid rgba(255,174,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <rect x="3" y="3" width="18" height="18" rx="1.5" />
                        <path d="M3 3l18 18M21 3 3 21" />
                        <path d="M12 3l9 9-9 9-9-9z" />
                      </svg>
                    </span>
                    {t.ap2}
                  </li>
                  <li style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <span style={{width:"36px",height:"36px",borderRadius:"11px",background:"rgba(255,174,0,.12)",border:"1px solid rgba(255,174,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
                      </svg>
                    </span>
                    {t.ap3}
                  </li>
                </ul>
                <A href="https://play.google.com/store/apps/details?id=com.astroshrine" target="_blank" rel="noopener noreferrer" className="bigcta tap" style={{marginTop:"26px"}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <path d="M12 3v12" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M4 21h16" />
                  </svg>
                  {t.appBtn}
                </A>
                <p style={{margin:"10px 0 0",fontSize:"14px",color:"#AEB4C6"}}>
                  {t.appNote}
                </p>
              </div>
              <div style={{position:"relative",display:"flex",justifyContent:"center"}}>
                <div style={{position:"relative"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"14px",flex:"none"}}>
                    <span className="pill" style={{background:"#14213D",color:"#FFAE00"}}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {t.phoneTag}
                    </span>
                    <div className="phone bob" role="img" aria-label={t.phoneAlt}>
                      <div className="pscreen" aria-hidden="true">
                        <div style={{background:"#14213D",color:"#FBF6EC",padding:"10px 18px 0",display:"flex",justifyContent:"space-between",fontSize:"11.5px",fontWeight:"700"}}>
                          <span>
                            9:41
                          </span>
                          <span style={{width:"84px",height:"20px",borderRadius:"12px",background:"#0B1224",marginTop:"-4px"}}>
                          </span>
                          <span>
                            86%
                          </span>
                        </div>
                        <div style={{background:"#14213D",color:"#FBF6EC",padding:"10px 12px 12px",display:"flex",alignItems:"center",gap:"10px"}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBF6EC" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                          <span style={{width:"36px",height:"36px",borderRadius:"50%",border:"2px solid #FFAE00",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:"800",color:"#FFAE00",position:"relative",flex:"none"}}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
                            <span style={{position:"absolute",right:"-1px",bottom:"-1px",width:"10px",height:"10px",borderRadius:"50%",background:"#1F8A4C",border:"2px solid #14213D"}}>
                            </span>
                          </span>
                          <span style={{flex:"1",minWidth:"0",lineHeight:"1.2"}}>
                            <b style={{display:"block",fontSize:"13.5px"}}>
                              {t.pName}
                            </b>
                            <span style={{fontSize:"10.5px",fontWeight:"700",color:"#9FE0B5"}}>
                              {t.pFree}
                            </span>
                          </span>
                          <span style={{background:"rgba(255,174,0,.16)",color:"#FFE29A",borderRadius:"999px",padding:"3px 8px",fontSize:"11px",fontWeight:"800"}}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFE29A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 7v5l3 2" />
                            </svg>
                            {" "}{t.pTimer}
                          </span>
                        </div>
                        <div style={{flex:"1",minHeight:"0",padding:"10px 10px 6px",display:"flex",flexDirection:"column",gap:"7px",background:"#F3EBDD radial-gradient(circle,rgba(138,90,0,.10) 1px,transparent 1.2px) 0 0/14px 14px",overflow:"hidden"}}>
                          <div className="bin" style={{alignSelf:"center",fontSize:"11px",fontWeight:"700",borderRadius:"999px",padding:"4px 10px",background:"#FFFFFF",color:"#555D74",animationDelay:"0.1s"}}>
                            {t.today}
                          </div>
                          <div className="bin" style={{alignSelf:"center",fontSize:"11px",fontWeight:"700",borderRadius:"999px",padding:"4px 10px",background:"#EAF6EE",color:"#1F6F3A",animationDelay:"0.3s"}}>
                            {t.psys1}
                          </div>
                          <div className="bub bin" style={{alignSelf:"flex-start",background:"#FFFFFF",borderRadius:"12px 12px 12px 3px",animationDelay:"0.6s"}}>
                            {t.pc1}
                            <small>
                              9:38
                            </small>
                          </div>
                          <div className="bub bin" style={{alignSelf:"flex-end",background:"#FFE29A",borderRadius:"12px 12px 3px 12px",animationDelay:"1.1s"}}>
                            {t.pa1}
                            <small>
                              9:39{" "}
                              <span style={{color:"#1F8A4C",fontWeight:"700"}}>
                                ✓✓
                              </span>
                            </small>
                          </div>
                          <div className="bub bin" style={{alignSelf:"flex-start",background:"#FFFFFF",borderRadius:"12px 12px 12px 3px",animationDelay:"1.6s"}}>
                            {t.pc2}
                            <small>
                              9:40
                            </small>
                          </div>
                          <div className="bin" style={{alignSelf:"center",fontSize:"11px",fontWeight:"700",borderRadius:"999px",padding:"4px 10px",background:"#FFFFFF",color:"#555D74",animationDelay:"2.0s"}}>
                            {t.psys2}
                          </div>
                          <div className="bub bin" style={{alignSelf:"flex-end",background:"#FFE29A",borderRadius:"12px 12px 3px 12px",animationDelay:"2.4s"}}>
                            {t.pa2}
                            <small>
                              9:41{" "}
                              <span style={{color:"#1F8A4C",fontWeight:"700"}}>
                                ✓✓
                              </span>
                            </small>
                          </div>
                          <div className="bin" style={{alignSelf:"flex-start",background:"#FFFFFF",borderRadius:"12px",padding:"8px 10px",display:"flex",gap:"4px",animationDelay:"2.9s"}}>
                            <span className="tdot">
                            </span>
                            <span className="tdot" style={{animationDelay:".15s"}}>
                            </span>
                            <span className="tdot" style={{animationDelay:".3s"}}>
                            </span>
                          </div>
                        </div>
                        <div style={{padding:"8px 10px 14px",display:"flex",gap:"8px",alignItems:"center",background:"#F3EBDD"}}>
                          <span style={{flex:"1",height:"38px",borderRadius:"999px",background:"#FFFFFF",display:"flex",alignItems:"center",padding:"0 14px",fontSize:"12.5px",color:"#8E93A6"}}>
                            {t.reply}
                          </span>
                          <span style={{width:"38px",height:"38px",borderRadius:"50%",background:"#FFAE00",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                              <path d="M22 2 11 13" />
                              <path d="M22 2 15 22l-4-9-9-4z" />
                            </svg>
                          </span>
                        </div>
                        <div style={{height:"4px",width:"110px",borderRadius:"2px",background:"#14213D",opacity:".5",margin:"0 auto 8px"}}>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div aria-hidden="true" className="toast bob" style={{left:"-120px",top:"110px"}}>
                    <span className="ico" style={{width:"38px",height:"38px",boxShadow:"none"}}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                      </svg>
                    </span>
                    <span>
                      <b style={{display:"block",fontSize:"14px"}}>
                        {t.toast1}
                      </b>
                      <span style={{fontSize:"12.5px",color:"#555D74"}}>
                        {t.reqName}
                      </span>
                    </span>
                  </div>
                  <div aria-hidden="true" className="toast bob" style={{right:"-110px",top:"290px",animationDelay:"-1.4s"}}>
                    <span className="ico" style={{width:"38px",height:"38px",background:"#FFAE00",boxShadow:"none"}}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <rect x="3" y="3" width="18" height="18" rx="1.5" />
                        <path d="M3 3l18 18M21 3 3 21" />
                        <path d="M12 3l9 9-9 9-9-9z" />
                      </svg>
                    </span>
                    <b style={{fontSize:"14px"}}>
                      {t.toast2}
                    </b>
                  </div>
                  <div aria-hidden="true" className="toast bob" style={{left:"-120px",bottom:"150px",animationDelay:"-2.2s"}}>
                    <span className="ico" style={{width:"38px",height:"38px",background:"#1F6F3A",boxShadow:"none"}}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
                        <path d="M3 5v14a2 2 0 0 0 2 2h15V7" />
                        <circle cx="16" cy="14" r="1.5" />
                      </svg>
                    </span>
                    <span>
                      <b style={{display:"block",fontSize:"14px"}}>
                        {t.toast3}
                      </b>
                      <span style={{fontSize:"12.5px",color:"#1F6F3A",fontWeight:"700"}}>
                        {t.toastNote}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </section>
            <section aria-labelledby="hj" className="card rise" style={{padding:"32px 34px"}}>
              <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:"12px"}}>
                <div style={{display:"flex",alignItems:"baseline",gap:"12px",flexWrap:"wrap"}}>
                  <span style={{color:"#8A5A00",fontWeight:"700"}}>
                    {t.hjEyebrow}
                  </span>
                  <h2 id="hj" className="ep" style={{margin:"0",fontSize:"30px",fontWeight:"700"}}>
                    {t.hjTitle}
                  </h2>
                </div>
                <A href="/astrologer/join" className="btn b-line tap" style={{height:"48px"}}>
                  {t.hjBtn}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </A>
              </div>
              <ol className="jsteps">
                <span aria-hidden="true" className="jline">
                </span>
                <span aria-hidden="true" className="jdot">
                </span>
                <li className="rise" style={{position:"relative",textAlign:"center",animationDelay:"0.12s"}}>
                  <span className="jnum ep">
                    1
                  </span>
                  <b className="ep" style={{display:"block",marginTop:"14px",fontSize:"18px"}}>
                    {t.hj1}
                  </b>
                  <span style={{display:"block",marginTop:"4px",fontSize:"14.5px",lineHeight:"1.5",color:"#555D74"}}>
                    {t.hjt1}
                  </span>
                </li>
                <li className="rise" style={{position:"relative",textAlign:"center",animationDelay:"0.24s"}}>
                  <span className="jnum ep">
                    2
                  </span>
                  <b className="ep" style={{display:"block",marginTop:"14px",fontSize:"18px"}}>
                    {t.hj2}
                  </b>
                  <span style={{display:"block",marginTop:"4px",fontSize:"14.5px",lineHeight:"1.5",color:"#555D74"}}>
                    {t.hjt2}
                  </span>
                </li>
                <li className="rise" style={{position:"relative",textAlign:"center",animationDelay:"0.36s"}}>
                  <span className="jnum ep">
                    3
                  </span>
                  <b className="ep" style={{display:"block",marginTop:"14px",fontSize:"18px"}}>
                    {t.hj3}
                  </b>
                  <span style={{display:"block",marginTop:"4px",fontSize:"14.5px",lineHeight:"1.5",color:"#555D74"}}>
                    {t.hjt3}
                  </span>
                </li>
                <li className="rise" style={{position:"relative",textAlign:"center",animationDelay:"0.48s"}}>
                  <span className="jnum ep">
                    4
                  </span>
                  <b className="ep" style={{display:"block",marginTop:"14px",fontSize:"18px"}}>
                    {t.hj4}
                  </b>
                  <span style={{display:"block",marginTop:"4px",fontSize:"14.5px",lineHeight:"1.5",color:"#555D74"}}>
                    {t.hjt4}
                  </span>
                </li>
              </ol>
            </section>
            <section aria-labelledby="faq" className="faqgrid">
              <div style={{position:"relative",padding:"8px 4px"}}>
                <span style={{color:"#8A5A00",fontWeight:"700"}}>
                  {t.faqEyebrow}
                </span>
                <h2 id="faq" className="ep" style={{margin:"6px 0 0",fontSize:"34px",fontWeight:"700",lineHeight:"1.15"}}>
                  {t.faqTitle}
                </h2>
                <p style={{margin:"12px 0 0",fontSize:"16.5px",lineHeight:"1.6",color:"#555D74"}}>
                  {t.faqSide}
                </p>
                <A href="/astrologer/help" className="btn b-navy tap" style={{marginTop:"18px",height:"50px"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFAE00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.6 2.6 0 0 1 5 1c0 1.7-2.5 2.2-2.5 3.6" />
                    <path d="M12 17h.01" />
                  </svg>
                  {t.faqBtn}
                </A>
              </div>
              <div className="card" style={{padding:"10px 26px 12px"}}>
                <div style={{borderTop:"1px solid #EBDFC6"}}>
                  <button type="button" className="tap" onClick={fq1.go} aria-expanded={fq1.open} style={{width:"100%",display:"flex",alignItems:"center",gap:"12px",padding:"16px 4px",textAlign:"left",fontSize:"17px",fontWeight:"700",color:"#14213D"}}>
                    <span style={{flex:"1"}}>
                      {t.q1}
                    </span>
                    <span aria-hidden="true" style={css(`width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;transition:transform .3s,background .3s;${fq1.icon}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {(fq1.open) && (<>
                    <p className="rise" style={{margin:"0",padding:"0 48px 18px 4px",fontSize:"16px",lineHeight:"1.65",color:"#555D74",animationDuration:".4s"}}>
                      {t.a1}
                    </p>
                  </>)}
                </div>
                <div style={{borderTop:"1px solid #EBDFC6"}}>
                  <button type="button" className="tap" onClick={fq2.go} aria-expanded={fq2.open} style={{width:"100%",display:"flex",alignItems:"center",gap:"12px",padding:"16px 4px",textAlign:"left",fontSize:"17px",fontWeight:"700",color:"#14213D"}}>
                    <span style={{flex:"1"}}>
                      {t.q2}
                    </span>
                    <span aria-hidden="true" style={css(`width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;transition:transform .3s,background .3s;${fq2.icon}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {(fq2.open) && (<>
                    <p className="rise" style={{margin:"0",padding:"0 48px 18px 4px",fontSize:"16px",lineHeight:"1.65",color:"#555D74",animationDuration:".4s"}}>
                      {t.a2}
                    </p>
                  </>)}
                </div>
                <div style={{borderTop:"1px solid #EBDFC6"}}>
                  <button type="button" className="tap" onClick={fq3.go} aria-expanded={fq3.open} style={{width:"100%",display:"flex",alignItems:"center",gap:"12px",padding:"16px 4px",textAlign:"left",fontSize:"17px",fontWeight:"700",color:"#14213D"}}>
                    <span style={{flex:"1"}}>
                      {t.q3}
                    </span>
                    <span aria-hidden="true" style={css(`width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;transition:transform .3s,background .3s;${fq3.icon}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {(fq3.open) && (<>
                    <p className="rise" style={{margin:"0",padding:"0 48px 18px 4px",fontSize:"16px",lineHeight:"1.65",color:"#555D74",animationDuration:".4s"}}>
                      {t.a3}
                    </p>
                  </>)}
                </div>
                <div style={{borderTop:"1px solid #EBDFC6"}}>
                  <button type="button" className="tap" onClick={fq4.go} aria-expanded={fq4.open} style={{width:"100%",display:"flex",alignItems:"center",gap:"12px",padding:"16px 4px",textAlign:"left",fontSize:"17px",fontWeight:"700",color:"#14213D"}}>
                    <span style={{flex:"1"}}>
                      {t.q4}
                    </span>
                    <span aria-hidden="true" style={css(`width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;transition:transform .3s,background .3s;${fq4.icon}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {(fq4.open) && (<>
                    <p className="rise" style={{margin:"0",padding:"0 48px 18px 4px",fontSize:"16px",lineHeight:"1.65",color:"#555D74",animationDuration:".4s"}}>
                      {t.a4}
                    </p>
                  </>)}
                </div>
                <div style={{borderTop:"1px solid #EBDFC6"}}>
                  <button type="button" className="tap" onClick={fq5.go} aria-expanded={fq5.open} style={{width:"100%",display:"flex",alignItems:"center",gap:"12px",padding:"16px 4px",textAlign:"left",fontSize:"17px",fontWeight:"700",color:"#14213D"}}>
                    <span style={{flex:"1"}}>
                      {t.q5}
                    </span>
                    <span aria-hidden="true" style={css(`width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;transition:transform .3s,background .3s;${fq5.icon}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {(fq5.open) && (<>
                    <p className="rise" style={{margin:"0",padding:"0 48px 18px 4px",fontSize:"16px",lineHeight:"1.65",color:"#555D74",animationDuration:".4s"}}>
                      {t.a5}
                    </p>
                  </>)}
                </div>
                <div style={{borderTop:"1px solid #EBDFC6"}}>
                  <button type="button" className="tap" onClick={fq6.go} aria-expanded={fq6.open} style={{width:"100%",display:"flex",alignItems:"center",gap:"12px",padding:"16px 4px",textAlign:"left",fontSize:"17px",fontWeight:"700",color:"#14213D"}}>
                    <span style={{flex:"1"}}>
                      {t.q6}
                    </span>
                    <span aria-hidden="true" style={css(`width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;transition:transform .3s,background .3s;${fq6.icon}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {(fq6.open) && (<>
                    <p className="rise" style={{margin:"0",padding:"0 48px 18px 4px",fontSize:"16px",lineHeight:"1.65",color:"#555D74",animationDuration:".4s"}}>
                      {t.a6}
                    </p>
                  </>)}
                </div>
              </div>
            </section>
            <section aria-labelledby="rd" className="rise" style={{position:"relative",overflow:"hidden",borderRadius:"32px",padding:"40px 44px",background:"radial-gradient(120% 140% at 100% 0%,#2A3B66,#14213D 60%)",color:"#FBF6EC",display:"flex",flexWrap:"wrap",gap:"20px 30px",alignItems:"center",justifyContent:"space-between"}}>
              <span aria-hidden="true" className="halo" style={{width:"360px",height:"360px",right:"-100px",top:"-170px"}}>
              </span>
              <span aria-hidden="true" className="halo" style={{width:"240px",height:"240px",right:"-40px",top:"-110px",animationDirection:"reverse",borderStyle:"dotted"}}>
              </span>
              <div style={{position:"relative",flex:"1 1 380px",minWidth:"0",display:"flex",alignItems:"center",gap:"20px"}}>
                <Image src="/logo.png" alt="" width="64" height="64" style={{width:"64px",height:"64px",display:"block",flex:"none"}} />
                <div>
                  <h2 id="rd" className="ep" style={{margin:"0",fontSize:"34px",fontWeight:"700"}}>
                    {t.readyTitle}
                  </h2>
                  <p style={{margin:"6px 0 0",color:"#E7E9F0",fontSize:"16.5px"}}>
                    {t.readySub}
                  </p>
                </div>
              </div>
              <A href="/astrologer/login" className="bigcta tap" style={{position:"relative"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                {t.ctaSign}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flex:"none"}}>
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </A>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

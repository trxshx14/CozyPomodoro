import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Plus, Trash2, Flower2, Coffee, Moon, Sparkles, Wind, X, Settings } from "lucide-react";

/* ============================================================
   COZY POMODORO v3 — Settings Drawer
   New:
   • ⚙️ Sliding pastel settings drawer (gear icon)
   • ⏱ Custom timer durations
   • 👗 Wardrobe: Glasses / Cozy Hat / Pink Bow
   • ☕ Cafe Menu: tea flavor selector + ambient sound sliders
   • 📖 About: tiny diary entry credits
   ============================================================ */

const DEFAULT_DURATIONS = { focus: 25, short: 5, long: 15 }; // minutes

const TEA_FLAVORS = {
  strawberry: {
    name: "Strawberry",
    emoji: "🍓",
    gradient: "linear-gradient(to top, #F7B8CC 0%, #F9C9D9 55%, #FBDCE7 100%)",
    pearlColor: "radial-gradient(circle at 32% 28%, #7A5240, #4A3328)",
    milkLine: "rgba(255,255,255,0.7)",
  },
  matcha: {
    name: "Matcha",
    emoji: "🍵",
    gradient: "linear-gradient(to top, #5BAF7D 0%, #84C9A0 55%, #BADECC 100%)",
    pearlColor: "radial-gradient(circle at 32% 28%, #2E5E38, #1C3D24)",
    milkLine: "rgba(255,255,255,0.6)",
  },
  taro: {
    name: "Taro",
    emoji: "🫐",
    gradient: "linear-gradient(to top, #9B7BC4 0%, #B99DE0 55%, #D8CCEF 100%)",
    pearlColor: "radial-gradient(circle at 32% 28%, #5A3B7A, #3D2B55)",
    milkLine: "rgba(255,255,255,0.65)",
  },
};

const THEMES = {
  focus: {
    label: "Focus", icon: Flower2,
    container: "#FFF0F2", text: "#4A3E3D", soft: "#FFE0E6", border: "#F9D5DC",
    bar: "#F4A7B9", sky: "#FFE6EC", skyDeep: "#FFD3DE", ground: "#F3C2CE",
    groundDeep: "#EBADBD", chip: "#FFDFD3", particle: "🌸",
  },
  short: {
    label: "Short Break", icon: Coffee,
    container: "#E8F7F4", text: "#2D423E", soft: "#D6F0EA", border: "#C8E8E0",
    bar: "#7FC8B8", sky: "#DDF3EE", skyDeep: "#C9EBE3", ground: "#A8DCCB",
    groundDeep: "#92CFBC", chip: "#FFF2CC", particle: "🍃",
  },
  long: {
    label: "Long Break", icon: Moon,
    container: "#F0EBF7", text: "#3B2D42", soft: "#E4DBF1", border: "#D9CCEB",
    bar: "#B49AD6", sky: "#E9E1F5", skyDeep: "#DCD0EE", ground: "#C5B3E0",
    groundDeep: "#B49FD6", chip: "#FFDFD3", particle: "⭐",
  },
};

const FONT_STACK = 'ui-rounded,"Hiragino Maru Gothic ProN","Quicksand","Varela Round","Comfortaa","Nunito","Segoe UI",system-ui,sans-serif';

function getDayPhase(hour) {
  if (hour >= 5 && hour < 9) return "sunrise";
  if (hour >= 9 && hour < 17) return "midday";
  if (hour >= 17 && hour < 20) return "twilight";
  return "night";
}

const WINDOW_PHASES = {
  sunrise: { skyTop: "#FFD3B8", skyMid: "#FFE4CA", skyBottom: "#FFF1DC", hillsBack: "#EDB6C4", hillsFront: "#E09FB2", greeting: "good morning", emoji: "🌅" },
  midday:  { skyTop: "#B5DFF5", skyMid: "#CFEBFA", skyBottom: "#E8F6FE", hillsBack: "#B6DFC0", hillsFront: "#9CD3AC", greeting: "hello, sunshine", emoji: "🌼" },
  twilight:{ skyTop: "#B79BD3", skyMid: "#E0AFC3", skyBottom: "#FFD0B5", hillsBack: "#8E72A8", hillsFront: "#76598F", greeting: "golden hour", emoji: "🌇" },
  night:   { skyTop: "#2C2950", skyMid: "#3D3868", skyBottom: "#534B85", hillsBack: "#2A2647", hillsFront: "#211D3A", greeting: "cozy night", emoji: "🌙", stars: true },
};

const STAR_FIELD = [
  {left:"12%",top:"14%",d:"0s",s:3},{left:"26%",top:"30%",d:"0.8s",s:2},{left:"38%",top:"10%",d:"1.6s",s:2.5},
  {left:"52%",top:"24%",d:"0.4s",s:3},{left:"64%",top:"12%",d:"2.1s",s:2},{left:"78%",top:"28%",d:"1.2s",s:2.5},
  {left:"88%",top:"16%",d:"0.6s",s:2},{left:"18%",top:"44%",d:"1.9s",s:2},{left:"70%",top:"42%",d:"0.2s",s:2.5},
  {left:"44%",top:"38%",d:"1.4s",s:2},
];

function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = freq;
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.start(t); osc.stop(t + 1.5);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch (e) {}
}

/* ============================================================
   DeskCompanion — now accepts `accessory` prop
   ============================================================ */
function DeskCompanion({ state, theme, accessory }) {
  const fur = "#F6CDB8", furDark = "#EBB79D", inner = "#F9A8C0";
  const dark = theme.text, blush = "#F8A8B8";
  const wood = "#C9A075", woodDark = "#B08A5F";

  return (
    <div className="relative flex items-end justify-center" style={{ height: 132, width: 210 }}>
      {state === "napping" && (
        <div className="absolute pointer-events-none" style={{ top: 4, right: "26%" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="absolute font-bold select-none" style={{ color: dark, opacity: 0.55, fontSize: 12 + i * 4, right: i * 14, animation: `zFloat 2.6s ease-in-out ${i * 0.7}s infinite` }}>z</span>
          ))}
        </div>
      )}
      {state === "napping" && (
        <>{[{left:"10%",delay:"0s",drift:"14px"},{left:"32%",delay:"1.6s",drift:"-12px"},{left:"62%",delay:"0.8s",drift:"10px"},{left:"80%",delay:"2.4s",drift:"-16px"}].map((p,i)=>(
          <div key={i} className="absolute pointer-events-none" style={{ left:p.left, top:-6, width:13, height:16, background:"#FFFDF8", border:"1px solid rgba(74,62,61,0.2)", borderRadius:2, ["--drift"]:p.drift, animation:`paperFloat 5.5s ease-in ${p.delay} infinite` }}>
            <div style={{margin:"3px 2px 0",height:1.5,background:"rgba(74,62,61,0.25)"}}/>
            <div style={{margin:"2px 2px 0",height:1.5,background:"rgba(74,62,61,0.18)",width:"70%"}}/>
            <div style={{margin:"2px 2px 0",height:1.5,background:"rgba(74,62,61,0.18)",width:"50%"}}/>
          </div>
        ))}</>
      )}
      {state === "drinking" && (
        <>{[{left:"16%",top:4,delay:"0s",size:18},{left:"74%",top:0,delay:"0.4s",size:22},{left:"62%",top:32,delay:"0.9s",size:14},{left:"28%",top:36,delay:"1.3s",size:15},{left:"46%",top:-4,delay:"0.6s",size:16}].map((s,i)=>(
          <span key={i} className="absolute select-none pointer-events-none" style={{ left:s.left, top:s.top, fontSize:s.size, animation:`sparkleTwinkle 1.8s ease-in-out ${s.delay} infinite` }}>✨</span>
        ))}</>
      )}

      {/* ── STUDYING ── */}
      {state === "studying" && (
        <svg viewBox="0 0 26 17" width="200" height="131" style={{ shapeRendering: "crispEdges" }} aria-label="A focused pixel cat at a tiny wooden desk" role="img">
          <g style={{ animation: "studyBob 3.4s ease-in-out infinite" }}>
            {/* ears */}
            <rect x="7.5" y="0.5" width="2" height="2" fill={furDark}/>
            <rect x="15.5" y="0.5" width="2" height="2" fill={furDark}/>
            <rect x="8" y="1.1" width="1" height="1" fill={inner}/>
            <rect x="16" y="1.1" width="1" height="1" fill={inner}/>

            {/* ── COZY HAT ── */}
            {accessory === "hat" && (
              <>
                <rect x="6" y="1.8" width="14" height="1.1" rx="0.4" fill="#D490B0"/>
                <rect x="8" y="0.1" width="10" height="2" rx="0.5" fill="#E2A4C4"/>
                <circle cx="13" cy="0.4" r="1" fill="white" opacity="0.9"/>
                <rect x="8.5" y="1" width="9" height="0.4" rx="0.2" fill="#D490B0" opacity="0.5"/>
              </>
            )}
            {/* ── PINK BOW ── */}
            {accessory === "bow" && (
              <>
                <ellipse cx="10.2" cy="1.2" rx="2.3" ry="1.3" fill="#F4A7B9"/>
                <ellipse cx="15.8" cy="1.2" rx="2.3" ry="1.3" fill="#F4A7B9"/>
                <ellipse cx="10.2" cy="1.2" rx="1.2" ry="0.7" fill="#FBCEDA" opacity="0.6"/>
                <ellipse cx="15.8" cy="1.2" rx="1.2" ry="0.7" fill="#FBCEDA" opacity="0.6"/>
                <circle cx="13" cy="1.2" r="1.1" fill="#E2A4C4"/>
                <circle cx="13" cy="1.2" r="0.45" fill="#D490B0"/>
              </>
            )}

            {/* head */}
            <rect x="6.5" y="2.5" width="12" height="6" fill={fur}/>

            {/* ── GLASSES (default) ── */}
            {accessory === "glasses" && (
              <>
                <rect x="9" y="4.2" width="2.4" height="2" fill="rgba(255,255,255,0.45)" stroke={dark} strokeWidth="0.4"/>
                <rect x="13.6" y="4.2" width="2.4" height="2" fill="rgba(255,255,255,0.45)" stroke={dark} strokeWidth="0.4"/>
                <rect x="11.4" y="5" width="2.2" height="0.45" fill={dark}/>
                <rect x="6.5" y="5" width="2.5" height="0.45" fill={dark} opacity="0.6"/>
                <rect x="16" y="5" width="2.5" height="0.45" fill={dark} opacity="0.6"/>
                <rect x="9.8" y="4.9" width="0.9" height="1" fill={dark}/>
                <rect x="14.4" y="4.9" width="0.9" height="1" fill={dark}/>
              </>
            )}
            {/* Normal eyes for hat / bow */}
            {accessory !== "glasses" && (
              <>
                <rect x="9.8" y="5" width="0.9" height="1.1" rx="0.3" fill={dark}/>
                <rect x="14.4" y="5" width="0.9" height="1.1" rx="0.3" fill={dark}/>
                {/* tiny highlight */}
                <rect x="10.3" y="5.1" width="0.3" height="0.3" fill="rgba(255,255,255,0.7)"/>
                <rect x="14.9" y="5.1" width="0.3" height="0.3" fill="rgba(255,255,255,0.7)"/>
              </>
            )}
            <rect x="12.1" y="7.2" width="0.9" height="0.4" fill={dark} opacity="0.7"/>
            <rect x="7.6" y="6.4" width="1.2" height="0.7" fill={blush} opacity="0.8"/>
            <rect x="16.2" y="6.4" width="1.2" height="0.7" fill={blush} opacity="0.8"/>
            <rect x="7.5" y="8.5" width="10" height="3.5" fill={fur}/>
          </g>
          {/* writing paw */}
          <g style={{ animation: "pawWrite 1.1s ease-in-out infinite" }}>
            <rect x="13.6" y="10.2" width="1.8" height="1.2" fill={furDark}/>
            <rect x="14.6" y="9.3" width="0.6" height="1.4" fill="#E8B84A"/>
            <rect x="14.6" y="9" width="0.6" height="0.4" fill={dark}/>
          </g>
          <rect x="9.4" y="10.4" width="1.8" height="1" fill={furDark}/>
          <rect x="9" y="10.9" width="7" height="1.1" fill="#FFFDF8" stroke="rgba(74,62,61,0.25)" strokeWidth="0.25"/>
          <rect x="9.8" y="11.25" width="3.4" height="0.3" fill="rgba(74,62,61,0.3)"/>
          <rect x="9.8" y="11.75" width="2.2" height="0.3" fill="rgba(74,62,61,0.2)"/>
          <rect x="4.5" y="12" width="16.5" height="1.4" fill={wood}/>
          <rect x="4.5" y="13.1" width="16.5" height="0.4" fill={woodDark}/>
          <rect x="5.5" y="13.4" width="1.3" height="3.4" fill={woodDark}/>
          <rect x="18.6" y="13.4" width="1.3" height="3.4" fill={woodDark}/>
        </svg>
      )}

      {/* ── DRINKING ── */}
      {state === "drinking" && (
        <svg viewBox="0 0 22 15" width="190" height="129" style={{ shapeRendering:"crispEdges", animation:"happyBounce 1.6s ease-in-out infinite", transform:"rotate(4deg)" }} aria-label="A happy pixel cat reaching for its bubble tea" role="img">
          <rect x="4" y="1" width="2" height="2" fill={furDark}/><rect x="12" y="1" width="2" height="2" fill={furDark}/>
          <rect x="4.5" y="1.6" width="1" height="1" fill={inner}/><rect x="12.5" y="1.6" width="1" height="1" fill={inner}/>
          {accessory === "hat" && (
            <><rect x="3" y="2.6" width="13" height="0.9" rx="0.3" fill="#D490B0"/><rect x="5.5" y="0.4" width="9" height="2.4" rx="0.4" fill="#E2A4C4"/><circle cx="10" cy="0.5" r="0.9" fill="white" opacity="0.9"/></>
          )}
          {accessory === "bow" && (
            <><ellipse cx="7.8" cy="0.9" rx="2.1" ry="1.2" fill="#F4A7B9"/><ellipse cx="12.2" cy="0.9" rx="2.1" ry="1.2" fill="#F4A7B9"/><circle cx="10" cy="0.9" r="1" fill="#E2A4C4"/><circle cx="10" cy="0.9" r="0.4" fill="#D490B0"/></>
          )}
          <rect x="3" y="3" width="12" height="6" fill={fur}/>
          <rect x="5.6" y="5.2" width="0.6" height="0.5" fill={dark}/><rect x="6.2" y="4.8" width="0.6" height="0.5" fill={dark}/><rect x="6.8" y="5.2" width="0.6" height="0.5" fill={dark}/>
          <rect x="10.2" y="5.2" width="0.6" height="0.5" fill={dark}/><rect x="10.8" y="4.8" width="0.6" height="0.5" fill={dark}/><rect x="11.4" y="5.2" width="0.6" height="0.5" fill={dark}/>
          <rect x="8.3" y="6.6" width="1.4" height="1" fill={dark}/><rect x="8.6" y="7.1" width="0.8" height="0.5" fill={inner}/>
          <rect x="4.4" y="6.6" width="1.2" height="0.7" fill={blush} opacity="0.9"/><rect x="12.4" y="6.6" width="1.2" height="0.7" fill={blush} opacity="0.9"/>
          <rect x="2" y="8" width="16" height="5" fill={fur}/><rect x="2" y="12" width="16" height="1" fill={furDark}/>
          <rect x="17" y="8.6" width="3.6" height="1.4" fill={fur}/><rect x="20.2" y="8.4" width="1.4" height="1.8" fill={furDark}/>
          <rect x="4" y="11.4" width="2.4" height="1.2" fill={furDark}/>
          <rect x="0.6" y="7.4" width="1.2" height="3.4" fill={furDark}><animate attributeName="y" values="7.4;6.8;7.4" dur="0.9s" repeatCount="indefinite"/></rect>
          <rect x="1.4" y="6" width="1.4" height="0.35" fill={dark} opacity="0.45"/><rect x="15.2" y="6" width="1.4" height="0.35" fill={dark} opacity="0.45"/>
        </svg>
      )}

      {/* ── NAPPING ── */}
      {state === "napping" && (
        <svg viewBox="0 0 24 16" width="200" height="133" style={{ shapeRendering:"crispEdges", animation:"sleepBreathe 3.2s ease-in-out infinite" }} aria-label="A pixel cat napping on a plush pillow" role="img">
          <rect x="2" y="10.5" width="20" height="4.5" rx="1.6" fill={theme.soft}/>
          <rect x="3" y="11.2" width="18" height="0.5" rx="0.25" fill="rgba(255,255,255,0.7)"/>
          <rect x="2.6" y="14.2" width="18.8" height="0.6" rx="0.3" fill="rgba(74,62,61,0.12)"/>
          <rect x="1.4" y="10.2" width="1.2" height="1.2" fill={theme.soft}/><rect x="21.4" y="10.2" width="1.2" height="1.2" fill={theme.soft}/>
          <rect x="6" y="2.6" width="2" height="2" fill={furDark}/><rect x="14" y="2.6" width="2" height="2" fill={furDark}/>
          <rect x="6.5" y="3.2" width="1" height="1" fill={inner}/><rect x="14.5" y="3.2" width="1" height="1" fill={inner}/>
          {accessory === "hat" && (
            <><rect x="5" y="4.2" width="14" height="1" rx="0.4" fill="#D490B0"/><rect x="7.5" y="2.2" width="9" height="2.2" rx="0.5" fill="#E2A4C4"/><circle cx="12" cy="2.3" r="0.9" fill="white" opacity="0.9"/></>
          )}
          {accessory === "bow" && (
            <><ellipse cx="9.5" cy="3.2" rx="2.2" ry="1.2" fill="#F4A7B9"/><ellipse cx="14.5" cy="3.2" rx="2.2" ry="1.2" fill="#F4A7B9"/><circle cx="12" cy="3.2" r="1" fill="#E2A4C4"/><circle cx="12" cy="3.2" r="0.4" fill="#D490B0"/></>
          )}
          <rect x="5" y="4.5" width="12" height="6" fill={fur}/>
          <rect x="6.4" y="6" width="9.2" height="2" fill="#8E7BA8"/><rect x="5" y="6.6" width="1.4" height="0.5" fill="#6F5E8C"/><rect x="15.6" y="6.6" width="1.4" height="0.5" fill="#6F5E8C"/>
          <rect x="10.4" y="6.6" width="0.7" height="0.7" fill="#FFF2CC"/>
          <rect x="10.5" y="8.8" width="1" height="0.4" fill={dark} opacity="0.6"/>
          <rect x="6.4" y="8.3" width="1.2" height="0.7" fill={blush} opacity="0.8"/><rect x="14.4" y="8.3" width="1.2" height="0.7" fill={blush} opacity="0.8"/>
          <rect x="4" y="9.5" width="16" height="3" fill={fur}/><rect x="4" y="12" width="16" height="0.8" fill={furDark}/>
          <rect x="16.5" y="11.6" width="3.4" height="1" fill={furDark}/><rect x="18.9" y="10.6" width="1" height="1.6" fill={furDark}/>
          <rect x="8.6" y="11.6" width="2.2" height="1" fill={furDark}/><rect x="11.4" y="11.6" width="2.2" height="1" fill={furDark}/>
        </svg>
      )}
    </div>
  );
}

/* ============================================================
   BubbleTea — now accepts `flavor` prop
   ============================================================ */
function BubbleTea({ progress, finished, flavor = "strawberry" }) {
  const fl = TEA_FLAVORS[flavor];
  const fillPct = Math.min(Math.max(progress, 0), 1) * 100;
  const showPearls = progress >= 0.5 || finished;
  const pearls = [
    {left:"16%",delay:"0s"},{left:"36%",delay:"0.3s"},{left:"56%",delay:"0.6s"},
    {left:"26%",delay:"0.9s"},{left:"47%",delay:"1.2s"},{left:"66%",delay:"1.5s"},
  ];
  return (
    <div className="relative flex flex-col items-center" style={{ width: 64 }} aria-hidden="true">
      {finished && (
        <>
          <div className="absolute rounded-full" style={{ width:9, height:64, top:-34, left:"58%", background:"linear-gradient(to right, #C89F87, #B98D74)", transform:"rotate(9deg)", transformOrigin:"bottom center", zIndex:3, animation:"strawPunch 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}/>
          <span className="absolute select-none" style={{ top:-40, left:"66%", fontSize:18, zIndex:4, animation:"popSparkle 1.1s ease-out forwards" }}>✨</span>
        </>
      )}
      <div className="rounded-t-full" style={{ width:50, height:14, background:"#FFE9F0", border:"2px solid rgba(74,62,61,0.25)", borderBottom:"none", zIndex:2 }}/>
      <div style={{ width:58, height:4, background:"#F6D3DE", borderRadius:3, border:"1.5px solid rgba(74,62,61,0.2)", zIndex:2 }}/>
      <div className="relative overflow-hidden rounded-b-2xl" style={{ width:52, height:78, background:"rgba(255,255,255,0.45)", border:"2px solid rgba(74,62,61,0.25)", borderTop:"none", boxShadow:"inset 3px 0 6px -3px rgba(255,255,255,0.9)" }}>
        <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-linear" style={{ height:`${fillPct}%`, background: fl.gradient }}>
          <div className="absolute top-0 left-0 right-0" style={{ height:4, background: fl.milkLine, borderRadius:2 }}/>
        </div>
        {showPearls && pearls.map((p,i) => (
          <div key={i} className="absolute rounded-full" style={{ width:8, height:8, left:p.left, bottom:3+(i%2)*7, background: fl.pearlColor, animation:`pearlDrop 0.55s cubic-bezier(0.34,1.3,0.64,1) ${p.delay} both` }}/>
        ))}
        <div className="absolute pointer-events-none" style={{ top:4, left:5, width:6, height:"82%", background:"rgba(255,255,255,0.5)", borderRadius:4 }}/>
      </div>
      <p className="text-[9px] font-bold mt-1.5 select-none" style={{ opacity:0.5, letterSpacing:"0.04em" }}>{fl.emoji} {fl.name.toLowerCase()}</p>
    </div>
  );
}

/* ============================================================
   OutsideWindow
   ============================================================ */
function OutsideWindow({ phase, theme }) {
  const p = WINDOW_PHASES[phase];
  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl" style={{ height:190, border:"10px solid #EFE3D3", boxShadow:"0 14px 34px -16px rgba(120,90,80,0.35),0 0 0 1px #E2D3BE,0 2px 0 rgba(255,255,255,0.8) inset", background:`linear-gradient(to bottom, ${p.skyTop} 0%, ${p.skyMid} 55%, ${p.skyBottom} 100%)`, transition:"background 1200ms ease" }} role="img" aria-label={`Window showing a ${phase} scene`}>
        {p.stars && STAR_FIELD.map((s,i) => <div key={i} className="absolute rounded-full" style={{ left:s.left, top:s.top, width:s.s, height:s.s, background:"#FFF6D8", animation:`starTwinkle 2.8s ease-in-out ${s.d} infinite` }}/>)}
        {phase === "night" ? (
          <div className="absolute" style={{ top:22, right:30 }}>
            <div className="relative" style={{ width:30, height:30 }}>
              <div className="absolute inset-0 rounded-full" style={{ background:"#F6EFC9", boxShadow:"0 0 18px 4px rgba(246,239,201,0.35)" }}/>
              <div className="absolute rounded-full" style={{ top:-3, right:-4, width:24, height:24, background:p.skyTop }}/>
            </div>
          </div>
        ) : (
          <div className="absolute rounded-full" style={{ width:phase==="midday"?34:40, height:phase==="midday"?34:40, background:phase==="sunrise"?"#FFC78E":phase==="twilight"?"#FFAE85":"#FFE89E", boxShadow:"0 0 24px 8px rgba(255,220,150,0.45)", left:phase==="sunrise"?"14%":phase==="midday"?"44%":"auto", right:phase==="twilight"?"12%":"auto", top:phase==="midday"?16:phase==="sunrise"?64:70, transition:"all 1200ms ease" }}/>
        )}
        {!p.stars && (
          <>
            <div className="absolute" style={{ top:26, left:0, animation:"cloudDrift 30s linear infinite" }}><div style={{ width:44, height:12, borderRadius:8, background:"rgba(255,255,255,0.8)", boxShadow:"14px -7px 0 rgba(255,255,255,0.8)" }}/></div>
            <div className="absolute" style={{ top:52, left:0, animation:"cloudDrift 44s linear 10s infinite" }}><div style={{ width:32, height:10, borderRadius:7, background:"rgba(255,255,255,0.6)" }}/></div>
          </>
        )}
        <div className="absolute rounded-t-full" style={{ bottom:-34, left:"-18%", width:"80%", height:84, background:p.hillsBack, transition:"background 1200ms ease" }}/>
        <div className="absolute rounded-t-full" style={{ bottom:-40, right:"-20%", width:"85%", height:86, background:p.hillsFront, transition:"background 1200ms ease" }}/>
        <div className="absolute" style={{ bottom:30, left:"22%" }}>
          <div style={{ width:18, height:12, background:"#FBF3E4" }}/>
          <div style={{ position:"absolute", top:-7, left:-2, width:0, height:0, borderLeft:"11px solid transparent", borderRight:"11px solid transparent", borderBottom:"8px solid #E8A48F" }}/>
          <div style={{ position:"absolute", top:4, left:6, width:5, height:5, background:phase==="night"||phase==="twilight"?"#FFE89E":"#C9B79C", boxShadow:phase==="night"?"0 0 6px 2px rgba(255,232,158,0.6)":"none" }}/>
        </div>
        <div className="absolute pointer-events-none" style={{ left:"50%", top:0, bottom:0, width:7, marginLeft:-3.5, background:"#EFE3D3", boxShadow:"0 0 0 1px #E2D3BE" }}/>
        <div className="absolute pointer-events-none" style={{ top:"48%", left:0, right:0, height:7, background:"#EFE3D3", boxShadow:"0 0 0 1px #E2D3BE" }}/>
        <div className="absolute pointer-events-none" style={{ top:-20, left:"8%", width:34, height:"150%", background:"rgba(255,255,255,0.18)", transform:"rotate(18deg)" }}/>
      </div>
      <div className="relative mx-2 rounded-b-2xl flex items-center justify-end pr-5" style={{ height:16, background:"#E7D8C3", boxShadow:"0 6px 14px -8px rgba(120,90,80,0.4)" }}>
        <span className="select-none" style={{ fontSize:15, marginTop:-16 }} aria-hidden="true">🪴</span>
      </div>
      <p className="text-center text-xs font-semibold mt-2.5" style={{ opacity:0.6 }}>{p.greeting} {p.emoji} · outside it's {phase}</p>
    </div>
  );
}

/* ============================================================
   BreathingGuide
   ============================================================ */
function BreathingGuide({ theme, phase, onClose }) {
  const particleChar = phase === "night" ? "⭐" : theme.particle;
  const particles = Array.from({ length: 12 });
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background:`${theme.container}F0`, backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)" }} role="dialog" aria-modal="true" aria-label="Breathing guide">
      <button onClick={onClose} aria-label="Close breathing guide" className="absolute top-5 right-5 rounded-2xl p-3 active:scale-90" style={{ background:"rgba(255,255,255,0.7)", color:theme.text, boxShadow:"0 6px 16px -8px rgba(120,90,80,0.4)", transition:"transform 150ms ease" }}>
        <X size={20} strokeWidth={2.5}/>
      </button>
      <div className="relative flex items-center justify-center" style={{ width:320, height:320 }}>
        <div className="absolute inset-0 pointer-events-none" style={{ animation:"breatheScale 8s ease-in-out infinite, slowSpin 70s linear infinite" }}>
          {particles.map((_,i) => (
            <span key={i} className="absolute select-none" style={{ left:"50%", top:"50%", fontSize:i%3===0?20:14, opacity:0.85, transform:`rotate(${i*30}deg) translateY(-138px) translateX(-50%)`, transformOrigin:"0 0" }}>{particleChar}</span>
          ))}
        </div>
        <div className="relative rounded-full flex items-center justify-center" style={{ width:190, height:190, background:`radial-gradient(circle at 38% 32%, rgba(255,255,255,0.9), ${theme.soft})`, boxShadow:`0 0 60px 10px ${theme.bar}55, 0 1px 0 rgba(255,255,255,0.9) inset`, animation:"breatheScale 8s ease-in-out infinite" }}>
          <span className="absolute text-lg font-bold" style={{ color:theme.text, animation:"breatheInText 8s ease-in-out infinite" }}>breathe in…</span>
          <span className="absolute text-lg font-bold" style={{ color:theme.text, animation:"breatheOutText 8s ease-in-out infinite", opacity:0 }}>breathe out…</span>
        </div>
      </div>
      <p className="mt-8 text-sm font-semibold text-center" style={{ color:theme.text, opacity:0.65 }}>follow the circle — four counts in, four counts out 🫧</p>
    </div>
  );
}

/* ============================================================
   PixelScene
   ============================================================ */
function PixelScene({ mode, isRunning, theme }) {
  const isBreak = mode !== "focus";
  const walkDuration = isRunning ? 13 : 20;
  const skin="#F6CDB8", hair="#6B4F44";
  const shirt = mode==="focus"?"#F4A7B9":mode==="short"?"#7FC8B8":"#B49AD6";
  const pants="#5E4B45"; const px=5;
  const Character = ({ sitting }) => (
    <div className="relative" style={{ width:px*4, height:sitting?px*6:px*8, animation:sitting?"sitBob 2.4s ease-in-out infinite":"walkBob 0.5s steps(2) infinite" }}>
      <div className="absolute" style={{ left:px*0.5, top:0, width:px*3, height:px, background:hair }}/>
      <div className="absolute" style={{ left:px*0.5, top:px, width:px*3, height:px*2, background:skin }}/>
      <div className="absolute" style={{ left:px*1, top:px*1.5, width:px*0.4, height:px*0.4, background:"#3B2D2A" }}/>
      <div className="absolute" style={{ left:px*2.4, top:px*1.5, width:px*0.4, height:px*0.4, background:"#3B2D2A" }}/>
      <div className="absolute" style={{ left:px*0.5, top:px*3, width:px*3, height:px*2.5, background:shirt }}/>
      {sitting ? <div className="absolute" style={{ left:px*0.2, top:px*5.2, width:px*3.6, height:px*0.9, background:pants }}/> : (
        <><div className="absolute" style={{ left:px*0.8, top:px*5.4, width:px*0.9, height:px*2.4, background:pants, transformOrigin:"top center", animation:"legSwingA 0.5s ease-in-out infinite alternate" }}/><div className="absolute" style={{ left:px*2.3, top:px*5.4, width:px*0.9, height:px*2.4, background:pants, transformOrigin:"top center", animation:"legSwingB 0.5s ease-in-out infinite alternate" }}/></>
      )}
    </div>
  );
  const Tree = () => (
    <div className="relative" style={{ width:px*7, height:px*9 }}>
      <div className="absolute" style={{ left:px*2.8, bottom:0, width:px*1.4, height:px*3, background:"#9B7B5E" }}/>
      <div className="absolute" style={{ left:px*1, bottom:px*2.6, width:px*5, height:px*2.4, background:"#A8DCA8" }}/>
      <div className="absolute" style={{ left:px*1.8, bottom:px*4.6, width:px*3.4, height:px*2, background:"#B9E6B3" }}/>
      <div className="absolute" style={{ left:px*2.6, bottom:px*6.2, width:px*1.8, height:px*1.4, background:"#CDEFC5" }}/>
      <div className="absolute" style={{ left:px*1.8, bottom:px*4, width:px*0.6, height:px*0.6, background:"#F8B8CB" }}/>
      <div className="absolute" style={{ left:px*4.4, bottom:px*5.4, width:px*0.6, height:px*0.6, background:"#F8B8CB" }}/>
    </div>
  );
  return (
    <div className="relative overflow-hidden rounded-3xl" style={{ height:110, background:`linear-gradient(to bottom, ${theme.sky} 0%, ${theme.skyDeep} 100%)`, transition:"background 700ms ease", boxShadow:"0 12px 30px -16px rgba(120,90,80,0.3)" }} aria-hidden="true">
      <div className="absolute" style={{ top:14, left:0, animation:"cloudDrift 26s linear infinite" }}><div style={{ width:34, height:10, background:"rgba(255,255,255,0.85)", boxShadow:"10px -6px 0 rgba(255,255,255,0.85)" }}/></div>
      <div className="absolute" style={{ top:32, left:0, animation:"cloudDrift 38s linear 8s infinite" }}><div style={{ width:26, height:8, background:"rgba(255,255,255,0.7)" }}/></div>
      <div className="absolute" style={{ top:12, right:20, width:14, height:14, background:mode==="long"?"#F3EBC8":"#FFE89E", boxShadow:"0 0 0 3px rgba(255,255,255,0.35)" }}/>
      <div className="absolute bottom-0 left-0 right-0" style={{ height:24, background:theme.ground, transition:"background 700ms ease" }}/>
      <div className="absolute bottom-0 left-0 right-0" style={{ height:9, background:theme.groundDeep, transition:"background 700ms ease" }}/>
      {isBreak ? (
        <div className="absolute flex items-end gap-1" style={{ bottom:22, left:"38%" }}>
          <Tree/><div style={{ marginLeft:2 }}><Character sitting/></div>
          <span className="select-none" style={{ fontSize:12, marginBottom:26, animation:"noteFloat 3s ease-in-out infinite", opacity:0.7 }}>♪</span>
        </div>
      ) : (
        <div className="absolute" style={{ bottom:22, left:"-12%", animation:`walkAcross ${walkDuration}s linear infinite` }}><Character sitting={false}/></div>
      )}
    </div>
  );
}

/* ============================================================
   SparkleBurst
   ============================================================ */
function SparkleBurst({ x, y }) {
  const pieces = ["✨","🌸","✨","💫","✨"];
  return (
    <div className="absolute pointer-events-none" style={{ left:x, top:y, zIndex:30 }}>
      {pieces.map((p,i) => <span key={i} className="absolute select-none" style={{ fontSize:13, animation:"burstFly 0.85s ease-out forwards", ["--dx"]:`${(i-2)*16}px`, ["--dy"]:`${-22-Math.abs(i-2)*8}px`, animationDelay:`${i*0.04}s` }}>{p}</span>)}
    </div>
  );
}

/* ============================================================
   SettingsDrawer
   ============================================================ */
function SettingsDrawer({ open, onClose, customDurations, onApplyDurations, accessory, setAccessory, teaFlavor, setTeaFlavor, ambientVolumes, setAmbientVolumes }) {
  const [localDur, setLocalDur] = useState(customDurations);
  const [applied, setApplied] = useState(false);

  useEffect(() => { if (open) { setLocalDur(customDurations); setApplied(false); } }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleApply = () => {
    const clamped = {
      focus: Math.min(90, Math.max(1, Number(localDur.focus) || 25)),
      short: Math.min(30, Math.max(1, Number(localDur.short) || 5)),
      long:  Math.min(60, Math.max(1, Number(localDur.long) || 15)),
    };
    setLocalDur(clamped);
    onApplyDurations(clamped);
    setApplied(true);
    setTimeout(() => setApplied(false), 1800);
  };

  const card = { background:"rgba(255,255,255,0.6)", border:"1px solid rgba(120,90,80,0.1)", borderRadius:16, padding:"18px 20px", marginBottom:14 };
  const sectionTitle = { fontSize:13, fontWeight:700, color:"#4A3E3D", marginBottom:14, display:"flex", alignItems:"center", gap:7 };

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:88,
          background: open ? "rgba(74,62,61,0.18)" : "transparent",
          backdropFilter: open ? "blur(3px)" : "none",
          pointerEvents: open ? "auto" : "none",
          transition:"all 350ms ease",
        }}
      />

      {/* drawer */}
      <div
        role="dialog" aria-modal="true" aria-label="Settings"
        style={{
          position:"fixed", top:0, right:0, bottom:0, width:340, zIndex:90,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition:"transform 400ms cubic-bezier(0.34,1.06,0.64,1)",
          background:"#FDF8F4",
          overflowY:"auto",
          boxShadow:"-24px 0 60px rgba(120,90,80,0.18)",
          fontFamily: FONT_STACK,
        }}
      >
        {/* header */}
        <div style={{ position:"sticky", top:0, zIndex:5, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 22px 14px", background:"rgba(253,248,244,0.95)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(120,90,80,0.08)" }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#4A3E3D", display:"flex", alignItems:"center", gap:8 }}>
            <Settings size={16} strokeWidth={2.2} style={{ color:"#F4A7B9" }}/> settings
          </div>
          <button onClick={onClose} className="rounded-2xl p-2.5 active:scale-90" style={{ background:"rgba(255,255,255,0.8)", border:"1px solid rgba(120,90,80,0.12)", color:"#4A3E3D", transition:"transform 150ms ease" }}>
            <X size={16} strokeWidth={2.5}/>
          </button>
        </div>

        <div style={{ padding:"20px 18px 80px" }}>

          {/* ── 1. TIME ADJUSTMENTS ── */}
          <div style={card}>
            <div style={sectionTitle}><span>⏱</span> time adjustments</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[["focus","Focus",1,90],["short","Short Break",1,30],["long","Long Break",1,60]].map(([key, label, min, max]) => (
                <div key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                  <label style={{ fontSize:12.5, fontWeight:600, color:"#7A6B65", minWidth:90 }}>{label}</label>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <input
                      type="number" min={min} max={max}
                      value={localDur[key]}
                      onChange={e => setLocalDur(d => ({ ...d, [key]: e.target.value }))}
                      style={{ width:56, textAlign:"center", borderRadius:12, border:"1.5px solid rgba(120,90,80,0.2)", background:"rgba(255,255,255,0.85)", color:"#4A3E3D", fontSize:14, fontWeight:700, padding:"7px 6px", fontFamily:FONT_STACK, outline:"none" }}
                    />
                    <span style={{ fontSize:11.5, color:"#9A8B85", fontWeight:500 }}>min</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleApply}
              style={{ marginTop:14, width:"100%", padding:"10px", borderRadius:14, border:"none", background: applied ? "linear-gradient(135deg,#7FC8B8,#5BAF9A)" : "linear-gradient(135deg,#F4A7B9,#E2849E)", color:"white", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 300ms ease", boxShadow:"0 6px 18px -8px rgba(244,167,185,0.7)", fontFamily:FONT_STACK }}
            >
              {applied ? "✓ applied!" : "apply changes"}
            </button>
          </div>

          {/* ── 2. THE WARDROBE ── */}
          <div style={card}>
            <div style={sectionTitle}><span>👗</span> the wardrobe</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {[["glasses","🤓","Reading Glasses"],["hat","🧢","Cozy Hat"],["bow","🎀","Pink Bow"]].map(([val, emoji, label]) => {
                const active = accessory === val;
                return (
                  <button
                    key={val}
                    onClick={() => setAccessory(val)}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, padding:"12px 6px", borderRadius:14, border: active ? "2px solid #F4A7B9" : "1.5px solid rgba(120,90,80,0.15)", background: active ? "rgba(244,167,185,0.14)" : "rgba(255,255,255,0.7)", cursor:"pointer", transition:"all 200ms ease", fontFamily:FONT_STACK }}
                  >
                    <span style={{ fontSize:22 }}>{emoji}</span>
                    <span style={{ fontSize:10, fontWeight:700, color: active ? "#D4768E" : "#7A6B65", textAlign:"center", lineHeight:1.2 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 3. CAFE MENU ── */}
          <div style={card}>
            <div style={sectionTitle}><span>☕</span> cafe menu</div>

            {/* Tea flavor */}
            <p style={{ fontSize:11, fontWeight:600, color:"#9A8B85", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>bubble tea flavor</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:18 }}>
              {Object.entries(TEA_FLAVORS).map(([key, fl]) => {
                const active = teaFlavor === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTeaFlavor(key)}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, padding:"10px 4px", borderRadius:14, border: active ? "2px solid #F4A7B9" : "1.5px solid rgba(120,90,80,0.15)", background: active ? "rgba(244,167,185,0.12)" : "rgba(255,255,255,0.7)", cursor:"pointer", transition:"all 200ms ease", fontFamily:FONT_STACK }}
                  >
                    <span style={{ fontSize:20 }}>{fl.emoji}</span>
                    <span style={{ fontSize:10, fontWeight:700, color: active ? "#D4768E" : "#7A6B65" }}>{fl.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Ambient sounds */}
            <p style={{ fontSize:11, fontWeight:600, color:"#9A8B85", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}>ambient sounds</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["rain","🌧","Rain"],["cafe","☕","Cafe"],["lofi","🎵","Lo-fi"]].map(([key, emoji, label]) => (
                <div key={key} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:16, width:22 }}>{emoji}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:"#7A6B65", minWidth:38 }}>{label}</span>
                  <input
                    type="range" min="0" max="100"
                    value={ambientVolumes[key]}
                    onChange={e => setAmbientVolumes(v => ({ ...v, [key]: Number(e.target.value) }))}
                    style={{ flex:1, accentColor:"#F4A7B9", cursor:"pointer", height:4 }}
                  />
                  <span style={{ fontSize:11, color:"#9A8B85", minWidth:28, textAlign:"right", fontWeight:600 }}>{ambientVolumes[key]}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. ABOUT ── */}
          <div style={{ ...card, background:"rgba(255,248,242,0.8)", borderColor:"rgba(244,167,185,0.25)" }}>
            <div style={sectionTitle}> about: </div>
            <div style={{ fontSize:12.5, color:"#6A5A54", lineHeight:1.9, fontStyle:"italic" }}>
              <p style={{ marginBottom:8 }}>dear diary,</p>
              <p style={{ marginBottom:8 }}>cozy pomodoro was made for anyone who needs a little softness in their study sessions — a cat who keeps you company, a window that knows what time it is, and a bubble tea that fills up as you focus.</p>
              <p style={{ marginBottom:8 }}>v1 was a simple timer. v3 has a wardrobe.</p>
              <p style={{ marginBottom:16 }}>made with 🌸 and too many late nights.</p>
              <div style={{ borderTop:"1px dashed rgba(244,167,185,0.4)", paddingTop:12, fontStyle:"normal" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {[["designed & built by","trisha raye cararag"]].map(([l,v]) => (
                    <div key={l} style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:11, color:"#9A8B85", fontWeight:600 }}>{l}</span>
                      <span style={{ fontSize:11, color:"#4A3E3D", fontWeight:700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function CozyPomodoro() {
  const [mode, setMode] = useState("focus");
  const [customDurations, setCustomDurations] = useState(DEFAULT_DURATIONS);
  const customDurationsRef = useRef(DEFAULT_DURATIONS);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATIONS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [breathing, setBreathing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());
  const [accessory, setAccessory] = useState("glasses");
  const [teaFlavor, setTeaFlavor] = useState("strawberry");
  const [ambientVolumes, setAmbientVolumes] = useState({ rain: 0, cafe: 0, lofi: 0 });
  const [tasks, setTasks] = useState([{ id: 1, text: "Plan today's top priority", done: false }]);
  const [taskInput, setTaskInput] = useState("");
  const [bursts, setBursts] = useState([]);

  const intervalRef = useRef(null);
  const listRef = useRef(null);
  const nextTaskId = useRef(2);

  // Ambient audio refs
  const audioCtxRef = useRef(null);
  const gainNodesRef = useRef({ rain: null, cafe: null, lofi: null });

  const theme = THEMES[mode];
  const total = customDurations[mode] * 60;
  const progress = 1 - secondsLeft / total;
  const phase = getDayPhase(hour);

  // Keep ref in sync so callbacks can read latest durations
  useEffect(() => { customDurationsRef.current = customDurations; }, [customDurations]);

  /* ── timer ── */
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => { setSecondsLeft(s => s > 0 ? s - 1 : 0); }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      setIsRunning(false); setFinished(true); playChime();
      if (mode === "focus") setSessions(n => n + 1);
    }
  }, [secondsLeft, isRunning, mode]);

  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const s = String(secondsLeft % 60).padStart(2, "0");
    document.title = `${m}:${s} · ${theme.label} 🌸`;
    return () => { document.title = "Cozy Pomodoro"; };
  }, [secondsLeft, theme.label]);

  /* ── ambient audio ── */
  useEffect(() => {
    const hasSound = Object.values(ambientVolumes).some(v => v > 0);
    if (!hasSound) {
      if (audioCtxRef.current) {
        Object.values(gainNodesRef.current).forEach(g => { if (g) { try { g.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.3); } catch(e){} } });
      }
      return;
    }
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtxRef.current;
        const bufLen = ctx.sampleRate * 3;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

        // Rain: lowpass white noise
        const rainSrc = ctx.createBufferSource(); rainSrc.buffer = buf; rainSrc.loop = true;
        const rainF = ctx.createBiquadFilter(); rainF.type = "lowpass"; rainF.frequency.value = 1200;
        const rainG = ctx.createGain(); rainG.gain.value = 0;
        rainSrc.connect(rainF); rainF.connect(rainG); rainG.connect(ctx.destination); rainSrc.start();
        gainNodesRef.current.rain = rainG;

        // Cafe: bandpass for gentle murmur
        const cafeSrc = ctx.createBufferSource(); cafeSrc.buffer = buf; cafeSrc.loop = true;
        const cafeF = ctx.createBiquadFilter(); cafeF.type = "bandpass"; cafeF.frequency.value = 320; cafeF.Q.value = 0.4;
        const cafeG = ctx.createGain(); cafeG.gain.value = 0;
        cafeSrc.connect(cafeF); cafeF.connect(cafeG); cafeG.connect(ctx.destination); cafeSrc.start();
        gainNodesRef.current.cafe = cafeG;

        // Lofi: soft chord oscillators
        const lofiG = ctx.createGain(); lofiG.gain.value = 0; lofiG.connect(ctx.destination);
        [130.81, 164.81, 196.00, 246.94].forEach(freq => {
          const osc = ctx.createOscillator(); const og = ctx.createGain();
          osc.type = "sine"; osc.frequency.value = freq; og.gain.value = 0.18;
          osc.connect(og); og.connect(lofiG); osc.start();
        });
        gainNodesRef.current.lofi = lofiG;
      }
      const ctx = audioCtxRef.current;
      Object.entries(ambientVolumes).forEach(([type, vol]) => {
        const g = gainNodesRef.current[type];
        if (g) g.gain.setTargetAtTime((vol / 100) * 0.28, ctx.currentTime, 0.4);
      });
    } catch(e) {}
  }, [ambientVolumes]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch(e){} }
    };
  }, []);

  /* ── mode / reset ── */
  const switchMode = useCallback((next) => {
    setMode(next); setSecondsLeft(customDurationsRef.current[next] * 60);
    setIsRunning(false); setFinished(false);
  }, []);

  const toggleTimer = () => {
    if (secondsLeft === 0) { setSecondsLeft(customDurationsRef.current[mode] * 60); setFinished(false); setIsRunning(true); return; }
    setFinished(false); setIsRunning(r => !r);
  };

  const resetTimer = () => { setIsRunning(false); setFinished(false); setSecondsLeft(customDurationsRef.current[mode] * 60); };

  const handleApplyDurations = useCallback((newDur) => {
    setCustomDurations(newDur);
    customDurationsRef.current = newDur;
    if (!isRunning) { setSecondsLeft(newDur[mode] * 60); setFinished(false); }
  }, [isRunning, mode]);

  /* ── tasks ── */
  const addTask = () => {
    const text = taskInput.trim(); if (!text) return;
    setTasks(t => [...t, { id: nextTaskId.current++, text, done: false }]);
    setTaskInput("");
  };

  const toggleTask = (id, e) => {
    let justDone = false;
    setTasks(t => t.map(task => { if (task.id === id) { if (!task.done) justDone = true; return {...task, done: !task.done}; } return task; }));
    if (justDone && listRef.current && e) {
      const lb = listRef.current.getBoundingClientRect(), bb = e.currentTarget.getBoundingClientRect();
      const burst = { id: Date.now(), x: bb.left - lb.left + 8, y: bb.top - lb.top };
      setBursts(b => [...b, burst]);
      setTimeout(() => setBursts(b => b.filter(bb => bb.id !== burst.id)), 1000);
    }
  };

  const deleteTask = (id) => setTasks(t => t.filter(task => task.id !== id));

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const catState = mode !== "focus" ? "napping" : finished ? "drinking" : "studying";
  const statusLine = finished ? (mode==="focus" ? "Session complete — you earned a break! ✨" : "Break's over — ready when you are 🌷") : isRunning ? (mode==="focus" ? "Shhh… deep focus in progress" : "Resting and recharging…") : "Press start when you're ready";

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background:`linear-gradient(180deg, #FAF7F2 0%, ${theme.container} 100%)`, fontFamily: FONT_STACK, color: theme.text, transition:"background 900ms ease, color 700ms ease" }}>
      <style>{`
        @keyframes zFloat { 0%{transform:translateY(0);opacity:0;}25%{opacity:0.6;}100%{transform:translateY(-26px);opacity:0;} }
        @keyframes sparkleTwinkle { 0%,100%{transform:scale(0.6) rotate(-8deg);opacity:0.25;}50%{transform:scale(1.15) rotate(8deg);opacity:1;} }
        @keyframes sleepBreathe { 0%,100%{transform:scaleY(1);}50%{transform:scaleY(1.035) translateY(-1px);} }
        @keyframes happyBounce { 0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);} }
        @keyframes walkAcross { from{left:-12%;}to{left:104%;} }
        @keyframes walkBob { 0%,100%{transform:translateY(0);}50%{transform:translateY(-2px);} }
        @keyframes sitBob { 0%,100%{transform:translateY(0);}50%{transform:translateY(-1.5px);} }
        @keyframes legSwingA { from{transform:rotate(22deg);}to{transform:rotate(-22deg);} }
        @keyframes legSwingB { from{transform:rotate(-22deg);}to{transform:rotate(22deg);} }
        @keyframes cloudDrift { from{transform:translateX(-70px);}to{transform:translateX(620px);} }
        @keyframes noteFloat { 0%,100%{transform:translateY(0);opacity:0.4;}50%{transform:translateY(-8px);opacity:0.9;} }
        @keyframes burstFly { 0%{transform:translate(0,0) scale(0.5);opacity:1;}100%{transform:translate(var(--dx),var(--dy)) scale(1.1);opacity:0;} }
        @keyframes gentlePulse { 0%,100%{transform:scale(1);}50%{transform:scale(1.012);} }
        @keyframes starTwinkle { 0%,100%{opacity:0.25;transform:scale(0.8);}50%{opacity:1;transform:scale(1.2);} }
        @keyframes breatheScale { 0%{transform:scale(0.74);}42%{transform:scale(1.12);}55%{transform:scale(1.12);}97%{transform:scale(0.74);}100%{transform:scale(0.74);} }
        @keyframes slowSpin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
        @keyframes breatheInText { 0%{opacity:0;}8%{opacity:1;}40%{opacity:1;}52%{opacity:0;}100%{opacity:0;} }
        @keyframes breatheOutText { 0%{opacity:0;}52%{opacity:0;}60%{opacity:1;}92%{opacity:1;}100%{opacity:0;} }
        @keyframes pawWrite { 0%,100%{transform:translate(0,0);}30%{transform:translate(0.7px,-0.15px);}60%{transform:translate(1.3px,0.1px);}80%{transform:translate(0.5px,-0.1px);} }
        @keyframes studyBob { 0%,100%{transform:translateY(0);}50%{transform:translateY(0.4px);} }
        @keyframes paperFloat { 0%{transform:translate(0,-14px) rotate(0deg);opacity:0;}12%{opacity:0.95;}80%{opacity:0.85;}100%{transform:translate(var(--drift,10px),86px) rotate(170deg);opacity:0;} }
        @keyframes pearlDrop { 0%{transform:translateY(-70px) scale(0.7);opacity:0;}55%{opacity:1;}78%{transform:translateY(3px) scale(1.08);}100%{transform:translateY(0) scale(1);opacity:1;} }
        @keyframes strawPunch { 0%{transform:translateY(-50px) rotate(9deg);opacity:0;}65%{transform:translateY(7px) rotate(9deg);opacity:1;}100%{transform:translateY(0) rotate(9deg);opacity:1;} }
        @keyframes popSparkle { 0%{transform:scale(0);opacity:0;}35%{transform:scale(1.5);opacity:1;}100%{transform:scale(0.8) translateY(-12px);opacity:0;} }
        input[type=range] { -webkit-appearance:none; height:4px; border-radius:4px; background: rgba(120,90,80,0.15); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:#F4A7B9; cursor:pointer; box-shadow:0 2px 6px rgba(244,167,185,0.5); }
        input[type=number]::-webkit-inner-spin-button { opacity:0; }
        button:focus-visible, input:focus-visible { outline:3px solid rgba(244,167,185,0.7); outline-offset:2px; }
        @media (prefers-reduced-motion:reduce) { *,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;} }
      `}</style>

      {/* ── HEADER ── */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold tracking-wide flex items-center gap-2"><span aria-hidden="true">☁️</span> cozy pomodoro</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title={`${sessions} focus sessions completed`} aria-label={`${sessions} focus sessions completed`}>
            {[0,1,2,3].map(i => <span key={i} style={{ fontSize:13, opacity: i < sessions % 4 || (sessions > 0 && sessions % 4 === 0) ? 1 : 0.25, transition:"opacity 300ms" }}>🐾</span>)}
            {sessions > 4 && <span className="text-xs font-bold ml-1">×{sessions}</span>}
          </div>
          <button onClick={() => setBreathing(true)} className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold active:scale-95" style={{ background:"rgba(255,255,255,0.7)", color:theme.text, boxShadow:"0 8px 20px -10px rgba(120,90,80,0.35)", transition:"transform 150ms ease" }}>
            <Wind size={16} strokeWidth={2.5} aria-hidden="true"/> Breathe
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="flex items-center justify-center rounded-2xl p-2.5 active:scale-95"
            style={{ background:"rgba(255,255,255,0.7)", color:theme.text, boxShadow:"0 8px 20px -10px rgba(120,90,80,0.35)", transition:"transform 150ms ease" }}
          >
            <Settings size={18} strokeWidth={2.3}/>
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 grid gap-6 lg:grid-cols-[1.15fr_1fr] items-start">

        {/* LEFT — timer */}
        <section className="rounded-3xl p-5 sm:p-7" style={{ background:theme.container, boxShadow:`0 24px 60px -18px ${theme.bar}55,0 8px 24px -10px rgba(120,90,80,0.18),0 1px 0 rgba(255,255,255,0.7) inset`, border:`1px solid ${theme.border}`, transition:"background 700ms ease,border-color 700ms ease,box-shadow 700ms ease" }}>
          <nav className="grid grid-cols-3 gap-2 mb-4" aria-label="Timer mode">
            {Object.entries(THEMES).map(([key, t]) => {
              const Icon = t.icon; const active = mode === key;
              return (
                <button key={key} onClick={() => switchMode(key)} aria-pressed={active} className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-2xl px-2 py-2.5 text-xs sm:text-sm font-semibold" style={{ background:active?theme.text:"rgba(255,255,255,0.55)", color:active?theme.container:theme.text, boxShadow:active?`0 6px 16px -6px ${theme.text}66`:"0 2px 6px -2px rgba(120,90,80,0.12)", transform:active?"translateY(-1px)":"none", transition:"all 350ms ease" }}>
                  <Icon size={15} strokeWidth={2.4} aria-hidden="true"/> {t.label}
                </button>
              );
            })}
          </nav>
          <div className="flex items-end justify-center gap-2 sm:gap-5">
            <DeskCompanion state={catState} theme={theme} accessory={accessory}/>
            <BubbleTea progress={progress} finished={finished} flavor={teaFlavor}/>
          </div>
          <div className="rounded-3xl px-6 py-6 mb-5 text-center" style={{ background:"rgba(255,255,255,0.6)", boxShadow:"0 10px 28px -14px rgba(120,90,80,0.25),0 1px 0 rgba(255,255,255,0.9) inset", animation:isRunning?"gentlePulse 4s ease-in-out infinite":"none", transition:"background 700ms ease" }} aria-live="polite">
            <div className="font-bold leading-none select-none" style={{ fontSize:"clamp(3.8rem,11vw,6.5rem)", fontVariantNumeric:"tabular-nums", letterSpacing:"0.02em" }}>
              {mm}<span style={{ opacity:isRunning?(secondsLeft%2?0.35:1):1, transition:"opacity 200ms" }}>:</span>{ss}
            </div>
            <div className="mt-5 h-2.5 w-full rounded-full overflow-hidden" style={{ background:theme.soft, transition:"background 700ms ease" }}>
              <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ width:`${progress*100}%`, background:theme.bar }}/>
            </div>
            <p className="mt-3 text-sm font-medium" style={{ opacity:0.75 }}>{statusLine}</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={toggleTimer} className="flex items-center gap-2 rounded-3xl px-8 py-4 text-base font-bold active:scale-95" style={{ background:"#FFDFD3", color:"#4A3E3D", boxShadow:"0 10px 24px -10px rgba(244,167,185,0.8),0 1px 0 rgba(255,255,255,0.8) inset", transition:"transform 150ms ease,box-shadow 300ms ease" }}>
              {isRunning ? <Pause size={20} strokeWidth={2.6} aria-hidden="true"/> : <Play size={20} strokeWidth={2.6} aria-hidden="true"/>}
              {isRunning ? "Pause" : secondsLeft === 0 ? "Restart" : "Start"}
            </button>
            <button onClick={resetTimer} aria-label="Reset timer" className="flex items-center justify-center rounded-3xl p-4 active:scale-95" style={{ background:"#FFF2CC", color:"#4A3E3D", boxShadow:"0 8px 20px -10px rgba(214,178,94,0.6),0 1px 0 rgba(255,255,255,0.8) inset", transition:"transform 150ms ease" }}>
              <RotateCcw size={20} strokeWidth={2.6} aria-hidden="true"/>
            </button>
          </div>
        </section>

        {/* RIGHT — window + tasks */}
        <div className="flex flex-col gap-6">
          <section className="rounded-3xl p-5" style={{ background:"rgba(255,255,255,0.55)", border:`1px solid ${theme.border}`, boxShadow:"0 18px 44px -20px rgba(120,90,80,0.3),0 1px 0 rgba(255,255,255,0.8) inset", transition:"border-color 700ms ease" }}>
            <OutsideWindow phase={phase} theme={theme}/>
          </section>
          <section className="relative rounded-3xl p-5" ref={listRef} style={{ background:"rgba(255,255,255,0.55)", border:`1px solid ${theme.border}`, boxShadow:"0 18px 44px -20px rgba(120,90,80,0.3)", transition:"border-color 700ms ease" }}>
            {bursts.map(b => <SparkleBurst key={b.id} x={b.x} y={b.y}/>)}
            <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5"><Sparkles size={14} strokeWidth={2.5} aria-hidden="true"/> Focus goals</h2>
            <div className="flex gap-2 mb-3">
              <input type="text" value={taskInput} onChange={e => setTaskInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&addTask()} placeholder="What will you focus on?" aria-label="New focus goal" maxLength={80} className="flex-1 min-w-0 rounded-2xl px-4 py-2.5 text-sm font-medium placeholder-current" style={{ background:"rgba(255,255,255,0.85)", color:theme.text, border:`1.5px solid ${theme.border}`, transition:"border-color 700ms ease" }}/>
              <button onClick={addTask} aria-label="Add focus goal" className="rounded-2xl px-3.5 active:scale-95" style={{ background:theme.chip, color:"#4A3E3D", boxShadow:"0 4px 12px -6px rgba(120,90,80,0.3)", transition:"transform 150ms ease,background 700ms ease" }}>
                <Plus size={18} strokeWidth={2.8} aria-hidden="true"/>
              </button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-xs text-center py-3 font-medium" style={{ opacity:0.55 }}>No goals yet — add one tiny thing to focus on 🌱</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map(task => (
                  <li key={task.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 group" style={{ background:"rgba(255,255,255,0.75)", opacity:task.done?0.55:1, transition:"opacity 400ms ease" }}>
                    <button onClick={e => toggleTask(task.id, e)} aria-label={task.done?`Mark "${task.text}" as not done`:`Mark "${task.text}" as done`} aria-pressed={task.done} className="flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center active:scale-90" style={{ background:task.done?theme.bar:"rgba(255,255,255,0.9)", border:`2px solid ${task.done?theme.bar:theme.border}`, color:"#fff", transition:"all 250ms ease" }}>
                      {task.done && <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 6.5 L4.8 9 L10 3.2" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span className="flex-1 text-sm font-medium break-words" style={{ textDecoration:task.done?"line-through":"none", transition:"all 300ms ease" }}>{task.text}</span>
                    <button onClick={() => deleteTask(task.id)} aria-label={`Delete "${task.text}"`} className="flex-shrink-0 rounded-xl p-1.5 opacity-40 hover:opacity-100 active:scale-90" style={{ color:theme.text, transition:"opacity 200ms ease,transform 150ms ease" }}>
                      <Trash2 size={15} strokeWidth={2.2} aria-hidden="true"/>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <PixelScene mode={mode} isRunning={isRunning} theme={theme}/>
        <p className="text-center text-[11px] font-medium mt-3" style={{ opacity:0.5 }}>one gentle step at a time 🌸</p>
      </footer>

      {/* ── OVERLAYS ── */}
      {breathing && <BreathingGuide theme={theme} phase={phase} onClose={() => setBreathing(false)}/>}

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        customDurations={customDurations}
        onApplyDurations={handleApplyDurations}
        accessory={accessory}
        setAccessory={setAccessory}
        teaFlavor={teaFlavor}
        setTeaFlavor={setTeaFlavor}
        ambientVolumes={ambientVolumes}
        setAmbientVolumes={setAmbientVolumes}
      />
    </div>
  );
}
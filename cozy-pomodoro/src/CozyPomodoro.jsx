import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Plus, Trash2, Flower2, Coffee, Moon, Sparkles } from "lucide-react";

/* ============================================================
   COZY POMODORO — pastel / Sanrio-inspired focus timer
   Single-file React app. Tailwind for layout, inline styles
   for the custom pastel palette (no Tailwind config needed).
   ============================================================ */

const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

const THEMES = {
  focus: {
    label: "Focus",
    icon: Flower2,
    container: "#FFF0F2",
    text: "#4A3E3D",
    soft: "#FFE0E6",
    border: "#F9D5DC",
    bar: "#F4A7B9",
    sky: "#FFE6EC",
    skyDeep: "#FFD3DE",
    ground: "#F3C2CE",
    groundDeep: "#EBADBD",
    chip: "#FFDFD3",
  },
  short: {
    label: "Short Break",
    icon: Coffee,
    container: "#E8F7F4",
    text: "#2D423E",
    soft: "#D6F0EA",
    border: "#C8E8E0",
    bar: "#7FC8B8",
    sky: "#DDF3EE",
    skyDeep: "#C9EBE3",
    ground: "#A8DCCB",
    groundDeep: "#92CFBC",
    chip: "#FFF2CC",
  },
  long: {
    label: "Long Break",
    icon: Moon,
    container: "#F0EBF7",
    text: "#3B2D42",
    soft: "#E4DBF1",
    border: "#D9CCEB",
    bar: "#B49AD6",
    sky: "#E9E1F5",
    skyDeep: "#DCD0EE",
    ground: "#C5B3E0",
    groundDeep: "#B49FD6",
    chip: "#FFDFD3",
  },
};

const FONT_STACK =
  'ui-rounded, "Hiragino Maru Gothic ProN", "Quicksand", "Varela Round", "Comfortaa", "Nunito", "Segoe UI", system-ui, sans-serif';

/* ---------- gentle Web Audio chime (no assets needed) ---------- */
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 — soft arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.start(t);
      osc.stop(t + 1.5);
    });
    // tiny "bubble pop" tail for extra coziness
    const pop = ctx.createOscillator();
    const pg = ctx.createGain();
    pop.type = "triangle";
    pop.frequency.setValueAtTime(880, ctx.currentTime + 0.7);
    pop.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.78);
    pop.connect(pg);
    pg.connect(ctx.destination);
    pg.gain.setValueAtTime(0, ctx.currentTime + 0.7);
    pg.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.72);
    pg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
    pop.start(ctx.currentTime + 0.7);
    pop.stop(ctx.currentTime + 1.05);
    setTimeout(() => ctx.close(), 2500);
  } catch (e) {
    // Audio not available — fail silently, the UI still celebrates.
  }
}

/* ---------- pixel cat illustration (SVG, crisp edges) ---------- */
function PixelCat({ awake, theme }) {
  const fur = "#F6CDB8"; // warm peach fur
  const furDark = "#EBB79D";
  const inner = "#F9A8C0"; // ear pink
  const dark = theme.text;
  const blush = "#F8A8B8";

  return (
    <div className="relative flex items-end justify-center" style={{ height: 120 }}>
      {/* floating z's while sleeping */}
      {!awake && (
        <div className="absolute pointer-events-none" style={{ top: 0, right: "28%" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute font-bold select-none"
              style={{
                color: dark,
                opacity: 0.55,
                fontSize: 12 + i * 4,
                right: i * 14,
                animation: `zFloat 2.6s ease-in-out ${i * 0.7}s infinite`,
              }}
            >
              z
            </span>
          ))}
        </div>
      )}

      {/* sparkles when awake / celebrating */}
      {awake && (
        <>
          {[
            { left: "22%", top: 6, delay: "0s", size: 18 },
            { left: "72%", top: 0, delay: "0.4s", size: 22 },
            { left: "60%", top: 30, delay: "0.9s", size: 14 },
            { left: "32%", top: 34, delay: "1.3s", size: 15 },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute select-none pointer-events-none"
              style={{
                left: s.left,
                top: s.top,
                fontSize: s.size,
                animation: `sparkleTwinkle 1.8s ease-in-out ${s.delay} infinite`,
              }}
            >
              ✨
            </span>
          ))}
        </>
      )}

      <svg
        viewBox="0 0 20 14"
        width="170"
        height="119"
        style={{ shapeRendering: "crispEdges", animation: awake ? "happyBounce 1.6s ease-in-out infinite" : "sleepBreathe 3.2s ease-in-out infinite" }}
        aria-label={awake ? "A happy pixel cat surrounded by sparkles" : "A sleeping pixel cat"}
        role="img"
      >
        {/* ears */}
        <rect x="4" y={awake ? 1 : 2} width="2" height="2" fill={furDark} />
        <rect x="12" y={awake ? 1 : 2} width="2" height="2" fill={furDark} />
        <rect x="4.5" y={awake ? 1.6 : 2.6} width="1" height="1" fill={inner} />
        <rect x="12.5" y={awake ? 1.6 : 2.6} width="1" height="1" fill={inner} />
        {/* head */}
        <rect x="3" y={awake ? 3 : 4} width="12" height="6" rx="0" fill={fur} />
        {/* body loaf */}
        <rect x="2" y="8" width="16" height="5" fill={fur} />
        <rect x="2" y="12" width="16" height="1" fill={furDark} />
        {/* tail */}
        <rect x="17" y="9" width="2" height="1.4" fill={furDark}>
          <animate attributeName="y" values="9;8.4;9" dur="1.4s" repeatCount="indefinite" />
        </rect>
        {/* paws tucked */}
        <rect x="4" y="11.4" width="2.4" height="1.2" fill={furDark} />
        <rect x="11.6" y="11.4" width="2.4" height="1.2" fill={furDark} />

        {awake ? (
          <>
            {/* open eyes with shine */}
            <rect x="6" y="5" width="1.4" height="1.8" fill={dark} />
            <rect x="10.6" y="5" width="1.4" height="1.8" fill={dark} />
            <rect x="6.3" y="5.3" width="0.5" height="0.5" fill="#FFFFFF" />
            <rect x="10.9" y="5.3" width="0.5" height="0.5" fill="#FFFFFF" />
            {/* happy mouth */}
            <rect x="8.4" y="7.2" width="1.2" height="0.5" fill={dark} />
            <rect x="8.1" y="6.9" width="0.4" height="0.4" fill={dark} />
            <rect x="9.5" y="6.9" width="0.4" height="0.4" fill={dark} />
          </>
        ) : (
          <>
            {/* peacefully closed eyes */}
            <rect x="5.8" y="6" width="1.8" height="0.5" fill={dark} />
            <rect x="10.4" y="6" width="1.8" height="0.5" fill={dark} />
            <rect x="8.5" y="7.1" width="1" height="0.4" fill={dark} opacity="0.6" />
          </>
        )}
        {/* blush */}
        <rect x="4.6" y="6.8" width="1.2" height="0.7" fill={blush} opacity="0.8" />
        <rect x="12.2" y="6.8" width="1.2" height="0.7" fill={blush} opacity="0.8" />
        {/* whiskers */}
        <rect x="2.2" y="6.2" width="1.4" height="0.35" fill={dark} opacity="0.45" />
        <rect x="14.4" y="6.2" width="1.4" height="0.35" fill={dark} opacity="0.45" />
      </svg>
    </div>
  );
}

/* ---------- lo-fi pixel walking scene (footer) ---------- */
function PixelScene({ mode, isRunning, theme }) {
  const isBreak = mode !== "focus";
  const walkDuration = isRunning ? 11 : 18; // walks faster while focusing

  const skin = "#F6CDB8";
  const hair = "#6B4F44";
  const shirt = mode === "focus" ? "#F4A7B9" : mode === "short" ? "#7FC8B8" : "#B49AD6";
  const pants = "#5E4B45";
  const px = 5; // base pixel unit

  const Character = ({ sitting }) => (
    <div
      className="relative"
      style={{
        width: px * 4,
        height: sitting ? px * 6 : px * 8,
        animation: sitting ? "sitBob 2.4s ease-in-out infinite" : "walkBob 0.5s steps(2) infinite",
      }}
    >
      {/* hair + head */}
      <div className="absolute" style={{ left: px * 0.5, top: 0, width: px * 3, height: px, background: hair }} />
      <div className="absolute" style={{ left: px * 0.5, top: px, width: px * 3, height: px * 2, background: skin }} />
      <div className="absolute" style={{ left: px * 1, top: px * 1.5, width: px * 0.4, height: px * 0.4, background: "#3B2D2A" }} />
      <div className="absolute" style={{ left: px * 2.4, top: px * 1.5, width: px * 0.4, height: px * 0.4, background: "#3B2D2A" }} />
      {/* body */}
      <div className="absolute" style={{ left: px * 0.5, top: px * 3, width: px * 3, height: px * 2.5, background: shirt }} />
      {sitting ? (
        <>
          {/* folded legs */}
          <div className="absolute" style={{ left: px * 0.2, top: px * 5.2, width: px * 3.6, height: px * 0.9, background: pants }} />
        </>
      ) : (
        <>
          {/* swinging legs */}
          <div
            className="absolute"
            style={{ left: px * 0.8, top: px * 5.4, width: px * 0.9, height: px * 2.4, background: pants, transformOrigin: "top center", animation: "legSwingA 0.5s ease-in-out infinite alternate" }}
          />
          <div
            className="absolute"
            style={{ left: px * 2.3, top: px * 5.4, width: px * 0.9, height: px * 2.4, background: pants, transformOrigin: "top center", animation: "legSwingB 0.5s ease-in-out infinite alternate" }}
          />
        </>
      )}
    </div>
  );

  const Tree = () => (
    <div className="relative" style={{ width: px * 7, height: px * 9 }}>
      <div className="absolute" style={{ left: px * 2.8, bottom: 0, width: px * 1.4, height: px * 3, background: "#9B7B5E" }} />
      <div className="absolute" style={{ left: px * 1, bottom: px * 2.6, width: px * 5, height: px * 2.4, background: "#A8DCA8" }} />
      <div className="absolute" style={{ left: px * 1.8, bottom: px * 4.6, width: px * 3.4, height: px * 2, background: "#B9E6B3" }} />
      <div className="absolute" style={{ left: px * 2.6, bottom: px * 6.2, width: px * 1.8, height: px * 1.4, background: "#CDEFC5" }} />
      {/* tiny blossoms */}
      <div className="absolute" style={{ left: px * 1.8, bottom: px * 4, width: px * 0.6, height: px * 0.6, background: "#F8B8CB" }} />
      <div className="absolute" style={{ left: px * 4.4, bottom: px * 5.4, width: px * 0.6, height: px * 0.6, background: "#F8B8CB" }} />
    </div>
  );

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        height: 104,
        background: `linear-gradient(to bottom, ${theme.sky} 0%, ${theme.skyDeep} 100%)`,
        transition: "background 700ms ease",
      }}
      aria-hidden="true"
    >
      {/* drifting pixel clouds */}
      <div className="absolute" style={{ top: 12, left: 0, animation: "cloudDrift 26s linear infinite" }}>
        <div style={{ width: 34, height: 10, background: "rgba(255,255,255,0.85)", boxShadow: "10px -6px 0 rgba(255,255,255,0.85)" }} />
      </div>
      <div className="absolute" style={{ top: 28, left: 0, animation: "cloudDrift 38s linear 8s infinite" }}>
        <div style={{ width: 26, height: 8, background: "rgba(255,255,255,0.7)" }} />
      </div>
      {/* pixel sun / moon */}
      <div
        className="absolute"
        style={{
          top: 10,
          right: 16,
          width: 14,
          height: 14,
          background: mode === "long" ? "#F3EBC8" : "#FFE89E",
          boxShadow: "0 0 0 3px rgba(255,255,255,0.35)",
        }}
      />
      {/* ground */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 22, background: theme.ground, transition: "background 700ms ease" }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 8, background: theme.groundDeep, transition: "background 700ms ease" }} />

      {isBreak ? (
        /* resting under the tree */
        <div className="absolute flex items-end gap-1" style={{ bottom: 20, left: "34%" }}>
          <Tree />
          <div style={{ marginLeft: 2 }}>
            <Character sitting />
          </div>
          <span className="select-none" style={{ fontSize: 12, marginBottom: 26, animation: "noteFloat 3s ease-in-out infinite", opacity: 0.7 }}>
            ♪
          </span>
        </div>
      ) : (
        /* walking across a pink-sky world */
        <div
          className="absolute"
          style={{
            bottom: 20,
            left: "-15%",
            animation: `walkAcross ${walkDuration}s linear infinite`,
            animationPlayState: "running",
          }}
        >
          <Character sitting={false} />
        </div>
      )}
    </div>
  );
}

/* ---------- sparkle burst for completed tasks ---------- */
function SparkleBurst({ x, y }) {
  const pieces = ["✨", "🌸", "✨", "💫", "✨"];
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y, zIndex: 30 }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            fontSize: 13,
            animation: `burstFly 0.85s ease-out forwards`,
            ["--dx"]: `${(i - 2) * 16}px`,
            ["--dy"]: `${-22 - Math.abs(i - 2) * 8}px`,
            animationDelay: `${i * 0.04}s`,
          }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function CozyPomodoro() {
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessions, setSessions] = useState(0);

  const [tasks, setTasks] = useState([
    { id: 1, text: "Plan today's top priority", done: false },
  ]);
  const [taskInput, setTaskInput] = useState("");
  const [bursts, setBursts] = useState([]);

  const intervalRef = useRef(null);
  const listRef = useRef(null);
  const nextTaskId = useRef(2);

  const theme = THEMES[mode];
  const total = DURATIONS[mode];
  const progress = 1 - secondsLeft / total;

  /* ---------- timer engine (setInterval) ---------- */
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  /* ---------- handle completion ---------- */
  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      setFinished(true);
      playChime();
      if (mode === "focus") setSessions((n) => n + 1);
    }
  }, [secondsLeft, isRunning, mode]);

  /* ---------- tab title ---------- */
  useEffect(() => {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const s = String(secondsLeft % 60).padStart(2, "0");
    document.title = `${m}:${s} · ${theme.label} 🌸`;
    return () => {
      document.title = "Cozy Pomodoro";
    };
  }, [secondsLeft, theme.label]);

  const switchMode = useCallback((next) => {
    setMode(next);
    setSecondsLeft(DURATIONS[next]);
    setIsRunning(false);
    setFinished(false);
  }, []);

  const toggleTimer = () => {
    if (secondsLeft === 0) {
      // restart the same mode after a finished session
      setSecondsLeft(total);
      setFinished(false);
      setIsRunning(true);
      return;
    }
    setFinished(false);
    setIsRunning((r) => !r);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setFinished(false);
    setSecondsLeft(total);
  };

  /* ---------- tasks ---------- */
  const addTask = () => {
    const text = taskInput.trim();
    if (!text) return;
    setTasks((t) => [...t, { id: nextTaskId.current++, text, done: false }]);
    setTaskInput("");
  };

  const toggleTask = (id, e) => {
    let justCompleted = false;
    setTasks((t) =>
      t.map((task) => {
        if (task.id === id) {
          if (!task.done) justCompleted = true;
          return { ...task, done: !task.done };
        }
        return task;
      })
    );
    if (justCompleted && listRef.current && e) {
      const listBox = listRef.current.getBoundingClientRect();
      const btnBox = e.currentTarget.getBoundingClientRect();
      const burst = {
        id: Date.now(),
        x: btnBox.left - listBox.left + 8,
        y: btnBox.top - listBox.top,
      };
      setBursts((b) => [...b, burst]);
      setTimeout(() => setBursts((b) => b.filter((bb) => bb.id !== burst.id)), 1000);
    }
  };

  const deleteTask = (id) => setTasks((t) => t.filter((task) => task.id !== id));

  /* ---------- derived display ---------- */
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const catAwake = mode !== "focus" || finished || (!isRunning && secondsLeft === total);

  const statusLine = finished
    ? mode === "focus"
      ? "Session complete — you earned a break! ✨"
      : "Break's over — ready when you are 🌷"
    : isRunning
    ? mode === "focus"
      ? "Shhh… deep focus in progress"
      : "Resting and recharging…"
    : "Press start when you're ready";

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-8"
      style={{ background: "#FAF7F2", fontFamily: FONT_STACK, color: theme.text, transition: "color 700ms ease" }}
    >
      {/* keyframes + reduced-motion support */}
      <style>{`
        @keyframes zFloat { 0% { transform: translateY(0); opacity: 0; } 25% { opacity: 0.6; } 100% { transform: translateY(-26px); opacity: 0; } }
        @keyframes sparkleTwinkle { 0%, 100% { transform: scale(0.6) rotate(-8deg); opacity: 0.25; } 50% { transform: scale(1.15) rotate(8deg); opacity: 1; } }
        @keyframes sleepBreathe { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.035) translateY(-1px); } }
        @keyframes happyBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes walkAcross { from { left: -15%; } to { left: 105%; } }
        @keyframes walkBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes sitBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
        @keyframes legSwingA { from { transform: rotate(22deg); } to { transform: rotate(-22deg); } }
        @keyframes legSwingB { from { transform: rotate(-22deg); } to { transform: rotate(22deg); } }
        @keyframes cloudDrift { from { transform: translateX(-60px); } to { transform: translateX(560px); } }
        @keyframes noteFloat { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-8px); opacity: 0.9; } }
        @keyframes burstFly { 0% { transform: translate(0, 0) scale(0.5); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(1.1); opacity: 0; } }
        @keyframes gentlePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
        button:focus-visible, input:focus-visible { outline: 3px solid rgba(244, 167, 185, 0.7); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* floating main card */}
      <main
        className="w-full max-w-md rounded-3xl p-5 sm:p-7"
        style={{
          background: theme.container,
          boxShadow: `0 24px 60px -18px ${theme.bar}55, 0 8px 24px -10px rgba(120, 90, 80, 0.18), 0 1px 0 rgba(255,255,255,0.7) inset`,
          border: `1px solid ${theme.border}`,
          transition: "background 700ms ease, border-color 700ms ease, box-shadow 700ms ease",
        }}
      >
        {/* header */}
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold tracking-wide flex items-center gap-2">
            <span aria-hidden="true">☁️</span> cozy pomodoro
          </h1>
          {/* session paw counter */}
          <div className="flex items-center gap-1" title={`${sessions} focus sessions completed`} aria-label={`${sessions} focus sessions completed`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{ fontSize: 13, opacity: i < sessions % 4 || (sessions > 0 && sessions % 4 === 0) ? 1 : 0.25, transition: "opacity 300ms" }}>
                🐾
              </span>
            ))}
            {sessions > 4 && <span className="text-xs font-bold ml-1">×{sessions}</span>}
          </div>
        </header>

        {/* mode tabs */}
        <nav className="grid grid-cols-3 gap-2 mb-5" aria-label="Timer mode">
          {Object.entries(THEMES).map(([key, t]) => {
            const Icon = t.icon;
            const active = mode === key;
            return (
              <button
                key={key}
                onClick={() => switchMode(key)}
                aria-pressed={active}
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-2xl px-2 py-2.5 text-xs sm:text-sm font-semibold"
                style={{
                  background: active ? theme.text : "rgba(255,255,255,0.55)",
                  color: active ? theme.container : theme.text,
                  boxShadow: active ? `0 6px 16px -6px ${theme.text}66` : "0 2px 6px -2px rgba(120,90,80,0.12)",
                  transform: active ? "translateY(-1px)" : "none",
                  transition: "all 350ms ease",
                }}
              >
                <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* pixel cat */}
        <PixelCat awake={catAwake} theme={theme} />

        {/* timer display */}
        <section
          className="rounded-3xl px-6 py-5 mb-4 text-center"
          style={{
            background: "rgba(255,255,255,0.6)",
            boxShadow: "0 10px 28px -14px rgba(120,90,80,0.25), 0 1px 0 rgba(255,255,255,0.9) inset",
            animation: isRunning ? "gentlePulse 4s ease-in-out infinite" : "none",
            transition: "background 700ms ease",
          }}
          aria-live="polite"
        >
          <div
            className="font-bold leading-none select-none"
            style={{ fontSize: "clamp(3.5rem, 18vw, 5rem)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}
          >
            {mm}
            <span style={{ opacity: isRunning ? (secondsLeft % 2 ? 0.35 : 1) : 1, transition: "opacity 200ms" }}>:</span>
            {ss}
          </div>

          {/* progress bar */}
          <div className="mt-4 h-2.5 w-full rounded-full overflow-hidden" style={{ background: theme.soft, transition: "background 700ms ease" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progress * 100}%`, background: theme.bar, transition: "width 900ms linear, background 700ms ease" }}
            />
          </div>

          <p className="mt-3 text-sm font-medium" style={{ opacity: 0.75 }}>
            {statusLine}
          </p>
        </section>

        {/* controls */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={toggleTimer}
            className="flex items-center gap-2 rounded-3xl px-7 py-3.5 text-base font-bold active:scale-95"
            style={{
              background: "#FFDFD3",
              color: "#4A3E3D",
              boxShadow: "0 10px 24px -10px rgba(244, 167, 185, 0.8), 0 1px 0 rgba(255,255,255,0.8) inset",
              transition: "transform 150ms ease, box-shadow 300ms ease",
            }}
          >
            {isRunning ? <Pause size={20} strokeWidth={2.6} aria-hidden="true" /> : <Play size={20} strokeWidth={2.6} aria-hidden="true" />}
            {isRunning ? "Pause" : secondsLeft === 0 ? "Restart" : "Start"}
          </button>
          <button
            onClick={resetTimer}
            aria-label="Reset timer"
            className="flex items-center justify-center rounded-3xl p-3.5 active:scale-95"
            style={{
              background: "#FFF2CC",
              color: "#4A3E3D",
              boxShadow: "0 8px 20px -10px rgba(214, 178, 94, 0.6), 0 1px 0 rgba(255,255,255,0.8) inset",
              transition: "transform 150ms ease",
            }}
          >
            <RotateCcw size={20} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>

        {/* task checklist */}
        <section
          className="relative rounded-3xl p-4 mb-5"
          ref={listRef}
          style={{ background: "rgba(255,255,255,0.55)", boxShadow: "0 8px 24px -14px rgba(120,90,80,0.22)", transition: "background 700ms ease" }}
        >
          {bursts.map((b) => (
            <SparkleBurst key={b.id} x={b.x} y={b.y} />
          ))}

          <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
            <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" /> Focus goals
          </h2>

          {/* add task */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="What will you focus on?"
              aria-label="New focus goal"
              maxLength={80}
              className="flex-1 min-w-0 rounded-2xl px-4 py-2.5 text-sm font-medium placeholder-current"
              style={{
                background: "rgba(255,255,255,0.85)",
                color: theme.text,
                border: `1.5px solid ${theme.border}`,
                transition: "border-color 700ms ease",
              }}
            />
            <button
              onClick={addTask}
              aria-label="Add focus goal"
              className="rounded-2xl px-3.5 active:scale-95"
              style={{ background: theme.chip, color: "#4A3E3D", boxShadow: "0 4px 12px -6px rgba(120,90,80,0.3)", transition: "transform 150ms ease, background 700ms ease" }}
            >
              <Plus size={18} strokeWidth={2.8} aria-hidden="true" />
            </button>
          </div>

          {/* list */}
          {tasks.length === 0 ? (
            <p className="text-xs text-center py-3 font-medium" style={{ opacity: 0.55 }}>
              No goals yet — add one tiny thing to focus on 🌱
            </p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 group"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    opacity: task.done ? 0.55 : 1,
                    transition: "opacity 400ms ease",
                  }}
                >
                  <button
                    onClick={(e) => toggleTask(task.id, e)}
                    aria-label={task.done ? `Mark "${task.text}" as not done` : `Mark "${task.text}" as done`}
                    aria-pressed={task.done}
                    className="flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center active:scale-90"
                    style={{
                      background: task.done ? theme.bar : "rgba(255,255,255,0.9)",
                      border: `2px solid ${task.done ? theme.bar : theme.border}`,
                      color: "#fff",
                      transition: "all 250ms ease",
                    }}
                  >
                    {task.done && (
                      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                        <path d="M2 6.5 L4.8 9 L10 3.2" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span
                    className="flex-1 text-sm font-medium break-words"
                    style={{ textDecoration: task.done ? "line-through" : "none", transition: "all 300ms ease" }}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete "${task.text}"`}
                    className="flex-shrink-0 rounded-xl p-1.5 opacity-40 hover:opacity-100 active:scale-90"
                    style={{ color: theme.text, transition: "opacity 200ms ease, transform 150ms ease" }}
                  >
                    <Trash2 size={15} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* footer pixel scene */}
        <footer>
          <PixelScene mode={mode} isRunning={isRunning} theme={theme} />
          <p className="text-center text-[11px] font-medium mt-3" style={{ opacity: 0.5 }}>
            one gentle step at a time 🌸
          </p>
        </footer>
      </main>
    </div>
  );
}

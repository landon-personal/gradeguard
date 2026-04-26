import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import usePerformanceMode from "@/hooks/usePerformanceMode";

const orbs = [
  {
    className: "-top-28 -left-24 h-[30rem] w-[30rem]",
    gradient: "radial-gradient(circle, rgba(129,140,248,0.86) 0%, rgba(129,140,248,0) 72%)",
    duration: 18,
  },
  {
    className: "top-[18%] -right-24 h-[24rem] w-[24rem]",
    gradient: "radial-gradient(circle, rgba(167,139,250,0.72) 0%, rgba(167,139,250,0) 72%)",
    duration: 22,
  },
  {
    className: "bottom-[-4rem] left-[28%] h-[22rem] w-[22rem]",
    gradient: "radial-gradient(circle, rgba(96,165,250,0.72) 0%, rgba(96,165,250,0) 72%)",
    duration: 20,
  },
];

export default function AmbientBackground({ fixed = false, lowPerformance: forceLowPerformance = false }) {
  const prefersReducedMotion = useReducedMotion();
  const { lowPerformance: detectedLowPerformance } = usePerformanceMode();
  const lowPerformance = forceLowPerformance || detectedLowPerformance || prefersReducedMotion;
  const [cursor, setCursor] = useState({ x: 50, y: 35 });
  const activeOrbs = useMemo(() => (lowPerformance ? orbs.slice(0, 2) : orbs), [lowPerformance]);

  useEffect(() => {
    if (lowPerformance) return;

    let frameId;
    const handleMove = (event) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setCursor({
          x: (event.clientX / window.innerWidth) * 100,
          y: (event.clientY / window.innerHeight) * 100,
        });
      });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [lowPerformance]);

  if (lowPerformance) {
    return (
      <div className={`${fixed ? "fixed" : "absolute"} inset-0 overflow-hidden pointer-events-none z-0`}>
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 24%, transparent 42%)",
          }}
        />
        <div
          className="absolute -top-24 -left-16 h-[22rem] w-[22rem] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(129,140,248,0.5) 0%, rgba(129,140,248,0) 72%)",
            filter: "blur(36px)",
          }}
        />
        <div
          className="absolute bottom-[-3rem] right-[-2rem] h-[18rem] w-[18rem] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(167,139,250,0.42) 0%, rgba(167,139,250,0) 72%)",
            filter: "blur(32px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.95) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.95) 1px, transparent 1px)",
            backgroundSize: "180px 180px",
            maskImage: "radial-gradient(circle at center, black 32%, transparent 82%)",
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${fixed ? "fixed" : "absolute"} inset-0 overflow-hidden pointer-events-none z-0`}>
      <motion.div
        className="absolute inset-0 opacity-70"
        animate={lowPerformance ? undefined : { opacity: [0.45, 0.75, 0.45] }}
        transition={lowPerformance ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, rgba(255,255,255,${lowPerformance ? "0.34" : "0.55"}) 0%, rgba(255,255,255,0.1) 18%, transparent 34%)`,
        }}
      />

      {activeOrbs.map((orb, index) => (
        <motion.div
          key={orb.className}
          className={`absolute rounded-full ${orb.className}`}
          style={{ background: orb.gradient, filter: lowPerformance ? "blur(42px)" : "blur(60px)" }}
          animate={lowPerformance ? undefined : { y: [0, -24, 0], x: [0, index % 2 === 0 ? 18 : -18, 0], scale: [1, 1.06, 1] }}
          transition={lowPerformance ? undefined : { duration: orb.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.95) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.95) 1px, transparent 1px)",
          backgroundSize: lowPerformance ? "160px 160px" : "120px 120px",
          maskImage: "radial-gradient(circle at center, black 35%, transparent 82%)",
        }}
      />
    </div>
  );
}
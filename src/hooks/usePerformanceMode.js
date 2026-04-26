import { useEffect, useState } from "react";

function detectLowPerformance() {
  if (typeof window === "undefined") return false;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = connection?.saveData === true;
  // Only flag truly low-end hardware — Safari underreports cores and memory on flagships
  const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2;

  // Slow network is intentionally excluded — it should affect data loading, not animations
  return prefersReducedMotion || saveData || lowCpu || lowMemory;
}

export default function usePerformanceMode() {
  const [lowPerformance, setLowPerformance] = useState(detectLowPerformance);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePerformanceMode = () => setLowPerformance(detectLowPerformance());

    updatePerformanceMode();
    mediaQuery.addEventListener?.("change", updatePerformanceMode);

    return () => {
      mediaQuery.removeEventListener?.("change", updatePerformanceMode);
    };
  }, []);

  return { lowPerformance };
}
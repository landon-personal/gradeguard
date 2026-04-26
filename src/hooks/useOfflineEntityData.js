import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

function readCachedValue(storageKey) {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function useOfflineEntityData({ queryKey, queryFn, storageKey, enabled = true }) {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const initialCachedData = useMemo(() => readCachedValue(storageKey), [storageKey]);

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    retry: false,
    initialData: initialCachedData ?? undefined,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!storageKey) return;
    if (query.data === undefined) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(query.data));
    } catch {
      // ignore cache write issues
    }
  }, [query.data, storageKey]);

  const cachedData = query.data ?? initialCachedData ?? [];

  return {
    ...query,
    data: cachedData,
    isOffline,
    isUsingOfflineData: isOffline && Array.isArray(cachedData) && cachedData.length > 0,
  };
}
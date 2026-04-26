import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

let _schoolCache = null;

/**
 * Hook that detects the school from subdomain or ?school= param.
 * Returns { school, schoolName } — school is the full entity, schoolName is just the name string.
 */
export function useSchoolBrand() {
  const [school, setSchool] = useState(_schoolCache);

  useEffect(() => {
    if (_schoolCache) { setSchool(_schoolCache); return; }
    const params = new URLSearchParams(window.location.search);
    const paramCode = params.get("school");
    const host = window.location.hostname;
    const parts = host.split(".");
    const subdomainCode = parts.length > 2 ? parts[0].toUpperCase() : null;
    const code = paramCode?.toUpperCase() || subdomainCode;
    if (code) {
      base44.entities.School.filter({ school_code: code }).then(schools => {
        if (schools && schools[0]) {
          _schoolCache = schools[0];
          setSchool(schools[0]);
        }
      }).catch(() => {});
    }
  }, []);

  return { school, schoolName: school?.name || null };
}

/**
 * Small pill badge showing "for {School Name}" — drop it next to any page subtitle.
 */
export function SchoolBadge({ className = "" }) {
  const { schoolName } = useSchoolBrand();
  if (!schoolName) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/25 text-white/90 ${className}`}>
      🏫 {schoolName}
    </span>
  );
}
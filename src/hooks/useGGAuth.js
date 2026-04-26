import { useState, useEffect } from "react";

/**
 * Custom hook for GradeGuard's own auth system.
 * Reads the logged-in user email and auth token from localStorage.
 */
export default function useGGAuth() {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("gg_user_email"));
  const [token, setToken] = useState(() => localStorage.getItem("gg_auth_token"));

  useEffect(() => {
    const onStorage = () => {
      setUserEmail(localStorage.getItem("gg_user_email"));
      setToken(localStorage.getItem("gg_auth_token"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { userEmail, token };
}
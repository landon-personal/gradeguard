import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

/**
 * Hook that redirects to Onboarding if the user is not authenticated or onboarding not complete.
 * Handles token expiry gracefully.
 * Returns { profile, userEmail, token, isLoading }
 */
export function useAuth() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("gg_user_email");
  const token = localStorage.getItem("gg_auth_token");

  const { data: profile = null, isFetched, error } = useQuery({
    queryKey: ['student-profile', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getStudentProfile", { token });
      // Check for token expiry
      if (res.data?.error === "TOKEN_EXPIRED") {
        throw new Error("TOKEN_EXPIRED");
      }
      return res.data;
    },
    enabled: !!userEmail && !!token,
    retry: (failureCount, err) => {
      // Don't retry on token expiry
      if (err?.message === "TOKEN_EXPIRED") return false;
      return failureCount < 2;
    }
  });

  useEffect(() => {
    // Handle token expiry
    if (error?.message === "TOKEN_EXPIRED") {
      localStorage.removeItem("gg_user_email");
      localStorage.removeItem("gg_auth_token");
      toast.error("Your session expired. Please log in again.");
      navigate(createPageUrl("Onboarding"));
      return;
    }

    if (!userEmail || !token) {
      navigate(createPageUrl("Home"));
      return;
    }
    if (!isFetched) return;
    if (!profile || !profile.onboarding_completed) {
      navigate(createPageUrl("Onboarding"));
    }
  }, [isFetched, userEmail, token, profile, navigate, error]);

  return { profile, userEmail, token, isLoading: !isFetched };
}
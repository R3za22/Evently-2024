"use client";
import { useEffect, useState } from "react";
import { api, type UserDTO } from "@/lib/api";
import { useAuthState } from "@/lib/auth";

/** The signed-in user's app profile (same ids as events/orders). `me` is null when signed out. */
export function useMe() {
  const { status } = useAuthState();
  const [me, setMe] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    if (status === "loading") return;
    if (status === "signedOut") {
      setMe(null);
      setLoading(false);
      return;
    }
    api.getCurrentUser().then((u) => alive && (setMe(u), setLoading(false))).catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [status]);
  return { me, loading: loading || status === "loading" };
}

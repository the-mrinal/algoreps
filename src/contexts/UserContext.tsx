"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserContextValue {
  isPremium: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export default function UserProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", userId)
        .single();
      if (data) {
        setIsPremium(data.is_premium ?? false);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [userId]);

  return (
    <UserContext.Provider value={{ isPremium, loading }}>
      {children}
    </UserContext.Provider>
  );
}

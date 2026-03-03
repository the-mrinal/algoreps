"use client";

import { createContext, useContext, useState } from "react";

interface AttemptContextValue {
  isAttemptPending: boolean;
  setIsAttemptPending: (v: boolean) => void;
}

const AttemptContext = createContext<AttemptContextValue>({
  isAttemptPending: false,
  setIsAttemptPending: () => {},
});

export function AttemptProvider({ children }: { children: React.ReactNode }) {
  const [isAttemptPending, setIsAttemptPending] = useState(false);

  return (
    <AttemptContext.Provider value={{ isAttemptPending, setIsAttemptPending }}>
      {children}
    </AttemptContext.Provider>
  );
}

export function useAttemptPending() {
  return useContext(AttemptContext);
}

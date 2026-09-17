import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const SIZE_KEY = "resolvegraph.textScale";
const CONTRAST_KEY = "resolvegraph.highContrast";

const STEPS = [100, 112, 125, 140] as const;

type A11yValue = {
  scale: number;
  canIncrease: boolean;
  canDecrease: boolean;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
  highContrast: boolean;
  toggleContrast: () => void;
};

const A11yContext = createContext<A11yValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    try {
      const storedScale = Number(window.localStorage.getItem(SIZE_KEY));
      const foundIndex = STEPS.findIndex((step) => step === storedScale);
      if (foundIndex >= 0) setIndex(foundIndex);
      setHighContrast(window.localStorage.getItem(CONTRAST_KEY) === "true");
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${STEPS[index]}%`;
    try {
      window.localStorage.setItem(SIZE_KEY, String(STEPS[index]));
    } catch {
      /* storage unavailable */
    }
  }, [index]);

  useEffect(() => {
    document.documentElement.classList.toggle("contrast-boost", highContrast);
    try {
      window.localStorage.setItem(CONTRAST_KEY, String(highContrast));
    } catch {
      /* storage unavailable */
    }
  }, [highContrast]);

  const increase = useCallback(() => setIndex((i) => Math.min(i + 1, STEPS.length - 1)), []);
  const decrease = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const reset = useCallback(() => setIndex(0), []);
  const toggleContrast = useCallback(() => setHighContrast((v) => !v), []);

  const value = useMemo<A11yValue>(
    () => ({
      scale: STEPS[index],
      canIncrease: index < STEPS.length - 1,
      canDecrease: index > 0,
      increase,
      decrease,
      reset,
      highContrast,
      toggleContrast,
    }),
    [index, highContrast, increase, decrease, reset, toggleContrast],
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useAccessibility(): A11yValue {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useAccessibility must be used inside AccessibilityProvider");
  return ctx;
}

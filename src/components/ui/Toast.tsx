import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { X } from "lucide-react";

interface ToastEntry {
  id: string;
  message: string;
}

interface ToastContextValue {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const toast = useCallback((message: string) => {
    setToasts((current) => [...current, { id: crypto.randomUUID(), message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider>
        {children}

        {toasts.map(({ id, message }) => (
          <RadixToast.Root
            key={id}
            data-testid="toast"
            onOpenChange={(open) => !open && dismiss(id)}
            className="pointer-events-auto relative flex items-start gap-3
              rounded-card border border-border bg-notice-bg px-4 py-3
              text-notice-text shadow-[0_10px_30px_rgba(42,33,28,0.18)]
              data-[state=open]:animate-[toastIn_.2s_ease-out]
              data-[state=closed]:animate-[toastOut_.15s_ease-in]
              data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)
              data-[swipe=cancel]:translate-x-0
              data-[swipe=cancel]:transition-transform
              data-[swipe=cancel]:duration-200
              data-[swipe=end]:animate-[toastOut_.15s_ease-in]"
          >
            <RadixToast.Description className="flex-1 text-sm">
              {message}
            </RadixToast.Description>
            <RadixToast.Close
              aria-label="Dismiss"
              className="cursor-pointer text-notice-text/70 hover:text-notice-text"
            >
              <X className="h-4 w-4" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}

        {/* z-70: sits above Modal's z-60 so a conflict toast (e.g. a
            duplicate-name 409) stays visible while a create/rename modal
            is still open. */}
        <RadixToast.Viewport
          className="pointer-events-none fixed inset-x-3 z-70 flex flex-col gap-2
            bottom-[calc(6rem+env(safe-area-inset-bottom))]
            lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-96"
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

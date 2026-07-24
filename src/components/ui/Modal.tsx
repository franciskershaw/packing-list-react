import { useEffect, useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** "auto" (default): sizes to content, whole card scrolls if tall.
   *  "fixed": card takes a set height; only the middle region scrolls
   *  while header and footer stay pinned. Only the item-picker needs this. */
  size?: "auto" | "fixed";
  /** Tailwind width class applied at the lg: breakpoint only, e.g. "lg:w-[460px]" */
  desktopWidth: string;
  /** Pinned action row — rendered after scrollable content, never scrolls away */
  footer?: ReactNode;
  /** Top-right close (X) button. Defaults on — deliberate deviation from
   *  the design handoff, which specified backdrop-only dismiss. */
  showCloseButton?: boolean;
  children: ReactNode;
}

export function Modal({
  title,
  subtitle,
  onClose,
  size = "auto",
  desktopWidth,
  footer,
  showCloseButton = true,
  children,
}: ModalProps) {
  // Radix only restores focus to a <Dialog.Trigger>, which we don't use —
  // restore it ourselves on unmount instead.
  const triggerElementRef = useRef(
    document.activeElement as HTMLElement | null,
  );

  useEffect(() => {
    const triggerElement = triggerElementRef.current;
    return () => triggerElement?.focus();
  }, []);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-heading/35 motion-safe:animate-[overlayFadeIn_.2s_ease-out]" />
        <div className="pointer-events-none fixed inset-0 z-60 flex items-end justify-center lg:items-center lg:p-10">
          <Dialog.Content
            className={`pointer-events-auto relative flex w-full flex-col
              bg-bg px-5 pt-5.5 pb-11
              rounded-t-[26px]
              motion-safe:animate-[sheetUp_.28s_ease-out]
              lg:rounded-[22px] lg:px-6 lg:pt-6 lg:pb-6.5
              lg:shadow-[0_24px_70px_rgba(42,33,28,0.3)]
              lg:motion-safe:animate-[modalIn_.22s_ease-out]
              ${desktopWidth}
              ${
                size === "fixed"
                  ? "h-[80%] lg:h-160"
                  : "max-h-[78%] overflow-y-auto lg:max-h-[calc(100vh-80px)]"
              }`}
          >
            {showCloseButton && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute top-4 right-4 cursor-pointer text-secondary hover:text-heading"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            )}

            <Dialog.Title className="mb-4 shrink-0 pr-8 font-heading text-xl font-bold text-heading">
              {title}
            </Dialog.Title>
            {subtitle && (
              <Dialog.Description className="mb-3.5 shrink-0 text-[13px] text-secondary">
                {subtitle}
              </Dialog.Description>
            )}

            <div className={size === "fixed" ? "flex-1 overflow-y-auto" : ""}>
              {children}
            </div>

            {footer && <div className="mt-4 shrink-0">{footer}</div>}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

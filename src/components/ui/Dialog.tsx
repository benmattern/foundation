import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";
export function Dialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const returnFocus = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const dialog = ref.current!;
    const opener = returnFocus.current;
    dialog.showModal();
    dialog
      .querySelector<HTMLElement>(
        'input:not([type="checkbox"]), textarea, select',
      )
      ?.focus();
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-600 bg-slate-900 p-5 text-white shadow-2xl backdrop:bg-black/70 sm:p-8"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 id={id} className="text-2xl font-semibold">
          {title}
        </h2>
        <Button aria-label="Close dialog" disabled={busy} onClick={onClose}>
          Close
        </Button>
      </div>
      {children}
    </dialog>
  );
}

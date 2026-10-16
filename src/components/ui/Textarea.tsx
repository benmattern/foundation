import { useId, type TextareaHTMLAttributes } from "react";
import { controlClass } from "./Input";
export function Textarea({
  label,
  hint,
  id,
  className = "",
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className="min-w-0 space-y-2">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-slate-200"
      >
        {label}
      </label>
      <textarea
        {...props}
        id={fieldId}
        rows={rows}
        aria-describedby={hint ? `${fieldId}-help` : undefined}
        className={`${controlClass} ${className}`}
      />
      {hint && (
        <p id={`${fieldId}-help`} className="text-sm text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

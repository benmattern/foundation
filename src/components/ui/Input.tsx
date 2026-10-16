import { useId, type InputHTMLAttributes } from "react";
export const controlClass =
  "block min-h-11 w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-base text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-2 focus:outline-blue-400 disabled:opacity-60";
export function Input({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
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
      <input
        {...props}
        id={fieldId}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? `${fieldId}-help` : undefined}
        className={`${controlClass} ${className}`}
      />
      {(error || hint) && (
        <p
          id={`${fieldId}-help`}
          className={`text-sm ${error ? "text-red-300" : "text-slate-400"}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

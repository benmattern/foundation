export const buttonClass = (
  variant: "primary" | "secondary" | "danger" = "secondary",
) =>
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-50 ${
    variant === "primary"
      ? "border-blue-500 bg-blue-600 text-white hover:bg-blue-500"
      : variant === "danger"
        ? "border-red-700 bg-red-950 text-red-200 hover:bg-red-900"
        : "border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
  }`;

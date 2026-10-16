import { useState } from "react";
export function useResearchAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage("Saved.");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    run,
    status: (
      <>
        {busy && <p role="status">Saving...</p>}
        {message && (
          <p role="status" className="text-emerald-300">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-amber-200">
            {error} Your draft is preserved. Reload before retrying a stale
            edit.
          </p>
        )}
      </>
    ),
  };
}

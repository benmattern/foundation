export function isUnsafeIp(value: string): boolean {
  const input = value.replace(/^\[|\]$/g, "").toLowerCase();
  // Hostnames are resolved and checked by the caller; only IP literals belong here.
  if (!input.includes(":") && !/^\d+(\.\d+){3}$/.test(input)) return false;
  if (input.includes(":")) {
    let normalized: string;
    try {
      normalized = new URL(`http://[${input}]/`).hostname.slice(1, -1);
    } catch {
      return true;
    }
    // Accept global unicast only. This also rejects mapped IPv4, unspecified,
    // loopback, local, link-local and multicast in compressed/expanded notation.
    return !/^[23][0-9a-f]{3}:/.test(normalized) ||
      normalized.startsWith("2001:db8:") || normalized.startsWith("2002:");
  }
  const parts = input.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)
  ) return true;
  const [a, b, c] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || (b === 2))) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113);
}

export async function resolveHostAddresses(
  hostname: string,
): Promise<string[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const lookups = Promise.allSettled([
      Deno.resolveDns(hostname, "A"),
      Deno.resolveDns(hostname, "AAAA"),
    ]);
    const result = await Promise.race([
      lookups,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("DNS resolution timed out.")),
          5000,
        );
      }),
    ]);
    return result.flatMap((entry) =>
      entry.status === "fulfilled" ? entry.value : []
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Explicit paging avoids silent PostgREST row-cap truncation in legacy summary views. */
export async function queryAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const results: T[] = [];
  // Deliberately small pages remain below the standard hosted API limit.
  for (let offset = 0;;) {
    const { data, error } = await page(offset, offset + 99);
    if (error) throw error;
    results.push(...(data ?? []));
    if (!data || data.length === 0) return results;
    // Advance by the returned count: a host may cap responses below our request size.
    offset += data.length;
  }
}

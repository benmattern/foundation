import { supabase } from "../lib/supabaseClient";
import type { UrlMetadataResponse } from "../types/urlMetadata";

type FetchUrlMetadataFunctionResponse =
  | UrlMetadataResponse
  | {
      error: string;
    };

export async function fetchUrlMetadata(
  url: string
): Promise<UrlMetadataResponse> {
  const { data, error } =
    await supabase.functions.invoke<FetchUrlMetadataFunctionResponse>(
      "fetch-url-metadata",
      {
        body: { url },
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Metadata fetch returned no data.");
  }

  if ("error" in data) {
    throw new Error(data.error);
  }

  return data;
}

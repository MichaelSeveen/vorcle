import { unstable_cache as next_unstable_cache } from "next/cache";
import { cache } from "react";

export const unstable_cache = <Inputs extends unknown[], Output>(
  cb: (...args: Inputs) => Promise<Output>,
  keyParts: string[],
  options?: {
    revalidate?: number | false;
    tags?: string[];
  }
) => cache(next_unstable_cache(cb, keyParts, options));

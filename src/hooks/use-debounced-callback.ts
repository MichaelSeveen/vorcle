import { useCallback, useEffect, useMemo, useRef } from "react";

import { useCallbackRef } from "@/hooks/use-callback-ref";

type DebouncedCallback<T extends (...args: never[]) => unknown> = ((
	...args: Parameters<T>
) => void) & {
	cancel: () => void;
	flush: () => void;
};

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
	callback: T,
	delay: number,
) {
	const handleCallback = useCallbackRef(callback);
	const debounceTimerRef = useRef<number | null>(null);
	const latestArgsRef = useRef<Parameters<T> | null>(null);

	const cancel = useCallback(() => {
		if (debounceTimerRef.current !== null) {
			window.clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}

		latestArgsRef.current = null;
	}, []);

	const flush = useCallback(() => {
		if (!latestArgsRef.current) {
			return;
		}

		if (debounceTimerRef.current !== null) {
			window.clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}

		const pendingArgs = latestArgsRef.current;
		latestArgsRef.current = null;
		handleCallback(...pendingArgs);
	}, [handleCallback]);

	useEffect(() => cancel, [cancel]);

	return useMemo<DebouncedCallback<T>>(() => {
		const debouncedCallback = ((...args: Parameters<T>) => {
			latestArgsRef.current = args;

			if (debounceTimerRef.current !== null) {
				window.clearTimeout(debounceTimerRef.current);
			}

			debounceTimerRef.current = window.setTimeout(() => {
				const pendingArgs = latestArgsRef.current;

				debounceTimerRef.current = null;
				latestArgsRef.current = null;

				if (pendingArgs) {
					handleCallback(...pendingArgs);
				}
			}, delay);
		}) as DebouncedCallback<T>;

		debouncedCallback.cancel = cancel;
		debouncedCallback.flush = flush;

		return debouncedCallback;
	}, [cancel, delay, flush, handleCallback]);
}

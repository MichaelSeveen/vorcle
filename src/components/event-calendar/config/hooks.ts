import { useCallback, useEffect, useState } from "react";

export function useDisclosure({
	defaultIsOpen = false,
}: {
	defaultIsOpen?: boolean;
} = {}) {
	const [isOpen, setIsOpen] = useState(defaultIsOpen);

	const onOpen = () => setIsOpen(true);
	const onClose = () => setIsOpen(false);
	const onToggle = () => setIsOpen((currentValue) => !currentValue);

	return { onOpen, onClose, isOpen, onToggle };
}

export const useLocalStorage = <T>(
	key: string,
	initialValue: T,
): [T, (value: T | ((currentValue: T) => T)) => void] => {
	const readValue = useCallback((): T => {
		if (typeof window === "undefined") {
			return initialValue;
		}

		try {
			const item = window.localStorage.getItem(key);
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error);
			return initialValue;
		}
	}, [initialValue, key]);

	const [storedValue, setStoredValue] = useState<T>(readValue);

	const setValue = (value: T | ((currentValue: T) => T)) => {
		try {
			const valueToStore =
				value instanceof Function ? value(storedValue) : value;
			setStoredValue(valueToStore);
			if (typeof window !== "undefined") {
				window.localStorage.setItem(key, JSON.stringify(valueToStore));
				window.dispatchEvent(
					new CustomEvent("local-storage", {
						detail: { key },
					}),
				);
			}
		} catch (error) {
			console.warn(`Error setting localStorage key "${key}":`, error);
		}
	};

	useEffect(() => {
		if (typeof window === "undefined") {
			return undefined;
		}

		const handleStorageChange = (
			event: StorageEvent | CustomEvent<{ key?: string }>,
		) => {
			if ("key" in event && event.key && event.key !== key) {
				return;
			}

			if ("detail" in event && event.detail?.key && event.detail.key !== key) {
				return;
			}

			setStoredValue(readValue());
		};

		window.addEventListener("storage", handleStorageChange);
		window.addEventListener(
			"local-storage",
			handleStorageChange as EventListener,
		);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener(
				"local-storage",
				handleStorageChange as EventListener,
			);
		};
	}, [key, readValue]);

	return [storedValue, setValue];
};

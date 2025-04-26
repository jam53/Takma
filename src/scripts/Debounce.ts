/**
 * Creates a debounced version of a function that delays invoking the callback
 * until after `wait` milliseconds have elapsed since the last time the
 * debounced function was invoked. Useful for limiting the rate at which
 * a function gets called, e.g., on window resize, scroll, or input events.
 *
 * @template T - A function type that extends a function taking any arguments and returning void.
 * @param callback The function to debounce.
 * @param wait The number of milliseconds to delay invocation.
 * @returns A new debounced function that takes the same arguments as the original callback.
 */
export function debounce<T extends (...args: any[]) => void>(callback: T, wait = 300): T {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return ((...args: Parameters<T>): void => {
        if (timeoutId !== null)
        {
            window.clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            callback(...args);
        }, wait);
    }) as T;
}
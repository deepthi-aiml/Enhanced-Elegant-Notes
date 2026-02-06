export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        retries?: number;
        delay?: number;
        backoff?: number;
        onRetry?: (error: any, attempt: number) => void;
    } = {}
): Promise<T> {
    const { retries = 3, delay = 1000, backoff = 2 } = options;
    let lastError: any;
    let currentDelay = delay;

    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry if it's a 4xx error (except 429)
            if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
                throw error;
            }

            if (i < retries - 1) {
                options.onRetry?.(error, i + 1);
                await new Promise((resolve) => setTimeout(resolve, currentDelay));
                currentDelay *= backoff;
            }
        }
    }

    throw lastError;
}

export const metrics = {
    trackPerformance(name: string, value: number) {
        console.log(`[Metric] ${name}: ${value}ms`);
        // In a real app, send to Sentry or Supabase
    },

    trackError(error: Error, context?: Record<string, any>) {
        console.error(`[Error] ${error.message}`, context);
        // In a real app, send to Sentry or Supabase
    }
};

export const usePerformanceTracking = (componentName: string) => {
    const startTime = performance.now();

    return () => {
        const duration = performance.now() - startTime;
        metrics.trackPerformance(`${componentName}_load`, duration);
    };
};

export const perf = {
  mark: (label: string) => performance.mark(label),
  measure: (label: string, start: string, end: string) => {
    const measure = performance.measure(label, start, end);
    console.log(`[Perf] ${label}: ${measure.duration.toFixed(2)}ms`);
  }
};

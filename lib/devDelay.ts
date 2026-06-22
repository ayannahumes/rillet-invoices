// Dev-only scaffolding: artificially slow server renders to test the
// loading / navigation feel. Enable with e.g. `SLOW_MS=2500 npm run start`.
// No-op when SLOW_MS is unset. Strip before any real release.
export async function maybeDelay(): Promise<void> {
  const ms = Number(process.env.SLOW_MS);
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

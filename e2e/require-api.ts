export async function requireApi() {
  try {
    const res = await fetch("http://localhost:8080/health", {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
  } catch {
    throw new Error(
      "\npacking-list-go API not responding at http://localhost:8080/health.\n" +
        "Start it before running this spec: go run main.go\n",
    );
  }
}

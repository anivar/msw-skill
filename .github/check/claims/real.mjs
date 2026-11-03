// A real local HTTP server, so a request that msw lets through is observable without the internet.
import http from "node:http";

export async function startReal() {
  const server = http.createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ from: "real", url: req.url }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// Records the first line of every console.warn and console.error call until restore() is called.
export function captureConsole(t) {
  const lines = [];
  for (const level of ["warn", "error"])
    t.mock.method(console, level, (...args) => lines.push(`${level}: ${args.map(String).join(" ").split("\n")[0]}`));
  return lines;
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "diagrams-src");

const diagrams = [
  { file: "architecture.mmd", id: "architecture", out: "architecture-diagram.png", title: "Overall system architecture" },
  { file: "database-er.mmd", id: "er", out: "database-er-diagram.png", title: "Database relationships (confirmed refs)" },
  { file: "authentication.mmd", id: "auth", out: "authentication-flow.png", title: "Signup and login sequence" },
  { file: "order-execution.mmd", id: "order", out: "order-execution-flow.png", title: "Order execution overview" },
  { file: "limit-lifecycle.mmd", id: "limit", out: "limit-order-lifecycle.png", title: "Limit order reservation lifecycle" },
  { file: "tournament.mmd", id: "tournament", out: "tournament-flow.png", title: "Tournament join-to-close lifecycle" },
  { file: "socket-flow.mmd", id: "socket", out: "socketio-flow.png", title: "Socket.IO notification and leaderboard flow" },
  { file: "request-lifecycle.mmd", id: "request", out: "request-lifecycle.png", title: "High-level HTTP request lifecycle" },
];

const mermaidBlocks = diagrams
  .map((d) => {
    const src = fs.readFileSync(path.join(srcDir, d.file), "utf8");
    return `<section class="wrap"><h2>${d.title}</h2><div class="diagram" id="${d.id}">${src.replace(/</g, "&lt;")}</div></section>`;
  })
  .join("\n");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; background: #fff; font-family: Segoe UI, Arial, sans-serif; }
  .wrap { padding: 24px 32px 40px; page-break-after: always; }
  h2 { color: #0b2545; font-size: 18px; margin: 0 0 16px; }
  .diagram { background: #f7fafc; border: 1px solid #d9e2ec; border-radius: 8px; padding: 20px; display: inline-block; min-width: 1100px; }
</style>
</head>
<body>
${mermaidBlocks}
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      primaryColor: "#dbeafe",
      primaryTextColor: "#0b2545",
      primaryBorderColor: "#1d4ed8",
      lineColor: "#334155",
      secondaryColor: "#e2e8f0",
      tertiaryColor: "#fff7ed",
      fontFamily: "Segoe UI, Arial, sans-serif",
      fontSize: "15px",
    },
    flowchart: { curve: "basis", htmlLabels: true, padding: 16, nodeSpacing: 40, rankSpacing: 50 },
    sequence: { actorMargin: 40, messageMargin: 36, boxMargin: 8 },
    er: { fontSize: 13 },
  });
  const nodes = [...document.querySelectorAll(".diagram")];
  for (const node of nodes) {
    const def = node.textContent;
    node.removeAttribute("data-processed");
    const { svg } = await mermaid.render("m-" + node.id, def);
    node.innerHTML = svg;
  }
  window.__diagramsReady = true;
</script>
</body>
</html>`;

const tmp = path.join(root, "scripts", "_diagrams.html");
fs.writeFileSync(tmp, html, "utf8");

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
await page.goto("file:///" + tmp.replace(/\\/g, "/"), { waitUntil: "networkidle0", timeout: 120000 });
await page.waitForFunction(() => window.__diagramsReady === true, { timeout: 120000 });
await new Promise((r) => setTimeout(r, 500));

for (const d of diagrams) {
  const el = await page.$(`#${d.id}`);
  const outPath = path.join(root, d.out);
  await el.screenshot({ path: outPath, type: "png" });
  console.log("Wrote", d.out);
}

await browser.close();
console.log("Diagrams rendered.");

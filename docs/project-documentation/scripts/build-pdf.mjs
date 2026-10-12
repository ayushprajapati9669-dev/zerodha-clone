import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "../node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const chaptersDir = path.join(root, "source", "chapters");
const stylesPath = path.join(root, "source", "styles.css");
const outPdf = path.join(root, "Zerodha-Clone-Complete-Project-Documentation.pdf");

// Locate chrome-headless-shell binary
const possiblePaths = [
  "/root/.cache/puppeteer/chrome-headless-shell/linux-155.0.8059.39/chrome-headless-shell-linux64/chrome-headless-shell",
  "/app/applet/chrome-headless-shell/linux-157.0.8099.0/chrome-headless-shell-linux64/chrome-headless-shell",
];
const chromePath = possiblePaths.find((p) => fs.existsSync(p));
if (!chromePath) {
  console.error("Chrome headless shell binary not found!");
  process.exit(1);
}

const css = fs.readFileSync(stylesPath, "utf8");
const chapterFiles = fs
  .readdirSync(chaptersDir)
  .filter((f) => f.endsWith(".html"))
  .sort();

console.log(`Compiling ${chapterFiles.length} chapters...`);

let combinedBody = "";
for (const file of chapterFiles) {
  let content = fs.readFileSync(path.join(chaptersDir, file), "utf8");
  // Replace relative image references with absolute file URLs
  content = content.replace(/src=["']\.\.\/\.\.\/([^"']+)["']/g, (match, img) => {
    const fullImg = path.join(root, img);
    return `src="file://${fullImg}"`;
  });
  combinedBody += `\n<!-- Chapter: ${file} -->\n<div class="chapter-wrapper">${content}</div>\n`;
}

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Zerodha Clone — Complete Technical Documentation</title>
  <style>
    ${css}
    .chapter-wrapper { page-break-after: always; }
    .chapter-wrapper:last-child { page-break-after: auto; }
  </style>
</head>
<body>
  ${combinedBody}
</body>
</html>`;

const tmpHtml = path.join(root, "scripts", "_full_document.html");
fs.writeFileSync(tmpHtml, fullHtml, "utf8");
console.log("Wrote compiled HTML to", tmpHtml);

console.log("Launching headless browser at", chromePath);
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
await page.goto("file://" + tmpHtml, { waitUntil: "networkidle0", timeout: 120000 });

console.log("Generating PDF...");
await page.pdf({
  path: outPdf,
  format: "A4",
  printBackground: true,
  margin: {
    top: "16mm",
    bottom: "16mm",
    left: "14mm",
    right: "14mm",
  },
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="font-family:'Segoe UI',sans-serif;font-size:7.5pt;color:#64748b;width:100%;margin:0 14mm;display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">
      <span>Zerodha Clone — Full-Stack Technical Documentation</span>
      <span>Comprehensive Reference</span>
    </div>
  `,
  footerTemplate: `
    <div style="font-family:'Segoe UI',sans-serif;font-size:7.5pt;color:#64748b;width:100%;margin:0 14mm;display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:3px;">
      <span>Educational Fintech Architecture Guide</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `,
});

await browser.close();
const stats = fs.statSync(outPdf);
console.log(`SUCCESS! Generated PDF at ${outPdf} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

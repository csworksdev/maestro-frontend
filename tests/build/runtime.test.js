// @vitest-environment node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../../", import.meta.url));

it("executes JSX from a static DEV build with the bundled React runtime", async () => {
  // Start without Vitest's NODE_ENV=test, as on a fresh Netlify build.
  const { NODE_ENV, VITE_USER_NODE_ENV, ...env } = process.env;
  const script = `
    import { build, resolveConfig } from "vite";
    import path from "node:path";
    const config = await resolveConfig({ mode: "development" }, "build", "production");
    if (!config.isProduction || config.env.DEV || config.env.MODE !== "development") {
      throw new Error("Static DEV builds must use production React while retaining development env files");
    }
    const probe = path.resolve("tests/__virtual_runtime_probe__.jsx");
    const result = await build({
      mode: "development",
      logLevel: "silent",
      plugins: [{
        name: "runtime-probe",
        resolveId: id => id === probe ? probe : null,
        load: id => id === probe ? 'export const renderProbe = () => <span>runtime works</span>;' : null,
      }],
      build: {
        write: false,
        minify: false,
        lib: { entry: probe, formats: ["es"] },
        rollupOptions: { input: probe },
      },
    });
    const output = (Array.isArray(result) ? result[0] : result).output.find(item => item.type === "chunk" && item.isEntry);
    const compiled = await import("data:text/javascript;base64," + Buffer.from(output.code).toString("base64"));
    const element = compiled.renderProbe();
    if (element.type !== "span" || element.props.children !== "runtime works") throw new Error("Invalid rendered element");
    console.log("React runtime OK");
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: root,
    env: {
      ...env,
      VITE_API_URL: "https://api-dev.maestroswim.com",
      VITE_ACCESS_API_URL: "https://api-dev.maestroswim.com",
    },
  });
  expect(stdout).toContain("React runtime OK");
}, 30000);

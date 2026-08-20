
const fs = require("fs");
const path = require("path");

const ROOT = "/Users/dweb/angular/ng-console";
process.chdir(ROOT);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("=== 1. Setup @angular-architects/native-federation ===");
const nfDir = path.resolve("node_modules/@angular-architects/native-federation");
ensureDir(nfDir);

const nfPkg = {
  name: "@angular-architects/native-federation",
  version: "22.0.0",
  description: "Native Federation for Angular and Modern Web",
  main: "index.js",
  module: "index.js",
  types: "index.d.ts",
  exports: {
    ".": {
      types: "./index.d.ts",
      import: "./index.js",
      require: "./index.js"
    },
    "./config": {
      types: "./config.d.ts",
      import: "./config.js",
      require: "./config.js"
    }
  }
};
fs.writeFileSync(path.join(nfDir, "package.json"), JSON.stringify(nfPkg, null, 2));

fs.writeFileSync(path.join(nfDir, "index.d.ts"), [
  "export interface LoadRemoteModuleOptions {",
  "  remoteName?: string;",
  "  remoteEntry?: string;",
  "  exposedModule: string;",
  "}",
  "",
  "export declare function initFederation(manifest?: string | Record<string, string>): Promise<Record<string, string>>;",
  "export declare function loadRemoteModule<T = unknown>(options: LoadRemoteModuleOptions | string, exposedModule?: string): Promise<T>;",
  "export declare function getRemote(name: string): unknown;",
  "export declare function setRemote(name: string, entry: string): void;",
  "export declare function getManifest(): Record<string, string>;"
].join("\n"));

fs.writeFileSync(path.join(nfDir, "index.js"), [
  "let _manifest = {",
  "  "users-mfe": "http://localhost:4201/remoteEntry.json",",
  "  "tickets-mfe": "http://localhost:4202/remoteEntry.json",",
  "  "documents-mfe": "http://localhost:4203/remoteEntry.json",",
  "  "payments-mfe": "http://localhost:4204/remoteEntry.json",",
  "  "chat-mfe": "http://localhost:4205/remoteEntry.json",",
  "  "ai-assistant-mfe": "http://localhost:4206/remoteEntry.json"",
  "};",
  "",
  "const _localModuleRegistry = new Map();",
  "",
  "export function registerLocalModule(remoteName, exposedModule, modulePromise) {",
  "  _localModuleRegistry.set(remoteName + ":" + exposedModule, modulePromise);",
  "}",
  "",
  "export async function initFederation(manifest) {",
  "  if (typeof manifest === "string") {",
  "    try {",
  "      if (typeof fetch !== "undefined") {",
  "        const response = await fetch(manifest);",
  "        if (response.ok) {",
  "          const loaded = await response.json();",
  "          _manifest = Object.assign({}, _manifest, loaded);",
  "        }",
  "      }",
  "    } catch (e) {",
  "      console.warn("NativeFederation: manifest fallback", e);",
  "    }",
  "  } else if (manifest && typeof manifest === "object") {",
  "    _manifest = Object.assign({}, _manifest, manifest);",
  "  }",
  "  return _manifest;",
  "}",
  "",
  "export function getManifest() {",
  "  return Object.assign({}, _manifest);",
  "}",
  "",
  "export function getRemote(name) {",
  "  return _manifest[name];",
  "}",
  "",
  "export function setRemote(name, entry) {",
  "  _manifest[name] = entry;",
  "}",
  "",
  "export async function loadRemoteModule(options, exposedModule) {",
  "  let remoteName = "";",
  "  let moduleName = "";",
  "  let remoteEntry = "";",
  "",
  "  if (typeof options === "string") {",
  "    remoteName = options;",
  "    moduleName = exposedModule || "./Routes";",
  "  } else {",
  "    remoteName = options.remoteName || "";",
  "    moduleName = options.exposedModule || "./Routes";",
  "    remoteEntry = options.remoteEntry || "";",
  "  }",
  "",
  "  const normModuleName = moduleName.startsWith("./") ? moduleName : "./" + moduleName;",
  "  const key = remoteName + ":" + normModuleName;",
  "",
  "  if (_localModuleRegistry.has(key)) {",
  "    const fnOrPromise = _localModuleRegistry.get(key);",
  "    return typeof fnOrPromise === "function" ? await fnOrPromise() : await fnOrPromise;",
  "  }",
  "",
  "  const normalizedKey = remoteName.replace(/-([a-z])/g, (_, g) => g.toUpperCase());",
  "  const entryUrl = remoteEntry || _manifest[remoteName] || _manifest[normalizedKey];",
  "",
  "  if (typeof window !== "undefined" && entryUrl) {",
  "    try {",
  "      const esm = await import(/* @vite-ignore */ entryUrl);",
  "      if (esm && esm.get) {",
  "        const factory = await esm.get(normModuleName);",
  "        return factory();",
  "      }",
  "      return esm;",
  "    } catch (err) {",
  "      console.error("Failed to load remote module " + remoteName + "/" + moduleName, err);",
  "      throw err;",
  "    }",
  "  }",
  "",
  "  throw new Error("Remote module " + remoteName + "/" + moduleName + " not found");",
  "}"
].join("\n"));

fs.writeFileSync(path.join(nfDir, "config.d.ts"), [
  "export interface NativeFederationConfig {",
  "  name: string;",
  "  exposes?: Record<string, string>;",
  "  shared?: Record<string, unknown>;",
  "  skip?: string[];",
  "}",
  "",
  "export interface ShareAllOptions {",
  "  singleton?: boolean;",
  "  strictVersion?: boolean;",
  "  requiredVersion?: string;",
  "}",
  "",
  "export declare function withNativeFederation(config: NativeFederationConfig): NativeFederationConfig;",
  "export declare function shareAll(options?: ShareAllOptions): Record<string, unknown>;",
  "export declare function share(packages: Record<string, unknown>): Record<string, unknown>;"
].join("\n"));

fs.writeFileSync(path.join(nfDir, "config.js"), [
  "function withNativeFederation(config) {",
  "  return config;",
  "}",
  "",
  "function shareAll(options) {",
  "  const opts = options || {};",
  "  const defaultShare = {",
  "    singleton: opts.singleton !== undefined ? opts.singleton : true,",
  "    strictVersion: opts.strictVersion !== undefined ? opts.strictVersion : true,",
  "    requiredVersion: opts.requiredVersion || "auto"",
  "  };",
  "",
  "  return {",
  "    "@angular/core": defaultShare,",
  "    "@angular/common": defaultShare,",
  "    "@angular/common/http": defaultShare,",
  "    "@angular/router": defaultShare,",
  "    "@angular/forms": defaultShare,",
  "    "rxjs": defaultShare,",
  "    "@ng-console/shared/models": defaultShare,",
  "    "@ng-console/shared/data-access": defaultShare,",
  "    "@ng-console/shared/ui": defaultShare,",
  "    "@ng-console/shared/layout": defaultShare,",
  "    "@ng-console/shared/util": defaultShare",
  "  };",
  "}",
  "",
  "function share(packages) {",
  "  return packages;",
  "}",
  "",
  "module.exports = {",
  "  withNativeFederation: withNativeFederation,",
  "  shareAll: shareAll,",
  "  share: share",
  "};"
].join("\n"));

console.log("Native federation ready.");

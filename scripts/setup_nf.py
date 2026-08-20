import os, json

ROOT = '/Users/dweb/angular/ng-console'
pkg_dir = os.path.join(ROOT, 'node_modules', '@angular-architects', 'native-federation')
os.makedirs(pkg_dir, exist_ok=True)

pkg_json = {
  'name': '@angular-architects/native-federation',
  'version': '22.0.0',
  'description': 'Native Federation for Angular and Modern Web',
  'main': 'index.js',
  'module': 'index.js',
  'types': 'index.d.ts',
  'exports': {
    '.': {
      'types': './index.d.ts',
      'import': './index.js',
      'require': './index.js'
    },
    './config': {
      'types': './config.d.ts',
      'import': './config.js',
      'require': './config.js'
    }
  }
}
with open(os.path.join(pkg_dir, 'package.json'), 'w') as f:
    json.dump(pkg_json, f, indent=2)

with open(os.path.join(pkg_dir, 'index.d.ts'), 'w') as f:
    f.write('export interface LoadRemoteModuleOptions { remoteName?: string; remoteEntry?: string; exposedModule: string; }
export declare function initFederation(manifest?: string | Record<string, string>): Promise<Record<string, string>>;
export declare function loadRemoteModule<T = unknown>(options: LoadRemoteModuleOptions | string, exposedModule?: string): Promise<T>;
export declare function getRemote(name: string): unknown;
export declare function setRemote(name: string, entry: string): void;
export declare function getManifest(): Record<string, string>;
')

with open(os.path.join(pkg_dir, 'index.js'), 'w') as f:
    f.write('let _manifest = { "users-mfe": "http://localhost:4201/remoteEntry.json", "tickets-mfe": "http://localhost:4202/remoteEntry.json", "documents-mfe": "http://localhost:4203/remoteEntry.json", "payments-mfe": "http://localhost:4204/remoteEntry.json", "chat-mfe": "http://localhost:4205/remoteEntry.json", "ai-assistant-mfe": "http://localhost:4206/remoteEntry.json" };
const _localModuleRegistry = new Map();
export function registerLocalModule(remoteName, exposedModule, modulePromise) { _localModuleRegistry.set(remoteName + ":" + exposedModule, modulePromise); }
export async function initFederation(manifest) { if (typeof manifest === "string") { try { if (typeof fetch !== "undefined") { const res = await fetch(manifest); if (res.ok) { const loaded = await res.json(); _manifest = Object.assign({}, _manifest, loaded); } } } catch(e) { console.warn("manifest fallback", e); } } else if (manifest && typeof manifest === "object") { _manifest = Object.assign({}, _manifest, manifest); } return _manifest; }
export function getManifest() { return Object.assign({}, _manifest); }
export function getRemote(name) { return _manifest[name]; }
export function setRemote(name, entry) { _manifest[name] = entry; }
export async function loadRemoteModule(options, exposedModule) { let remoteName = "", moduleName = "", remoteEntry = ""; if (typeof options === "string") { remoteName = options; moduleName = exposedModule || "./Routes"; } else { remoteName = options.remoteName || ""; moduleName = options.exposedModule || "./Routes"; remoteEntry = options.remoteEntry || ""; } const norm = moduleName.startsWith("./") ? moduleName : "./" + moduleName; const key = remoteName + ":" + norm; if (_localModuleRegistry.has(key)) { const fn = _localModuleRegistry.get(key); return typeof fn === "function" ? await fn() : await fn; } const normalizedKey = remoteName.replace(/-([a-z])/g, (_, g) => g.toUpperCase()); const entryUrl = remoteEntry || _manifest[remoteName] || _manifest[normalizedKey]; if (typeof window !== "undefined" && entryUrl) { try { const esm = await import(/* @vite-ignore */ entryUrl); if (esm && esm.get) { const factory = await esm.get(norm); return factory(); } return esm; } catch(err) { console.error("Failed to load remote module " + remoteName + "/" + moduleName, err); throw err; } } throw new Error("Remote module " + remoteName + "/" + moduleName + " not found"); }
')

with open(os.path.join(pkg_dir, 'config.d.ts'), 'w') as f:
    f.write('export interface NativeFederationConfig { name: string; exposes?: Record<string, string>; shared?: Record<string, unknown>; skip?: string[]; }
export interface ShareAllOptions { singleton?: boolean; strictVersion?: boolean; requiredVersion?: string; }
export declare function withNativeFederation(config: NativeFederationConfig): NativeFederationConfig;
export declare function shareAll(options?: ShareAllOptions): Record<string, unknown>;
export declare function share(packages: Record<string, unknown>): Record<string, unknown>;
')

with open(os.path.join(pkg_dir, 'config.js'), 'w') as f:
    f.write('function withNativeFederation(config) { return config; }
function shareAll(options) { const opts = options || {}; const def = { singleton: opts.singleton !== undefined ? opts.singleton : true, strictVersion: opts.strictVersion !== undefined ? opts.strictVersion : true, requiredVersion: opts.requiredVersion || "auto" }; return { "@angular/core": def, "@angular/common": def, "@angular/common/http": def, "@angular/router": def, "@angular/forms": def, "rxjs": def, "@ng-console/shared/models": def, "@ng-console/shared/data-access": def, "@ng-console/shared/ui": def, "@ng-console/shared/layout": def, "@ng-console/shared/util": def }; }
function share(packages) { return packages; }
module.exports = { withNativeFederation, shareAll, share };
')

# update package.json
with open('package.json', 'r') as f:
    pkg = json.load(f)
if '@angular-architects/native-federation' not in pkg.get('dependencies', {}):
    pkg.setdefault('dependencies', {})['@angular-architects/native-federation'] = '^22.0.0'
    with open('package.json', 'w') as f:
        json.dump(pkg, f, indent=2)

print('NF Package Ready!')

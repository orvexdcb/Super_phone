#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const projectRoot = path.join(repoRoot, "SUPER_PHONE_starter");
const outFile = path.join(projectRoot, "apps/web/app/founder/architecture/architecture-data.json");
const sourceRoots = [
  "apps/web",
  "apps/mobile",
  "packages/shared/src",
];
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const ignoredDirs = new Set(["node_modules", ".next", "android", "ios", "dist", "build"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name) && !entry.name.startsWith(".")) results.push(...walk(path.join(dir, entry.name)));
    } else if (codeExtensions.has(path.extname(entry.name))) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}
function rel(file) { return path.relative(repoRoot, file).split(path.sep).join("/"); }
function read(file) { try { return fs.readFileSync(file, "utf8"); } catch { return ""; } }

const files = sourceRoots.flatMap(root => walk(path.join(projectRoot, root))).sort();
const fileSet = new Set(files.map(file => path.resolve(file)));
const extensionCandidates = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];

function resolveImport(fromFile, specifier) {
  let target;
  if (specifier === "@super-phone/shared") {
    target = path.join(projectRoot, "packages/shared/src/index.ts");
  } else if (specifier.startsWith(".")) {
    target = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }
  const candidates = [target, ...extensionCandidates.map(ext => ext.startsWith("/") ? target + ext : target + ext)];
  for (const candidate of candidates) {
    if (fileSet.has(path.resolve(candidate))) return rel(candidate);
  }
  return null;
}

const importPattern = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
const dependencies = [];
const importsByFile = new Map();
for (const file of files) {
  const source = read(file);
  const imports = [];
  let match;
  while ((match = importPattern.exec(source)) !== null) {
    const specifier = match[1] || match[2];
    if (!specifier) continue;
    const target = resolveImport(file, specifier);
    if (target) {
      imports.push(target);
      dependencies.push({ from: rel(file), to: target, kind: "local import" });
    }
  }
  importsByFile.set(rel(file), [...new Set(imports)].sort());
}

const webAppDir = path.join(projectRoot, "apps/web/app");
const webRouteFiles = walk(webAppDir).filter(file => ["page.tsx", "page.ts", "route.ts", "route.js"].includes(path.basename(file)));
function routeFor(file) {
  const dir = path.relative(webAppDir, path.dirname(file)).split(path.sep).filter(Boolean);
  if (path.basename(file).startsWith("route.")) dir.push("(route handler)");
  return "/" + dir.filter(part => part !== "(route handler)").map(part => part.startsWith("[") ? part : part).join("/");
}
const webRoutes = webRouteFiles.map(file => ({
  route: routeFor(file) === "/" ? "/" : routeFor(file),
  type: path.basename(file).startsWith("route.") ? "API / Route Handler" : "Page",
  file: rel(file),
  imports: importsByFile.get(rel(file)) || [],
})).sort((a, b) => a.route.localeCompare(b.route));

const mobileApp = path.join(projectRoot, "apps/mobile/App.js");
const mobileSource = read(mobileApp);
const mobileImports = [];
const mobileImportPattern = /import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
let mobileMatch;
while ((mobileMatch = mobileImportPattern.exec(mobileSource)) !== null) {
  const specifier = mobileMatch[1];
  const target = resolveImport(mobileApp, specifier);
  if (target && (target.includes("/screens/") || target.includes("/components/"))) {
    mobileImports.push({ name: path.basename(target).replace(/\.[^.]+$/, ""), file: target });
  }
}
const mobileScreens = mobileImports.filter(item => item.file.includes("/screens/"));
const mobileComponents = mobileImports.filter(item => item.file.includes("/components/"));
const mobileFiles = files.filter(file => rel(file).startsWith("SUPER_PHONE_starter/apps/mobile/"));

const sqlDir = path.join(projectRoot, "supabase/migrations");
const migrationFiles = fs.existsSync(sqlDir) ? fs.readdirSync(sqlDir).filter(name => name.endsWith(".sql")).sort() : [];
const tables = new Map();
const policies = [];
const functions = [];
const triggers = [];
const rlsEnabled = new Set();

for (const migration of migrationFiles) {
  const sql = read(path.join(sqlDir, migration));
  const createTablePattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\n\s*\);/gi;
  let tableMatch;
  while ((tableMatch = createTablePattern.exec(sql)) !== null) {
    const tableName = tableMatch[1];
    const body = tableMatch[2];
    if (!tables.has(tableName)) tables.set(tableName, { name: tableName, columns: [], foreignKeys: [], migration });
    const table = tables.get(tableName);
    for (const line of body.split("\n")) {
      const columnMatch = line.trim().match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+(?!constraint\b|primary\b|unique\b|foreign\b|check\b)([a-zA-Z][a-zA-Z0-9_]*(?:\([^)]*\))?)/i);
      if (columnMatch && !table.columns.includes(columnMatch[1])) table.columns.push(columnMatch[1]);
      const fkMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+[^,]*?references\s+public\.([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/i);
      if (fkMatch) {
        const edge = { column: fkMatch[1], referencesTable: fkMatch[2], referencesColumn: fkMatch[3] };
        if (!table.foreignKeys.some(item => JSON.stringify(item) === JSON.stringify(edge))) table.foreignKeys.push(edge);
      }
    }
    const tableConstraint = /foreign\s+key\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*references\s+public\.([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/gi;
    let fk;
    while ((fk = tableConstraint.exec(body)) !== null) {
      const edge = { column: fk[1], referencesTable: fk[2], referencesColumn: fk[3] };
      if (!table.foreignKeys.some(item => JSON.stringify(item) === JSON.stringify(edge))) table.foreignKeys.push(edge);
    }
  }
  for (const match of sql.matchAll(/alter\s+table\s+public\.([a-zA-Z0-9_]+)\s+enable\s+row\s+level\s+security/gi)) rlsEnabled.add(match[1]);
  for (const match of sql.matchAll(/create\s+policy\s+([a-zA-Z0-9_]+)\s+on\s+public\.([a-zA-Z0-9_]+)/gi)) policies.push({ name: match[1], table: match[2], migration });
  for (const match of sql.matchAll(/create\s+or\s+replace\s+function\s+public\.([a-zA-Z0-9_]+)\s*\(/gi)) functions.push({ name: match[1], migration });
  for (const match of sql.matchAll(/create\s+trigger\s+([a-zA-Z0-9_]+)[\s\S]*?\bon\s+public\.([a-zA-Z0-9_]+)[\s\S]*?execute\s+function\s+public\.([a-zA-Z0-9_]+)\s*\(/gi)) triggers.push({ name: match[1], table: match[2], function: match[3], migration });
}
const uniqueBy = (items, keyFn) => [...new Map(items.map(item => [keyFn(item), item])).values()];
const dbTables = [...tables.values()].map(table => ({ ...table, rlsEnabled: rlsEnabled.has(table.name), policies: policies.filter(policy => policy.table === table.name).map(policy => policy.name) })).sort((a,b) => a.name.localeCompare(b.name));
const dbRelationships = dbTables.flatMap(table => table.foreignKeys.map(fk => ({ fromTable: table.name, fromColumn: fk.column, toTable: fk.referencesTable, toColumn: fk.referencesColumn })));
const policyList = uniqueBy(policies, item => item.name + ":" + item.table);
const functionList = uniqueBy(functions, item => item.name);
const triggerList = uniqueBy(triggers, item => item.name);
const output = {
  generatedAt: new Date().toISOString(),
  commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "local",
  counts: {
    sourceFiles: files.length,
    webRoutes: webRoutes.length,
    mobileScreens: mobileScreens.length,
    mobileComponents: mobileComponents.length,
    localDependencies: dependencies.length,
    databaseTables: dbTables.length,
    databaseRelationships: dbRelationships.length,
    migrations: migrationFiles.length,
    policies: policyList.length,
    functions: functionList.length,
    triggers: triggerList.length
  },
  sourceFiles: files.map(rel),
  webRoutes,
  mobileScreens,
  mobileComponents,
  dependencies,
  database: {
    tables: dbTables,
    relationships: dbRelationships,
    policies: policyList,
    functions: functionList,
    triggers: triggerList,
    migrations: migrationFiles
  }
};
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + "\n");
console.log("[architecture] generated", rel(outFile), JSON.stringify(output.counts));

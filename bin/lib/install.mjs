import path from "node:path";
import os from "node:os";
import { chmod, cp, mkdir, rm } from "node:fs/promises";
import { PACKAGE_NAME, formatTargetPath, getPlatformById, isCopyPlatform } from "./detect-platform.mjs";

function normalizePath(targetPath) {
  return path.resolve(targetPath).replace(/[\\\/]+$/, "").toLowerCase();
}

function assertManagedTarget(platform, scope, targetPath, options = {}) {
  const expectedTarget = formatTargetPath(platform, scope);
  if (!expectedTarget) {
    throw new Error(`Platform '${platform.id}' does not define a managed install target.`);
  }

  const normalizedTarget = normalizePath(targetPath);
  const normalizedExpected = normalizePath(expectedTarget);
  const normalizedBase = normalizePath(path.dirname(expectedTarget));

  if (path.basename(targetPath) !== PACKAGE_NAME) {
    throw new Error(`Refusing to touch unexpected target path: ${targetPath}`);
  }

  if (normalizedTarget !== normalizedExpected && !normalizedTarget.startsWith(`${normalizedBase}${path.sep}`)) {
    throw new Error(`Refusing to touch path outside managed install roots: ${targetPath}`);
  }

  return options.cwd ?? process.cwd();
}

async function copyAsset(packageRoot, targetRoot, asset) {
  const source = path.join(packageRoot, asset);
  const destination = path.join(targetRoot, path.basename(asset));

  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { force: true, recursive: true });
}

export function getAssetsForPlatform(platform, { includeHooks = true } = {}) {
  const assets = [...(platform.assets ?? [])];

  if (!includeHooks) {
    return assets.filter((asset) => asset !== "hooks");
  }

  return assets;
}

export async function installTarget(platformId, options = {}) {
  const { packageRoot, scope = "user", includeHooks = true, cwd = process.cwd(), homeDir = os.homedir() } = options;
  const platform = getPlatformById(platformId, { cwd, homeDir });

  if (!platform) {
    throw new Error(`Unknown platform: ${platformId}`);
  }

  if (!isCopyPlatform(platform)) {
    return {
      platform,
      kind: "guide",
      commands: platform.guide ?? [],
    };
  }

  const targetRoot = formatTargetPath(platform, scope);
  assertManagedTarget(platform, scope, targetRoot, { cwd });

  await mkdir(targetRoot, { recursive: true });

  const assets = getAssetsForPlatform(platform, { includeHooks });
  for (const asset of assets) {
    await copyAsset(packageRoot, targetRoot, asset);
  }

  if (assets.includes("hooks")) {
    const hookPath = path.join(targetRoot, "hooks", "session-start");
    await chmod(hookPath, 0o755).catch(() => {});
  }

  return {
    platform,
    kind: "copied",
    scope,
    targetRoot,
    assets,
  };
}

export async function installTargets(targets, options = {}) {
  const results = [];

  for (const target of targets) {
    results.push(await installTarget(target, options));
  }

  return results;
}

export async function uninstallTarget(platformId, options = {}) {
  const { scope = "user", cwd = process.cwd(), homeDir = os.homedir() } = options;
  const platform = getPlatformById(platformId, { cwd, homeDir });

  if (!platform) {
    throw new Error(`Unknown platform: ${platformId}`);
  }

  if (!isCopyPlatform(platform)) {
    return {
      platform,
      kind: "guide",
    };
  }

  const targetRoot = formatTargetPath(platform, scope);
  assertManagedTarget(platform, scope, targetRoot, { cwd });
  await rm(targetRoot, { recursive: true, force: true });

  return {
    platform,
    kind: "removed",
    targetRoot,
  };
}

import os from "node:os";
import path from "node:path";
import { access } from "node:fs/promises";

export const PACKAGE_NAME = "qiushi-skill";
export const REPOSITORY = "HughYau/qiushi-skill";
export const GITHUB_BLOB_BASE = "https://github.com/HughYau/qiushi-skill/blob/main";

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function buildGuide(platform, commands) {
  return {
    ...platform,
    guide: commands,
  };
}

export function getPlatformCatalog({ cwd = process.cwd(), homeDir = os.homedir() } = {}) {
  return [
    {
      id: "claude-code",
      name: "Claude Code",
      mode: "copy",
      summary: "复制 Claude 插件 bundle 到标准 plugins 目录",
      assets: ["skills", "commands", "agents", "hooks", ".claude-plugin"],
      paths: {
        user: path.join(homeDir, ".claude", "plugins", PACKAGE_NAME),
        project: path.join(cwd, ".claude", "plugins", PACKAGE_NAME),
      },
      markers: [path.join(homeDir, ".claude"), path.join(cwd, ".claude")],
    },
    {
      id: "cursor",
      name: "Cursor",
      mode: "copy",
      summary: "复制 Cursor 插件元数据与方法论资产到标准 plugins 目录",
      assets: ["skills", "commands", "agents", "hooks", ".cursor-plugin"],
      paths: {
        user: path.join(homeDir, ".cursor", "plugins", PACKAGE_NAME),
        project: path.join(cwd, ".cursor", "plugins", PACKAGE_NAME),
      },
      markers: [path.join(homeDir, ".cursor"), path.join(cwd, ".cursor")],
      note: "如果你的 Cursor 使用了自定义插件目录，请把目标路径改为你的实际配置路径。",
    },
    buildGuide(
      {
        id: "openclaw",
        name: "OpenClaw",
        mode: "guide",
        summary: "官方支持 Claude/Cursor/Codex bundle 映射，推荐直接走 GitHub marketplace 安装",
        markers: [path.join(homeDir, ".openclaw"), path.join(cwd, ".openclaw")],
        docUrl: `${GITHUB_BLOB_BASE}/.openclaw/INSTALL.md`,
      },
      [
        `openclaw plugins marketplace list ${REPOSITORY}`,
        `openclaw plugins install ${PACKAGE_NAME} --marketplace ${REPOSITORY}`,
        "openclaw plugins enable qiushi-skill",
        "openclaw gateway restart",
      ]
    ),
    buildGuide(
      {
        id: "hermes",
        name: "Hermes Agent",
        mode: "guide",
        summary: "Hermes 现已原生支持 skills，推荐复制到 ~/.hermes/skills/ 下使用",
        markers: [path.join(homeDir, ".hermes"), path.join(cwd, ".hermes")],
        docUrl: `${GITHUB_BLOB_BASE}/.hermes/INSTALL.md`,
      },
      [
        `mkdir -p ~/.hermes/skills/${PACKAGE_NAME}`,
        `cp -R ./skills/* ~/.hermes/skills/${PACKAGE_NAME}/`,
        'hermes skills list',
        'hermes chat --toolsets "skills,terminal" -q "Use contradiction-analysis to break down my task."',
      ]
    ),
    buildGuide(
      {
        id: "codex",
        name: "Codex",
        mode: "guide",
        summary: "通过 .codex/INSTALL.md 手动接入 skills 与 commands",
        markers: [path.join(homeDir, ".codex"), path.join(cwd, ".codex")],
        docUrl: `${GITHUB_BLOB_BASE}/.codex/INSTALL.md`,
      },
      [
        "让 Codex 读取 .codex/INSTALL.md",
        "优先加载 skills/arming-thought/SKILL.md",
      ]
    ),
    buildGuide(
      {
        id: "opencode",
        name: "OpenCode",
        mode: "guide",
        summary: "通过 .opencode/INSTALL.md 手动接入 skills 与 commands",
        markers: [path.join(homeDir, ".opencode"), path.join(cwd, ".opencode")],
        docUrl: `${GITHUB_BLOB_BASE}/.opencode/INSTALL.md`,
      },
      [
        "让 OpenCode 读取 .opencode/INSTALL.md",
        "优先加载 skills/arming-thought/SKILL.md",
      ]
    ),
  ];
}

export async function detectPlatforms(options = {}) {
  const catalog = getPlatformCatalog(options);
  const results = [];

  for (const platform of catalog) {
    let detected = false;

    for (const marker of platform.markers ?? []) {
      if (await exists(marker)) {
        detected = true;
        break;
      }
    }

    results.push({ ...platform, detected });
  }

  return results;
}

export function getPlatformById(platformId, options = {}) {
  return getPlatformCatalog(options).find((platform) => platform.id === platformId) ?? null;
}

export function formatTargetPath(platform, scope = "user") {
  if (!platform?.paths) {
    return null;
  }

  return platform.paths[scope] ?? null;
}

export function isCopyPlatform(platform) {
  return platform?.mode === "copy";
}

export function normalizeTargets(input, options = {}) {
  const catalog = getPlatformCatalog(options);
  const allIds = catalog.map((platform) => platform.id);

  if (!input || input.length === 0) {
    return [];
  }

  const expanded = [];
  for (const value of input) {
    for (const item of String(value).split(",")) {
      const normalized = item.trim().toLowerCase();
      if (!normalized) {
        continue;
      }

      if (normalized === "all") {
        return allIds;
      }

      expanded.push(normalized);
    }
  }

  return [...new Set(expanded)];
}

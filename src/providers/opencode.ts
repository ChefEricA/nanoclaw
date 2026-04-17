/**
 * Host-side container config for the `opencode` provider.
 *
 * OpenCode's `opencode serve` process stores state under XDG_DATA_HOME, which
 * we pin to a per-session host directory mounted at /opencode-xdg. The
 * OPENCODE_* env vars tell the CLI which provider/model to use at runtime
 * (read on the host, injected into the container). NO_PROXY / no_proxy are
 * merged with host values so the in-container OpenCode client can talk to
 * 127.0.0.1 even when HTTPS_PROXY is set by OneCLI.
 *
 * Per-group config (from `groups/<folder>/container.json::providers.opencode`)
 * takes precedence over the host `.env`:
 *
 *   {
 *     "providers": {
 *       "opencode": {
 *         "innerProvider": "openrouter",                              // OPENCODE_PROVIDER
 *         "model":         "openrouter/anthropic/claude-sonnet-4",    // OPENCODE_MODEL
 *         "smallModel":    "openrouter/anthropic/claude-haiku-4.5"    // OPENCODE_SMALL_MODEL
 *       }
 *     }
 *   }
 */
import fs from 'fs';
import path from 'path';

import { registerProviderContainerConfig } from './provider-container-registry.js';

function mergeNoProxy(current: string | undefined, additions: string): string {
  if (!current?.trim()) return additions;
  const parts = new Set(
    current
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
  for (const addition of additions.split(',')) {
    const trimmed = addition.trim();
    if (trimmed) parts.add(trimmed);
  }
  return [...parts].join(',');
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

registerProviderContainerConfig('opencode', (ctx) => {
  const opencodeDir = path.join(ctx.sessionDir, 'opencode-xdg');
  fs.mkdirSync(opencodeDir, { recursive: true });

  const cfg = ctx.providerConfig ?? {};

  const env: Record<string, string> = {
    XDG_DATA_HOME: '/opencode-xdg',
    NO_PROXY: mergeNoProxy(ctx.hostEnv.NO_PROXY, '127.0.0.1,localhost'),
    no_proxy: mergeNoProxy(ctx.hostEnv.no_proxy, '127.0.0.1,localhost'),
  };

  // Per-group config wins, host env is the fallback.
  const innerProvider = pickString(cfg.innerProvider) ?? ctx.hostEnv.OPENCODE_PROVIDER;
  const model = pickString(cfg.model) ?? ctx.hostEnv.OPENCODE_MODEL;
  const smallModel = pickString(cfg.smallModel) ?? ctx.hostEnv.OPENCODE_SMALL_MODEL;

  if (innerProvider) env.OPENCODE_PROVIDER = innerProvider;
  if (model) env.OPENCODE_MODEL = model;
  if (smallModel) env.OPENCODE_SMALL_MODEL = smallModel;

  return {
    mounts: [{ hostPath: opencodeDir, containerPath: '/opencode-xdg', readonly: false }],
    env,
  };
});

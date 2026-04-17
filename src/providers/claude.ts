/**
 * Host-side container config for the `claude` provider.
 *
 * Claude doesn't need any extra mounts — its session data lives under the
 * per-group `.claude-shared` mount (set up in `container-runner.ts::buildMounts`
 * for all providers). This file exists purely to emit `ANTHROPIC_MODEL` from
 * the per-group config so different agent groups can run different models.
 *
 * Per-group config (from `groups/<folder>/container.json::providers.claude`):
 *
 *   {
 *     "providers": {
 *       "claude": {
 *         "model": "claude-sonnet-4-5"   // → ANTHROPIC_MODEL in the container
 *       }
 *     }
 *   }
 *
 * Fallback chain: `providers.claude.model` → host `ANTHROPIC_MODEL` → Claude
 * Code SDK's built-in default (which tracks the current flagship Sonnet).
 */
import { registerProviderContainerConfig } from './provider-container-registry.js';

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

registerProviderContainerConfig('claude', (ctx) => {
  const cfg = ctx.providerConfig ?? {};
  const env: Record<string, string> = {};

  const model = pickString(cfg.model) ?? ctx.hostEnv.ANTHROPIC_MODEL;
  if (model) env.ANTHROPIC_MODEL = model;

  return { env };
});

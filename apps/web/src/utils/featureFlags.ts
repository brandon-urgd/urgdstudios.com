/**
 * Build-time feature flag evaluation.
 * Reads Vite environment variables at build time.
 * Default: true when the env var is absent (features enabled by default).
 */

export type FeatureFlag =
  | 'commandCenter'
  | 'commandCenterReply'
  | 'commandCenterAutoResponse';

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  switch (flag) {
    case 'commandCenter':
      return import.meta.env.VITE_COMMAND_CENTER !== 'false';
    case 'commandCenterReply':
      return import.meta.env.VITE_COMMAND_CENTER_REPLY !== 'false';
    case 'commandCenterAutoResponse':
      return import.meta.env.VITE_COMMAND_CENTER_AUTO_RESPONSE !== 'false';
  }
}

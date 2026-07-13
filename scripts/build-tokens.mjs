// Compile tokens/mmaiq.tokens.json (format W3C Design Tokens) vers :
//   - src/design-tokens.css                                  (site)
//   - ../mma_perf_lab/lib/core/themes/design_tokens.dart     (app Flutter, si le repo est présent)
// Usage : npm run tokens
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'tokens/mmaiq.tokens.json'), 'utf8'));

// Aplatit {color:{violet:{500:{$value}}}} en [["color-violet-500", "#7B2FFF"], ...]
function flatten(node, path = []) {
  const out = [];
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (val && typeof val === 'object' && '$value' in val) {
      out.push([[...path, key].join('-'), val.$value]);
    } else if (val && typeof val === 'object') {
      out.push(...flatten(val, [...path, key]));
    }
  }
  return out;
}

const flat = flatten(tokens);
const get = (name) => flat.find(([n]) => n === name)?.[1];

// ─── CSS (site) ─────────────────────────────────────────────
const cssVars = flat
  .map(([name, value]) => `  --${name.replace(/^color-/, 'color-').replace(/^radius-/, 'radius-')}: ${value};`)
  .join('\n');

const css = `/* GÉNÉRÉ par scripts/build-tokens.mjs depuis tokens/mmaiq.tokens.json — ne pas éditer à la main.
   Source unique des tokens partagés site ↔ app (décisions design du 11 juillet 2026). */
:root {
${cssVars}

  /* Rôles (pointent sur l'échelle ci-dessus) */
  --color-accent-primary: var(--color-violet-500);
  --color-accent-secondary: var(--color-accent-red);
  --color-border: rgba(123, 47, 255, 0.25);
  --color-glow-violet: rgba(123, 47, 255, 0.6);
  --color-glow-red: rgba(255, 23, 68, 0.5);
  --color-glow-cyan: rgba(0, 229, 255, 0.4);

  /* Alias historiques requis par les composants existants */
  --color-accent-purple: var(--color-violet-500);
  --color-accent-magenta: var(--color-violet-300);
  --color-card-bg: var(--color-bg-surface);
  --color-border-dark: rgba(255, 255, 255, 0.1);
  --color-success: var(--color-semantic-success);
  --color-warning: var(--color-semantic-warning);
  --color-error: var(--color-semantic-error);
  --color-text-sec: var(--color-text-secondary);
}
`;
writeFileSync(join(root, 'src/design-tokens.css'), css);
console.log('✓ src/design-tokens.css');

// ─── Dart (app Flutter) ─────────────────────────────────────
const appThemesDir = join(root, '..', 'mma_perf_lab', 'lib', 'core', 'themes');
if (existsSync(appThemesDir)) {
  const toDart = (hex) => `Color(0xFF${hex.slice(1).toUpperCase()})`;
  const ident = (name) =>
    name
      .replace(/^color-/, '')
      .split('-')
      .map((p, i) => (i === 0 ? p : /^\d/.test(p) ? p : p[0].toUpperCase() + p.slice(1)))
      .join('');

  const colorConsts = flat
    .filter(([n, v]) => n.startsWith('color-') && /^#([0-9a-fA-F]{6})$/.test(v))
    .map(([n, v]) => `  static const Color ${ident(n)} = ${toDart(v)};`)
    .join('\n');

  const dart = `import 'package:flutter/material.dart';

/// GÉNÉRÉ par site-web-mmaiq/scripts/build-tokens.mjs depuis
/// site-web-mmaiq/tokens/mmaiq.tokens.json — ne pas éditer à la main.
///
/// Source unique des design tokens partagés site ↔ app.
/// Décisions du 11 juillet 2026 : violet canonique #7B2FFF (violet500),
/// base sombre commune (bgBase/bgSurface/bgElevated), un seul trio sémantique.
///
/// Migration progressive : faire pointer AppColors.* sur ces valeurs
/// (ex. \`static const Color primary = DesignTokens.violet500;\`).
abstract final class DesignTokens {
${colorConsts}

  /// Rôles
  static const Color accentPrimary = ${toDart(get('color-violet-500'))};

  /// Radius (échelle fermée : input 12, card 16, hero 24, pill)
  static const double radiusSm = ${parseFloat(get('radius-sm'))};
  static const double radiusInput = ${parseFloat(get('radius-input'))};
  static const double radiusCard = ${parseFloat(get('radius-card'))};
  static const double radiusHero = ${parseFloat(get('radius-hero'))};
}
`;
  writeFileSync(join(appThemesDir, 'design_tokens.dart'), dart);
  console.log('✓ ../mma_perf_lab/lib/core/themes/design_tokens.dart');
} else {
  console.log('⚠ repo mma_perf_lab introuvable — Dart non généré');
}

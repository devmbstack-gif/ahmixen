export type HeroLogoBlend = 'screen' | 'lighten' | 'multiply' | 'normal';

type HeroLogoMeta = {
  src: string;
  /** How the asset blends into the dark tool card (removes solid bg boxes). */
  blend: HeroLogoBlend;
};

/**
 * Official tool logos — jpeg app icons with solid black frames use `screen`
 * so the frame disappears on dark cards; already-transparent SVGs stay `normal`.
 */
const HERO_LOGO_META: Record<string, HeroLogoMeta> = {
  claude: {
    // New PNG (black plate) → screen drops the frame on dark cards
    src: '/tools/hero/claude-ai.png',
    blend: 'screen',
  },
  'claude-ai': {
    src: '/tools/hero/claude-ai.png',
    blend: 'screen',
  },
  'claude-code': {
    src: '/tools/hero/claude-ai.png',
    blend: 'screen',
  },
  openclaw: {
    src: '/tools/hero/open-claw.png',
    blend: 'screen',
  },
  'open-claw': {
    src: '/tools/hero/open-claw.png',
    blend: 'screen',
  },
  antigravity: {
    // New PNG (black plate) → screen drops the frame on dark cards
    src: '/tools/hero/antigravity.png',
    blend: 'screen',
  },
  'meta-ai': {
    // Black plate JPEG → screen drops the frame on dark cards
    src: '/tools/hero/meta-ai.jpeg',
    blend: 'screen',
  },
  meta: {
    src: '/tools/hero/meta-ai.jpeg',
    blend: 'screen',
  },
  // Legacy ids still map to Meta AI after the Cursor → Meta swap
  cursor: {
    src: '/tools/hero/meta-ai.jpeg',
    blend: 'screen',
  },
  'cursor-ai': {
    src: '/tools/hero/meta-ai.jpeg',
    blend: 'screen',
  },
  designer: {
    src: '/tools/hero/meta-ai.jpeg',
    blend: 'screen',
  },
  n8n: {
    // Black plate + pink mark → screen
    src: '/tools/hero/n8n.jpeg',
    blend: 'screen',
  },
};

export const STATIC_HERO_TOOL_LOGOS: Record<string, string> = Object.fromEntries(
  Object.entries(HERO_LOGO_META).map(([id, meta]) => [id, meta.src])
);

export function staticHeroToolLogo(toolId: string): string | null {
  return HERO_LOGO_META[toolId]?.src ?? null;
}

export function staticHeroToolBlend(toolId: string): HeroLogoBlend {
  return HERO_LOGO_META[toolId]?.blend ?? 'normal';
}

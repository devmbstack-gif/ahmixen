export type AiStackTool = {
  id: string;
  name: string;
  /** Path under /public, or null for letter fallback */
  logo: string | null;
  /** Tailwind-friendly accent for letter fallback */
  accent: string;
};

/** Static tool pills for the “Meet your future AI stack” section. */
export const AI_STACK_TOOLS: AiStackTool[] = [
  { id: 'chatgpt', name: 'ChatGPT', logo: '/tools/stack/chatgpt.svg', accent: '#10a37f' },
  { id: 'openclaw', name: 'OpenClaw', logo: '/tools/openclaw.svg', accent: '#a78bfa' },
  { id: 'claude-code', name: 'Claude Code', logo: '/tools/claude-code.svg', accent: '#d4a27f' },
  { id: 'bolt', name: 'Bolt', logo: '/tools/stack/bolt.svg', accent: '#fbbf24' },
  { id: 'claude', name: 'claude', logo: '/tools/stack/claude.svg', accent: '#d97706' },
  { id: 'gemini', name: 'Gemini', logo: '/tools/stack/gemini.svg', accent: '#8b5cf6' },
  { id: 'loveable', name: 'Loveable', logo: '/tools/stack/loveable.svg', accent: '#f472b6' },
  { id: 'make', name: 'Make', logo: '/tools/stack/make.svg', accent: '#6d28d9' },
  { id: 'n8n', name: 'n8n', logo: '/tools/n8n.svg', accent: '#ea4b71' },
  { id: 'openai', name: 'OpenAI', logo: '/tools/stack/openai.svg', accent: '#10a37f' },
  { id: 'zapier', name: 'Zapier', logo: '/tools/stack/zapier.svg', accent: '#ff4a00' },
  { id: 'vercel', name: 'Vercel', logo: '/tools/stack/vercel.svg', accent: '#e5e5e5' },
  { id: 'github', name: 'GitHub', logo: '/tools/stack/github.svg', accent: '#e6edf3' },
  { id: 'copilot', name: 'Copilot', logo: '/tools/stack/copilot.svg', accent: '#a5b4fc' },
  { id: 'dalle', name: 'DALL-E', logo: '/tools/stack/dalle.svg', accent: '#74aa9c' },
];

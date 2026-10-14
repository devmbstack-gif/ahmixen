export const WORKSHOP_SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
] as const;

export const WORKSHOP_LEARNING_GOALS = [
  { id: 'ai_automation', label: 'AI Automation' },
  { id: 'monetize', label: 'Monetize AI skills / Get clients' },
  { id: 'ai_agents', label: 'AI Agents' },
  { id: 'n8n', label: 'n8n Workflows' },
  { id: 'real_world', label: 'Real-World AI Projects' },
  { id: 'business_problems', label: 'Find business problems with AI' },
  { id: 'content_research', label: 'AI tools for content & trend research' },
  { id: 'other', label: 'Other' },
] as const;

export const WORKSHOP_PAYMENT = {
  /** Canonical booking amount stored on Orders (matches Programs card). */
  amountPkr: 500,
  amountLabel: 'PKR 499 / Rs 500',
  accountName: 'Ahmi',
  walletLabel: 'JazzCash / EasyPaisa',
  walletNumber: '0321-4359182',
} as const;

export type WorkshopSkillLevel =
  (typeof WORKSHOP_SKILL_LEVELS)[number]['id'];

export type WorkshopLearningGoalId =
  (typeof WORKSHOP_LEARNING_GOALS)[number]['id'];

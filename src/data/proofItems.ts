export type ProofItem = {
  publisher: string;
  number: number;
  prefix: string;
  suffix: string;
  headline: string;
  url: string;
};

export const PROOF_ITEMS: ProofItem[] = [
  {
    publisher: 'World Economic Forum',
    number: 170,
    prefix: '',
    suffix: 'M',
    headline: 'New jobs expected worldwide by 2030',
    url: 'https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/',
  },
  {
    publisher: 'PwC',
    number: 62,
    prefix: '',
    suffix: '%',
    headline: 'Extra pay for workers with AI skills',
    url: 'https://www.pwc.com/id/en/media-centre/press-release/2026/english/ai-jobs-barometer-en.html',
  },
  {
    publisher: 'Gartner',
    number: 32,
    prefix: '',
    suffix: 'M',
    headline: 'Jobs reshaped by AI every year from 2028',
    url: 'https://www.gartner.com/en/documents/7139530',
  },
];

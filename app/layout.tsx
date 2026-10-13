import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { ReserveFlowProvider } from '@/components/checkout/ReserveFlowProvider';
import './globals.css';

/** Dark-only site — clear any legacy light preference before paint. */
const THEME_INIT_SCRIPT = `(function(){try{localStorage.removeItem('ahmixen-theme');var d=document.documentElement;d.classList.remove('light');d.classList.add('dark');d.style.colorScheme='dark';}catch(e){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}})();`;

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ahmixen.com'),
  title: 'AhmiXen — Live AI Masterclass & Autonomous Agents Workshop',
  description:
    "Join AhmiXen's intensive 2.5-hour live AI masterclass. Learn practical AI fundamentals, prompt engineering architectures, autonomous agent workflows, and vibe coding.",
  keywords: [
    'AI Workshop',
    'Autonomous Agents',
    'LLMs',
    'Vibe Coding',
    'Prompt Engineering',
    'n8n Automation',
    'AhmiXen',
  ],
  openGraph: {
    type: 'website',
    title: 'AhmiXen — Live AI Masterclass & Autonomous Agents Workshop',
    description:
      'Master practical AI, build autonomous agents, and orchestrate modern LLM workflows with AhmiXen.',
    images: ['/ahmixen-logo.png'],
  },
  icons: {
    icon: '/ahmixen-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${plusJakarta.className} font-sans antialiased selection:bg-brand selection:text-white`}
      >
        <ReserveFlowProvider>{children}</ReserveFlowProvider>
      </body>
    </html>
  );
}

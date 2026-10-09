import {
  Check,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Ticket,
  Calendar,
  Clock,
  Video,
  Lock,
  Maximize2,
} from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/workshopData';

interface RegistrationProps {
  onOpenRegister: () => void;
  onOpenLightbox?: (id: string) => void;
}

export const Registration: React.FC<RegistrationProps> = ({ onOpenRegister, onOpenLightbox }) => {
  const perks = [
    '2.5 Hours of Live Interactive Instruction & Demonstrations',
    'Full 4K HD Recording Access Forever with Chapter Markers',
    '3 Complete Production Agent Workflows & n8n Blueprints',
    'Comprehensive Prompt Engineering Playbook & JSON Templates',
    'Verifiable AhmiXen AI Practitioner Certificate of Completion',
    'Exclusive Invitation to Private AhmiXen Discord Community',
    'Live Q&A Session to Troubleshoot Your Specific Workflows',
    '100% No-Questions-Asked 7-Day Money-Back Guarantee',
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/15 blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full purple-badge text-xs font-semibold">
            <Ticket className="w-3.5 h-3.5" />
            <span>ENROLLMENT &amp; PASSES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Reserve Your Seat in the <span className="gradient-text-ahmixen">Live AI Masterclass</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            Invest in practical skills that immediately compound your personal and professional productivity.
          </p>
        </div>

        {/* Pricing & Value Proposition Box */}
        <div className="relative">
          {/* Outer Glow Halo */}
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-purple-600/40 via-violet-500/30 to-purple-800/40 blur-xl opacity-75" />

          {/* Pricing Card */}
          <div className="relative glass-panel rounded-3xl p-8 sm:p-12 border border-[var(--border-highlight)] shadow-2xl bg-[var(--card-bg)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left Column: What's Included */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Comprehensive All-Access Cohort
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] mt-1">
                    Everything You Need to Succeed
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-2">
                    Zero hidden costs. Includes full session access, downloadable repositories, starter code, and ongoing community membership.
                  </p>
                </div>

                {/* Checklist */}
                <div className="space-y-3 pt-2">
                  {perks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[var(--text-main)]">
                      <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/30">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="leading-snug">{perk}</span>
                    </div>
                  ))}
                </div>

                {onOpenLightbox && (
                  <div className="pt-2">
                    <button
                      type="button"
                      id="preview-cert-lightbox-btn"
                      onClick={() => onOpenLightbox('certificate')}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/40 border border-purple-500/25 px-3.5 py-2 rounded-xl hover:border-purple-400 transition-all cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Preview Verifiable Certificate Sample</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Pricing & Primary CTA */}
              <div className="lg:col-span-5 flex flex-col justify-center glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 bg-purple-950/20 space-y-6 text-center">
                
                {/* Early Bird Badge */}
                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full purple-badge text-xs font-bold mx-auto">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>EARLY BIRD REGISTRATION</span>
                </div>

                {/* Price Display */}
                <div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-[var(--text-main)] gradient-text-ahmixen">
                      {WORKSHOP_CONFIG.priceEarlyBird.amount}
                    </span>
                    <span className="text-base text-[var(--text-secondary)] line-through">
                      {WORKSHOP_CONFIG.priceEarlyBird.original}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 mt-1">
                    {WORKSHOP_CONFIG.priceEarlyBird.savings} • Limited First 100 Seats
                  </div>
                </div>

                {/* Session Logistics Badges */}
                <div className="space-y-2 py-3 border-y border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-[var(--text-main)]">{WORKSHOP_CONFIG.date}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>{WORKSHOP_CONFIG.time}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span>Live Interactive Cohort ({WORKSHOP_CONFIG.duration})</span>
                  </div>
                </div>

                {/* Main Registration Button */}
                <button
                  type="button"
                  id="pricing-reserve-cta"
                  onClick={onOpenRegister}
                  className="btn-ahmixen w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(124,58,237,0.4)] cursor-pointer"
                >
                  <span>Reserve My Seat Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Trust Reassurance */}
                <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>100% Risk-Free 7-Day Guarantee</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Compact Trust & Reassurance Badges */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] flex items-center justify-center gap-3">
            <Lock className="w-5 h-5 text-purple-400" />
            <div className="text-left text-xs">
              <div className="font-bold text-[var(--text-main)]">Encrypted &amp; Secure</div>
              <div className="text-[var(--text-secondary)]">No unwanted recurring fees</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] flex items-center justify-center gap-3">
            <Video className="w-5 h-5 text-purple-400" />
            <div className="text-left text-xs">
              <div className="font-bold text-[var(--text-main)]">Instant Replay Access</div>
              <div className="text-[var(--text-secondary)]">Full recording if you miss it live</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] flex items-center justify-center gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <div className="text-left text-xs">
              <div className="font-bold text-[var(--text-main)]">Full Money-Back Guarantee</div>
              <div className="text-[var(--text-secondary)]">100% satisfaction promised</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

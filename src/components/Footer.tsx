import { WORKSHOP_CONFIG } from '../data/workshopData';
import { AhmiXenLogo } from './AhmiXenLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="section-y-sm bg-transparent" role="contentinfo">
      <div className="container-narrow flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-2">
          <AhmiXenLogo className="text-2xl sm:text-3xl" />
          <p className="text-xs text-[var(--text-secondary)]">
            Practical AI workshops for professionals.
          </p>
        </div>

        <div className="text-xs text-[var(--text-muted)] space-y-1">
          <a
            href={`mailto:${WORKSHOP_CONFIG.contactEmail}`}
            className="text-[var(--purple-soft-text)] hover:underline block"
          >
            {WORKSHOP_CONFIG.contactEmail}
          </a>
          <p>
            &copy; {new Date().getFullYear()} {WORKSHOP_CONFIG.brandName}
          </p>
        </div>
      </div>
    </footer>
  );
};

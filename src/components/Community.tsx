'use client';

import { Reveal } from './Reveal';
import { CommunityGallery } from './community/CommunityGallery';

export const Community: React.FC = () => {
  return (
    <section
      id="community"
      className="community-section relative section-y overflow-hidden bg-transparent"
      aria-labelledby="community-heading"
    >
      <div className="relative container-page max-w-6xl">
        <Reveal className="text-center mb-6 sm:mb-8">
          <h2 id="community-heading" className="type-title text-ink">
            Our <span className="gradient-text-ahmixen">Community</span> Is Growing Fast
          </h2>
        </Reveal>

        <CommunityGallery />
      </div>
    </section>
  );
};

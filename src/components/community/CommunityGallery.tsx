'use client';

import { useCallback, useState } from 'react';
import { COMMUNITY_PHOTOS } from './communityPhotos';
import { GalleryTile } from './GalleryTile';
import { Lightbox } from './Lightbox';

export function CommunityGallery() {
  const [active, setActive] = useState<number | null>(null);
  const total = COMMUNITY_PHOTOS.length;

  const openAt = useCallback((index: number) => setActive(index), []);
  const close = useCallback(() => setActive(null), []);

  const prev = useCallback(() => {
    setActive((i) => (i === null ? i : (i - 1 + total) % total));
  }, [total]);

  const next = useCallback(() => {
    setActive((i) => (i === null ? i : (i + 1) % total));
  }, [total]);

  return (
    <>
      <ul className="community-bento" aria-label="Workshop photos">
        {COMMUNITY_PHOTOS.map((photo, index) => (
          <GalleryTile key={photo.id} photo={photo} index={index} onOpen={openAt} />
        ))}
      </ul>

      <Lightbox
        photos={COMMUNITY_PHOTOS}
        index={active}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </>
  );
}

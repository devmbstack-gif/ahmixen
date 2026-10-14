'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  COMMUNITY_BLUR_DATA_URL,
  type CommunityPhoto,
} from './communityPhotos';

const EASE = [0.16, 1, 0.3, 1] as const;

const spanClass: Record<CommunityPhoto['span'], string> = {
  lg: 'community-tile-lg',
  tall: 'community-tile-tall',
  wide: 'community-tile-wide',
  sm: 'community-tile-sm',
};

type GalleryTileProps = {
  photo: CommunityPhoto;
  index: number;
  onOpen: (index: number) => void;
};

export function GalleryTile({ photo, index, onOpen }: GalleryTileProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li
      className={`community-tile-item ${spanClass[photo.span]}`}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -40px 0px' }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.55,
        delay: reduceMotion ? 0 : index * 0.07,
        ease: EASE,
      }}
    >
      <motion.button
        type="button"
        className="community-tile group"
        onClick={() => onOpen(index)}
        aria-label={`Open photo: ${photo.caption}`}
        whileHover={reduceMotion ? undefined : { y: -4 }}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      >
        <div className="community-tile-media">
          <Image
            src={encodeURI(photo.src)}
            alt={photo.caption}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="community-tile-img object-cover"
            style={
              photo.objectPosition
                ? { objectPosition: photo.objectPosition }
                : undefined
            }
            placeholder="blur"
            blurDataURL={COMMUNITY_BLUR_DATA_URL}
            loading="lazy"
            unoptimized
          />
        </div>

        <span className="community-tile-caption" aria-hidden="true">
          {photo.caption}
        </span>
      </motion.button>
    </motion.li>
  );
}

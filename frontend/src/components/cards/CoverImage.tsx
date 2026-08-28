import { useState } from 'react';
import { CoverArt } from './CoverArt';

/**
 * Renders the post's uploaded cover, or deterministic generative art when there
 * is none (or the file fails to load). `seed` keeps a post's art stable.
 */
export function CoverImage({
  src,
  alt,
  seed = '',
  className = '',
}: {
  src: string | null | undefined;
  alt: string;
  seed?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <CoverArt seed={seed || alt} className={`block h-full w-full object-cover ${className}`} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

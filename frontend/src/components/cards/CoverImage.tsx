import { useState } from 'react';
import { CoverArt } from './CoverArt';

/**
 * Renders the post's uploaded cover, or deterministic generative art when there
 * is none (or the file fails to load). `seed` keeps a post's art stable.
 *
 * Pass `photo` (a "<width>/<height>" pair) to slot a deterministic demo
 * photograph between those two steps, for the photo-led home page:
 *   uploaded cover -> picsum.photos/seed/<seed> -> CoverArt
 * Callers that omit `photo` keep the original two-step behaviour, so the
 * article page and the post grid are untouched.
 */
export function CoverImage({
  src,
  alt,
  seed = '',
  photo,
  className = '',
  eager = false,
}: {
  src: string | null | undefined;
  alt: string;
  seed?: string;
  photo?: string;
  className?: string;
  eager?: boolean;
}) {
  const [coverFailed, setCoverFailed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const imgClass = `object-cover ${className}`;

  if (src && !coverFailed) {
    return (
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setCoverFailed(true)}
        className={imgClass}
      />
    );
  }

  if (photo && !photoFailed) {
    return (
      <img
        src={`https://picsum.photos/seed/${encodeURIComponent(seed || alt || 'roadeep')}/${photo}`}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setPhotoFailed(true)}
        className={imgClass}
      />
    );
  }

  return <CoverArt seed={seed || alt} className={`block h-full w-full object-cover ${className}`} />;
}

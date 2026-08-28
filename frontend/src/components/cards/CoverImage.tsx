import { useState } from 'react';

export function CoverImage({
  src,
  alt,
  className = '',
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-ink-800 text-ink-400 ${className}`}
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.3} stroke="currentColor" className="h-12 w-12">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="m4 17 5-5 3 3 4-5 4 5" />
          <circle cx="8.5" cy="9" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      </div>
    );
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

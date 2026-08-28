export function ShareLinks({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: 'تلگرام',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: 'ایکس',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: 'واتس‌اپ',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-600 dark:text-bone-400">اشتراک‌گذاری:</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="press rounded-full border border-ink-950 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-bone-50 dark:border-bone-400 dark:text-bone-100 dark:hover:bg-mint-300 dark:hover:text-ink-950 dark:hover:border-mint-300"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

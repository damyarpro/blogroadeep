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
      <span className="text-sm text-slate-500 dark:text-slate-400">اشتراک‌گذاری:</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="press rounded-full border border-slate-200 px-3.5 py-1.5 text-xs whitespace-nowrap text-slate-600 transition-colors duration-150 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:text-indigo-300"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

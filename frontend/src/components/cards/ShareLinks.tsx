import { TelegramIcon, WhatsAppIcon, XIcon } from '../home/icons';

/** Circular icon buttons, the same 40px disc the magazine cards use. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: 'تلگرام',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: TelegramIcon,
    },
    {
      label: 'ایکس',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: XIcon,
    },
    {
      label: 'واتس‌اپ',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      Icon: WhatsAppIcon,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-ink-600 dark:text-bone-400">اشتراک‌گذاری:</span>
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`اشتراک‌گذاری در ${label}`}
          title={label}
          className="press inline-flex h-10 w-10 items-center justify-center rounded-full border border-bone-300 bg-bone-50 text-ink-950 transition-colors duration-150 hover:border-ink-950 hover:bg-ink-950 hover:text-mint-300 dark:border-ink-700 dark:bg-ink-950 dark:text-bone-100 dark:hover:border-mint-300 dark:hover:bg-mint-300 dark:hover:text-ink-950"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { to: '/', label: 'خانه' },
  { to: '/articles', label: 'مقالات' },
  { to: '/categories', label: 'دسته‌بندی‌ها' },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    'press rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors duration-150',
    isActive
      ? 'bg-ink-950 text-bone-50 dark:bg-mint-300 dark:text-ink-950'
      : 'text-ink-600 hover:bg-bone-200 hover:text-ink-950 dark:text-bone-300 dark:hover:bg-ink-800 dark:hover:text-bone-50',
  ].join(' ');
}

export function Header() {
  const { isStaff } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-bone-300 bg-bone-100/85 backdrop-blur dark:border-ink-800 dark:bg-ink-950/85">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NavLink
          to="/"
          className="press flex items-center gap-2.5 text-lg font-black tracking-tight text-ink-950 dark:text-bone-50"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-300 font-black text-ink-950"
          >
            ر
          </span>
          بلاگ رودیپ
        </NavLink>

        <nav aria-label="پیمایش اصلی" className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Discreet entrance to the authoring panel; only staff ever sees it. */}
          {isStaff && (
            <Link
              to="/admin"
              className="press rounded-full border border-ink-950 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-bone-50 dark:border-bone-400 dark:text-bone-100 dark:hover:border-mint-300 dark:hover:bg-mint-300 dark:hover:text-ink-950"
            >
              پنل نویسنده
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>

      <nav aria-label="پیمایش اصلی (موبایل)" className="flex items-center gap-1.5 overflow-x-auto px-4 pb-3 sm:hidden">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

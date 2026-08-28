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
    'press rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-150',
    isActive
      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  ].join(' ');
}

export function Header() {
  const { isStaff } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NavLink
          to="/"
          className="press flex items-center gap-2 text-lg font-bold text-slate-900 transition-colors duration-150 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white"
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
              className="press rounded-full border border-indigo-200 px-3.5 py-1.5 text-xs font-medium whitespace-nowrap text-indigo-600 transition-colors duration-150 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
            >
              پنل نویسنده
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>

      <nav aria-label="پیمایش اصلی (موبایل)" className="flex items-center gap-1 overflow-x-auto px-4 pb-3 sm:hidden">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

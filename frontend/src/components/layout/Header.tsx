import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { to: '/', label: 'خانه' },
  { to: '/articles', label: 'مقالات' },
  { to: '/categories', label: 'دسته‌بندی‌ها' },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    'rounded-full px-3 py-1.5 text-sm font-medium transition',
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  ].join(' ');
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"
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

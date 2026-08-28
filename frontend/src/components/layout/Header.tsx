import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { isStaticMode } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { NewsTicker } from '../home/NewsTicker';
import { MenuIcon, RssIcon, SearchIcon } from '../home/icons';
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

/** Wordmark: forest green name, mint full stop, exactly like the masthead. */
function Wordmark() {
  return (
    <NavLink to="/" className="press flex shrink-0 items-baseline text-xl font-black tracking-tight sm:text-2xl">
      <span className="text-forest-800 dark:text-mint-300">بلاگ رودیپ</span>
      <span aria-hidden="true" className="text-mint-400">
        .
      </span>
    </NavLink>
  );
}

export function Header() {
  const { isStaff } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuRoute, setMenuRoute] = useState('');

  const isHome = location.pathname === '/';
  const route = location.pathname + location.search;

  // A route change means the reader got where they were going: close the sheet.
  // Adjusted during render rather than in an effect, so no second paint shows
  // the menu still open over the new page.
  if (menuRoute !== route) {
    setMenuRoute(route);
    if (menuOpen) setMenuOpen(false);
  }

  const iconButtonClass =
    'press inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-950 text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-bone-50 dark:border-bone-400 dark:text-bone-100 dark:hover:border-mint-300 dark:hover:bg-mint-300 dark:hover:text-ink-950';

  return (
    <>
      {/* Breaking bar rides above the masthead, on the home page only. */}
      {isHome && <NewsTicker />}

      <header className="sticky top-0 z-30 border-b border-bone-300 bg-bone-50/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
        <div className="mx-auto flex max-w-[88rem] items-center gap-4 px-4 py-3 sm:px-6">
          <Wordmark />

          <span aria-hidden="true" className="hidden h-7 w-px bg-bone-300 xl:block dark:bg-ink-800" />
          <p className="hidden text-xs whitespace-nowrap text-ink-400 xl:block dark:text-bone-400">
            روایت‌های تازهٔ فناوری
          </p>

          <nav aria-label="پیمایش اصلی" className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
            {!isStaticMode && (
              <a
                href="/feed/"
                className="press relative rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap text-ink-600 transition-colors duration-150 hover:bg-bone-200 hover:text-ink-950 dark:text-bone-300 dark:hover:bg-ink-800 dark:hover:text-bone-50"
              >
                خبرخوان
                <span aria-hidden="true" className="absolute end-2.5 top-1.5 h-1.5 w-1.5 rounded-full bg-mint-400" />
              </a>
            )}
          </nav>

          <div className="ms-auto flex items-center gap-2 md:ms-0">
            {/* Search lives on the articles page; this jumps there and focuses it. */}
            <Link
              to="/articles?focus=search"
              aria-label="جستجو در مقالات"
              className="press hidden items-center gap-2 rounded-full border border-bone-300 px-4 py-2 text-sm font-medium text-ink-600 transition-colors duration-150 hover:border-ink-950 hover:text-ink-950 sm:inline-flex dark:border-ink-700 dark:text-bone-300 dark:hover:border-mint-300 dark:hover:text-bone-50"
            >
              <SearchIcon className="h-4 w-4" />
              جستجو
            </Link>

            {isStaff && (
              <Link
                to="/admin"
                className="press hidden rounded-full border border-ink-950 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-bone-50 sm:block dark:border-bone-400 dark:text-bone-100 dark:hover:border-mint-300 dark:hover:bg-mint-300 dark:hover:text-ink-950"
              >
                پنل نویسنده
              </Link>
            )}

            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
              className={`${iconButtonClass} md:hidden`}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-nav"
            aria-label="پیمایش اصلی (موبایل)"
            className="border-t border-bone-300 px-4 py-3 md:hidden dark:border-ink-800"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
              <Link to="/articles?focus=search" className={navLinkClass({ isActive: false })}>
                جستجو
              </Link>
              {!isStaticMode && (
                <a href="/feed/" className={`${navLinkClass({ isActive: false })} inline-flex items-center gap-2`}>
                  <RssIcon className="h-4 w-4" />
                  خبرخوان
                </a>
              )}
              {isStaff && (
                <Link to="/admin" className={navLinkClass({ isActive: false })}>
                  پنل نویسنده
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

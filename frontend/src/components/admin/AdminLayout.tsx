import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { fetchAdminStats } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { toPersianDigits } from '../../lib/format';
import { ThemeToggle } from '../layout/ThemeToggle';
import { Seo } from '../seo/Seo';
import { ToastProvider } from './Toaster';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: ReactNode;
}

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const navItems: NavItem[] = [
  {
    to: '/admin',
    label: 'داشبورد',
    end: true,
    icon: icon('M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6Zm9.75 0A2.25 2.25 0 0 1 15.75 3.75H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Zm-9.75 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 8.25 20.25H6A2.25 2.25 0 0 1 3.75 18v-2.25Zm9.75 0A2.25 2.25 0 0 1 15.75 13.5H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z'),
  },
  {
    to: '/admin/posts',
    label: 'نوشته‌ها',
    icon: icon('M4.5 4.5h10.5M4.5 9h15M4.5 13.5h15M4.5 18h9'),
  },
  {
    to: '/admin/comments',
    label: 'دیدگاه‌ها',
    icon: icon('M8 10.5h8M8 14h5m8-2c0 4.418-4.03 8-9 8-1.02 0-2-.152-2.91-.433L3 21l1.5-3.75C3.556 16.1 3 14.61 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z'),
  },
  {
    to: '/admin/taxonomy',
    label: 'دسته‌ها و برچسب‌ها',
    icon: icon('M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.182 0l4.318-4.318a2.25 2.25 0 0 0 0-3.182l-9.58-9.581A2.25 2.25 0 0 0 9.567 3Z M6 6h.008v.008H6V6Z'),
  },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  ].join(' ');
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Small badge on the "دیدگاه‌ها" link so moderation never gets forgotten.
  useEffect(() => {
    let cancelled = false;
    fetchAdminStats()
      .then((stats) => {
        if (!cancelled) setPending(stats.comments.pending);
      })
      .catch(() => {
        /* the badge is a bonus — ignore failures */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <ToastProvider>
      <Seo title="پنل نویسنده" noIndex />
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-label="نمایش منوی پنل"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
              >
                {icon('M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5')}
              </button>
              <Link to="/admin" className="flex items-center gap-2 font-bold">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"
                >
                  ر
                </span>
                <span className="hidden sm:inline">پنل نویسنده</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100 sm:inline-flex dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                مشاهدهٔ سایت
              </Link>
              <ThemeToggle />
              <div className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pe-1 ps-3 dark:border-slate-700">
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {user?.full_name ?? user?.username}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="خروج از حساب"
                  aria-label="خروج از حساب"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                >
                  {icon('M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 15l3-3m0 0-3-3m3 3H9')}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6">
          <aside
            className={`${menuOpen ? 'block' : 'hidden'} w-full shrink-0 lg:block lg:w-56`}
          >
            <nav aria-label="پیمایش پنل" className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={navLinkClass}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/admin/comments' && pending > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {toPersianDigits(pending)}
                    </span>
                  )}
                </NavLink>
              ))}
              <Link
                to="/admin/posts/new"
                onClick={() => setMenuOpen(false)}
                className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 px-3 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
              >
                {icon('M12 4.5v15m7.5-7.5h-15')}
                نوشتهٔ جدید
              </Link>
            </nav>
          </aside>

          <main className={`${menuOpen ? 'hidden' : 'block'} min-w-0 flex-1 lg:block`}>
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

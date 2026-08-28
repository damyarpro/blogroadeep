import { Link } from 'react-router-dom';
import { isStaticMode } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const year = new Date().getFullYear();

export function Footer() {
  const { isStaff } = useAuth();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6 dark:text-slate-400">
        <p className="text-center sm:text-start">© {year} بلاگ رودیپ. تمامی حقوق محفوظ است.</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {isStaff && (
            <Link
              to="/admin"
              className="press whitespace-nowrap transition-colors duration-150 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              پنل نویسنده
            </Link>
          )}
          {/* RSS is served by the Django backend and doesn't exist in the static demo. */}
          {!isStaticMode && (
            <a
              href="/feed/"
              className="press inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 whitespace-nowrap transition-colors duration-150 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:text-indigo-300"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M4 4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1c6.627 0 12 5.373 12 12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1C20 10.611 13.389 4 4 4Zm0 8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 4 4 0 0 1 4 4 1 1 0 0 0 1 1h2a1 1 0 0 0 1-1c0-4.418-3.582-8-8-8Zm-1 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
              </svg>
              فید RSS
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

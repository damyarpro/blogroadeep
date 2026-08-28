import { Link } from 'react-router-dom';
import { isStaticMode } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const year = new Date().getFullYear();

export function Footer() {
  const { isStaff } = useAuth();

  return (
    <footer className="mt-auto bg-ink-950 dark:border-t dark:border-ink-800 dark:bg-ink-900">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-12 text-sm text-bone-300 sm:flex-row sm:justify-between sm:px-6">
        <p className="flex flex-wrap items-baseline justify-center gap-x-2.5 text-center sm:justify-start sm:text-start">
          <span className="text-lg font-black tracking-tight text-mint-300">
            بلاگ رودیپ
            <span aria-hidden="true" className="text-mint-400">
              .
            </span>
          </span>
          <span>© {year} تمامی حقوق محفوظ است.</span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {isStaff && (
            <Link
              to="/admin"
              className="press font-bold whitespace-nowrap text-bone-300 transition-colors duration-150 hover:text-mint-300"
            >
              پنل نویسنده
            </Link>
          )}
          {/* RSS is served by the Django backend and doesn't exist in the static demo. */}
          {!isStaticMode && (
            <a
              href="/feed/"
              className="press inline-flex items-center gap-1.5 rounded-full border border-bone-400 px-4 py-1.5 font-bold whitespace-nowrap text-bone-100 transition-colors duration-150 hover:border-mint-300 hover:bg-mint-300 hover:text-ink-950"
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

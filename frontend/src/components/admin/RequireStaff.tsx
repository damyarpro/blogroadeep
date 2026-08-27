import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { isStaticMode } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Seo } from '../seo/Seo';

/** Persian notice shown wherever the panel would be on the backend-less demo build. */
export function StaticModeNotice() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <Seo title="پنل نویسنده" noIndex />
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-7 w-7">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          />
        </svg>
      </div>
      <h1 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
        پنل نویسنده در نسخهٔ نمایشی فعال نیست
      </h1>
      <p className="mb-6 leading-8 text-slate-600 dark:text-slate-300">
        این نسخه فقط یک عکس ثابت از داده‌هاست و بک‌اند جنگو ندارد. برای نوشتن، ویرایش و انتشار
        مقاله باید پروژه را به همراه سرور جنگو اجرا کنید.
      </p>
      <Link to="/" className="text-indigo-600 hover:underline dark:text-indigo-400">
        بازگشت به صفحهٔ اصلی
      </Link>
    </div>
  );
}

function PanelLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        role="status"
        aria-label="در حال بارگذاری"
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400"
      />
    </div>
  );
}

/** Gate around every /admin route: staff session required, demo build excluded. */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (isStaticMode) return <StaticModeNotice />;
  if (loading) return <PanelLoading />;
  if (!user || !user.is_staff) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

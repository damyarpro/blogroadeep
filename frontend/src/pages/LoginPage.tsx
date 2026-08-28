import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, isStaticMode } from '../lib/api';
import { useAuth } from '../lib/auth';
import { StaticModeNotice } from '../components/admin/RequireStaff';
import { cardShell, fieldClass, fieldLabelClass, solidPill } from '../components/magazine/tokens';
import { Seo } from '../components/seo/Seo';

/* The one panel door that lives on the public site, so it wears the magazine
   chrome rather than the authoring panel's slate and indigo. */

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Already signed in? Skip straight to the panel.
  useEffect(() => {
    if (user?.is_staff) navigate(from, { replace: true });
  }, [user, from, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const account = await login(username.trim(), password);
      if (!account.is_staff) {
        setError('این حساب کاربری اجازهٔ ورود به پنل مدیریت را ندارد.');
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setError('اتصال به سرور برقرار نشد. مطمئن شوید سرور جنگو در حال اجراست.');
      } else {
        setError(err instanceof ApiError ? err.message : 'ورود با خطا مواجه شد.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isStaticMode) return <StaticModeNotice />;

  return (
    <div className="hero-wash">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 pt-16 pb-24 sm:px-6">
        <Seo title="ورود به پنل" noIndex />

        <div className="mb-8 text-center">
          <span
            aria-hidden="true"
            className="rise mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-mint-300 text-xl font-black text-ink-950"
          >
            ر
          </span>
          <h1 className="rise text-[2rem] leading-tight font-black tracking-tight text-ink-950 dark:text-bone-50">
            ورود به پنل نویسنده
          </h1>
          <p
            className="rise mt-3 text-sm text-ink-600 dark:text-bone-300"
            style={{ '--rise-delay': '80ms' } as React.CSSProperties}
          >
            برای نوشتن و مدیریت مقالات وارد حساب مدیریتی خود شوید.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={`rise flex flex-col gap-5 p-6 sm:p-8 ${cardShell}`}>
          <div>
            <label htmlFor="login-username" className={fieldLabelClass}>
              نام کاربری
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              dir="ltr"
              className={`${fieldClass} rounded-full text-start`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className={fieldLabelClass}>
              رمز عبور
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                dir="ltr"
                className={`${fieldClass} rounded-full pe-24 text-start`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                className="press absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-bone-200 px-4 py-1.5 text-xs font-bold text-ink-950 transition-colors duration-150 hover:bg-ink-950 hover:text-mint-300 dark:bg-ink-800 dark:text-bone-100 dark:hover:bg-mint-300 dark:hover:text-ink-950"
              >
                {showPassword ? 'پنهان' : 'نمایش'}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-3xl bg-ink-950 px-5 py-4 text-sm leading-7 text-bone-50 dark:bg-ink-800">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className={`w-full ${solidPill}`}>
            {submitting ? 'در حال ورود…' : 'ورود'}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-ink-600 dark:text-bone-300">
          <Link
            to="/"
            className="font-bold transition-colors duration-150 hover:text-ink-950 dark:hover:text-mint-300"
          >
            بازگشت به صفحهٔ اصلی
          </Link>
        </p>
      </div>
    </div>
  );
}

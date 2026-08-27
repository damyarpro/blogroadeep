import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, isStaticMode } from '../lib/api';
import { useAuth } from '../lib/auth';
import { StaticModeNotice } from '../components/admin/RequireStaff';
import { input, label, primaryButton } from '../components/admin/panelStyles';
import { Seo } from '../components/seo/Seo';

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
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <Seo title="ورود به پنل" noIndex />

      <div className="mb-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white"
        >
          ر
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ورود به پنل نویسنده</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          برای نوشتن و مدیریت مقالات وارد حساب مدیریتی خود شوید.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div>
          <label htmlFor="login-username" className={label}>
            نام کاربری
          </label>
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            dir="ltr"
            className={`${input} text-start`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="login-password" className={label}>
            رمز عبور
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              dir="ltr"
              className={`${input} pe-11 text-start`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {showPassword ? 'پنهان' : 'نمایش'}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? 'در حال ورود…' : 'ورود'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          بازگشت به صفحهٔ اصلی
        </Link>
      </p>
    </div>
  );
}

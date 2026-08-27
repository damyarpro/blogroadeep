import { Link } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <Seo title="صفحه یافت نشد" noIndex />
      <p className="mb-2 text-6xl font-extrabold text-indigo-600">۴۰۴</p>
      <h1 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">صفحه مورد نظر پیدا نشد</h1>
      <p className="mb-6 text-slate-500 dark:text-slate-400">
        نشانی وارد شده وجود ندارد یا جابه‌جا شده است.
      </p>
      <Link
        to="/"
        className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        بازگشت به خانه
      </Link>
    </div>
  );
}

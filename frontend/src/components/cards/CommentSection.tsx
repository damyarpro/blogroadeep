import { useState, type FormEvent } from 'react';
import type { Comment } from '../../lib/types';
import { formatJalaliDateTime, toPersianDigits } from '../../lib/format';
import { submitComment, ApiError } from '../../lib/api';

/* Radius system: surfaces = rounded-2xl, pressables and single-line inputs = rounded-full. */

const fieldClass =
  'w-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400';

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300';

/** Avatar-less thread row: the name and the words carry it, nothing else. */
function CommentItem({ comment }: { comment: Comment }) {
  return (
    <li className="py-5">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-medium text-slate-800 dark:text-slate-100">{comment.name}</span>
        <time dateTime={comment.created_at} className="text-xs text-slate-400 dark:text-slate-500">
          {formatJalaliDateTime(comment.created_at)}
        </time>
      </div>
      <p className="text-sm leading-7 whitespace-pre-line text-slate-600 dark:text-slate-400">{comment.body}</p>
    </li>
  );
}

export function CommentSection({ slug, comments }: { slug: string; comments: Comment[] }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !body.trim()) return;

    setStatus('submitting');
    setErrorMessage('');
    try {
      await submitComment(slug, { name: name.trim(), email: email.trim(), body: body.trim() });
      setStatus('success');
      setName('');
      setEmail('');
      setBody('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof ApiError ? error.message : 'ارسال دیدگاه با خطا مواجه شد.');
    }
  }

  return (
    <section aria-labelledby="comments-heading" className="mt-16">
      <div className="mb-2 flex items-baseline gap-3">
        <h2 id="comments-heading" className="text-xl font-bold text-slate-900 dark:text-white">
          دیدگاه‌ها
        </h2>
        {comments.length > 0 && (
          <span className="text-sm text-slate-400 dark:text-slate-500">{toPersianDigits(comments.length)} دیدگاه</span>
        )}
      </div>

      {comments.length > 0 ? (
        <ul className="mb-10 divide-y divide-slate-200 dark:divide-slate-800">
          {comments.map((comment, index) => (
            <CommentItem key={`${comment.created_at}-${index}`} comment={comment} />
          ))}
        </ul>
      ) : (
        <p className="mb-10 text-sm leading-7 text-slate-500 dark:text-slate-400">
          هنوز دیدگاهی ثبت نشده است. اولین نفری باشید که نظر می‌دهد.
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/50">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">ثبت دیدگاه</h3>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          نشانی ایمیل شما منتشر نمی‌شود و فقط برای پاسخ به کار می‌رود.
        </p>

        {status === 'success' ? (
          <p
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-7 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            دیدگاه شما ثبت شد و در انتظار تأیید مدیر است. پس از بررسی، زیر همین مقاله نمایش داده می‌شود.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="comment-name" className={labelClass}>
                  نام
                </label>
                <input
                  id="comment-name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${fieldClass} rounded-full`}
                />
              </div>
              <div>
                <label htmlFor="comment-email" className={labelClass}>
                  ایمیل
                </label>
                <input
                  id="comment-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${fieldClass} rounded-full`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="comment-body" className={labelClass}>
                دیدگاه
              </label>
              <textarea
                id="comment-body"
                name="body"
                required
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className={`${fieldClass} rounded-2xl leading-7`}
              />
            </div>

            {status === 'error' && (
              <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="press w-fit rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'submitting' ? 'در حال ارسال…' : 'ارسال دیدگاه'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

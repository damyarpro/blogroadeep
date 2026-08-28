import { useState, type FormEvent } from 'react';
import type { Comment } from '../../lib/types';
import { formatJalaliDateTime, toPersianDigits } from '../../lib/format';
import { submitComment, ApiError } from '../../lib/api';

/* Radius system: block surfaces = rounded-3xl, single-line inputs and
   pressables = rounded-full, the multi-line textarea = rounded-3xl. */

const fieldClass =
  'w-full border border-bone-300 bg-bone-50 px-5 py-3 text-sm text-ink-950 outline-none transition-colors duration-150 placeholder:text-ink-400 focus:border-forest-800 focus:ring-2 focus:ring-mint-400/60 dark:border-ink-700 dark:bg-ink-950 dark:text-bone-50 dark:focus:border-mint-300';

const labelClass = 'mb-2 block text-sm font-bold text-ink-950 dark:text-bone-100';

/** Avatar-less thread row: the name and the words carry it, nothing else. */
function CommentItem({ comment }: { comment: Comment }) {
  return (
    <li className="py-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-bold text-ink-950 dark:text-bone-50">{comment.name}</span>
        <time dateTime={comment.created_at} className="text-xs text-ink-600 dark:text-bone-400">
          {formatJalaliDateTime(comment.created_at)}
        </time>
      </div>
      <p className="text-sm leading-7 whitespace-pre-line text-ink-600 dark:text-bone-300">{comment.body}</p>
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
      <div className="mb-2 flex flex-wrap items-baseline gap-3">
        <h2 id="comments-heading" className="text-3xl font-black tracking-tight text-ink-950 dark:text-bone-50">
          دیدگاه‌ها
        </h2>
        {comments.length > 0 && (
          <span className="rounded-full bg-bone-200 px-3 py-1 text-xs font-bold text-ink-950 dark:bg-ink-800 dark:text-bone-100">
            {toPersianDigits(comments.length)} دیدگاه
          </span>
        )}
      </div>

      {comments.length > 0 ? (
        <ul className="mb-10 divide-y divide-bone-300 dark:divide-ink-800">
          {comments.map((comment, index) => (
            <CommentItem key={`${comment.created_at}-${index}`} comment={comment} />
          ))}
        </ul>
      ) : (
        <p className="mb-10 text-sm leading-7 text-ink-600 dark:text-bone-300">
          هنوز دیدگاهی ثبت نشده است. اولین نفری باشید که نظر می‌دهد.
        </p>
      )}

      <div className="rounded-[2rem] border border-bone-300 bg-bone-50 p-7 sm:p-10 dark:border-ink-700 dark:bg-ink-900">
        <h3 className="text-xl font-black tracking-tight text-ink-950 dark:text-bone-50">ثبت دیدگاه</h3>
        <p className="mt-2 text-sm text-ink-600 dark:text-bone-300">
          نشانی ایمیل شما منتشر نمی‌شود و فقط برای پاسخ به کار می‌رود.
        </p>

        {status === 'success' ? (
          <p
            role="status"
            className="mt-6 rounded-3xl bg-mint-300 px-6 py-5 text-sm leading-7 font-medium text-ink-950"
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
                className={`${fieldClass} rounded-3xl leading-7`}
              />
            </div>

            {status === 'error' && (
              <p role="alert" className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-bone-50 dark:bg-ink-800">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="press w-fit rounded-full bg-ink-950 px-7 py-3 text-sm font-bold whitespace-nowrap text-bone-50 transition-colors duration-150 hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-mint-300 dark:text-ink-950 dark:hover:bg-mint-400"
            >
              {status === 'submitting' ? 'در حال ارسال…' : 'ارسال دیدگاه'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

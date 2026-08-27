import { useState, type FormEvent } from 'react';
import type { Comment } from '../../lib/types';
import { formatJalaliDateTime } from '../../lib/format';
import { submitComment, ApiError } from '../../lib/api';

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <li className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="font-medium text-slate-800 dark:text-slate-200">{comment.name}</span>
        <time dateTime={comment.created_at} className="text-xs text-slate-400">
          {formatJalaliDateTime(comment.created_at)}
        </time>
      </div>
      <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-400">{comment.body}</p>
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
    <section aria-labelledby="comments-heading" className="mt-12">
      <h2 id="comments-heading" className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
        دیدگاه‌ها {comments.length > 0 && `(${comments.length})`}
      </h2>

      {comments.length > 0 ? (
        <ul className="mb-8 flex flex-col gap-3">
          {comments.map((comment, index) => (
            <CommentItem key={`${comment.created_at}-${index}`} comment={comment} />
          ))}
        </ul>
      ) : (
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
          هنوز دیدگاهی ثبت نشده است. اولین نفری باشید که نظر می‌دهد.
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">ثبت دیدگاه</h3>

        {status === 'success' ? (
          <p
            role="status"
            className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            دیدگاه شما با موفقیت ثبت شد و پس از تأیید مدیر نمایش داده خواهد شد.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="comment-name" className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                  نام
                </label>
                <input
                  id="comment-name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label htmlFor="comment-email" className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                  ایمیل
                </label>
                <input
                  id="comment-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>
            <div>
              <label htmlFor="comment-body" className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                دیدگاه
              </label>
              <textarea
                id="comment-body"
                name="body"
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
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
              className="w-fit rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'submitting' ? 'در حال ارسال…' : 'ارسال دیدگاه'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

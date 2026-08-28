import { useState, type FormEvent } from 'react';
import type { Comment } from '../../lib/types';
import { formatJalaliDateTime, toPersianDigits } from '../../lib/format';
import { submitComment, ApiError } from '../../lib/api';
import { cardShell, fieldClass, fieldLabelClass, pillShell, solidPill } from '../magazine/tokens';

/* Radius lock: cards = rounded-3xl, single-line inputs and pressables =
   rounded-full, the multi-line textarea keeps the card radius. */

/** Avatar-less thread card: a mint initial disc, the name, then the words. */
function CommentItem({ comment }: { comment: Comment }) {
  return (
    <li className={`p-5 sm:p-6 ${cardShell}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-300 text-xs font-black text-ink-950"
          >
            {comment.name.trim().charAt(0) || 'م'}
          </span>
          <span className="font-bold text-ink-950 dark:text-bone-50">{comment.name}</span>
        </span>
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
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 id="comments-heading" className="text-2xl font-black tracking-tight text-ink-950 dark:text-bone-50">
          دیدگاه‌ها
        </h2>
        {comments.length > 0 && (
          <span className={`px-4 py-1.5 text-xs font-bold text-ink-950 dark:text-bone-100 ${pillShell}`}>
            {toPersianDigits(comments.length)} دیدگاه
          </span>
        )}
      </div>

      {comments.length > 0 ? (
        <ul className="mb-8 flex flex-col gap-3">
          {comments.map((comment, index) => (
            <CommentItem key={`${comment.created_at}-${index}`} comment={comment} />
          ))}
        </ul>
      ) : (
        <p className="mb-8 text-sm leading-7 text-ink-600 dark:text-bone-300">
          هنوز دیدگاهی ثبت نشده است. اولین نفری باشید که نظر می‌دهد.
        </p>
      )}

      <div className={`p-6 sm:p-9 ${cardShell}`}>
        <h3 className="text-xl font-black tracking-tight text-ink-950 dark:text-bone-50">ثبت دیدگاه</h3>
        <p className="mt-2 text-sm text-ink-600 dark:text-bone-300">
          نشانی ایمیل شما منتشر نمی‌شود و فقط برای پاسخ به کار می‌رود.
        </p>

        {status === 'success' ? (
          <p role="status" className="mt-6 rounded-3xl bg-mint-300 px-6 py-5 text-sm leading-7 font-medium text-ink-950">
            دیدگاه شما ثبت شد و در انتظار تأیید مدیر است. پس از بررسی، زیر همین مقاله نمایش داده می‌شود.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="comment-name" className={fieldLabelClass}>
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
                <label htmlFor="comment-email" className={fieldLabelClass}>
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
              <label htmlFor="comment-body" className={fieldLabelClass}>
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

            <button type="submit" disabled={status === 'submitting'} className={`w-fit ${solidPill}`}>
              {status === 'submitting' ? 'در حال ارسال…' : 'ارسال دیدگاه'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

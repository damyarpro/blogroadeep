// Single module responsible for talking to the Django REST backend.
// If backend field/route names shift slightly, adjust only here.
import type {
  Category,
  Comment,
  CommentPayload,
  Paginated,
  PostDetail,
  PostSummary,
  PostsQuery,
  Tag,
} from './types';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api';

// Static demo mode (GitHub Pages): there is no Django backend to talk to, so every
// function below serves from the pre-fetched JSON snapshot in public/data/ instead of
// issuing a fetch to Django. Toggled only by the Pages build
// (see .github/workflows/deploy-pages.yml); the normal dev/prod build against a real
// backend is unaffected.
export const isStaticMode: boolean = import.meta.env.VITE_STATIC_DATA === 'true';

const STATIC_PAGE_SIZE = 9;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });
  } catch {
    throw new ApiError('اتصال به سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.', 0);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = typeof body?.detail === 'string' ? body.detail : '';
    } catch {
      // response had no JSON body — ignore
    }
    throw new ApiError(
      detail || `خطای سرور (کد ${response.status})`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== null) {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// ---------------------------------------------------------------------------
// Static demo data (GitHub Pages) — no backend, so we load the JSON snapshot once
// per page load and answer every query (search, filter, pagination) client-side.
// ---------------------------------------------------------------------------

let staticPostsPromise: Promise<PostDetail[]> | null = null;
let staticCategoriesPromise: Promise<Category[]> | null = null;
let staticTagsPromise: Promise<Tag[]> | null = null;

async function loadStaticJson<T>(file: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}data/${file}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiError('بارگذاری داده‌های نمایشی با خطا مواجه شد.', 0);
  }
  if (!response.ok) {
    throw new ApiError(`خطای بارگذاری داده‌های نمایشی (کد ${response.status})`, response.status);
  }
  return (await response.json()) as T;
}

function loadStaticPosts(): Promise<PostDetail[]> {
  if (!staticPostsPromise) {
    staticPostsPromise = loadStaticJson<PostDetail[]>('posts.json');
  }
  return staticPostsPromise;
}

function loadStaticCategories(): Promise<Category[]> {
  if (!staticCategoriesPromise) {
    staticCategoriesPromise = loadStaticJson<Category[]>('categories.json');
  }
  return staticCategoriesPromise;
}

function loadStaticTags(): Promise<Tag[]> {
  if (!staticTagsPromise) {
    staticTagsPromise = loadStaticJson<Tag[]>('tags.json');
  }
  return staticTagsPromise;
}

async function fetchPostsStatic(query: PostsQuery): Promise<Paginated<PostSummary>> {
  const posts = await loadStaticPosts();
  const search = query.search?.trim().toLowerCase();

  const filtered = posts.filter((post) => {
    if (query.category && post.category?.slug !== query.category) return false;
    if (query.tag && !post.tags.some((tag) => tag.slug === query.tag)) return false;
    if (search) {
      const haystack = `${post.title} ${post.excerpt} ${post.content}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );

  const page = query.page && query.page > 0 ? query.page : 1;
  const start = (page - 1) * STATIC_PAGE_SIZE;
  const results = sorted.slice(start, start + STATIC_PAGE_SIZE);

  return {
    count: sorted.length,
    next: start + STATIC_PAGE_SIZE < sorted.length ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    results,
  };
}

async function fetchPostStatic(slug: string): Promise<PostDetail> {
  const posts = await loadStaticPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    // Same shape the UI already handles: ArticleDetailPage treats status 404 as "not found".
    throw new ApiError('یافت نشد.', 404);
  }
  return post;
}

// ---------------------------------------------------------------------------
// Public API — signatures stay identical between live and static demo mode so
// pages never need to know which one is active.
// ---------------------------------------------------------------------------

export function fetchPosts(query: PostsQuery = {}): Promise<Paginated<PostSummary>> {
  if (isStaticMode) return fetchPostsStatic(query);

  const qs = buildQuery({
    page: query.page,
    search: query.search,
    category: query.category,
    tag: query.tag,
  });
  return request<Paginated<PostSummary>>(`/posts/${qs}`);
}

export function fetchPost(slug: string): Promise<PostDetail> {
  if (isStaticMode) return fetchPostStatic(slug);
  return request<PostDetail>(`/posts/${encodeURIComponent(slug)}/`);
}

export function fetchCategories(): Promise<Category[]> {
  if (isStaticMode) return loadStaticCategories();
  return request<Category[]>('/categories/');
}

export function fetchTags(): Promise<Tag[]> {
  if (isStaticMode) return loadStaticTags();
  return request<Tag[]>('/tags/');
}

export function submitComment(slug: string, payload: CommentPayload): Promise<Comment> {
  if (isStaticMode) {
    return Promise.reject(new ApiError('در نسخهٔ نمایشی امکان ثبت دیدگاه نیست.', 403));
  }
  return request<Comment>(`/posts/${encodeURIComponent(slug)}/comments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

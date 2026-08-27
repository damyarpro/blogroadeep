// Single module responsible for talking to the Django REST backend.
// If backend field/route names shift slightly, adjust only here.
import { readToken } from './authToken';
import type {
  AdminComment,
  AdminPost,
  AdminPostPayload,
  AdminPostSummary,
  AdminPostsQuery,
  AdminStats,
  AdminTag,
  Category,
  Comment,
  CommentPayload,
  LoginResponse,
  Paginated,
  PanelUser,
  PostDetail,
  PostSummary,
  PostsQuery,
  SlugAvailability,
  Tag,
  UploadResult,
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

  /** DRF field errors, e.g. `{ slug: ['نوشته‌ای با این نامک وجود دارد.'] }`. */
  fields?: Record<string, string[]>;

  constructor(message: string, status: number, fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

/** Turn a DRF error body into a readable message plus per-field errors. */
function parseErrorBody(body: unknown): { message: string; fields?: Record<string, string[]> } {
  if (!body || typeof body !== 'object') return { message: '' };
  const record = body as Record<string, unknown>;
  if (typeof record.detail === 'string') return { message: record.detail };

  const fields: Record<string, string[]> = {};
  const messages: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    const list = Array.isArray(value) ? value.map(String) : [String(value)];
    fields[key] = list;
    messages.push(list.join(' '));
  }
  return { message: messages.join(' ').trim(), fields: Object.keys(fields).length ? fields : undefined };
}

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  /** Attach the panel's `Authorization: Token …` header. */
  auth?: boolean;
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { headers, auth, ...rest } = init;
  const url = `${API_BASE_URL}${path}`;
  const finalHeaders: Record<string, string> = { Accept: 'application/json', ...(headers ?? {}) };
  if (auth) {
    const token = readToken();
    if (token) finalHeaders.Authorization = `Token ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { headers: finalHeaders, ...rest });
  } catch {
    throw new ApiError('اتصال به سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.', 0);
  }

  if (!response.ok) {
    let parsed: { message: string; fields?: Record<string, string[]> } = { message: '' };
    try {
      parsed = parseErrorBody(await response.json());
    } catch {
      // response had no JSON body — ignore
    }
    throw new ApiError(
      parsed.message || `خطای سرور (کد ${response.status})`,
      response.status,
      parsed.fields,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function jsonRequest<T>(path: string, method: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method,
    auth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
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

// ---------------------------------------------------------------------------
// Authoring panel API (token auth, staff only). Every call here needs the real
// Django backend — the static demo build has no server to write to.
// ---------------------------------------------------------------------------

const STATIC_PANEL_MESSAGE =
  'در نسخهٔ نمایشی، پنل نویسنده در دسترس نیست؛ برای نوشتن و انتشار به بک‌اند جنگو نیاز است.';

function rejectInStaticMode<T>(): Promise<T> {
  return Promise.reject(new ApiError(STATIC_PANEL_MESSAGE, 503));
}

export function login(username: string, password: string): Promise<LoginResponse> {
  if (isStaticMode) return rejectInStaticMode();
  return request<LoginResponse>('/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function logout(): Promise<void> {
  if (isStaticMode) return Promise.resolve();
  return request<void>('/auth/logout/', { method: 'POST', auth: true });
}

export function fetchMe(): Promise<PanelUser> {
  if (isStaticMode) return rejectInStaticMode();
  return request<PanelUser>('/auth/me/', { auth: true });
}

export function fetchAdminStats(): Promise<AdminStats> {
  if (isStaticMode) return rejectInStaticMode();
  return request<AdminStats>('/admin/stats/', { auth: true });
}

export function fetchAdminPosts(
  query: AdminPostsQuery = {},
): Promise<Paginated<AdminPostSummary>> {
  if (isStaticMode) return rejectInStaticMode();
  const qs = buildQuery({
    page: query.page,
    search: query.search,
    status: query.status,
    category: query.category,
    ordering: query.ordering,
  });
  return request<Paginated<AdminPostSummary>>(`/admin/posts/${qs}`, { auth: true });
}

export function fetchAdminPost(id: number): Promise<AdminPost> {
  if (isStaticMode) return rejectInStaticMode();
  return request<AdminPost>(`/admin/posts/${id}/`, { auth: true });
}

/**
 * Posts go out as JSON unless a fresh cover image file is attached, in which case
 * the whole payload has to travel as multipart/form-data.
 */
function postRequestInit(payload: AdminPostPayload, method: string): RequestOptions {
  const { cover_image: coverImage, ...rest } = payload;

  if (!(coverImage instanceof File)) {
    const body: Record<string, unknown> = { ...rest };
    return {
      method,
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined) continue;
    if (key === 'tags' && Array.isArray(value)) {
      for (const tag of value) form.append('tags', String(tag));
    } else if (value === null) {
      form.append(key, '');
    } else {
      form.append(key, String(value));
    }
  }
  form.append('cover_image', coverImage);
  return { method, auth: true, body: form };
}

export function createAdminPost(payload: AdminPostPayload): Promise<AdminPost> {
  if (isStaticMode) return rejectInStaticMode();
  return request<AdminPost>('/admin/posts/', postRequestInit(payload, 'POST'));
}

export function updateAdminPost(
  id: number,
  payload: AdminPostPayload,
): Promise<AdminPost> {
  if (isStaticMode) return rejectInStaticMode();
  return request<AdminPost>(`/admin/posts/${id}/`, postRequestInit(payload, 'PATCH'));
}

export function patchAdminPost(
  id: number,
  patch: Partial<AdminPostPayload>,
): Promise<AdminPost> {
  if (isStaticMode) return rejectInStaticMode();
  return jsonRequest<AdminPost>(`/admin/posts/${id}/`, 'PATCH', patch);
}

export function deleteAdminPost(id: number): Promise<void> {
  if (isStaticMode) return rejectInStaticMode();
  return request<void>(`/admin/posts/${id}/`, { method: 'DELETE', auth: true });
}

export function checkSlugAvailability(
  slug: string,
  excludeId?: number,
): Promise<SlugAvailability> {
  if (isStaticMode) return rejectInStaticMode();
  const qs = buildQuery({ slug, exclude: excludeId });
  return request<SlugAvailability>(`/admin/posts/slug-available/${qs}`, { auth: true });
}

export function fetchAdminCategories(): Promise<Category[]> {
  if (isStaticMode) return rejectInStaticMode();
  return request<Category[]>('/admin/categories/', { auth: true });
}

export function createAdminCategory(payload: {
  name: string;
  slug?: string;
  description?: string;
}): Promise<Category> {
  if (isStaticMode) return rejectInStaticMode();
  return jsonRequest<Category>('/admin/categories/', 'POST', payload);
}

export function updateAdminCategory(
  id: number,
  payload: { name?: string; slug?: string; description?: string },
): Promise<Category> {
  if (isStaticMode) return rejectInStaticMode();
  return jsonRequest<Category>(`/admin/categories/${id}/`, 'PATCH', payload);
}

export function deleteAdminCategory(id: number): Promise<void> {
  if (isStaticMode) return rejectInStaticMode();
  return request<void>(`/admin/categories/${id}/`, { method: 'DELETE', auth: true });
}

export function fetchAdminTags(): Promise<Tag[]> {
  if (isStaticMode) return rejectInStaticMode();
  return request<Tag[]>('/admin/tags/', { auth: true });
}

export function createAdminTag(payload: { name: string; slug?: string }): Promise<AdminTag> {
  if (isStaticMode) return rejectInStaticMode();
  return jsonRequest<AdminTag>('/admin/tags/', 'POST', payload);
}

export function updateAdminTag(
  id: number,
  payload: { name?: string; slug?: string },
): Promise<Tag> {
  if (isStaticMode) return rejectInStaticMode();
  return jsonRequest<Tag>(`/admin/tags/${id}/`, 'PATCH', payload);
}

export function deleteAdminTag(id: number): Promise<void> {
  if (isStaticMode) return rejectInStaticMode();
  return request<void>(`/admin/tags/${id}/`, { method: 'DELETE', auth: true });
}

export function fetchAdminComments(query: {
  page?: number;
  is_approved?: boolean;
  search?: string;
} = {}): Promise<Paginated<AdminComment>> {
  if (isStaticMode) return rejectInStaticMode();
  const qs = buildQuery({
    page: query.page,
    is_approved: query.is_approved,
    search: query.search,
  });
  return request<Paginated<AdminComment>>(`/admin/comments/${qs}`, { auth: true });
}

export function setCommentApproval(id: number, approved: boolean): Promise<AdminComment> {
  if (isStaticMode) return rejectInStaticMode();
  const path = `/admin/comments/${id}/${approved ? 'approve' : 'unapprove'}/`;
  return request<AdminComment>(path, { method: 'POST', auth: true });
}

export function bulkApproveComments(
  ids: number[],
  approved = true,
): Promise<{ updated: number; is_approved: boolean }> {
  if (isStaticMode) return rejectInStaticMode();
  return jsonRequest('/admin/comments/bulk-approve/', 'POST', { ids, is_approved: approved });
}

export function deleteAdminComment(id: number): Promise<void> {
  if (isStaticMode) return rejectInStaticMode();
  return request<void>(`/admin/comments/${id}/`, { method: 'DELETE', auth: true });
}

export function uploadImage(file: File): Promise<UploadResult> {
  if (isStaticMode) return rejectInStaticMode();
  const form = new FormData();
  form.append('file', file);
  return request<UploadResult>('/admin/uploads/', { method: 'POST', auth: true, body: form });
}

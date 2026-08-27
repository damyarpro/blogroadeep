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

export function fetchPosts(query: PostsQuery = {}): Promise<Paginated<PostSummary>> {
  const qs = buildQuery({
    page: query.page,
    search: query.search,
    category: query.category,
    tag: query.tag,
  });
  return request<Paginated<PostSummary>>(`/posts/${qs}`);
}

export function fetchPost(slug: string): Promise<PostDetail> {
  return request<PostDetail>(`/posts/${encodeURIComponent(slug)}/`);
}

export function fetchCategories(): Promise<Category[]> {
  return request<Category[]>('/categories/');
}

export function fetchTags(): Promise<Tag[]> {
  return request<Tag[]>('/tags/');
}

export function submitComment(slug: string, payload: CommentPayload): Promise<Comment> {
  return request<Comment>(`/posts/${encodeURIComponent(slug)}/comments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Types describing the shapes returned by the Django REST API.
// Keep in sync with src/lib/api.ts if backend field names shift.

export interface Category {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  post_count: number;
}

export interface Tag {
  id?: number;
  name: string;
  slug: string;
  post_count: number;
}

export interface Author {
  id: number;
  username: string;
  full_name: string;
}

export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  category: Category | null;
  tags: Tag[];
  author: Author;
  published_at: string;
  reading_time: number | null;
}

export interface Comment {
  name: string;
  body: string;
  created_at: string;
}

export interface PostDetail extends PostSummary {
  content: string;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  canonical_url: string | null;
  comments: Comment[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CommentPayload {
  name: string;
  email: string;
  body: string;
}

export interface PostsQuery {
  page?: number;
  search?: string;
  category?: string;
  tag?: string;
}

// ---------------------------------------------------------------------------
// Authoring panel (/api/auth/ and /api/admin/) — staff only.
// ---------------------------------------------------------------------------

export interface PanelUser {
  id: number;
  username: string;
  full_name: string;
  is_staff: boolean;
}

export interface LoginResponse {
  token: string;
  user: PanelUser;
}

export type PostStatus = 'draft' | 'published';

export interface AdminTag {
  id: number;
  name: string;
  slug: string;
}

export interface AdminPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author: PanelUser;
  category: Category | null;
  tags: AdminTag[];
  cover_image: string | null;
  status: PostStatus;
  is_published: boolean;
  reading_time: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  comment_count: number;
  pending_comment_count: number;
}

export interface AdminPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: PanelUser;
  category: number | null;
  category_detail: Category | null;
  tags: AdminTag[];
  cover_image: string | null;
  status: PostStatus;
  is_published: boolean;
  published_at: string | null;
  reading_time: number | null;
  created_at: string;
  updated_at: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
}

/** Fields the panel sends back on save. `cover_image` is a freshly picked File. */
export interface AdminPostPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: number | null;
  tags?: (number | string)[];
  status?: PostStatus;
  published_at?: string | null;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  cover_image?: File | null;
  remove_cover_image?: boolean;
}

export interface AdminPostsQuery {
  page?: number;
  search?: string;
  status?: PostStatus | '';
  category?: number | '';
  ordering?: string;
}

export interface AdminComment {
  id: number;
  post: number;
  post_title: string;
  post_slug: string;
  name: string;
  email: string;
  body: string;
  created_at: string;
  is_approved: boolean;
}

export interface AdminStats {
  posts: { total: number; published: number; draft: number; scheduled: number };
  comments: { total: number; pending: number; approved: number };
  taxonomy: { categories: number; tags: number };
  recent_posts: AdminPostSummary[];
}

export interface SlugAvailability {
  slug: string;
  available: boolean;
  detail?: string;
}

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
}

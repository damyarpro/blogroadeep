// Types describing the shapes returned by the Django REST API.
// Keep in sync with src/lib/api.ts if backend field names shift.

export interface Category {
  name: string;
  slug: string;
  post_count: number;
}

export interface Tag {
  name: string;
  slug: string;
  post_count: number;
}

export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  category: Category | null;
  tags: Tag[];
  author_name: string;
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

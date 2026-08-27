import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { RequireStaff } from './components/admin/RequireStaff';
import { HomePage } from './pages/HomePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { NotFoundPage } from './pages/NotFoundPage';

// The panel (and its editor bundle: Tiptap/ProseMirror) is loaded on demand, so
// readers of the public site never download it.
const AdminLayout = lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('./pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const PostsListPage = lazy(() =>
  import('./pages/admin/PostsListPage').then((m) => ({ default: m.PostsListPage })),
);
const PostEditorPage = lazy(() =>
  import('./pages/admin/PostEditorPage').then((m) => ({ default: m.PostEditorPage })),
);
const CommentsPage = lazy(() =>
  import('./pages/admin/CommentsPage').then((m) => ({ default: m.CommentsPage })),
);
const TaxonomyPage = lazy(() =>
  import('./pages/admin/TaxonomyPage').then((m) => ({ default: m.TaxonomyPage })),
);

function PanelFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        role="status"
        aria-label="در حال بارگذاری"
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400"
      />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PanelFallback />}>
      <Routes>
        {/* Authoring panel — its own chrome, staff only, never indexed. */}
        <Route
          path="/admin"
          element={
            <RequireStaff>
              <AdminLayout />
            </RequireStaff>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="posts" element={<PostsListPage />} />
          <Route path="posts/new" element={<PostEditorPage />} />
          <Route path="posts/:id/edit" element={<PostEditorPage />} />
          <Route path="comments" element={<CommentsPage />} />
          <Route path="taxonomy" element={<TaxonomyPage />} />
        </Route>

        {/* Public site */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticleDetailPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;

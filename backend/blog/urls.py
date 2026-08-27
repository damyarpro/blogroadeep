from django.urls import include, path

from . import admin_views, views

app_name = "blog"

urlpatterns = [
    # Authoring panel: token auth + staff-only CRUD. The routes below it stay public.
    path("auth/login/", admin_views.LoginView.as_view(), name="auth-login"),
    path("auth/logout/", admin_views.LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", admin_views.MeView.as_view(), name="auth-me"),
    path("admin/", include("blog.admin_urls")),
    path("posts/", views.PostListView.as_view(), name="post-list"),
    path("posts/<str:slug>/", views.PostDetailView.as_view(), name="post-detail"),
    path(
        "posts/<str:slug>/comments/",
        views.CommentCreateView.as_view(),
        name="comment-create",
    ),
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("tags/", views.TagListView.as_view(), name="tag-list"),
]

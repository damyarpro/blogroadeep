from django.urls import path

from . import views

app_name = "blog"

urlpatterns = [
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

from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Rss201rev2Feed

from .models import Post

FEED_LIMIT = 20


class LatestPostsFeed(Feed):
    feed_type = Rss201rev2Feed
    title = "وبلاگ رودیپ"
    link = "/feed/"
    description = "تازه‌ترین نوشته‌های منتشرشده در وبلاگ"
    language = "fa"

    def items(self):
        return Post.published.with_related()[:FEED_LIMIT]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.excerpt or item.meta_description

    def item_link(self, item):
        return item.get_absolute_url()

    def item_pubdate(self, item):
        return item.published_at

    def item_updateddate(self, item):
        return item.updated_at

    def item_author_name(self, item):
        return item.author.get_full_name() or item.author.username

    def item_categories(self, item):
        return [tag.name for tag in item.tags.all()]

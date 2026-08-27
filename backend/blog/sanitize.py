"""Server-side sanitization for author-submitted post HTML.

Post content is authored in the SPA panel and rendered on the public article page
with `dangerouslySetInnerHTML`, so it must never reach the database with scripts,
inline styles or event handlers still attached. Everything goes through
`sanitize_html()` on `Post.save()`, which covers the authoring API, the Django
admin and management commands alike.
"""

import nh3

# Tags a blog post legitimately needs. Anything else is unwrapped by nh3
# (its text survives); `script` and `style` have their content dropped entirely.
ALLOWED_TAGS = {
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "ins",
    "mark",
    "sub",
    "sup",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "code",
    "pre",
    "hr",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "colgroup",
    "col",
    "figure",
    "figcaption",
    "div",
    "span",
}

ALLOWED_ATTRIBUTES = {
    # "rel" is intentionally absent: nh3 sets it itself via `link_rel` below.
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "width", "height", "loading"},
    "ol": {"start", "type"},
    "th": {"colspan", "rowspan", "scope"},
    "td": {"colspan", "rowspan"},
    "col": {"span"},
    "colgroup": {"span"},
    "blockquote": {"cite"},
    "code": {"class"},
    "pre": {"class"},
    "*": {"dir", "lang"},
}

# Content of these tags is removed, not just unwrapped.
CLEAN_CONTENT_TAGS = {"script", "style", "iframe", "object", "embed"}


def sanitize_html(value):
    """Return `value` with only the whitelisted tags/attributes left intact."""
    if not value:
        return value
    return nh3.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        clean_content_tags=CLEAN_CONTENT_TAGS,
        strip_comments=True,
        link_rel="noopener noreferrer",
    )

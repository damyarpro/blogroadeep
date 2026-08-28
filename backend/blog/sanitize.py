"""Server-side sanitization for author-submitted post HTML.

Post content is authored in the SPA panel and rendered on the public article page
with `dangerouslySetInnerHTML`, so it must never reach the database with scripts,
inline styles or event handlers still attached. Everything goes through
`sanitize_html()` on `Post.save()`, which covers the authoring API, the Django
admin and management commands alike.
"""

import re

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
    # `style` is allowed only on the tags below AND only for the exact
    # properties `_filter_attribute` accepts (text-align / background-color).
    "p": {"style"},
    "h2": {"style"},
    "h3": {"style"},
    "h4": {"style"},
    "mark": {"style"},
}

# Content of these tags is removed, not just unwrapped.
CLEAN_CONTENT_TAGS = {"script", "style", "iframe", "object", "embed"}

# The editor's text-align (RTL-aware) and highlight colors are the only inline
# styles the panel produces. Restricting `style` to these exact shapes keeps the
# attribute useless as an injection vector (no url(), expression(), position…).
_TEXT_ALIGN_RE = re.compile(r"^\s*text-align\s*:\s*(left|right|center|justify)\s*;?\s*$")
_HIGHLIGHT_RE = re.compile(
    r"^\s*background-color\s*:\s*"
    r"(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))"
    r"\s*;?\s*$"
)


def _filter_attribute(tag, attribute, value):
    """Keep `style` only when it is exactly one whitelisted declaration."""
    if attribute != "style":
        return value
    if tag == "mark":
        return value if _HIGHLIGHT_RE.match(value) else None
    return value if _TEXT_ALIGN_RE.match(value) else None


def sanitize_html(value):
    """Return `value` with only the whitelisted tags/attributes left intact."""
    if not value:
        return value
    return nh3.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        attribute_filter=_filter_attribute,
        clean_content_tags=CLEAN_CONTENT_TAGS,
        strip_comments=True,
        link_rel="noopener noreferrer",
    )

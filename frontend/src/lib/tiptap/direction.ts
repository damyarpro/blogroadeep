// Per-block LTR/RTL direction toggle for mixed Persian/English content (code
// snippets, Latin quotes, etc). Adds a `dir` attribute to block nodes; the
// backend sanitizer already whitelists `dir`/`lang` on every tag (see
// backend/blog/sanitize.py, ALLOWED_ATTRIBUTES["*"]), so this survives
// unchanged through `sanitize_html()`.
import { Extension } from '@tiptap/core';

export interface DirectionOptions {
  /** Node types that may carry an explicit `dir` attribute. */
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    direction: {
      /** Flip the current block between the inherited RTL default and explicit LTR. */
      toggleDirection: () => ReturnType;
    };
  }
}

export const Direction = Extension.create<DirectionOptions>({
  name: 'direction',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote', 'listItem'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: null,
            parseHTML: (element) => (element.getAttribute('dir') === 'ltr' ? 'ltr' : null),
            renderHTML: (attributes) => (attributes.dir === 'ltr' ? { dir: 'ltr' } : {}),
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      toggleDirection:
        () =>
        ({ editor, chain }) => {
          const activeType = this.options.types.find((type) => editor.isActive(type));
          if (!activeType) return false;
          const current = editor.getAttributes(activeType).dir as string | null;
          return chain()
            .updateAttributes(activeType, { dir: current === 'ltr' ? null : 'ltr' })
            .run();
        },
    };
  },
});

/** Is the caret currently inside a block explicitly marked `dir="ltr"`? */
export function isDirectionLtrActive(
  editor: { isActive: (name: string, attrs?: Record<string, unknown>) => boolean },
  types: string[],
): boolean {
  return types.some((type) => editor.isActive(type, { dir: 'ltr' }));
}

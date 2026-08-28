// Small, dependency-free Persian text utilities for the authoring panel's
// «ابزار فارسی» toolbar group: fixing Arabic look-alike letters, normalizing
// digits, wrapping selections in guillemets, and inserting ZWNJ (نیم‌فاصله).
import { Extension, type Editor } from '@tiptap/core';
import type { Mark } from '@tiptap/pm/model';
import { toPersianDigits } from '../format';

export const ZWNJ = '‌';

const ARABIC_TO_PERSIAN_LETTERS: Record<string, string> = {
  'ي': 'ی', // ي → ی
  'ك': 'ک', // ك → ک
};

/** Arabic ي/ك → Persian ی/ک. */
export function toPersianLettersText(value: string): string {
  return value.replace(/[يك]/g, (char) => ARABIC_TO_PERSIAN_LETTERS[char] ?? char);
}

/**
 * Rewrite every text node touching the selection (or the whole document when
 * nothing is selected) with `transform`, preserving each node's own marks.
 */
function transformEditorText(editor: Editor, transform: (text: string) => string): boolean {
  const { state, view } = editor;
  const { selection } = state;
  const from = selection.empty ? 0 : selection.from;
  const to = selection.empty ? state.doc.content.size : selection.to;

  const edits: { from: number; to: number; text: string; marks: readonly Mark[] }[] = [];

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText || !node.text) return;
    const start = Math.max(pos, from);
    const end = Math.min(pos + node.text.length, to);
    if (start >= end) return;
    const slice = node.text.slice(start - pos, end - pos);
    const next = transform(slice);
    if (next !== slice) {
      edits.push({ from: start, to: end, text: next, marks: node.marks });
    }
  });

  if (!edits.length) return false;

  const tr = state.tr;
  for (const edit of edits.reverse()) {
    tr.replaceWith(edit.from, edit.to, state.schema.text(edit.text, edit.marks));
  }
  view.dispatch(tr);
  editor.view.focus();
  return true;
}

export function convertSelectionToPersianLetters(editor: Editor): boolean {
  return transformEditorText(editor, toPersianLettersText);
}

export function convertSelectionToPersianDigits(editor: Editor): boolean {
  return transformEditorText(editor, toPersianDigits);
}

/** Wrap the selection in « » guillemets, or insert an empty pair at the caret. */
export function insertGuillemets(editor: Editor): boolean {
  const { state } = editor;
  const { from, to, empty } = state.selection;

  if (!empty) {
    const text = state.doc.textBetween(from, to, '​');
    return editor.chain().focus().insertContentAt({ from, to }, `«${text}»`).run();
  }

  const ran = editor.chain().focus().insertContent('«»').run();
  if (ran) {
    editor.chain().setTextSelection(editor.state.selection.from - 1).run();
  }
  return ran;
}

/** Ctrl/Cmd+Shift+2 inserts a ZWNJ (نیم‌فاصله) at the caret, e.g. «می‌روم». */
export const PersianTools = Extension.create({
  name: 'persianTools',
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-2': () => this.editor.commands.insertContent(ZWNJ),
    };
  },
});

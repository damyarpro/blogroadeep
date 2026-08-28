// Tiptap-based RTL rich text editor for the authoring panel.
// The editing surface reuses the public article's `prose-fa` classes, so what an
// author sees here is what readers get on /articles/:slug.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TableKit } from '@tiptap/extension-table';
import CharacterCount from '@tiptap/extension-character-count';
import { ApiError, uploadImage } from '../../lib/api';
import { toPersianDigits } from '../../lib/format';
import { Direction, isDirectionLtrActive } from '../../lib/tiptap/direction';
import {
  PersianTools,
  ZWNJ,
  convertSelectionToPersianDigits,
  convertSelectionToPersianLetters,
  insertGuillemets,
} from '../../lib/tiptap/persianTools';
import '../../styles/editor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onNotify?: (message: string, tone: 'success' | 'error' | 'info') => void;
  /** Bump to force-reload `value` into the editor (e.g. after restoring a draft). */
  resetKey?: number;
}

const EDITOR_PLACEHOLDER = 'نوشتن را از اینجا شروع کنید…';

/** Block types that can carry alignment / an explicit `dir`. */
const DIRECTION_TYPES = ['paragraph', 'heading', 'blockquote', 'listItem'];

const HIGHLIGHT_COLORS: { label: string; value: string; swatch: string }[] = [
  { label: 'زرد', value: '#fde68a', swatch: '#fde68a' },
  { label: 'سبز', value: '#a7f3d0', swatch: '#a7f3d0' },
  { label: 'آبی', value: '#bae6fd', swatch: '#bae6fd' },
  { label: 'صورتی', value: '#fecdd3', swatch: '#fecdd3' },
  { label: 'بنفش', value: '#ddd6fe', swatch: '#ddd6fe' },
];

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={[
        'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition',
        active
          ? 'bg-indigo-600 text-white'
          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />;
}

const stroke = (path: string) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

/** A toolbar button that opens a small popover menu, closing on outside click / Escape. */
function ToolbarDropdown({
  label,
  trigger,
  active = false,
  children,
}: {
  label: string;
  trigger: ReactNode;
  active?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <ToolbarButton label={label} active={active || open} onClick={() => setOpen((v) => !v)}>
        {trigger}
      </ToolbarButton>
      {open && (
        <div className="absolute start-0 top-full z-20 mt-1.5 min-w-[11rem] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-start text-xs text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onPickImage,
  uploading,
}: {
  editor: Editor;
  onPickImage: () => void;
  uploading: boolean;
}) {
  const setLink = useCallback(() => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('نشانی پیوند را وارد کنید:', previous ?? 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }, [editor]);

  const dirActive = isDirectionLtrActive(editor, DIRECTION_TYPES);
  const inTable = editor.isActive('table');

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-100 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/70">
      <ToolbarButton
        label="درشت (Ctrl+B)"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-extrabold">B</span>
      </ToolbarButton>
      <ToolbarButton
        label="کج (Ctrl+I)"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="font-serif italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        label="زیرخط (Ctrl+U)"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        label="خط‌خورده"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="سرتیتر درجه ۲"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton
        label="سرتیتر درجه ۳"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="font-bold">H3</span>
      </ToolbarButton>
      <ToolbarButton
        label="سرتیتر درجه ۴"
        active={editor.isActive('heading', { level: 4 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      >
        <span className="font-bold">H4</span>
      </ToolbarButton>
      <ToolbarButton
        label="پاراگراف"
        active={editor.isActive('paragraph')}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <span className="font-bold">P</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="چینش راست"
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        {stroke('M4 6h16M10 12h10M4 18h16')}
      </ToolbarButton>
      <ToolbarButton
        label="وسط‌چین"
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        {stroke('M4 6h16M7 12h10M6 18h12')}
      </ToolbarButton>
      <ToolbarButton
        label="چینش چپ"
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        {stroke('M4 6h16M4 12h10M4 18h16')}
      </ToolbarButton>
      <ToolbarButton
        label="بلوکی (justify)"
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        {stroke('M4 6h16M4 12h16M4 18h16')}
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="فهرست نقطه‌ای"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        {stroke('M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01')}
      </ToolbarButton>
      <ToolbarButton
        label="فهرست شماره‌دار"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        {stroke('M9 6h12M9 12h12M9 18h12M4 5h1v4M4 13h2l-2 3h2')}
      </ToolbarButton>
      <ToolbarButton
        label="نقل قول"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        {stroke('M7 7h4v4a4 4 0 0 1-4 4V7Zm9 0h4v4a4 4 0 0 1-4 4V7Z')}
      </ToolbarButton>
      <ToolbarButton
        label="بلوک کد"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {stroke('m8 8-4 4 4 4m8-8 4 4-4 4')}
      </ToolbarButton>
      <ToolbarButton
        label="خط جداکننده"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        {stroke('M4 12h16')}
      </ToolbarButton>

      <Divider />

      <ToolbarDropdown
        label="هایلایت متن"
        active={editor.isActive('highlight')}
        trigger={<span className="rounded bg-amber-200 px-1 font-bold text-slate-800">H</span>}
      >
        {(close) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 px-1 py-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  aria-label={`هایلایت ${color.label}`}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: color.value }).run();
                    close();
                  }}
                  className={[
                    'h-6 w-6 rounded-full border transition',
                    editor.isActive('highlight', { color: color.value })
                      ? 'border-indigo-600 ring-2 ring-indigo-400'
                      : 'border-slate-300 dark:border-slate-600',
                  ].join(' ')}
                  style={{ backgroundColor: color.swatch }}
                />
              ))}
            </div>
            <DropdownItem
              disabled={!editor.isActive('highlight')}
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                close();
              }}
            >
              حذف هایلایت
            </DropdownItem>
          </div>
        )}
      </ToolbarDropdown>

      <ToolbarButton
        label={dirActive ? 'بازگشت به راست‌به‌چپ' : 'تبدیل بلوک به چپ‌به‌راست (برای متن انگلیسی)'}
        active={dirActive}
        onClick={() => editor.chain().focus().toggleDirection().run()}
      >
        <span className="text-[11px] font-bold tracking-tight">LTR</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="افزودن یا ویرایش پیوند" active={editor.isActive('link')} onClick={setLink}>
        {stroke('M13.5 10.5 21 3m0 0h-5.25M21 3v5.25M10.5 6H6a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-4.5')}
      </ToolbarButton>
      <ToolbarButton
        label="حذف پیوند"
        disabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        {stroke('M8.5 15.5 3 21m0-5.5V21h5.5M15.5 8.5 21 3m0 5.5V3h-5.5')}
      </ToolbarButton>
      <ToolbarButton
        label={uploading ? 'در حال بارگذاری تصویر…' : 'افزودن تصویر'}
        disabled={uploading}
        onClick={onPickImage}
      >
        {uploading
          ? stroke('M12 3a9 9 0 1 0 9 9')
          : stroke('M3 16.5 8.25 11l4.5 4.5 2.25-2.25L21 19M3 5.25h18v13.5H3V5.25Z')}
      </ToolbarButton>

      <Divider />

      <ToolbarDropdown label="جدول" active={inTable} trigger={stroke('M3 4.5h18v15H3v-15Zm0 5h18M9 4.5v15')}>
        {(close) => (
          <div className="flex flex-col gap-0.5">
            <DropdownItem
              disabled={inTable}
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                close();
              }}
            >
              درج جدول ۳×۳
            </DropdownItem>
            <DropdownItem
              disabled={!inTable}
              onClick={() => {
                editor.chain().focus().addRowAfter().run();
                close();
              }}
            >
              افزودن سطر
            </DropdownItem>
            <DropdownItem
              disabled={!inTable}
              onClick={() => {
                editor.chain().focus().deleteRow().run();
                close();
              }}
            >
              حذف سطر
            </DropdownItem>
            <DropdownItem
              disabled={!inTable}
              onClick={() => {
                editor.chain().focus().addColumnAfter().run();
                close();
              }}
            >
              افزودن ستون
            </DropdownItem>
            <DropdownItem
              disabled={!inTable}
              onClick={() => {
                editor.chain().focus().deleteColumn().run();
                close();
              }}
            >
              حذف ستون
            </DropdownItem>
            <DropdownItem
              disabled={!inTable}
              onClick={() => {
                editor.chain().focus().deleteTable().run();
                close();
              }}
            >
              حذف جدول
            </DropdownItem>
          </div>
        )}
      </ToolbarDropdown>

      <Divider />

      <ToolbarButton
        label="اصلاح حروف عربی به فارسی (ي→ی، ك→ک)"
        onClick={() => convertSelectionToPersianLetters(editor)}
      >
        <span className="text-sm">ی/ک</span>
      </ToolbarButton>
      <ToolbarButton
        label="تبدیل ارقام به فارسی (۰۱۲…)"
        onClick={() => convertSelectionToPersianDigits(editor)}
      >
        <span className="text-sm">۱۲۳</span>
      </ToolbarButton>
      <ToolbarButton label="افزودن گیومه « »" onClick={() => insertGuillemets(editor)}>
        <span className="text-sm">«»</span>
      </ToolbarButton>
      <ToolbarButton
        label="افزودن نیم‌فاصله (Ctrl+Shift+2)"
        onClick={() => editor.chain().focus().insertContent(ZWNJ).run()}
      >
        <span className="text-[11px]">نیم‌فاصله</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="پاک کردن قالب‌بندی"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        {stroke('M12 4.5 4.5 19.5M7 4.5h12M5 19.5h9')}
      </ToolbarButton>
      <ToolbarButton
        label="واگرد (Ctrl+Z)"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        {stroke('M9 14 4 9m0 0 5-5M4 9h11a5 5 0 0 1 0 10h-3')}
      </ToolbarButton>
      <ToolbarButton
        label="ازنو (Ctrl+Shift+Z)"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        {stroke('m15 14 5-5m0 0-5-5m5 5H9a5 5 0 0 0 0 10h3')}
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({ value, onChange, onNotify, resetKey = 0 }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Image.configure({ HTMLAttributes: { class: 'rounded-xl' } }),
      Placeholder.configure({ placeholder: EDITOR_PLACEHOLDER }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
        alignments: ['right', 'center', 'left', 'justify'],
        defaultAlignment: 'right',
      }),
      Highlight.configure({ multicolor: true }),
      Direction.configure({ types: DIRECTION_TYPES }),
      TableKit.configure({ table: { resizable: true } }),
      CharacterCount.configure({}),
      PersianTools,
    ],
    content: value,
    // Toolbar state (bold on/off, undo availability) has to follow the selection.
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        dir: 'rtl',
        lang: 'fa',
        class:
          'prose-fa min-h-[24rem] max-w-none px-4 py-4 text-[17px] leading-8 text-slate-700 outline-none dark:text-slate-300',
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      onChangeRef.current(html === '<p></p>' ? '' : html);
    },
  });

  // Pull external content in (initial load, restored autosave) without stomping
  // on the caret while the author is typing.
  useEffect(() => {
    // In StrictMode the first editor instance is destroyed before the effect
    // re-runs; touching a destroyed instance throws inside ProseMirror.
    if (!editor || editor.isDestroyed) return;
    const current = editor.getHTML();
    const next = value || '';
    if (next !== current && !(next === '' && current === '<p></p>')) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, resetKey]);

  const insertImageFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      const alt =
        window.prompt('متن جایگزین تصویر (برای سئو و دسترس‌پذیری):', '')?.trim() ?? '';
      setUploading(true);
      try {
        const result = await uploadImage(file);
        editor.chain().focus().setImage({ src: result.url, alt }).run();
        onNotify?.('تصویر با موفقیت بارگذاری شد.', 'success');
      } catch (error) {
        onNotify?.(
          error instanceof ApiError ? error.message : 'بارگذاری تصویر با خطا مواجه شد.',
          'error',
        );
      } finally {
        setUploading(false);
      }
    },
    [editor, onNotify],
  );

  // Pasting or dropping an image straight into the body uploads it too.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const dom = editor.view.dom;

    function imageFrom(list: FileList | null | undefined): File | null {
      if (!list) return null;
      for (const file of Array.from(list)) {
        if (file.type.startsWith('image/')) return file;
      }
      return null;
    }

    function handlePaste(event: ClipboardEvent) {
      const file = imageFrom(event.clipboardData?.files);
      if (!file) return;
      event.preventDefault();
      void insertImageFile(file);
    }

    function handleDrop(event: DragEvent) {
      const file = imageFrom(event.dataTransfer?.files);
      if (!file) return;
      event.preventDefault();
      void insertImageFile(file);
    }

    dom.addEventListener('paste', handlePaste);
    dom.addEventListener('drop', handleDrop);
    return () => {
      dom.removeEventListener('paste', handlePaste);
      dom.removeEventListener('drop', handleDrop);
    };
  }, [editor, insertImageFile]);

  if (!editor || editor.isDestroyed) return null;

  const words = editor.storage.characterCount.words() as number;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="richtext-editor overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-indigo-500 dark:border-slate-700 dark:bg-slate-900">
      <Toolbar
        editor={editor}
        uploading={uploading}
        onPickImage={() => fileInputRef.current?.click()}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void insertImageFile(file);
        }}
      />

      <EditorContent editor={editor} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        <span>
          {toPersianDigits(words)} کلمه · {toPersianDigits(minutes)} دقیقه خواندن
        </span>
      </div>
    </div>
  );
}

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * Coloration syntaxique branchée sur les tokens de design `--c-*` de `theme.css`.
 * Les variables CSS se résolvent selon `.sawa[data-theme=…]` → un seul style
 * cohérent en clair ET en sombre (remplace `oneDark`).
 */
const appHighlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword], color: 'var(--c-kw)' },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName, t.macroName],
    color: 'var(--c-fn)',
  },
  { tag: [t.string, t.special(t.string), t.regexp, t.escape], color: 'var(--c-str)' },
  { tag: [t.number, t.bool, t.atom, t.literal], color: 'var(--c-num)' },
  {
    tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
    color: 'var(--c-com)',
    fontStyle: 'italic',
  },
  {
    tag: [t.variableName, t.propertyName, t.attributeName, t.definition(t.variableName)],
    color: 'var(--c-var)',
  },
  { tag: [t.typeName, t.className, t.namespace, t.tagName, t.changed], color: 'var(--c-type)' },
  {
    tag: [t.punctuation, t.bracket, t.brace, t.paren, t.separator, t.derefOperator],
    color: 'var(--c-punct)',
  },
  { tag: [t.operator, t.self], color: 'var(--c-kw)' },
  { tag: [t.attributeValue], color: 'var(--c-str)' },
  { tag: t.invalid, color: 'var(--danger)' },
  // Markdown
  { tag: t.heading, color: 'var(--c-fn)', fontWeight: '700' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: 'var(--c-str)', textDecoration: 'underline' },
  { tag: [t.url, t.monospace], color: 'var(--c-str)' },
]);

/** Habillage minimal de l'éditeur, aligné sur la charte (fond transparent hérité du parent). */
const appEditorTheme = EditorView.theme({
  '&': { color: 'var(--text)', backgroundColor: 'transparent' },
  '.cm-content': { caretColor: 'var(--accent)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--accent-soft)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--faint)',
    border: 'none',
  },
  '.cm-activeLine': { backgroundColor: 'var(--hover)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--text-2)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--elevated)',
    color: 'var(--muted)',
    border: '1px solid var(--border)',
  },
  // La scrollbar discrète est gérée globalement dans theme.css (.cm-scroller).
});

/** Extension prête à l'emploi : thème éditeur + coloration. */
export const highlighting = [appEditorTheme, syntaxHighlighting(appHighlightStyle)];

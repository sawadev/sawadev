import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { EditorState, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { useUI } from '../context';

/** Choisit l'extension de langage CodeMirror d'après l'extension de fichier. */
function languageFor(path: string): Extension[] {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext))
    return [javascript({ typescript: ext.startsWith('ts'), jsx: ext.endsWith('x') })];
  if (ext === 'json') return [json()];
  if (ext === 'py') return [python()];
  if (['html', 'htm'].includes(ext)) return [html()];
  if (ext === 'css') return [css()];
  if (['md', 'markdown'].includes(ext)) return [markdown()];
  return [];
}

interface Props {
  path: string;
  value: string;
  onChange: (v: string) => void;
  onSave?: () => void;
}

/** Éditeur CodeMirror 6 léger (mobile-friendly), recréé au changement de fichier. */
export function CodeEditor({ path, value, onChange, onSave }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const { theme } = useUI();

  // Garde les callbacks à jour sans recréer l'éditeur.
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  // (Re)crée l'éditeur quand le fichier ou le thème change.
  useEffect(() => {
    if (!host.current) return;
    const saveKey = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current?.();
          return true;
        },
      },
    ]);
    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      saveKey,
      EditorView.lineWrapping,
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChangeRef.current(u.state.doc.toString());
      }),
      ...languageFor(path),
    ];
    if (theme === 'dark') extensions.push(oneDark);

    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({ doc: value, extensions }),
    });
    view.current = v;
    return () => v.destroy();
    // value volontairement hors deps : géré par la sync ci-dessous.
    // biome-ignore lint/correctness/useExhaustiveDependencies: recréation ciblée
  }, [path, theme]);

  // Si la valeur change de l'extérieur (chargement async), synchronise le doc.
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    if (v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} style={{ height: '100%', overflow: 'auto', fontSize: 13 }} />;
}

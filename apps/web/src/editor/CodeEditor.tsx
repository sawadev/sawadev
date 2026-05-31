import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { css } from '@codemirror/lang-css';
import { go } from '@codemirror/lang-go';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { highlighting } from './highlight';

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
  if (['xml', 'svg'].includes(ext)) return [xml()];
  if (['yaml', 'yml'].includes(ext)) return [yaml()];
  if (ext === 'sql') return [sql()];
  if (ext === 'rs') return [rust()];
  if (ext === 'go') return [go()];
  if (['c', 'h', 'cc', 'cpp', 'hpp', 'cxx', 'hxx'].includes(ext)) return [cpp()];
  if (ext === 'php') return [php()];
  if (ext === 'java') return [java()];
  if (['sh', 'bash', 'zsh'].includes(ext)) return [StreamLanguage.define(shell)];
  return [];
}

interface EditorViewState {
  scroll: number;
  anchor: number;
  head: number;
}

interface Props {
  path: string;
  value: string;
  onChange: (v: string) => void;
  onSave?: () => void;
  /** Position à restaurer à l'ouverture du fichier (scroll + curseur). */
  viewState?: EditorViewState;
  /** Sauvegarde la position courante (au changement de fichier / démontage). */
  onViewState?: (path: string, vs: EditorViewState) => void;
}

/** Éditeur CodeMirror 6 léger (mobile-friendly), recréé au changement de fichier. */
export function CodeEditor({ path, value, onChange, onSave, viewState, onViewState }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  // Garde les callbacks/valeurs à jour sans recréer l'éditeur.
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const viewStateRef = useRef(viewState);
  const onViewStateRef = useRef(onViewState);
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;
  viewStateRef.current = viewState;
  onViewStateRef.current = onViewState;

  // (Re)crée l'éditeur quand le fichier change. La coloration vient des CSS vars
  // (--c-*), résolues par thème → pas besoin de recréer l'éditeur au changement de thème.
  // `value` hors deps volontairement : valeur initiale seulement, MAJ via la synchro plus bas.
  // biome-ignore lint/correctness/useExhaustiveDependencies: recréation ciblée sur `path`
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
      ...highlighting,
      ...languageFor(path),
    ];

    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({ doc: value, extensions }),
    });
    view.current = v;

    // Restaure la position (curseur + scroll) du fichier, si connue.
    const vs = viewStateRef.current;
    if (vs) {
      const len = v.state.doc.length;
      v.dispatch({ selection: { anchor: Math.min(vs.anchor, len), head: Math.min(vs.head, len) } });
      requestAnimationFrame(() => {
        if (view.current === v) v.scrollDOM.scrollTop = vs.scroll;
      });
    }

    return () => {
      // Sauvegarde la position pour CE fichier (closure `path`).
      const main = v.state.selection.main;
      onViewStateRef.current?.(path, {
        scroll: v.scrollDOM.scrollTop,
        anchor: main.anchor,
        head: main.head,
      });
      v.destroy();
    };
  }, [path]);

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

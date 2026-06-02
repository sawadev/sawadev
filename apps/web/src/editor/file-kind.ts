/** Nature d'un fichier pour choisir le rendu (édition, image, aperçu, brut). */
export type FileKind = 'image' | 'svg' | 'markdown' | 'text' | 'binary';

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico']);
const MARKDOWN_EXT = new Set(['md', 'markdown']);

// Binaires connus, non prévisualisables dans l'éditeur (évite d'afficher du charabia).
const BINARY_EXT = new Set([
  'pdf',
  'zip',
  'gz',
  'tar',
  'tgz',
  'rar',
  '7z',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'eot',
  'mp4',
  'mov',
  'webm',
  'mkv',
  'avi',
  'mp3',
  'wav',
  'ogg',
  'flac',
  'exe',
  'dll',
  'bin',
  'so',
  'dylib',
  'o',
  'a',
  'wasm',
]);

function ext(path: string): string {
  const base = path.split('/').pop() ?? path;
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
}

/** Classe un fichier d'après son extension. */
export function fileKind(path: string): FileKind {
  const e = ext(path);
  if (e === 'svg') return 'svg';
  if (MARKDOWN_EXT.has(e)) return 'markdown';
  if (IMAGE_EXT.has(e)) return 'image';
  if (BINARY_EXT.has(e)) return 'binary';
  return 'text';
}

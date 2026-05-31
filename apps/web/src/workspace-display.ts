/** Helpers de présentation : déduit une étiquette/icône d'après l'image Docker. */

const RULES: { match: RegExp; label: string; icon: string }[] = [
  { match: /node|bun|deno/i, label: 'Node', icon: 'cpu' },
  { match: /python|conda/i, label: 'Python', icon: 'bolt' },
  { match: /go(lang)?/i, label: 'Go', icon: 'bolt' },
  { match: /rust/i, label: 'Rust', icon: 'bolt' },
  { match: /next/i, label: 'Next.js', icon: 'layers' },
];

/** Étiquette « stack » lisible (ex. node:20 -> Node). */
export function stackLabel(image: string): string {
  return RULES.find((r) => r.match.test(image))?.label ?? image.split(':')[0] ?? image;
}

/** Nom d'icône (jeu HIcon) associé à l'image. */
export function workspaceIcon(image: string): string {
  return RULES.find((r) => r.match.test(image))?.icon ?? 'cpu';
}

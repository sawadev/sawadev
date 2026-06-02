import type { ToolType } from '@sawadev/shared';

/**
 * Catalogue statique de services managés (images officielles). En M6, l'orchestrateur
 * créera un conteneur `role=tool` sur le réseau du workspace ; ici, c'est la liste
 * proposée à l'UI (le lifecycle est encore mocké côté service).
 */
export const TOOL_CATALOG: ToolType[] = [
  {
    type: 'postgres',
    label: 'PostgreSQL',
    icon: 'layers',
    image: 'postgres:16',
    defaultPort: 5432,
    description: 'Relational database.',
  },
  {
    type: 'mysql',
    label: 'MySQL',
    icon: 'layers',
    image: 'mysql:8',
    defaultPort: 3306,
    description: 'Relational database.',
  },
  {
    type: 'mongo',
    label: 'MongoDB',
    icon: 'layers',
    image: 'mongo:7',
    defaultPort: 27017,
    description: 'Document database.',
  },
  {
    type: 'redis',
    label: 'Redis',
    icon: 'bolt',
    image: 'redis:7',
    defaultPort: 6379,
    description: 'In-memory key-value store.',
  },
  {
    type: 'supabase',
    label: 'Supabase',
    icon: 'globe',
    image: 'supabase/postgres:15',
    defaultPort: 5432,
    description: 'Postgres + Auth + Studio.',
  },
];

export function findToolType(type: string): ToolType | undefined {
  return TOOL_CATALOG.find((t) => t.type === type);
}

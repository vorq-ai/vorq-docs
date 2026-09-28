import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// A .json file, so the host serves it compressed.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, { language: 'english' });

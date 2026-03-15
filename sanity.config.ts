import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemaTypes';

const projectId = (import.meta as any).env.VITE_SANITY_PROJECT_ID || 'a4f3nfat';
const dataset = (import.meta as any).env.VITE_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'faisan_kaka_studio',
  title: 'Faisan Kaka Studio',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [
    structureTool(),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (prev) =>
      prev.filter(
        ({ action }) =>
          action &&
          !['unpublish'].includes(action)
      ),
  },
});

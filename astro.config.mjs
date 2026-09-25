import { existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightLinksValidator from 'starlight-links-validator';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightThemeBlack from 'starlight-theme-black';
import sources from './sources.json' with { type: 'json' };

// Every source repo follows the same docs/ layout; see README.md.
const SECTIONS = [
  ['guides', 'Guides'],
  ['concepts', 'Concepts'],
  ['reference', 'Reference'],
];

const topicItems = (slug) => [
  { label: 'Overview', slug },
  { label: 'Quickstart', slug: `${slug}/quickstart` },
  ...SECTIONS.filter(([dir]) => existsSync(`src/content/docs/${slug}/${dir}`)).map(([dir, label]) => ({
    label,
    items: [{ autogenerate: { directory: `${slug}/${dir}` } }],
  })),
];

export default defineConfig({
  site: 'https://docs.vorq.co',
  integrations: [
    starlight({
      title: 'VORQ Docs',
      description: 'Documentation for the VORQ async inference exchange: client SDKs, provider daemon, coordinator API and contracts.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/vorq-ai' }],
      components: {
        Sidebar: './src/components/Sidebar.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      customCss: ['./src/styles/custom.css'],
      // The theme leaves the terminal title bar on the page background, apart from the code.
      expressiveCode: { styleOverrides: { frames: { terminalTitlebarBackground: 'var(--code-background)' } } },
      plugins: [
        starlightThemeBlack({}),
        starlightSidebarTopics(
          [
            {
              label: 'Overview',
              link: '/overview/how-it-works/',
              icon: 'open-book',
              items: [{ autogenerate: { directory: 'overview' } }],
            },
            ...sources.map((s) => ({ label: s.label, link: `/${s.slug}/`, icon: s.icon, items: topicItems(s.slug) })),
          ],
          { exclude: ['/index'] },
        ),
        starlightLlmsTxt({ projectName: 'VORQ' }),
        starlightLinksValidator(),
      ],
    }),
  ],
});

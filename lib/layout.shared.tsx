import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <img src="/favicon.svg" alt="" width={22} height={22} />
          {appName}
        </span>
      ),
    },
    githubUrl: 'https://github.com/vorq-ai',
    // Light only.
    themeSwitch: { enabled: false },
  };
}

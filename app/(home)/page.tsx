import Link from 'next/link';
import { ArrowRight, BookOpen, Braces, Code, FileLock, Network, Server } from 'lucide-react';
import { Card, Cards } from 'fumadocs-ui/components/card';

const sections = [
  { title: 'Python SDK', href: '/docs/python', icon: <Code />, text: 'Submit jobs and batches from Python. OpenAI-compatible.' },
  { title: 'JavaScript SDK', href: '/docs/js', icon: <Braces />, text: 'The same client surface for Node and browsers.' },
  { title: 'Provider daemon', href: '/docs/provider', icon: <Server />, text: 'Run vorqd and serve jobs from your own inference backend.' },
  { title: 'Coordinator API', href: '/docs/coordinator', icon: <Network />, text: 'The HTTP API behind the SDKs.' },
  { title: 'Contracts', href: '/docs/contracts', icon: <FileLock />, text: 'Settlement on Base: jobs, providers, asks.' },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 md:py-24">
      <h1 className="text-4xl font-medium tracking-tight md:text-5xl">VORQ Docs</h1>
      <p className="mt-4 max-w-2xl text-lg text-fd-muted-foreground">
        An async inference exchange. Submit jobs, get results, settle on-chain.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/docs/overview/how-it-works"
          className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground"
        >
          <BookOpen className="size-4" /> How VORQ works
        </Link>
        <Link
          href="/docs/python/quickstart"
          className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium"
        >
          Python quickstart <ArrowRight className="size-4" />
        </Link>
      </div>
      <Cards className="mt-14">
        {sections.map((s) => (
          <Card key={s.href} title={s.title} href={s.href} icon={s.icon}>
            {s.text}
          </Card>
        ))}
      </Cards>
    </main>
  );
}

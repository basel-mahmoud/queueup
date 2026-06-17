import { ArrowRight, Clock, QrCode, Radio, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

const features = [
  {
    icon: QrCode,
    title: 'Join by QR — no app',
    body: 'Customers scan a code and join the line from their phone. No download, no signup.',
  },
  {
    icon: Clock,
    title: 'Live position & ETA',
    body: 'Everyone sees exactly where they stand and how long the wait is, updated in real time.',
  },
  {
    icon: Radio,
    title: 'One staff dashboard',
    body: 'Call next, mark served, flag no-shows, and add walk-ins — the board syncs instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    body: 'Row-level security, validated inputs, rate limiting, and token-scoped customer access.',
  },
];

function App() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
            Q
          </span>
          QueueUp
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-center py-16 text-center sm:py-24">
          <span className="text-muted-foreground mb-4 rounded-full border px-3 py-1 text-xs">
            Virtual walk-in waitlist for small businesses
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Replace the clipboard. <span className="text-primary">Free your front desk.</span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-xl text-lg text-pretty">
            QueueUp lets customers join your line from their phone and watch their place update
            live, while your staff run the whole queue from one screen.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" disabled>
              Get started <ArrowRight aria-hidden />
            </Button>
            <Button size="lg" variant="outline" disabled>
              View a live queue
            </Button>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Auth &amp; backend wiring lands in the next milestone.
          </p>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardContent className="space-y-3 p-6">
                <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-lg">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-muted-foreground text-sm">{body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="text-muted-foreground border-t py-8 text-center text-sm">
        Built with React, Supabase, and Clerk — a portfolio project.
      </footer>
    </div>
  );
}

export default App;

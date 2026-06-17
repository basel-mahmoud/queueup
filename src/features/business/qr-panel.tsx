import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { env } from '@/lib/env';

/** Public join link + scannable QR for a business. */
export function QrPanel({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const origin = env.VITE_APP_URL || window.location.origin;
  const joinUrl = `${origin.replace(/\/$/, '')}/q/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be blocked; the link is visible to copy manually
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer join link</CardTitle>
        <CardDescription>Print the QR for your counter, or share the link.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG value={joinUrl} size={132} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <code className="bg-muted block truncate rounded px-2 py-1 text-sm">{joinUrl}</code>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void copy()}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={joinUrl} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden /> Preview
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

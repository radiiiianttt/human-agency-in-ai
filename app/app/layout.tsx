import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Human Agency in AI · Invisible Lab', description: 'A local experiment in permission and user agency.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

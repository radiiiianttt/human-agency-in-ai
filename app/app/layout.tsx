import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';
import './design-system.css';
import './globals.css';
import './industrial-theme.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Human Agency in AI · Invisible Lab', description: 'A local experiment in permission and user agency.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

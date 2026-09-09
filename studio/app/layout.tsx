import type { ReactNode } from 'react';
import './global.css';

export const metadata = {
  title: 'Kairos Studio',
  description: 'Moteur marketing des applications du groupe.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

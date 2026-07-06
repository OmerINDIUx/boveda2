import type { Metadata } from 'next';
import { Sidebar } from '../components/layout/sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Holocron',
  description: 'Boveda documental empresarial',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}

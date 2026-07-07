import type { Metadata } from 'next';
import { Sidebar } from '../components/layout/sidebar';
import { TopBar } from '../components/layout/topbar';
import { ToastProvider } from '../components/ui/toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Holocron',
  description: 'Bóveda documental empresarial',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <a href="#main-content" className="skip-link">
            Saltar al contenido principal
          </a>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              overflow: 'hidden',
            }}
          >
            <TopBar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Sidebar />
              <main
                id="main-content"
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '1.75rem',
                  background: '#f7f8fb',
                }}
              >
                {children}
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}

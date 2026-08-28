import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-bone-100 text-ink-950 dark:bg-ink-950 dark:text-bone-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 focus:rounded-full focus:bg-mint-300 focus:px-5 focus:py-2 focus:font-medium focus:text-ink-950"
      >
        رفتن به محتوای اصلی
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-btn focus:bg-marquee focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
      <Header />
      <main id="main" className="min-h-[70vh] flex-1">{children}</main>
      <Footer />
    </div>
  );
}

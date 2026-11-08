import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex flex-1 items-center justify-center px-5 py-12">{children}</main>
      <Footer />
    </div>
  );
}

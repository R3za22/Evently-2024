import Link from "next/link";
import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="wrapper flex flex-1 flex-col items-start justify-center gap-5 py-20">
        <p className="overline">Error 404</p>
        <h1 className="text-5xl font-extrabold tracking-tight">This ticket doesn’t exist.</h1>
        <p className="max-w-lg text-lg text-slate">The page you’re looking for was moved or never existed. Let’s get you back to the events.</p>
        <Link href="/" className="btn btn-primary btn-lg text-white">Back to events</Link>
      </main>
      <Footer />
    </div>
  );
}

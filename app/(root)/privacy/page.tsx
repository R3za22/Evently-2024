export const metadata = { title: "About & privacy" };

export default function Privacy() {
  return (
    <div className="wrapper max-w-3xl space-y-6 py-14">
      <h1 className="text-5xl font-extrabold tracking-tight">About &amp; privacy</h1>
      <p className="text-lg text-slate">
        Evently is a portfolio project by Reza Ghamar: a small event platform where you can discover events, buy tickets and host your own.
        It is based on the JSM (JavaScript Mastery) Evently tutorial and has been redesigned, hardened and extended.
      </p>
      <h2 className="text-2xl font-bold">In the demo</h2>
      <ul className="list-disc space-y-2 ps-6">
        <li>All events, orders and the demo account are sample data stored in your browser (localStorage). Nothing is sent to a server.</li>
        <li>Payments are simulated. Use card 4242 4242 4242 4242 to succeed or 4000 0000 0000 0002 to see a declined payment. No real card is ever needed.</li>
        <li>Uploaded images stay in your browser. Use “Reset demo data” below to clear everything.</li>
      </ul>
      <h2 className="text-2xl font-bold">In the full app</h2>
      <p>Accounts are handled by Clerk, payments by Stripe, images by uploadthing and data by MongoDB. The server derives who you are from your session and the price from the database; it never trusts the browser for either.</p>
      <ResetButton />
    </div>
  );
}

import ResetButton from "@/components/shared/ResetButton";

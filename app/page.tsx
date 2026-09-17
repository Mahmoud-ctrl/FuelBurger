import { Site } from "@/components/site";

export default function Home() {
  return (
    <main className="relative bg-fuel-maroon">
      {/* With scripting off the overlay would never clear, so drop it. */}
      <noscript>
        <style>{`.fuel-intro{display:none!important}`}</style>
      </noscript>
      <Site />
    </main>
  );
}

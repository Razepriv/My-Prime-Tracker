import PrimeApp from "@/components/PrimeApp";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = {
  title: "PRIME Tracker — your dashboard",
  // The app is behind login (thin content for crawlers); keep it out of the index.
  robots: { index: false, follow: false },
};

export default function AppPage() {
  return (
    <ErrorBoundary>
      <PrimeApp />
    </ErrorBoundary>
  );
}

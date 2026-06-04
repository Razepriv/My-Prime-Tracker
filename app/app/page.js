import PrimeApp from "@/components/PrimeApp";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = {
  title: "PRIME Tracker — your dashboard",
};

export default function AppPage() {
  return (
    <ErrorBoundary>
      <PrimeApp />
    </ErrorBoundary>
  );
}

import { Header } from "@/components/Header";
import { RateLimitMonitor } from "@/components/RateLimitMonitor";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const RateLimits = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <RateLimitMonitor />
      </main>
    </div>
  );
};

export default RateLimits;

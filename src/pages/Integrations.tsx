
import { Navigation } from "@/components/Navigation";
import { IntegrationsHub } from "@/components/integrations/IntegrationsHub";

export default function Integrations() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect your tender platform with external services to automate workflows and enhance notifications.
          </p>
        </div>
        <IntegrationsHub />
      </main>
    </div>
  );
}

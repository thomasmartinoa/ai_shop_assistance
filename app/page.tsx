import Link from 'next/link';
import { Mic, Package, BarChart3, Settings } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <header className="px-6 py-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Shopkeeper AI
          </h1>
          <p className="text-gray-600 mb-8">
            Voice-powered billing assistant for your shop. 
            Speak in Malayalam, manage your business hands-free.
          </p>
          
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-4 px-6 bg-primary text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-primary/90 transition-colors touch-target"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="px-6 py-8">
        <div className="max-w-md mx-auto space-y-4">
          <FeatureCard
            icon={<Mic className="w-6 h-6 text-blue-600" />}
            title="Voice Billing"
            description="Say 'അരി 2 കിലോ' and add items to bill instantly"
          />
          <FeatureCard
            icon={<Package className="w-6 h-6 text-green-600" />}
            title="Inventory Check"
            description="Ask 'സ്റ്റോക്ക് എത്ര?' to know stock levels"
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
            title="Sales Reports"
            description="View daily, weekly, and monthly sales"
          />
          <FeatureCard
            icon={<Settings className="w-6 h-6 text-orange-600" />}
            title="UPI Payments"
            description="Generate QR codes for GPay, PhonePe"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-gray-500 text-sm">
        <p>Made for Kerala Shopkeepers 🛒</p>
        <p className="mt-1">English UI • Malayalam Voice</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

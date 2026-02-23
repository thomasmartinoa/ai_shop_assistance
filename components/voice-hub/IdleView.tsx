/**
 * IdleView — shown when voice hub is in ready/standby state
 */
import { Mic, ShoppingCart, Package, BarChart2, HelpCircle } from 'lucide-react';

interface IdleViewProps {
  todaySales?: number;
  lowStockCount?: number;
  shopName?: string;
}

export function IdleView({ todaySales = 0, lowStockCount = 0, shopName }: IdleViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
      {/* Greeting */}
      <div>
        <p className="text-2xl font-bold text-gray-800">
          {shopName ? `${shopName}` : 'Shopkeeper AI'}
        </p>
        <p className="text-gray-500 mt-1 text-lg">ഞാൻ തയ്യാർ. സംസാരിക്കൂ.</p>
      </div>

      {/* Quick stats */}
      {(todaySales > 0 || lowStockCount > 0) && (
        <div className="flex gap-4 w-full max-w-sm">
          {todaySales > 0 && (
            <div className="flex-1 bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-green-600 font-medium">ഇന്നത്തെ സെയിൽ</p>
              <p className="text-xl font-bold text-green-700">₹{todaySales.toLocaleString()}</p>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex-1 bg-orange-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-orange-600 font-medium">കുറഞ്ഞ സ്റ്റോക്ക്</p>
              <p className="text-xl font-bold text-orange-700">{lowStockCount} ഉൽപ്പന്നം</p>
            </div>
          )}
        </div>
      )}

      {/* Example commands */}
      <div className="w-full max-w-sm space-y-2 text-left">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">ഉദാഹരണ കമ്മാൻഡുകൾ</p>
        {[
          { icon: ShoppingCart, text: '"10 kg അരി, 2 kg പഞ്ചസാര"' },
          { icon: Package, text: '"അരി സ്റ്റോക്ക് എത്ര?"' },
          { icon: BarChart2, text: '"ഇന്നത്തെ സെയിൽ എത്ര?"' },
          { icon: HelpCircle, text: '"എന്തൊക്കെ ചെയ്യാൻ പറ്റും?"' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Icon size={16} className="text-blue-500 shrink-0" />
            <span className="text-sm text-gray-600">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

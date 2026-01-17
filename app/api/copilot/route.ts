import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel, isGeminiConfigured, getModelName } from '@/lib/gemini/client';
import { SALES_COPILOT_SYSTEM_PROMPT, INSIGHT_GENERATION_PROMPT } from '@/lib/gemini/prompts';

export const runtime = 'nodejs';

interface CopilotRequest {
  query: string;
  context: {
    inventory?: ProductContext[];
    cart?: CartItem[];
    recentSales?: SalesSummary;
  };
  language?: 'ml' | 'en' | 'mixed';
}

interface ProductContext {
  name_en: string;
  name_ml: string;
  stock: number;
  min_stock: number;
  price: number;
  category?: string;
  unit: string;
}

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface SalesSummary {
  today?: number;
  yesterday?: number;
  thisWeek?: number;
  lastWeek?: number;
  topProducts?: { name: string; quantity: number; revenue: number }[];
}

// Generate demo sales data for testing
function generateDemoSalesData(): SalesSummary {
  const todaySales = Math.floor(Math.random() * 5000) + 3000;
  const yesterdaySales = Math.floor(Math.random() * 5000) + 2500;
  const thisWeekSales = todaySales + Math.floor(Math.random() * 25000) + 15000;
  const lastWeekSales = Math.floor(Math.random() * 30000) + 18000;
  
  return {
    today: todaySales,
    yesterday: yesterdaySales,
    thisWeek: thisWeekSales,
    lastWeek: lastWeekSales,
    topProducts: [
      { name: 'അരി (Rice)', quantity: 45, revenue: 2475 },
      { name: 'പഞ്ചസാര (Sugar)', quantity: 30, revenue: 1350 },
      { name: 'പാൽ (Milk)', quantity: 28, revenue: 1540 },
      { name: 'ചായപ്പൊടി (Tea)', quantity: 12, revenue: 3360 },
      { name: 'വെളിച്ചെണ്ണ (Coconut Oil)', quantity: 8, revenue: 1440 },
    ],
  };
}

// Generate demo response when API quota is exceeded
function generateDemoResponse(query: string, salesData: SalesSummary, inventory: ProductContext[]): string {
  const queryLower = query.toLowerCase();
  
  // Check for specific product stock query
  if (queryLower.includes('stock') || queryLower.includes('കുറവ') || queryLower.includes('available')) {
    // Check if asking about a specific product from actual inventory
    for (const product of inventory) {
      const nameEnLower = product.name_en.toLowerCase();
      const nameMlLower = product.name_ml.toLowerCase();
      
      if (queryLower.includes(nameEnLower) || queryLower.includes(nameMlLower) || 
          queryLower.includes(product.name_en.toLowerCase()) || 
          queryLower.includes(product.name_ml)) {
        const isLowStock = product.stock <= product.min_stock;
        const status = isLowStock ? '⚠️ Low' : '✅ Good';
        return `📦 ${product.name_ml} (${product.name_en}) Stock:\n\nCurrent: ${product.stock} ${product.unit}\nMin required: ${product.min_stock} ${product.unit}\nPrice: ₹${product.price}/${product.unit}\nStatus: ${status}\n\n${isLowStock ? '⚠️ Stock കുറവാണ്! Soon reorder ചെയ്യുക.' : '✅ Stock നല്ല രീതിയിൽ ഉണ്ട്! 👍'}`;
      }
    }
    
    // General low stock alert using real inventory
    const lowStockItems = inventory.filter(p => p.stock <= p.min_stock);
    if (lowStockItems.length > 0) {
      const itemsList = lowStockItems.slice(0, 5).map((p, i) => 
        `${i + 1}. ${p.name_ml} (${p.name_en}) - ${p.stock} ${p.unit} മാത്രം`
      ).join('\n');
      return `⚠️ Low Stock Alert:\n\n${itemsList}\n\nഈ items ഉടൻ order ചെയ്യുക! 📦`;
    }
    
    return `✅ എല്ലാ items നും നല്ല stock ഉണ്ട്!\n\nTotal items: ${inventory.length}\nAll stock levels are good. 👍`;
  }
  
  // Top sellers query
  if (queryLower.includes('വിറ്റ') || queryLower.includes('top') || queryLower.includes('best') || queryLower.includes('popular')) {
    const products = salesData.topProducts || [];
    const productList = products.slice(0, 3).map((p, i) => `${i + 1}. ${p.name} - ${p.quantity} units, ₹${p.revenue}`).join('\n');
    return `🏆 ഇന്നത്തെ Top Sellers:\n\n${productList}\n\nഅരി ആണ് ഏറ്റവും കൂടുതൽ വിറ്റത്! 📈`;
  }
  
  // Sales query
  if (queryLower.includes('sale') || queryLower.includes('വിൽപ്പന') || queryLower.includes('today') || queryLower.includes('ഇന്ന') || queryLower.includes('business') || queryLower.includes('progress')) {
    const today = salesData.today || 4520;
    const yesterday = salesData.yesterday || 3800;
    const change = ((today - yesterday) / yesterday * 100).toFixed(1);
    return `📊 ഇന്നത്തെ വിൽപ്പന Report:\n\nToday: ₹${today.toLocaleString('en-IN')}\nYesterday: ₹${yesterday.toLocaleString('en-IN')}\n\n${Number(change) > 0 ? '📈' : '📉'} ${change}% ${Number(change) > 0 ? 'increase!' : 'decrease'}\n\n${Number(change) > 0 ? 'നല്ല progress ആണ്! Keep it up! 💪' : 'Marketing focus ചെയ്യുക! 🎯'}`;
  }
  
  // Prediction query
  if (queryLower.includes('predict') || queryLower.includes('week') || queryLower.includes('ആഴ്ച') || queryLower.includes('future') || queryLower.includes('expect')) {
    return `🔮 ഈ ആഴ്ചത്തെ Prediction:\n\n• Expected sales: ₹28,000 - ₹32,000\n• Best days: Friday, Saturday\n• Stock up: അരി, പഞ്ചസാര, എണ്ണ\n\nWeekend-ന് മുമ്പ് stock check ചെയ്യുക! 📅`;
  }
  
  // Business tips query
  if (queryLower.includes('suggest') || queryLower.includes('tip') || queryLower.includes('idea') || queryLower.includes('improve') || queryLower.includes('ചെയ്യാം')) {
    return `💡 Business Tips:\n\n1. 📦 അരി bulk-ൽ വാങ്ങുക - 10% save\n2. 🕐 Evening 5-7 PM busy hours\n3. 🎁 Combo offers try ചെയ്യുക\n4. 💳 UPI payments push ചെയ്യുക\n5. 📱 WhatsApp updates send ചെയ്യുക\n\nചെറിയ changes, വലിയ impact! 🚀`;
  }
  
  // Default response
  return `നമസ്കാരം! 🙏\n\nഇന്നത്തെ sales: ₹${(salesData.today || 4520).toLocaleString('en-IN')}\nTop product: അരി (Rice)\n\nഎന്തും ചോദിക്കൂ:\n• Stock levels (e.g., "milk stock")\n• Sales reports\n• Business tips\n• Predictions 📈`;
}

// Format inventory for prompt
function formatInventory(inventory: ProductContext[]): string {
  if (!inventory || inventory.length === 0) {
    return 'No inventory data available';
  }
  
  return inventory.map(p => {
    const stockStatus = p.stock <= p.min_stock ? '⚠️ LOW' : '✓';
    return `- ${p.name_ml} (${p.name_en}): ${p.stock} ${p.unit} @ ₹${p.price}/${p.unit} ${stockStatus}`;
  }).join('\n');
}

// Format cart for prompt
function formatCart(cart: CartItem[]): string {
  if (!cart || cart.length === 0) {
    return 'Cart is empty';
  }
  
  const total = cart.reduce((sum, item) => sum + item.total, 0);
  const items = cart.map(item => `- ${item.name}: ${item.quantity} x ₹${item.price} = ₹${item.total}`).join('\n');
  return `${items}\nTotal: ₹${total}`;
}

// Format sales for prompt
function formatSales(sales: SalesSummary): string {
  if (!sales) {
    return 'No sales data available';
  }
  
  let summary = '';
  
  if (sales.today !== undefined) {
    const changeFromYesterday = sales.yesterday 
      ? ((sales.today - sales.yesterday) / sales.yesterday * 100).toFixed(1)
      : 'N/A';
    summary += `Today: ₹${sales.today.toLocaleString('en-IN')} (${changeFromYesterday}% vs yesterday)\n`;
  }
  
  if (sales.yesterday !== undefined) {
    summary += `Yesterday: ₹${sales.yesterday.toLocaleString('en-IN')}\n`;
  }
  
  if (sales.thisWeek !== undefined) {
    summary += `This Week: ₹${sales.thisWeek.toLocaleString('en-IN')}\n`;
  }
  
  if (sales.lastWeek !== undefined) {
    summary += `Last Week: ₹${sales.lastWeek.toLocaleString('en-IN')}\n`;
  }
  
  if (sales.topProducts && sales.topProducts.length > 0) {
    summary += '\nTop Products:\n';
    summary += sales.topProducts.map((p, i) => 
      `${i + 1}. ${p.name}: ${p.quantity} units, ₹${p.revenue.toLocaleString('en-IN')}`
    ).join('\n');
  }
  
  return summary || 'No sales data available';
}

export async function POST(request: NextRequest) {
  // Parse body early so we can use it in catch block
  let query = '';
  let context: CopilotRequest['context'] = {};
  let salesData: SalesSummary = generateDemoSalesData();
  let inventory: ProductContext[] = [];
  
  try {
    const body: CopilotRequest = await request.json();
    query = body.query || '';
    context = body.context || {};
    salesData = context.recentSales || generateDemoSalesData();
    inventory = context.inventory || [];
    
    // Check if Gemini is configured
    if (!isGeminiConfigured()) {
      const demoResponse = generateDemoResponse(query, salesData, inventory);
      return NextResponse.json({
        success: true,
        response: demoResponse,
        salesData: salesData,
        demo: true,
        timestamp: new Date().toISOString(),
      });
    }

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Copilot Query:', query);

    // Format context for prompt
    const inventoryText = formatInventory(context?.inventory || []);
    const cartText = formatCart(context?.cart || []);
    const salesText = formatSales(salesData);

    // Build the prompt
    const userPrompt = INSIGHT_GENERATION_PROMPT
      .replace('{inventory}', inventoryText)
      .replace('{sales}', salesText)
      .replace('{cart}', cartText)
      .replace('{query}', query);

    console.log('🤖 Sending to Gemini...');

    // Get Gemini model and generate response
    const model = getGeminiModel();
    
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are the Sales Copilot. Here are your instructions:\n\n' + SALES_COPILOT_SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [{ text: 'നമസ്കാരം! 🙏 ഞാൻ കടസഹായി ആണ്. നിങ്ങളുടെ business-നെ കുറിച്ച് എന്തും ചോദിക്കൂ!' }],
        },
      ],
    });

    const result = await chat.sendMessage(userPrompt);
    const response = result.response.text();

    console.log('🤖 Gemini Response:', response.substring(0, 100) + '...');

    return NextResponse.json({
      success: true,
      response: response,
      salesData: salesData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('🤖 Copilot Error:', error);
    
    // For any API errors, use demo fallback to keep the app working
    console.log('🤖 Using demo fallback...');
    const demoResponse = generateDemoResponse(query, salesData, inventory);
    
    return NextResponse.json({
      success: true,
      response: demoResponse,
      salesData: salesData,
      demo: true,
      timestamp: new Date().toISOString(),
    });
  }
}

// GET endpoint for quick insights
export async function GET(request: NextRequest) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json({
        configured: false,
        message: 'Add GEMINI_API_KEY to enable AI Copilot',
      });
    }

    return NextResponse.json({
      configured: true,
      model: getModelName(),
      capabilities: [
        'sales_analysis',
        'stock_prediction',
        'business_suggestions',
        'malayalam_support',
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

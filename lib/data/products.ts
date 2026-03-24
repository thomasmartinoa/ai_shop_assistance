/**
 * Comprehensive Kerala Kirana Store Product Catalog
 * ~100 products with Malayalam names, aliases, pricing, and GST rates.
 * Covers all common categories in a typical Kerala general/provision store.
 * Prices updated to current Kerala market rates — March 2026.
 */

export interface ProductDefinition {
  name_en: string;
  name_ml: string;
  aliases: string[];  // for voice matching (transliterations, common misspellings, alternate names)
  unit: 'kg' | 'g' | 'litre' | 'ml' | 'piece' | 'pack';
  price: number;      // selling price
  cost_price: number; // purchase price
  gst_rate: number;   // GST % (0, 5, 12, 18)
  category: string;
  min_stock: number;
  shelf_location: string;
}

export const KERALA_PRODUCTS: ProductDefinition[] = [

  // ─── GRAINS & RICE (10) ────────────────────────────────────────────
  {
    name_en: 'Rice',
    name_ml: 'അരി',
    aliases: ['ari', 'rice', 'chawal', 'aari', 'ary', 'ariyum', 'നെല്ല്', 'അരിയും', 'ari ye'],
    unit: 'kg', price: 62, cost_price: 55, gst_rate: 0,
    category: 'grains', min_stock: 10, shelf_location: 'Floor - Sack Area',
  },
  {
    name_en: 'Red Rice',
    name_ml: 'ചുവന്ന അരി',
    aliases: ['chuvanna ari', 'red rice', 'rosematta', 'palakkadan matta', 'matta rice', 'കൈമ'],
    unit: 'kg', price: 75, cost_price: 68, gst_rate: 0,
    category: 'grains', min_stock: 5, shelf_location: 'Floor - Sack Area',
  },
  {
    name_en: 'Wheat',
    name_ml: 'ഗോതമ്പ്',
    aliases: ['gothambu', 'wheat', 'goa thambu', 'gothampum', 'ഗോതമ്പ്', 'godhambu'],
    unit: 'kg', price: 38, cost_price: 33, gst_rate: 0,
    category: 'grains', min_stock: 10, shelf_location: 'Floor - Sack Area',
  },
  {
    name_en: 'Wheat Flour',
    name_ml: 'ആട്ട',
    aliases: ['atta', 'aata', 'wheat flour', 'gothambu podi', 'ഗോതമ്പ് പൊടി', 'maida atta'],
    unit: 'kg', price: 48, cost_price: 43, gst_rate: 0,
    category: 'grains', min_stock: 10, shelf_location: 'Floor - Sack Area',
  },
  {
    name_en: 'Maida',
    name_ml: 'മൈദ',
    aliases: ['maida', 'all purpose flour', 'refined flour', 'maida mavu'],
    unit: 'kg', price: 46, cost_price: 40, gst_rate: 0,
    category: 'grains', min_stock: 5, shelf_location: 'Counter Shelf - Row 1',
  },
  {
    name_en: 'Rava',
    name_ml: 'റവ',
    aliases: ['rava', 'sooji', 'suji', 'semolina', 'rawa', 'ഗോതമ്പ് ഗ്രോട്ട്'],
    unit: 'kg', price: 44, cost_price: 38, gst_rate: 0,
    category: 'grains', min_stock: 5, shelf_location: 'Counter Shelf - Row 1',
  },
  {
    name_en: 'Rice Flour',
    name_ml: 'അരിപ്പൊടി',
    aliases: ['arippodi', 'rice flour', 'ari podi', 'rice powder', 'arippodi'],
    unit: 'kg', price: 46, cost_price: 40, gst_rate: 0,
    category: 'grains', min_stock: 5, shelf_location: 'Counter Shelf - Row 1',
  },
  {
    name_en: 'Puttu Flour',
    name_ml: 'പുട്ടുപൊടി',
    aliases: ['puttupodi', 'puttu podi', 'puttu powder', 'puttu flour', 'puttupodi'],
    unit: 'kg', price: 52, cost_price: 46, gst_rate: 0,
    category: 'grains', min_stock: 5, shelf_location: 'Counter Shelf - Row 1',
  },
  {
    name_en: 'Corn Flour',
    name_ml: 'കോൺ ഫ്ലൗർ',
    aliases: ['corn flour', 'cornflour', 'corn starch', 'maize flour'],
    unit: 'kg', price: 80, cost_price: 70, gst_rate: 0,
    category: 'grains', min_stock: 3, shelf_location: 'Counter Shelf - Row 1',
  },
  {
    name_en: 'Idli Rice',
    name_ml: 'ഇഡ്ഡലി അരി',
    aliases: ['idli ari', 'idly rice', 'idli rice', 'boiled rice', 'ukka ari'],
    unit: 'kg', price: 58, cost_price: 52, gst_rate: 0,
    category: 'grains', min_stock: 5, shelf_location: 'Floor - Sack Area',
  },

  // ─── DALS & PULSES (8) ────────────────────────────────────────────
  {
    name_en: 'Toor Dal',
    name_ml: 'തുവര പരിപ്പ്',
    aliases: ['tuvara parippu', 'toor dal', 'tur dal', 'arhar dal', 'yellow dal', 'thuvara parippu', 'parippu'],
    unit: 'kg', price: 165, cost_price: 148, gst_rate: 0,
    category: 'dals', min_stock: 5, shelf_location: 'Dal Shelf - Row 1',
  },
  {
    name_en: 'Moong Dal',
    name_ml: 'ചെറുപയർ',
    aliases: ['cherupayar', 'moong dal', 'green gram', 'mung dal', 'payar', 'cheru payar'],
    unit: 'kg', price: 128, cost_price: 112, gst_rate: 0,
    category: 'dals', min_stock: 5, shelf_location: 'Dal Shelf - Row 1',
  },
  {
    name_en: 'Urad Dal',
    name_ml: 'ഉഴുന്ന്',
    aliases: ['uzhunnu', 'urad dal', 'black gram', 'uzhunu', 'uzhunn'],
    unit: 'kg', price: 145, cost_price: 128, gst_rate: 0,
    category: 'dals', min_stock: 5, shelf_location: 'Dal Shelf - Row 1',
  },
  {
    name_en: 'Chana Dal',
    name_ml: 'കടലപ്പരിപ്പ്',
    aliases: ['kadala parippu', 'chana dal', 'bengal gram', 'chickpea dal', 'kadala'],
    unit: 'kg', price: 98, cost_price: 85, gst_rate: 0,
    category: 'dals', min_stock: 5, shelf_location: 'Dal Shelf - Row 1',
  },
  {
    name_en: 'Masoor Dal',
    name_ml: 'മസൂർ',
    aliases: ['masoor', 'masur dal', 'red lentil', 'lentil', 'masoor dal'],
    unit: 'kg', price: 108, cost_price: 95, gst_rate: 0,
    category: 'dals', min_stock: 5, shelf_location: 'Dal Shelf - Row 2',
  },
  {
    name_en: 'Chickpea',
    name_ml: 'കടല',
    aliases: ['kadala', 'chickpea', 'chana', 'kabuli chana', 'white chickpea'],
    unit: 'kg', price: 92, cost_price: 80, gst_rate: 0,
    category: 'dals', min_stock: 5, shelf_location: 'Dal Shelf - Row 2',
  },
  {
    name_en: 'Black Eyed Beans',
    name_ml: 'വൻ പയർ',
    aliases: ['van payar', 'cowpea', 'lobiya', 'black eyed peas', 'vanpayar'],
    unit: 'kg', price: 105, cost_price: 92, gst_rate: 0,
    category: 'dals', min_stock: 5, shelf_location: 'Dal Shelf - Row 2',
  },
  {
    name_en: 'Green Peas',
    name_ml: 'പട്ടാണി',
    aliases: ['pattani', 'green peas', 'matar', 'vatana', 'dried peas'],
    unit: 'kg', price: 98, cost_price: 86, gst_rate: 0,
    category: 'dals', min_stock: 5, shelf_location: 'Dal Shelf - Row 2',
  },

  // ─── SPICES (12) ───────────────────────────────────────────────────
  {
    name_en: 'Red Chilli Powder',
    name_ml: 'മുളക് പൊടി',
    aliases: ['mulaku podi', 'chilli powder', 'red chilli', 'mulak podi', 'kashmiri chilli', 'mulakupodi'],
    unit: 'kg', price: 205, cost_price: 178, gst_rate: 5,
    category: 'spices', min_stock: 3, shelf_location: 'Masala Shelf - Row 1',
  },
  {
    name_en: 'Turmeric Powder',
    name_ml: 'മഞ്ഞൾ',
    aliases: ['manjal', 'turmeric', 'haldi', 'manjal podi', 'turmeric powder'],
    unit: 'kg', price: 185, cost_price: 162, gst_rate: 5,
    category: 'spices', min_stock: 3, shelf_location: 'Masala Shelf - Row 1',
  },
  {
    name_en: 'Coriander Powder',
    name_ml: 'മല്ലി',
    aliases: ['malli', 'coriander', 'dhaniya', 'malli podi', 'coriander powder', 'dhania'],
    unit: 'kg', price: 135, cost_price: 118, gst_rate: 5,
    category: 'spices', min_stock: 3, shelf_location: 'Masala Shelf - Row 1',
  },
  {
    name_en: 'Cumin',
    name_ml: 'ജീരകം',
    aliases: ['jeerakam', 'jeera', 'cumin', 'jira', 'jeerakam'],
    unit: 'kg', price: 360, cost_price: 320, gst_rate: 5,
    category: 'spices', min_stock: 2, shelf_location: 'Masala Shelf - Row 1',
  },
  {
    name_en: 'Mustard Seeds',
    name_ml: 'കടുക്',
    aliases: ['kaduku', 'mustard', 'mustard seeds', 'rai', 'sarson'],
    unit: 'kg', price: 95, cost_price: 82, gst_rate: 5,
    category: 'spices', min_stock: 3, shelf_location: 'Masala Shelf - Row 1',
  },
  {
    name_en: 'Black Pepper',
    name_ml: 'കുരുമുളക്',
    aliases: ['kurumulak', 'pepper', 'black pepper', 'kali mirch', 'kurumulaku'],
    unit: 'kg', price: 720, cost_price: 648, gst_rate: 5,
    category: 'spices', min_stock: 2, shelf_location: 'Masala Shelf - Row 2',
  },
  {
    name_en: 'Cardamom',
    name_ml: 'ഏലം',
    aliases: ['elam', 'cardamom', 'elaichi', 'green cardamom', 'ela'],
    unit: 'kg', price: 2800, cost_price: 2500, gst_rate: 5,
    category: 'spices', min_stock: 1, shelf_location: 'Masala Shelf - Row 2',
  },
  {
    name_en: 'Cloves',
    name_ml: 'ഗ്രാമ്പൂ',
    aliases: ['grampu', 'cloves', 'lavang', 'grambu'],
    unit: 'kg', price: 950, cost_price: 855, gst_rate: 5,
    category: 'spices', min_stock: 1, shelf_location: 'Masala Shelf - Row 2',
  },
  {
    name_en: 'Cinnamon',
    name_ml: 'ഇലവംഗം',
    aliases: ['ilavam', 'cinnamon', 'dalchini', 'ilavangam'],
    unit: 'kg', price: 480, cost_price: 420, gst_rate: 5,
    category: 'spices', min_stock: 1, shelf_location: 'Masala Shelf - Row 2',
  },
  {
    name_en: 'Fenugreek',
    name_ml: 'ഉലുവ',
    aliases: ['uluva', 'fenugreek', 'methi', 'uluva'],
    unit: 'kg', price: 135, cost_price: 118, gst_rate: 5,
    category: 'spices', min_stock: 2, shelf_location: 'Masala Shelf - Row 2',
  },
  {
    name_en: 'Garam Masala',
    name_ml: 'ഗരം മസാല',
    aliases: ['garam masala', 'masala', 'biryani masala', 'meat masala'],
    unit: 'pack', price: 42, cost_price: 34, gst_rate: 5,
    category: 'spices', min_stock: 5, shelf_location: 'Masala Shelf - Row 3',
  },
  {
    name_en: 'Fish Masala',
    name_ml: 'ഫിഷ് മസാല',
    aliases: ['fish masala', 'meen masala', 'meen curry powder', 'fish curry masala'],
    unit: 'pack', price: 22, cost_price: 16, gst_rate: 5,
    category: 'spices', min_stock: 10, shelf_location: 'Masala Shelf - Row 3',
  },

  // ─── OILS (5) ──────────────────────────────────────────────────────
  {
    name_en: 'Coconut Oil',
    name_ml: 'വെളിച്ചെണ്ണ',
    aliases: ['velichenna', 'coconut oil', 'enna', 'velichennu', 'vellachenna', 'naalikera enna', 'nallienna'],
    unit: 'litre', price: 230, cost_price: 202, gst_rate: 5,
    category: 'oils', min_stock: 5, shelf_location: 'Oil Rack - Row 1',
  },
  {
    name_en: 'Sunflower Oil',
    name_ml: 'സൺഫ്ലവർ ഓയിൽ',
    aliases: ['sunflower oil', 'sunflower', 'refined oil', 'cooking oil', 'sunflower enna'],
    unit: 'litre', price: 135, cost_price: 118, gst_rate: 5,
    category: 'oils', min_stock: 5, shelf_location: 'Oil Rack - Row 1',
  },
  {
    name_en: 'Mustard Oil',
    name_ml: 'കടലെണ്ണ',
    aliases: ['kadal enna', 'mustard oil', 'groundnut oil', 'sarson oil'],
    unit: 'litre', price: 145, cost_price: 128, gst_rate: 5,
    category: 'oils', min_stock: 3, shelf_location: 'Oil Rack - Row 2',
  },
  {
    name_en: 'Palm Oil',
    name_ml: 'പാം ഓയിൽ',
    aliases: ['palm oil', 'dalda', 'vanaspati', 'palm enna'],
    unit: 'litre', price: 108, cost_price: 94, gst_rate: 5,
    category: 'oils', min_stock: 3, shelf_location: 'Oil Rack - Row 2',
  },
  {
    name_en: 'Sesame Oil',
    name_ml: 'എള്ളെണ്ണ',
    aliases: ['ellenna', 'sesame oil', 'til oil', 'gingelly oil', 'nalenna'],
    unit: 'litre', price: 275, cost_price: 242, gst_rate: 5,
    category: 'oils', min_stock: 3, shelf_location: 'Oil Rack - Row 2',
  },

  // ─── BEVERAGES (8) ─────────────────────────────────────────────────
  {
    name_en: 'Tea Powder',
    name_ml: 'ചായപ്പൊടി',
    aliases: ['chayappodi', 'tea powder', 'tea', 'chaya podi', 'chaya', 'chai', 'chayapodi'],
    unit: 'kg', price: 330, cost_price: 290, gst_rate: 5,
    category: 'beverages', min_stock: 3, shelf_location: 'Counter Shelf - Row 3',
  },
  {
    name_en: 'Coffee Powder',
    name_ml: 'കാപ്പിപ്പൊടി',
    aliases: ['kappippodi', 'coffee powder', 'coffee', 'kaapi podi', 'kappi'],
    unit: 'kg', price: 420, cost_price: 372, gst_rate: 5,
    category: 'beverages', min_stock: 3, shelf_location: 'Counter Shelf - Row 3',
  },
  {
    name_en: 'Milk',
    name_ml: 'പാൽ',
    aliases: ['paal', 'milk', 'pal', 'palu', 'ksheeram', 'milkum', 'പാലും'],
    unit: 'litre', price: 64, cost_price: 58, gst_rate: 0,
    category: 'dairy', min_stock: 10, shelf_location: 'Fridge',
  },
  {
    name_en: 'Boost',
    name_ml: 'ബൂസ്റ്റ്',
    aliases: ['boost', 'buust', 'chocolate malt', 'boost powder'],
    unit: 'kg', price: 265, cost_price: 235, gst_rate: 18,
    category: 'beverages', min_stock: 3, shelf_location: 'Counter Shelf - Row 3',
  },
  {
    name_en: 'Horlicks',
    name_ml: 'ഹോർലിക്സ്',
    aliases: ['horlicks', 'health drink', 'malt drink', 'horlick'],
    unit: 'kg', price: 258, cost_price: 228, gst_rate: 18,
    category: 'beverages', min_stock: 3, shelf_location: 'Counter Shelf - Row 3',
  },
  {
    name_en: 'Cocoa Powder',
    name_ml: 'കൊക്കോ',
    aliases: ['cocoa', 'cocoa powder', 'chocolate powder', 'coco powder'],
    unit: 'kg', price: 285, cost_price: 252, gst_rate: 18,
    category: 'beverages', min_stock: 2, shelf_location: 'Counter Shelf - Row 3',
  },
  {
    name_en: 'Ovaltine',
    name_ml: 'ഓവൽടൈൻ',
    aliases: ['ovaltine', 'malt drink', 'oval tine'],
    unit: 'kg', price: 238, cost_price: 210, gst_rate: 18,
    category: 'beverages', min_stock: 2, shelf_location: 'Counter Shelf - Row 3',
  },
  {
    name_en: 'Tang',
    name_ml: 'ടാംഗ്',
    aliases: ['tang', 'tang powder', 'instant drink', 'fruit drink', 'orange powder'],
    unit: 'pack', price: 48, cost_price: 38, gst_rate: 12,
    category: 'beverages', min_stock: 5, shelf_location: 'Counter Shelf - Row 3',
  },

  // ─── SOAP & CLEANING (10) ──────────────────────────────────────────
  {
    name_en: 'Soap',
    name_ml: 'സോപ്പ്',
    aliases: ['soap', 'sabun', 'soppu', 'soapum', 'bathing soap', 'toilet soap'],
    unit: 'piece', price: 42, cost_price: 34, gst_rate: 18,
    category: 'personal-care', min_stock: 20, shelf_location: 'Personal Care Shelf - Row 1',
  },
  {
    name_en: 'Washing Powder',
    name_ml: 'വാഷിംഗ് പൗഡർ',
    aliases: ['washing powder', 'detergent', 'washing soap', 'kapda soap', 'ariel', 'surf excel', 'tide'],
    unit: 'kg', price: 105, cost_price: 88, gst_rate: 18,
    category: 'household', min_stock: 5, shelf_location: 'Cleaning Shelf - Row 1',
  },
  {
    name_en: 'Dishwash Bar',
    name_ml: 'ബർട്ടൻ',
    aliases: ['vim bar', 'dishwash', 'bartan soap', 'vessel soap', 'pots soap', 'dishwash bar'],
    unit: 'piece', price: 32, cost_price: 24, gst_rate: 18,
    category: 'household', min_stock: 10, shelf_location: 'Cleaning Shelf - Row 1',
  },
  {
    name_en: 'Liquid Soap',
    name_ml: 'ലിക്വിഡ് സോപ്പ്',
    aliases: ['liquid soap', 'hand wash', 'handwash', 'lifebuoy liquid', 'dettol liquid'],
    unit: 'ml', price: 105, cost_price: 84, gst_rate: 18,
    category: 'household', min_stock: 5, shelf_location: 'Cleaning Shelf - Row 1',
  },
  {
    name_en: 'Phenyl',
    name_ml: 'ഫിനൈൽ',
    aliases: ['phenyl', 'phenol', 'floor cleaner liquid', 'disinfectant'],
    unit: 'litre', price: 52, cost_price: 40, gst_rate: 18,
    category: 'household', min_stock: 5, shelf_location: 'Cleaning Shelf - Row 1',
  },
  {
    name_en: 'Bleaching Powder',
    name_ml: 'ബ്ലീച്ചിംഗ് പൗഡർ',
    aliases: ['bleaching powder', 'bleach', 'chlorine powder', 'whitener'],
    unit: 'kg', price: 38, cost_price: 28, gst_rate: 18,
    category: 'household', min_stock: 5, shelf_location: 'Cleaning Shelf - Row 2',
  },
  {
    name_en: 'Toilet Cleaner',
    name_ml: 'ടോയ്‌ലറ്റ് ക്ലീനർ',
    aliases: ['toilet cleaner', 'harpic', 'bathroom cleaner', 'toilet liquid'],
    unit: 'piece', price: 78, cost_price: 62, gst_rate: 18,
    category: 'household', min_stock: 5, shelf_location: 'Cleaning Shelf - Row 2',
  },
  {
    name_en: 'Floor Cleaner',
    name_ml: 'ഫ്ലോർ ക്ലീനർ',
    aliases: ['floor cleaner', 'lizol', 'lifebuoy floor', 'dettol floor', 'floor liquid'],
    unit: 'litre', price: 88, cost_price: 72, gst_rate: 18,
    category: 'household', min_stock: 5, shelf_location: 'Cleaning Shelf - Row 2',
  },
  {
    name_en: 'Mosquito Coil',
    name_ml: 'കൊതുക് തിരി',
    aliases: ['kotuku thiri', 'mosquito coil', 'good knight', 'good night', 'allout', 'mosquito repellent'],
    unit: 'pack', price: 28, cost_price: 20, gst_rate: 12,
    category: 'household', min_stock: 10, shelf_location: 'Cleaning Shelf - Row 2',
  },
  {
    name_en: 'Vim Powder',
    name_ml: 'വിം',
    aliases: ['vim', 'vim powder', 'vessel cleaner powder', 'dishwash powder'],
    unit: 'pack', price: 42, cost_price: 32, gst_rate: 18,
    category: 'household', min_stock: 10, shelf_location: 'Cleaning Shelf - Row 2',
  },

  // ─── SNACKS & BISCUITS (10) ────────────────────────────────────────
  {
    name_en: 'Biscuit',
    name_ml: 'ബിസ്ക്കറ്റ്',
    aliases: ['biscuit', 'biscuits', 'biskut', 'marie', 'cream biscuit', 'britannia'],
    unit: 'pack', price: 12, cost_price: 9, gst_rate: 12,
    category: 'snacks', min_stock: 20, shelf_location: 'Display Case',
  },
  {
    name_en: 'Parle-G',
    name_ml: 'പാർലേ-ജി',
    aliases: ['parle g', 'parle', 'parle-g', 'glucose biscuit', 'parley'],
    unit: 'pack', price: 5, cost_price: 4, gst_rate: 12,
    category: 'snacks', min_stock: 30, shelf_location: 'Display Case',
  },
  {
    name_en: 'Chips',
    name_ml: 'ചിപ്സ്',
    aliases: ['chips', 'potato chips', 'lays', 'wafers chips', 'kurkure chips'],
    unit: 'pack', price: 22, cost_price: 17, gst_rate: 12,
    category: 'snacks', min_stock: 20, shelf_location: 'Display Case',
  },
  {
    name_en: 'Mixture',
    name_ml: 'മിക്സ്ചർ',
    aliases: ['mixture', 'namkeen', 'chivda', 'kerala mixture', 'haldirams'],
    unit: 'pack', price: 38, cost_price: 28, gst_rate: 12,
    category: 'snacks', min_stock: 10, shelf_location: 'Display Case',
  },
  {
    name_en: 'Murukku',
    name_ml: 'മുറുക്ക്',
    aliases: ['murukku', 'chakli', 'muruku', 'chakri', 'ribbon murukku'],
    unit: 'pack', price: 32, cost_price: 22, gst_rate: 12,
    category: 'snacks', min_stock: 10, shelf_location: 'Display Case',
  },
  {
    name_en: 'Banana Chips',
    name_ml: 'ഉണക്ക കേള',
    aliases: ['unakka kela', 'banana chips', 'plantain chips', 'kerala chips', 'pazham chips'],
    unit: 'kg', price: 240, cost_price: 200, gst_rate: 12,
    category: 'snacks', min_stock: 5, shelf_location: 'Display Case',
  },
  {
    name_en: 'Peanuts',
    name_ml: 'കടലക്കരി',
    aliases: ['kadalakaari', 'peanuts', 'groundnuts', 'kadala', 'roasted peanuts', 'verkadalai'],
    unit: 'kg', price: 125, cost_price: 105, gst_rate: 12,
    category: 'snacks', min_stock: 5, shelf_location: 'Display Case',
  },
  {
    name_en: 'Noodles',
    name_ml: 'നൂഡിൽസ്',
    aliases: ['noodles', 'maggi', 'top ramen', 'instant noodles', 'atta noodles'],
    unit: 'pack', price: 18, cost_price: 14, gst_rate: 12,
    category: 'snacks', min_stock: 20, shelf_location: 'Display Case',
  },
  {
    name_en: 'Kurkure',
    name_ml: 'കുർകുരേ',
    aliases: ['kurkure', 'kurl on', 'cheese balls', 'corn puff', 'cheetos'],
    unit: 'pack', price: 22, cost_price: 17, gst_rate: 12,
    category: 'snacks', min_stock: 15, shelf_location: 'Display Case',
  },
  {
    name_en: 'Bread',
    name_ml: 'ബ്രഡ്',
    aliases: ['bread', 'white bread', 'slice bread', 'modern bread', 'bread loaf'],
    unit: 'piece', price: 55, cost_price: 46, gst_rate: 0,
    category: 'snacks', min_stock: 5, shelf_location: 'Display Case',
  },

  // ─── PERSONAL CARE (8) ─────────────────────────────────────────────
  {
    name_en: 'Toothpaste',
    name_ml: 'ടൂത്ത്പേസ്റ്റ്',
    aliases: ['toothpaste', 'tooth paste', 'colgate', 'pepsodent', 'pista', 'close up', 'macleans'],
    unit: 'piece', price: 85, cost_price: 70, gst_rate: 12,
    category: 'personal-care', min_stock: 10, shelf_location: 'Personal Care Shelf - Row 1',
  },
  {
    name_en: 'Toothbrush',
    name_ml: 'ടൂത്ത്ബ്രഷ്',
    aliases: ['toothbrush', 'tooth brush', 'oral b', 'colgate brush'],
    unit: 'piece', price: 38, cost_price: 28, gst_rate: 12,
    category: 'personal-care', min_stock: 10, shelf_location: 'Personal Care Shelf - Row 1',
  },
  {
    name_en: 'Shampoo',
    name_ml: 'ഷാമ്പൂ',
    aliases: ['shampoo', 'head shoulders', 'clinic plus', 'pantene', 'dove shampoo'],
    unit: 'ml', price: 115, cost_price: 90, gst_rate: 18,
    category: 'personal-care', min_stock: 5, shelf_location: 'Personal Care Shelf - Row 1',
  },
  {
    name_en: 'Hair Oil',
    name_ml: 'ഹെയർ ഓയിൽ',
    aliases: ['hair oil', 'parachute', 'coconut hair oil', 'dabur amla', 'vatika'],
    unit: 'ml', price: 98, cost_price: 78, gst_rate: 18,
    category: 'personal-care', min_stock: 5, shelf_location: 'Personal Care Shelf - Row 2',
  },
  {
    name_en: 'Fairness Cream',
    name_ml: 'ഫെയർനസ് ക്രീം',
    aliases: ['fairness cream', 'face cream', 'fair lovely', 'glow lovely', 'cream'],
    unit: 'piece', price: 98, cost_price: 78, gst_rate: 18,
    category: 'personal-care', min_stock: 5, shelf_location: 'Personal Care Shelf - Row 2',
  },
  {
    name_en: 'Deo',
    name_ml: 'ഡിയോ',
    aliases: ['deo', 'deodorant', 'axe', 'rexona', 'park avenue', 'body spray'],
    unit: 'piece', price: 148, cost_price: 118, gst_rate: 18,
    category: 'personal-care', min_stock: 5, shelf_location: 'Personal Care Shelf - Row 2',
  },
  {
    name_en: 'Razor',
    name_ml: 'റേസർ',
    aliases: ['razor', 'shaving blade', 'gillette', '7o clock', 'blade'],
    unit: 'piece', price: 38, cost_price: 28, gst_rate: 18,
    category: 'personal-care', min_stock: 10, shelf_location: 'Personal Care Shelf - Row 2',
  },
  {
    name_en: 'Sanitary Pad',
    name_ml: 'സ്ത്രീ സ്വാസ്ഥ്യം',
    aliases: ['sanitary pad', 'napkin', 'whisper', 'stayfree', 'sofy', 'kotex'],
    unit: 'pack', price: 75, cost_price: 60, gst_rate: 0,
    category: 'personal-care', min_stock: 5, shelf_location: 'Personal Care Shelf - Row 2',
  },

  // ─── DAIRY (5) ─────────────────────────────────────────────────────
  {
    name_en: 'Curd',
    name_ml: 'തൈര്',
    aliases: ['thayir', 'curd', 'yogurt', 'dahi', 'thair'],
    unit: 'kg', price: 58, cost_price: 50, gst_rate: 0,
    category: 'dairy', min_stock: 5, shelf_location: 'Fridge',
  },
  {
    name_en: 'Butter',
    name_ml: 'വെണ്ണ',
    aliases: ['venna', 'butter', 'amul butter', 'fresh butter'],
    unit: 'kg', price: 540, cost_price: 490, gst_rate: 12,
    category: 'dairy', min_stock: 2, shelf_location: 'Fridge',
  },
  {
    name_en: 'Ghee',
    name_ml: 'നെയ്യ്',
    aliases: ['neyyu', 'ghee', 'clarified butter', 'desi ghee', 'cow ghee', 'neyyy'],
    unit: 'kg', price: 620, cost_price: 558, gst_rate: 12,
    category: 'dairy', min_stock: 3, shelf_location: 'Fridge',
  },
  {
    name_en: 'Paneer',
    name_ml: 'പനീർ',
    aliases: ['paneer', 'cottage cheese', 'indian cheese'],
    unit: 'kg', price: 395, cost_price: 355, gst_rate: 5,
    category: 'dairy', min_stock: 2, shelf_location: 'Fridge',
  },
  {
    name_en: 'Condensed Milk',
    name_ml: 'ക്ഷീർ',
    aliases: ['ksheeram', 'condensed milk', 'milkmaid', 'sweet milk'],
    unit: 'pack', price: 56, cost_price: 45, gst_rate: 5,
    category: 'dairy', min_stock: 5, shelf_location: 'Fridge',
  },

  // ─── SUGAR & SWEETENERS (4) ────────────────────────────────────────
  {
    name_en: 'Sugar',
    name_ml: 'പഞ്ചസാര',
    aliases: ['panchara', 'panjasara', 'sugar', 'cheeni', 'sharkara', 'ഷുഗർ', 'panja sara'],
    unit: 'kg', price: 48, cost_price: 42, gst_rate: 5,
    category: 'grains', min_stock: 10, shelf_location: 'Counter Shelf - Row 1',
  },
  {
    name_en: 'Jaggery',
    name_ml: 'ശർക്കര',
    aliases: ['sharkara', 'jaggery', 'gur', 'palm jaggery', 'nadan sharkara', 'sharkkara'],
    unit: 'kg', price: 72, cost_price: 60, gst_rate: 5,
    category: 'grains', min_stock: 5, shelf_location: 'Counter Shelf - Row 1',
  },
  {
    name_en: 'Honey',
    name_ml: 'തേൻ',
    aliases: ['then', 'honey', 'natural honey', 'bee honey', 'dabur honey'],
    unit: 'kg', price: 440, cost_price: 380, gst_rate: 12,
    category: 'grains', min_stock: 3, shelf_location: 'Counter Shelf - Row 2',
  },
  {
    name_en: 'Palm Sugar',
    name_ml: 'കരിമ്പ് ശർക്കര',
    aliases: ['karimbu sharkara', 'palm sugar', 'raw sugar', 'kandu sharkara', 'brown sugar'],
    unit: 'kg', price: 98, cost_price: 80, gst_rate: 5,
    category: 'grains', min_stock: 3, shelf_location: 'Counter Shelf - Row 2',
  },

  // ─── SALT & ESSENTIALS (5) ─────────────────────────────────────────
  {
    name_en: 'Salt',
    name_ml: 'ഉപ്പ്',
    aliases: ['uppu', 'salt', 'namak', 'iodized salt', 'table salt', 'uppum'],
    unit: 'kg', price: 22, cost_price: 16, gst_rate: 0,
    category: 'grains', min_stock: 10, shelf_location: 'Counter Shelf - Row 1',
  },
  {
    name_en: 'Vinegar',
    name_ml: 'വിനഗർ',
    aliases: ['vinegar', 'acidity', 'white vinegar', 'apple vinegar'],
    unit: 'litre', price: 38, cost_price: 28, gst_rate: 12,
    category: 'grains', min_stock: 3, shelf_location: 'Counter Shelf - Row 2',
  },
  {
    name_en: 'Baking Soda',
    name_ml: 'ബേക്കിംഗ് സോഡ',
    aliases: ['baking soda', 'soda', 'sodium bicarbonate', 'cooking soda', 'payyasam soda'],
    unit: 'pack', price: 18, cost_price: 12, gst_rate: 12,
    category: 'grains', min_stock: 5, shelf_location: 'Counter Shelf - Row 2',
  },
  {
    name_en: 'Tamarind',
    name_ml: 'പുളി',
    aliases: ['puli', 'tamarind', 'imli', 'kokum', 'tamarind paste'],
    unit: 'kg', price: 115, cost_price: 96, gst_rate: 0,
    category: 'spices', min_stock: 3, shelf_location: 'Masala Shelf - Row 1',
  },
  {
    name_en: 'Coconut',
    name_ml: 'തേങ്ങ',
    aliases: ['thenga', 'coconut', 'nariyal', 'naalikera', 'thengu'],
    unit: 'piece', price: 35, cost_price: 25, gst_rate: 0,
    category: 'vegetables', min_stock: 10, shelf_location: 'Veg Corner',
  },

  // ─── VEGETABLES & STAPLES (5) ─────────────────────────────────────
  {
    name_en: 'Onion',
    name_ml: 'ഉള്ളി',
    aliases: ['ulli', 'onion', 'pyaz', 'kanda', 'red onion', 'shallot'],
    unit: 'kg', price: 48, cost_price: 38, gst_rate: 0,
    category: 'vegetables', min_stock: 5, shelf_location: 'Veg Corner',
  },
  {
    name_en: 'Garlic',
    name_ml: 'വെളുത്തുള്ളി',
    aliases: ['veluthulli', 'garlic', 'lehsun', 'white onion', 'lashun'],
    unit: 'kg', price: 185, cost_price: 158, gst_rate: 0,
    category: 'vegetables', min_stock: 3, shelf_location: 'Veg Corner',
  },
  {
    name_en: 'Ginger',
    name_ml: 'ഇഞ്ചി',
    aliases: ['inchi', 'ginger', 'adrak', 'fresh ginger', 'inji'],
    unit: 'kg', price: 125, cost_price: 105, gst_rate: 0,
    category: 'vegetables', min_stock: 3, shelf_location: 'Veg Corner',
  },
  {
    name_en: 'Green Chilli',
    name_ml: 'പച്ചമുളക്',
    aliases: ['pacha mulaku', 'green chilli', 'hari mirch', 'green pepper', 'pachumulaku'],
    unit: 'kg', price: 85, cost_price: 68, gst_rate: 0,
    category: 'vegetables', min_stock: 3, shelf_location: 'Veg Corner',
  },
  {
    name_en: 'Tomato',
    name_ml: 'തക്കാളി',
    aliases: ['thakkali', 'tomato', 'tamatar', 'takkali'],
    unit: 'kg', price: 55, cost_price: 44, gst_rate: 0,
    category: 'vegetables', min_stock: 3, shelf_location: 'Veg Corner',
  },

  // ─── HOUSEHOLD & MISCELLANEOUS (10) ───────────────────────────────
  {
    name_en: 'Matchbox',
    name_ml: 'തീപ്പെട്ടി',
    aliases: ['theeppetti', 'matchbox', 'match box', 'match stick'],
    unit: 'pack', price: 6, cost_price: 4, gst_rate: 12,
    category: 'household', min_stock: 20, shelf_location: 'Counter Top',
  },
  {
    name_en: 'Candle',
    name_ml: 'മെഴുകുതിരി',
    aliases: ['mezhuku thiri', 'candle', 'mozhuktiri', 'wax candle'],
    unit: 'pack', price: 38, cost_price: 28, gst_rate: 12,
    category: 'household', min_stock: 10, shelf_location: 'Counter Top',
  },
  {
    name_en: 'Incense Sticks',
    name_ml: 'അഗർബത്തി',
    aliases: ['agarbatti', 'incense', 'agarbathi', 'chandan', 'dhoop'],
    unit: 'pack', price: 28, cost_price: 20, gst_rate: 12,
    category: 'household', min_stock: 10, shelf_location: 'Counter Top',
  },
  {
    name_en: 'Battery',
    name_ml: 'ബാറ്ററി',
    aliases: ['battery', 'cell', 'duracell', 'eveready', 'aa battery'],
    unit: 'piece', price: 42, cost_price: 32, gst_rate: 12,
    category: 'household', min_stock: 10, shelf_location: 'Counter Top',
  },
  {
    name_en: 'Pen',
    name_ml: 'പേന',
    aliases: ['pena', 'pen', 'ball pen', 'gel pen', 'reynolds', 'cello'],
    unit: 'piece', price: 12, cost_price: 8, gst_rate: 12,
    category: 'stationery', min_stock: 20, shelf_location: 'Stationery Corner',
  },
  {
    name_en: 'Notebook',
    name_ml: 'നോട്ട്ബുക്ക്',
    aliases: ['notebook', 'note book', 'copy', 'exercise book', 'classmate'],
    unit: 'piece', price: 42, cost_price: 32, gst_rate: 12,
    category: 'stationery', min_stock: 10, shelf_location: 'Stationery Corner',
  },
  {
    name_en: 'Envelope',
    name_ml: 'കവർ',
    aliases: ['cover', 'envelope', 'letter cover', 'postal cover'],
    unit: 'pack', price: 22, cost_price: 16, gst_rate: 12,
    category: 'stationery', min_stock: 10, shelf_location: 'Stationery Corner',
  },
  {
    name_en: 'Banana',
    name_ml: 'പഴം',
    aliases: ['pazham', 'banana', 'ethapazham', 'nendra', 'poovan', 'plantain'],
    unit: 'piece', price: 10, cost_price: 7, gst_rate: 0,
    category: 'vegetables', min_stock: 10, shelf_location: 'Veg Corner',
  },
  {
    name_en: 'Coconut Oil Sachets',
    name_ml: 'വെളിച്ചെണ്ണ സാഷേ',
    aliases: ['enna sacha', 'oil sachet', 'coconut sachet', 'small oil pack', 'sachet oil'],
    unit: 'pack', price: 12, cost_price: 9, gst_rate: 5,
    category: 'oils', min_stock: 20, shelf_location: 'Oil Rack - Row 2',
  },
  {
    name_en: 'Washing Soap Bar',
    name_ml: 'അലക്ക് സോപ്പ്',
    aliases: ['alaku soap', 'washing bar', 'laundry soap', '501 soap', 'rin bar', 'sunlight'],
    unit: 'piece', price: 28, cost_price: 20, gst_rate: 18,
    category: 'household', min_stock: 10, shelf_location: 'Cleaning Shelf - Row 2',
  },
];

/**
 * Build quick lookup structures for voice matching
 */
export const PRODUCT_ALIAS_MAP = new Map<string, string>();
for (const product of KERALA_PRODUCTS) {
  // Map English name
  PRODUCT_ALIAS_MAP.set(product.name_en.toLowerCase(), product.name_en);
  // Map Malayalam name
  PRODUCT_ALIAS_MAP.set(product.name_ml.toLowerCase(), product.name_en);
  // Map all aliases
  for (const alias of product.aliases) {
    PRODUCT_ALIAS_MAP.set(alias.toLowerCase(), product.name_en);
  }
}

/**
 * Get product by English name
 */
export function getProduct(name_en: string): ProductDefinition | undefined {
  return KERALA_PRODUCTS.find(p => p.name_en === name_en);
}

/**
 * Get all unique product categories
 */
export const PRODUCT_CATEGORIES_LIST = [...new Set(KERALA_PRODUCTS.map(p => p.category))];

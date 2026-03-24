-- =====================================================
-- Price Update Migration — March 2026
-- Updates all product prices to current Kerala market rates.
-- Run in Supabase SQL Editor: only affects rows where name_en matches.
-- =====================================================

DO $$
BEGIN

-- ─── GRAINS & RICE ──────────────────────────────────────────────────
UPDATE products SET price = 62,  cost_price = 55  WHERE name_en = 'Rice';
UPDATE products SET price = 75,  cost_price = 68  WHERE name_en = 'Red Rice';
UPDATE products SET price = 38,  cost_price = 33  WHERE name_en = 'Wheat';
UPDATE products SET price = 48,  cost_price = 43  WHERE name_en = 'Wheat Flour';
UPDATE products SET price = 46,  cost_price = 40  WHERE name_en = 'Maida';
UPDATE products SET price = 44,  cost_price = 38  WHERE name_en = 'Rava';
UPDATE products SET price = 46,  cost_price = 40  WHERE name_en = 'Rice Flour';
UPDATE products SET price = 52,  cost_price = 46  WHERE name_en = 'Puttu Flour';
UPDATE products SET price = 80,  cost_price = 70  WHERE name_en = 'Corn Flour';
UPDATE products SET price = 58,  cost_price = 52  WHERE name_en = 'Idli Rice';

-- ─── DALS & PULSES ──────────────────────────────────────────────────
UPDATE products SET price = 165, cost_price = 148 WHERE name_en = 'Toor Dal';
UPDATE products SET price = 128, cost_price = 112 WHERE name_en = 'Moong Dal';
UPDATE products SET price = 145, cost_price = 128 WHERE name_en = 'Urad Dal';
UPDATE products SET price = 98,  cost_price = 85  WHERE name_en = 'Chana Dal';
UPDATE products SET price = 108, cost_price = 95  WHERE name_en = 'Masoor Dal';
UPDATE products SET price = 92,  cost_price = 80  WHERE name_en = 'Chickpea';
UPDATE products SET price = 105, cost_price = 92  WHERE name_en = 'Black Eyed Beans';
UPDATE products SET price = 98,  cost_price = 86  WHERE name_en = 'Green Peas';

-- ─── SPICES ─────────────────────────────────────────────────────────
UPDATE products SET price = 205,  cost_price = 178  WHERE name_en = 'Red Chilli Powder';
UPDATE products SET price = 185,  cost_price = 162  WHERE name_en = 'Turmeric Powder';
UPDATE products SET price = 135,  cost_price = 118  WHERE name_en = 'Coriander Powder';
UPDATE products SET price = 360,  cost_price = 320  WHERE name_en = 'Cumin';
UPDATE products SET price = 95,   cost_price = 82   WHERE name_en = 'Mustard Seeds';
UPDATE products SET price = 720,  cost_price = 648  WHERE name_en = 'Black Pepper';
UPDATE products SET price = 2800, cost_price = 2500 WHERE name_en = 'Cardamom';
UPDATE products SET price = 950,  cost_price = 855  WHERE name_en = 'Cloves';
UPDATE products SET price = 480,  cost_price = 420  WHERE name_en = 'Cinnamon';
UPDATE products SET price = 135,  cost_price = 118  WHERE name_en = 'Fenugreek';
UPDATE products SET price = 42,   cost_price = 34   WHERE name_en = 'Garam Masala';
UPDATE products SET price = 22,   cost_price = 16   WHERE name_en = 'Fish Masala';

-- ─── OILS ───────────────────────────────────────────────────────────
UPDATE products SET price = 230, cost_price = 202 WHERE name_en = 'Coconut Oil';
UPDATE products SET price = 135, cost_price = 118 WHERE name_en = 'Sunflower Oil';
UPDATE products SET price = 145, cost_price = 128 WHERE name_en = 'Mustard Oil';
UPDATE products SET price = 108, cost_price = 94  WHERE name_en = 'Palm Oil';
UPDATE products SET price = 275, cost_price = 242 WHERE name_en = 'Sesame Oil';

-- ─── BEVERAGES ──────────────────────────────────────────────────────
UPDATE products SET price = 330, cost_price = 290 WHERE name_en = 'Tea Powder';
UPDATE products SET price = 420, cost_price = 372 WHERE name_en = 'Coffee Powder';
UPDATE products SET price = 64,  cost_price = 58  WHERE name_en = 'Milk';
UPDATE products SET price = 265, cost_price = 235 WHERE name_en = 'Boost';
UPDATE products SET price = 258, cost_price = 228 WHERE name_en = 'Horlicks';
UPDATE products SET price = 285, cost_price = 252 WHERE name_en = 'Cocoa Powder';
UPDATE products SET price = 238, cost_price = 210 WHERE name_en = 'Ovaltine';
UPDATE products SET price = 48,  cost_price = 38  WHERE name_en = 'Tang';

-- ─── SOAP & CLEANING ────────────────────────────────────────────────
UPDATE products SET price = 42,  cost_price = 34 WHERE name_en = 'Soap';
UPDATE products SET price = 105, cost_price = 88 WHERE name_en = 'Washing Powder';
UPDATE products SET price = 32,  cost_price = 24 WHERE name_en = 'Dishwash Bar';
UPDATE products SET price = 105, cost_price = 84 WHERE name_en = 'Liquid Soap';
UPDATE products SET price = 52,  cost_price = 40 WHERE name_en = 'Phenyl';
UPDATE products SET price = 38,  cost_price = 28 WHERE name_en = 'Bleaching Powder';
UPDATE products SET price = 78,  cost_price = 62 WHERE name_en = 'Toilet Cleaner';
UPDATE products SET price = 88,  cost_price = 72 WHERE name_en = 'Floor Cleaner';
UPDATE products SET price = 28,  cost_price = 20 WHERE name_en = 'Mosquito Coil';
UPDATE products SET price = 42,  cost_price = 32 WHERE name_en = 'Vim Powder';

-- ─── SNACKS & BISCUITS ──────────────────────────────────────────────
UPDATE products SET price = 12,  cost_price = 9   WHERE name_en = 'Biscuit';
-- Parle-G stays at ₹5 (iconic price point)
UPDATE products SET price = 22,  cost_price = 17  WHERE name_en = 'Chips';
UPDATE products SET price = 38,  cost_price = 28  WHERE name_en = 'Mixture';
UPDATE products SET price = 32,  cost_price = 22  WHERE name_en = 'Murukku';
UPDATE products SET price = 240, cost_price = 200 WHERE name_en = 'Banana Chips';
UPDATE products SET price = 125, cost_price = 105 WHERE name_en = 'Peanuts';
UPDATE products SET price = 18,  cost_price = 14  WHERE name_en = 'Noodles';
UPDATE products SET price = 22,  cost_price = 17  WHERE name_en = 'Kurkure';
UPDATE products SET price = 55,  cost_price = 46  WHERE name_en = 'Bread';

-- ─── PERSONAL CARE ──────────────────────────────────────────────────
UPDATE products SET price = 85,  cost_price = 70  WHERE name_en = 'Toothpaste';
UPDATE products SET price = 38,  cost_price = 28  WHERE name_en = 'Toothbrush';
UPDATE products SET price = 115, cost_price = 90  WHERE name_en = 'Shampoo';
UPDATE products SET price = 98,  cost_price = 78  WHERE name_en = 'Hair Oil';
UPDATE products SET price = 98,  cost_price = 78  WHERE name_en = 'Fairness Cream';
UPDATE products SET price = 148, cost_price = 118 WHERE name_en = 'Deo';
UPDATE products SET price = 38,  cost_price = 28  WHERE name_en = 'Razor';
UPDATE products SET price = 75,  cost_price = 60  WHERE name_en = 'Sanitary Pad';

-- ─── DAIRY ──────────────────────────────────────────────────────────
UPDATE products SET price = 58,  cost_price = 50  WHERE name_en = 'Curd';
UPDATE products SET price = 540, cost_price = 490 WHERE name_en = 'Butter';
UPDATE products SET price = 620, cost_price = 558 WHERE name_en = 'Ghee';
UPDATE products SET price = 395, cost_price = 355 WHERE name_en = 'Paneer';
UPDATE products SET price = 56,  cost_price = 45  WHERE name_en = 'Condensed Milk';

-- ─── SUGAR & SWEETENERS ─────────────────────────────────────────────
UPDATE products SET price = 48,  cost_price = 42  WHERE name_en = 'Sugar';
UPDATE products SET price = 72,  cost_price = 60  WHERE name_en = 'Jaggery';
UPDATE products SET price = 440, cost_price = 380 WHERE name_en = 'Honey';
UPDATE products SET price = 98,  cost_price = 80  WHERE name_en = 'Palm Sugar';

-- ─── SALT & ESSENTIALS ──────────────────────────────────────────────
UPDATE products SET price = 22,  cost_price = 16  WHERE name_en = 'Salt';
UPDATE products SET price = 38,  cost_price = 28  WHERE name_en = 'Vinegar';
UPDATE products SET price = 18,  cost_price = 12  WHERE name_en = 'Baking Soda';
UPDATE products SET price = 115, cost_price = 96  WHERE name_en = 'Tamarind';
UPDATE products SET price = 35,  cost_price = 25  WHERE name_en = 'Coconut';

-- ─── VEGETABLES ─────────────────────────────────────────────────────
UPDATE products SET price = 48,  cost_price = 38  WHERE name_en = 'Onion';
UPDATE products SET price = 185, cost_price = 158 WHERE name_en = 'Garlic';
UPDATE products SET price = 125, cost_price = 105 WHERE name_en = 'Ginger';
UPDATE products SET price = 85,  cost_price = 68  WHERE name_en = 'Green Chilli';
UPDATE products SET price = 55,  cost_price = 44  WHERE name_en = 'Tomato';

-- ─── HOUSEHOLD & MISC ───────────────────────────────────────────────
UPDATE products SET price = 6,   cost_price = 4   WHERE name_en = 'Matchbox';
UPDATE products SET price = 38,  cost_price = 28  WHERE name_en = 'Candle';
UPDATE products SET price = 28,  cost_price = 20  WHERE name_en = 'Incense Sticks';
UPDATE products SET price = 42,  cost_price = 32  WHERE name_en = 'Battery';
UPDATE products SET price = 12,  cost_price = 8   WHERE name_en = 'Pen';
UPDATE products SET price = 42,  cost_price = 32  WHERE name_en = 'Notebook';
UPDATE products SET price = 22,  cost_price = 16  WHERE name_en = 'Envelope';
UPDATE products SET price = 10,  cost_price = 7   WHERE name_en = 'Banana';
UPDATE products SET price = 12,  cost_price = 9   WHERE name_en = 'Coconut Oil Sachets';
UPDATE products SET price = 28,  cost_price = 20  WHERE name_en = 'Washing Soap Bar';

RAISE NOTICE 'Price update complete — % rows may have been affected', (SELECT COUNT(*) FROM products);

END $$;

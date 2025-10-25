User
├── id (uuid, primary key)
├── email (string, unique)
├── name (string)
├── created_at (timestamp)
├── updated_at (timestamp)
├── preferences (jsonb)
│   ├── default_currency
│   ├── preferred_regions []
│   ├── avoid_characteristics []
│   └── price_comfort_zone {min, max}
└── settings (jsonb)
    ├── notifications_enabled
    ├── peak_window_alerts
    └── language
```

---

### **Bottle**
```
Bottle
├── id (uuid, primary key)
├── user_id (uuid, foreign key → User)
├── wine_id (uuid, foreign key → Wine, nullable)
│
├── -- Purchase & Ownership --
├── quantity (integer, default 1)
├── purchase_price (decimal)
├── currency (string, default from user prefs)
├── purchase_date (date)
├── purchase_location (string, nullable)
├── storage_location (string, nullable)
│
├── -- Status --
├── status (enum: 'in_cellar', 'consumed', 'gifted', 'other')
├── consumed_date (date, nullable)
│
├── -- User Data --
├── personal_notes (text, nullable)
├── rating (integer 1-5, nullable)
├── tags [] (string array)
│
├── -- Metadata --
├── created_at (timestamp)
├── updated_at (timestamp)
└── acquisition_method (enum: 'purchased', 'gift', 'trade', 'other')
```

---

### **Wine**
```
Wine
├── id (uuid, primary key)
├── name (string)
├── full_name (string)
├── vintage (integer, nullable) // null for NV (non-vintage)
├── producer (string)
├── producer_id (uuid, foreign key → Producer, nullable)
│
├── -- Classification --
├── wine_type (enum: 'red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified')
├── style (string) // "Full-bodied red", "Crisp white"
├── primary_grape (string)
├── grape_varieties [] (jsonb array)
│   └── [{name: "Cabernet Sauvignon", percentage: 70}, ...]
│
├── -- Geography --
├── country (string)
├── region (string)
├── sub_region (string, nullable)
├── appellation (string, nullable)
│
├── -- Wine Characteristics --
├── alcohol_percentage (decimal, nullable)
├── sweetness_level (enum: 'dry', 'off-dry', 'medium', 'sweet', 'very_sweet', nullable)
├── body (enum: 'light', 'medium', 'full', nullable)
├── tannin_level (enum: 'low', 'medium', 'high', nullable)
├── acidity_level (enum: 'low', 'medium', 'high', nullable)
│
├── -- Aging & Service --
├── peak_drinking_start (integer, nullable) // years from vintage
├── peak_drinking_end (integer, nullable)
├── optimal_serving_temp_min (integer, nullable)
├── optimal_serving_temp_max (integer, nullable)
├── decant_time_minutes (integer, nullable)
│
├── -- AI/External Data --
├── description (text, nullable)
├── tasting_notes (text, nullable)
├── external_ids (jsonb) // {vivino_id, wine_searcher_id, etc}
├── ai_generated_summary (text, nullable)
├── embedding (vector, nullable) // for semantic search
│
├── -- Metadata --
├── created_at (timestamp)
├── updated_at (timestamp)
├── verified (boolean, default false)
└── data_source (string, nullable)
```

---

### **Producer** (Optional - can add later)
```
Producer
├── id (uuid, primary key)
├── name (string)
├── country (string)
├── region (string, nullable)
├── founded_year (integer, nullable)
├── website (string, nullable)
├── description (text, nullable)
├── specialty (string, nullable)
└── external_ids (jsonb)
```

---

### **ConsumptionLog**
Simplified - focuses on when wines were drunk and ratings.
```
ConsumptionLog
├── id (uuid, primary key)
├── bottle_id (uuid, foreign key → Bottle)
├── user_id (uuid, foreign key → User)
├── wine_id (uuid, foreign key → Wine) // denormalized
│
├── consumed_date (date)
├── quantity_consumed (integer, default 1) // if opened bottle over multiple occasions
├── occasion (string, nullable) // "dinner party", "quiet evening"
├── rating (integer 1-5, nullable)
├── tasting_notes (text, nullable)
│
├── -- Context --
├── companions (string array, nullable) // who drank it with you
├── location (string, nullable)
│
└── created_at (timestamp)
```

---

### **LabelScan**
```
LabelScan
├── id (uuid, primary key)
├── user_id (uuid, foreign key → User)
├── bottle_id (uuid, foreign key → Bottle, nullable)
├── image_url (string)
├── extraction_confidence (float)
├── extracted_data (jsonb) // raw AI output
├── user_confirmed (boolean, nullable)
├── corrections_made (jsonb, nullable)
└── created_at (timestamp)
```

---

### **WineKnowledge** (Cache for AI explanations)
```
WineKnowledge
├── id (uuid, primary key)
├── topic_type (enum: 'grape', 'region', 'style', 'producer', 'comparison')
├── topic_key (string) // "nebbiolo", "barolo", "barolo_vs_barbaresco"
├── title (string)
├── content (text)
├── related_topics (string array)
├── embedding (vector, nullable)
├── usage_count (integer, default 0)
├── created_at (timestamp)
└── updated_at (timestamp)
```

---

### **PriceHistory**
```
PriceHistory
├── id (uuid, primary key)
├── wine_id (uuid, foreign key → Wine)
├── vintage (integer, nullable)
├── price (decimal)
├── currency (string)
├── source (string) // "user_purchase", "wine_searcher", "vivino"
├── source_url (string, nullable)
├── recorded_date (date)
└── created_at (timestamp)
```

---

### **UserPreferenceLearning**
AI learns what you like over time based on ratings and consumption patterns.
```
UserPreferenceLearning
├── id (uuid, primary key)
├── user_id (uuid, foreign key → User)
├── preference_type (enum: 'grape', 'region', 'style', 'price_sensitivity', 'characteristic')
├── preference_value (string) // "nebbiolo", "piedmont", "full-bodied"
├── affinity_score (float) // -1 to 1 (negative = dislike, positive = like)
├── confidence_score (float) // 0-1, how confident AI is
├── evidence_count (integer) // number of bottles rated/consumed
├── last_reinforced (timestamp)
└── created_at (timestamp)
```

---

## Simplified Relationships
```
User
  ├─→ Bottle (1:many)
  ├─→ ConsumptionLog (1:many)
  ├─→ LabelScan (1:many)
  └─→ UserPreferenceLearning (1:many)

Wine
  ├─→ Bottle (1:many)
  ├─→ ConsumptionLog (1:many)
  ├─→ Producer (many:1, optional)
  └─→ PriceHistory (1:many)

Bottle
  ├─→ Wine (many:1)
  ├─→ User (many:1)
  ├─→ ConsumptionLog (1:many)
  └─→ LabelScan (1:1 or 1:0)

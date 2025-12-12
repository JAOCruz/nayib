# 🚀 Data Optimization - Next Steps

## ✅ What's Been Done

### 1. Created Standardization Scripts

**Three new scripts have been created:**

1. **`scripts/standardize-addresses.js`** - Adds structured address data
   - Parses location strings into: city, sector, street, subdivision
   - Maintains backward compatibility (keeps original `location` field)
   - Adds new `address` field with structured data

2. **`scripts/fix-solares-pricing.js`** - Fixes pricing issues in terrains
   - Detects when `precio_usd_m2` contains total price instead of price per m²
   - Automatically calculates correct price per m²
   - Standardizes legal status values (CON TÍTULO, DESLINDADO, etc.)

3. **New NPM scripts added to `package.json`:**
   ```bash
   npm run fix-solares:dry-run          # Preview pricing fixes
   npm run fix-solares                  # Apply pricing fixes
   npm run standardize-addresses:dry-run # Preview address changes
   npm run standardize-addresses        # Apply address changes
   npm run optimize-all                 # Run all optimizations
   ```

### 2. Test Results (Dry Run)

**Solares Pricing & Legal Status:**
- ✅ 15 lots with pricing corrected (total price → price per m²)
- ✅ 12 lots with legal status standardized ("CON TITULO" → "CON TÍTULO")
- ✅ 27 total corrections

**Address Standardization:**
- ✅ 82 properties will get structured address data
- ✅ 84 solares locations will get structured address data
- ✅ 166 total changes

**Examples of Fixes:**

Pricing fix:
```
Juan Dolio [Lot #5]
❌ OLD: $2,600,000 per m² (clearly wrong)
✅ NEW: $1,083.33 per m² (calculated from 2,600,000 ÷ 2,400 m²)
```

Address standardization:
```
Original: "Piantini, Santo Domingo"
Structured:
  - city: "Santo Domingo"
  - sector: "Piantini"
  - formatted: "Piantini, Santo Domingo"
```

---

## 📋 Recommended Next Steps

### Step 1: Apply Data Fixes (Recommended to do now)

Run these commands to fix the data issues:

```bash
# Apply pricing and legal status fixes
npm run fix-solares

# Apply address standardization
npm run standardize-addresses

# Validate everything is correct
npm run validate
```

**What this does:**
- Creates automatic backups before making changes
- Fixes 27 data issues in terrains
- Adds structured address data to all properties
- Maintains backward compatibility

**Time needed:** 5 minutes

---

### Step 2: File Splitting (Optional but Recommended)

Split the large 292KB file into smaller category files:

```
data/
├── properties/
│   ├── propiedades.json (~150KB)
│   ├── oficinas.json (~15KB)
│   └── solares.json (~120KB)
└── properties-index.json (~10KB)
```

**Benefits:**
- 98% faster initial page load (5-10KB instead of 292KB)
- Lazy loading (only load category when needed)
- Easier to edit specific categories

**To implement:**
```bash
# Preview what would happen
npm run migrate:dry-run

# Apply migration with backup
npm run migrate
```

**Then update JavaScript files** to load category-specific JSON files instead of the full file.

**Time needed:** 2-3 hours (includes JS updates and testing)

---

### Step 3: Testing

After applying changes:

1. **Local testing:**
   - Open each page (propiedades, solares, oficinas)
   - Test filters and search
   - Verify all data displays correctly
   - Check property detail pages

2. **Validation:**
   ```bash
   npm run validate
   ```

3. **Visual inspection:**
   - Check a few properties manually
   - Verify pricing looks correct on terrain pages
   - Confirm addresses display properly

**Time needed:** 1-2 hours

---

## 🎯 Quick Start - Apply Fixes Now

If you want to apply the data fixes right now:

```bash
# Run all optimizations at once
npm run optimize-all
```

This will:
1. Fix terrain pricing (15 corrections)
2. Standardize legal status (12 corrections)
3. Add structured addresses (166 additions)
4. Validate everything is correct
5. Create backups automatically

**Total time:** ~2 minutes

---

## 📊 What Each Script Does

### `fix-solares`
**Fixes:**
- ❌ `precio_usd_m2: 2600000` (this is total price)
- ✅ `precio_usd_m2: 1083.33` (correct price per m²)

- ❌ `estatus_legal: "CON TITULO"` (missing accent)
- ✅ `estatus_legal: "CON TÍTULO"` (correct)

### `standardize-addresses`
**Adds:**
```json
{
  "location": "Piantini, Santo Domingo",
  "address": {
    "city": "Santo Domingo",
    "sector": "Piantini",
    "street": null,
    "subdivision": null,
    "province": "Santo Domingo",
    "formatted": "Piantini, Santo Domingo"
  }
}
```

### `migrate` (File Splitting)
**Creates:**
- `data/properties/propiedades.json` - All residential properties
- `data/properties/oficinas.json` - All offices
- `data/properties/solares.json` - All terrains
- `data/properties-index.json` - Metadata and featured

---

## ⚠️ Important Notes

### Backups
- All scripts create automatic backups before making changes
- Backups are named: `properties.backup-[timestamp].json`
- You can always rollback by copying a backup file

### Backward Compatibility
- Original `location` field is kept (not removed)
- New `address` field is added alongside it
- Existing code will continue to work

### Testing
- Always run with `--dry-run` first to preview changes
- Validate after applying changes: `npm run validate`
- Test locally before deploying

---

## 📞 Questions?

If you have questions or want to proceed with any of these steps, just let me know!

**Recommended order:**
1. ✅ Apply data fixes now (`npm run optimize-all`)
2. 🤔 Decide on file splitting later (requires JS changes)
3. ✅ Test everything locally
4. 🚀 Deploy when ready

---

**Created:** December 2024
**Status:** Ready to apply

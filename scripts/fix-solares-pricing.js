#!/usr/bin/env node

/**
 * Fix Solares Pricing Script
 *
 * This script fixes solares where the precio_usd_m2 field contains the total price
 * instead of the price per square meter. It detects these cases and converts them
 * to the correct price per m² value.
 *
 * Detection logic:
 * - If precio_usd_m2 > 10,000, it's likely a total price, not price per m²
 * - Calculate real price per m² = precio_usd_m2 / area_m2
 *
 * Usage:
 *   node scripts/fix-solares-pricing.js [options]
 *
 * Options:
 *   --dry-run    Show what would be changed without making changes
 *   --backup     Create a backup before making changes (default: true)
 *   --input      Input file path (default: data/properties.json)
 *   --threshold  Price threshold to detect total prices (default: 10000)
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  backup: !args.includes('--no-backup'),
  input: args.find(arg => arg.startsWith('--input='))?.split('=')[1] || 'data/properties.json',
  threshold: parseInt(args.find(arg => arg.startsWith('--threshold='))?.split('=')[1]) || 10000
};

/**
 * Fix pricing for solares
 * @param {object} data - Properties data
 * @param {number} threshold - Price threshold to detect total prices
 * @returns {object} Updated data with fixed pricing and statistics
 */
function fixSolaresPricing(data, threshold) {
  const stats = {
    totalLocations: 0,
    totalLots: 0,
    lotsFixed: 0,
    changes: []
  };

  if (!data.categories || !data.categories.solares || !data.categories.solares.data) {
    console.log('⚠️  No solares data found');
    return { data, stats };
  }

  const solares = data.categories.solares.data;
  stats.totalLocations = solares.length;

  solares.forEach((location, locationIndex) => {
    if (!location.solares || !Array.isArray(location.solares)) {
      return;
    }

    location.solares.forEach((lot, lotIndex) => {
      stats.totalLots++;

      // Skip if price is "CONSULTAR" or area is not a number
      if (lot.precio_usd_m2 === 'CONSULTAR' || typeof lot.area_m2 !== 'number') {
        return;
      }

      const currentPrice = lot.precio_usd_m2;

      // Detect if this is likely a total price
      if (currentPrice > threshold) {
        const realPricePerM2 = Math.round((currentPrice / lot.area_m2) * 100) / 100;

        const change = {
          location: location.ubicacion,
          locationIndex,
          lotIndex,
          area: lot.area_m2,
          oldPrice: currentPrice,
          newPrice: realPricePerM2,
          oldTotal: currentPrice,
          newTotal: Math.round(realPricePerM2 * lot.area_m2)
        };

        stats.changes.push(change);
        stats.lotsFixed++;

        // Update the price
        lot.precio_usd_m2 = realPricePerM2;
      }
    });
  });

  return { data, stats };
}

/**
 * Standardize legal status values
 * @param {object} data - Properties data
 * @returns {object} Updated data with standardized legal status
 */
function standardizeLegalStatus(data) {
  const stats = {
    totalLots: 0,
    lotsUpdated: 0,
    changes: []
  };

  if (!data.categories || !data.categories.solares || !data.categories.solares.data) {
    return { data, stats };
  }

  // Standard legal status values (with proper accents)
  const statusMap = {
    'CON TITULO': 'CON TÍTULO',
    'con titulo': 'CON TÍTULO',
    'Con Titulo': 'CON TÍTULO',
    'con título': 'CON TÍTULO',
    'Con Título': 'CON TÍTULO',
    'DESLINDADO': 'DESLINDADO',
    'deslindado': 'DESLINDADO',
    'SIN DESLINDAR': 'SIN DESLINDAR',
    'sin deslindar': 'SIN DESLINDAR',
    'Sin Deslindar': 'SIN DESLINDAR',
    'EN PROCESO': 'EN PROCESO',
    'en proceso': 'EN PROCESO',
    'En Proceso': 'EN PROCESO',
    'EN PROGRESO': 'EN PROCESO',
    'PENDIENTE': 'EN PROCESO',
    'Pendiente': 'EN PROCESO'
  };

  const solares = data.categories.solares.data;

  solares.forEach((location, locationIndex) => {
    if (!location.solares || !Array.isArray(location.solares)) {
      return;
    }

    location.solares.forEach((lot, lotIndex) => {
      stats.totalLots++;

      if (lot.estatus_legal && statusMap[lot.estatus_legal]) {
        const oldStatus = lot.estatus_legal;
        const newStatus = statusMap[lot.estatus_legal];

        if (oldStatus !== newStatus) {
          const change = {
            location: location.ubicacion,
            locationIndex,
            lotIndex,
            oldStatus,
            newStatus
          };

          stats.changes.push(change);
          stats.lotsUpdated++;

          lot.estatus_legal = newStatus;
        }
      }
    });
  });

  return { data, stats };
}

/**
 * Print report
 */
function printReport(pricingStats, legalStats, dryRun) {
  console.log('\n' + '='.repeat(70));
  console.log('💰 Solares Data Standardization Report');
  console.log('='.repeat(70));

  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No changes will be saved\n');
  }

  // Pricing fixes
  console.log(`\n📊 Pricing Statistics:`);
  console.log(`   Total locations: ${pricingStats.totalLocations}`);
  console.log(`   Total lots: ${pricingStats.totalLots}`);
  console.log(`   Lots with pricing fixed: ${pricingStats.lotsFixed}`);

  if (pricingStats.changes.length > 0) {
    console.log(`\n💵 Price Corrections (showing first 15):`);

    pricingStats.changes.slice(0, 15).forEach((change, i) => {
      console.log(`\n   ${i + 1}. ${change.location} [Lot #${change.lotIndex}]`);
      console.log(`      Area: ${change.area.toLocaleString()} m²`);
      console.log(`      ❌ OLD - Price per m²: $${change.oldPrice.toLocaleString()} (Total: $${change.oldTotal.toLocaleString()})`);
      console.log(`      ✅ NEW - Price per m²: $${change.newPrice.toLocaleString()} (Total: $${change.newTotal.toLocaleString()})`);
      console.log(`      📉 Correction: $${change.oldPrice.toLocaleString()} → $${change.newPrice.toLocaleString()} per m²`);
    });

    if (pricingStats.changes.length > 15) {
      console.log(`\n   ... and ${pricingStats.changes.length - 15} more price corrections`);
    }
  }

  // Legal status standardization
  console.log(`\n\n📋 Legal Status Standardization:`);
  console.log(`   Total lots checked: ${legalStats.totalLots}`);
  console.log(`   Lots with status standardized: ${legalStats.lotsUpdated}`);

  if (legalStats.changes.length > 0) {
    console.log(`\n📝 Status Changes (showing first 10):`);

    legalStats.changes.slice(0, 10).forEach((change, i) => {
      console.log(`   ${i + 1}. ${change.location} [Lot #${change.lotIndex}]`);
      console.log(`      "${change.oldStatus}" → "${change.newStatus}"`);
    });

    if (legalStats.changes.length > 10) {
      console.log(`\n   ... and ${legalStats.changes.length - 10} more status changes`);
    }
  }

  console.log('\n' + '='.repeat(70));

  // Summary
  const totalChanges = pricingStats.lotsFixed + legalStats.lotsUpdated;
  if (totalChanges > 0) {
    console.log(`\n✨ Summary: ${totalChanges} total corrections`);
    console.log(`   - ${pricingStats.lotsFixed} pricing corrections`);
    console.log(`   - ${legalStats.lotsUpdated} legal status standardizations`);
  } else {
    console.log(`\n✅ All data is already correct!`);
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Starting Solares Data Standardization...\n');

  const inputPath = path.resolve(options.input);

  console.log(`📂 Input file: ${inputPath}`);
  console.log(`🎯 Price threshold: $${options.threshold.toLocaleString()} (prices above this are considered total prices)`);

  if (options.dryRun) {
    console.log(`⚠️  DRY RUN MODE - No files will be modified`);
  }

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`\n❌ Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // Load data
  console.log('\n📖 Loading properties data...');
  let data;
  try {
    const fileContent = fs.readFileSync(inputPath, 'utf8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error(`\n❌ Error loading file: ${error.message}`);
    process.exit(1);
  }

  // Fix pricing
  console.log('💰 Fixing solares pricing...');
  const { data: dataAfterPricing, stats: pricingStats } = fixSolaresPricing(data, options.threshold);

  // Standardize legal status
  console.log('📋 Standardizing legal status...');
  const { data: finalData, stats: legalStats } = standardizeLegalStatus(dataAfterPricing);

  // Print report
  printReport(pricingStats, legalStats, options.dryRun);

  if (!options.dryRun) {
    // Create backup if requested
    if (options.backup) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupPath = inputPath.replace('.json', `.backup-${timestamp}.json`);
      console.log(`💾 Creating backup: ${backupPath}`);
      fs.copyFileSync(inputPath, backupPath);
    }

    // Save updated data
    console.log(`\n💾 Saving corrected data to: ${inputPath}`);
    fs.writeFileSync(inputPath, JSON.stringify(finalData, null, 2), 'utf8');
    console.log('✅ Done!\n');
  } else {
    console.log('ℹ️  To apply these changes, run without --dry-run flag\n');
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { fixSolaresPricing, standardizeLegalStatus };

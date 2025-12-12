#!/usr/bin/env node

/**
 * Address Standardization Script for Dominican Republic Properties
 *
 * This script standardizes address data for properties in the Dominican Republic
 * by creating a structured address object from the existing location field.
 *
 * Usage:
 *   node scripts/standardize-addresses.js [options]
 *
 * Options:
 *   --dry-run    Show what would be changed without making changes
 *   --backup     Create a backup before making changes (default: true)
 *   --input      Input file path (default: data/properties.json)
 *   --output     Output file path (default: same as input)
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  backup: !args.includes('--no-backup'),
  input: args.find(arg => arg.startsWith('--input='))?.split('=')[1] || 'data/properties.json',
  output: args.find(arg => arg.startsWith('--output='))?.split('=')[1] || null
};

options.output = options.output || options.input;

// Common Dominican Republic cities and provinces
const DR_CITIES = [
  'Santo Domingo',
  'Santiago',
  'La Romana',
  'Puerto Plata',
  'San Pedro de Macorís',
  'La Vega',
  'San Cristóbal',
  'San Francisco de Macorís',
  'Higüey',
  'Concepción de La Vega',
  'San Juan de la Maguana',
  'Bonao',
  'Baní',
  'Moca',
  'Azua',
  'Mao',
  'Punta Cana',
  'Bávaro',
  'Cap Cana',
  'Casa de Campo',
  'Juan Dolio',
  'Samaná',
  'Las Terrenas',
  'Cabarete',
  'Sosúa',
  'Jarabacoa',
  'Constanza'
];

// Common sectors in Santo Domingo
const SANTO_DOMINGO_SECTORS = [
  'Piantini',
  'Naco',
  'Bella Vista',
  'Los Cacicazgos',
  'La Esperilla',
  'Gazcue',
  'La Julia',
  'Evaristo Morales',
  'Serrallés',
  'Paraíso',
  'Ensanche Julieta',
  'Ensanche Quisqueya',
  'Ensanche Luperón',
  'Ensanche Ozama',
  'El Vergel',
  'Los Restauradores',
  'Zona Universitaria',
  'Ensanche Isabelita',
  'Mirador Sur',
  'Mirador Norte',
  'Arroyo Hondo',
  'Los Praditos',
  'Los Prados',
  'Altos de Arroyo Hondo',
  'Villa Marina'
];

/**
 * Parse a location string into structured address components
 * @param {string} location - Location string like "Piantini, Santo Domingo"
 * @returns {object} Structured address object
 */
function parseLocation(location) {
  if (!location || typeof location !== 'string') {
    return null;
  }

  const address = {
    city: null,
    sector: null,
    street: null,
    subdivision: null,
    province: null,
    formatted: location.trim()
  };

  // Split by comma and clean up parts
  const parts = location.split(',').map(s => s.trim()).filter(s => s);

  if (parts.length === 0) {
    return address;
  }

  // Check if any part is a known city
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    const cityMatch = DR_CITIES.find(city =>
      part.toLowerCase().includes(city.toLowerCase())
    );

    if (cityMatch) {
      address.city = cityMatch;
      parts.splice(i, 1);
      break;
    }
  }

  // If no city found but we have parts, assume last part is the city
  if (!address.city && parts.length > 0) {
    address.city = parts[parts.length - 1];
    parts.pop();
  }

  // Check remaining parts for sectors (if city is Santo Domingo)
  if (address.city === 'Santo Domingo' && parts.length > 0) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      const sectorMatch = SANTO_DOMINGO_SECTORS.find(sector =>
        part.toLowerCase().includes(sector.toLowerCase())
      );

      if (sectorMatch) {
        address.sector = sectorMatch;
        parts.splice(i, 1);
        break;
      }
    }

    // If no sector matched but we have parts, use first part as sector
    if (!address.sector && parts.length > 0) {
      address.sector = parts[0];
      parts.shift();
    }
  } else if (parts.length > 0) {
    // For non-Santo Domingo cities, use first remaining part as sector
    address.sector = parts[0];
    parts.shift();
  }

  // Any remaining parts are likely street or subdivision
  if (parts.length > 0) {
    // Check if it looks like a street (starts with Av., Calle, etc.)
    const firstPart = parts[0];
    if (/^(Av\.|Ave\.|Avenida|Calle|C\/)/i.test(firstPart)) {
      address.street = parts.join(', ');
    } else {
      address.subdivision = parts.join(', ');
    }
  }

  // Set province same as city for major cities, otherwise leave null
  if (['Santo Domingo', 'Santiago', 'La Romana', 'Puerto Plata'].includes(address.city)) {
    address.province = address.city;
  }

  return address;
}

/**
 * Standardize addresses in properties
 * @param {object} data - Properties data
 * @returns {object} Updated data with standardized addresses
 */
function standardizeAddresses(data) {
  const stats = {
    totalProperties: 0,
    propertiesUpdated: 0,
    totalSolares: 0,
    solaresUpdated: 0,
    changes: []
  };

  // Process propiedades category
  if (data.categories && data.categories.propiedades && data.categories.propiedades.properties) {
    stats.totalProperties = data.categories.propiedades.properties.length;

    data.categories.propiedades.properties.forEach((property, index) => {
      if (property.location) {
        const parsedAddress = parseLocation(property.location);

        if (parsedAddress) {
          const change = {
            type: 'propiedad',
            index,
            id: property.id,
            title: property.title,
            old: property.location,
            new: parsedAddress
          };

          stats.changes.push(change);
          stats.propertiesUpdated++;

          // Add address field (keep location for backwards compatibility)
          property.address = parsedAddress;
        }
      }
    });
  }

  // Process oficinas category
  if (data.categories && data.categories.oficinas && data.categories.oficinas.properties) {
    const oficinas = data.categories.oficinas.properties;

    oficinas.forEach((property, index) => {
      if (property.location) {
        const parsedAddress = parseLocation(property.location);

        if (parsedAddress) {
          const change = {
            type: 'oficina',
            index,
            id: property.id,
            title: property.title,
            old: property.location,
            new: parsedAddress
          };

          stats.changes.push(change);
          stats.propertiesUpdated++;

          property.address = parsedAddress;
        }
      }
    });
  }

  // Process solares category
  if (data.categories && data.categories.solares && data.categories.solares.data) {
    const solares = data.categories.solares.data;
    stats.totalSolares = solares.length;

    solares.forEach((location, index) => {
      if (location.ubicacion) {
        const parsedAddress = parseLocation(location.ubicacion);

        if (parsedAddress) {
          const change = {
            type: 'solar',
            index,
            old: location.ubicacion,
            new: parsedAddress,
            solarCount: location.solares.length
          };

          stats.changes.push(change);
          stats.solaresUpdated++;

          // Add address field (keep ubicacion for backwards compatibility)
          location.address = parsedAddress;
        }
      }
    });
  }

  // Process featured properties
  if (data.featured && Array.isArray(data.featured)) {
    data.featured.forEach((property, index) => {
      if (property.location && !property.address) {
        const parsedAddress = parseLocation(property.location);
        if (parsedAddress) {
          property.address = parsedAddress;
        }
      }
    });
  }

  return { data, stats };
}

/**
 * Print statistics and changes
 */
function printReport(stats, dryRun) {
  console.log('\n' + '='.repeat(60));
  console.log('📍 Address Standardization Report');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No changes will be saved\n');
  }

  console.log(`\n📊 Statistics:`);
  console.log(`   Properties processed: ${stats.totalProperties}`);
  console.log(`   Properties updated: ${stats.propertiesUpdated}`);
  console.log(`   Solares locations processed: ${stats.totalSolares}`);
  console.log(`   Solares locations updated: ${stats.solaresUpdated}`);
  console.log(`   Total changes: ${stats.changes.length}`);

  if (stats.changes.length > 0) {
    console.log(`\n📝 Sample Changes (showing first 10):`);

    stats.changes.slice(0, 10).forEach((change, i) => {
      console.log(`\n   ${i + 1}. ${change.type.toUpperCase()} ${change.title || change.id || `#${change.index}`}`);
      console.log(`      Original: "${change.old}"`);
      console.log(`      Parsed:`);
      console.log(`         City: ${change.new.city || '-'}`);
      console.log(`         Sector: ${change.new.sector || '-'}`);
      console.log(`         Street: ${change.new.street || '-'}`);
      console.log(`         Subdivision: ${change.new.subdivision || '-'}`);
      if (change.solarCount) {
        console.log(`         Contains: ${change.solarCount} lots`);
      }
    });

    if (stats.changes.length > 10) {
      console.log(`\n   ... and ${stats.changes.length - 10} more changes`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Starting Address Standardization...\n');

  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);

  console.log(`📂 Input file: ${inputPath}`);
  if (options.dryRun) {
    console.log(`⚠️  DRY RUN MODE - No files will be modified`);
  } else {
    console.log(`💾 Output file: ${outputPath}`);
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

  // Standardize addresses
  console.log('🔄 Standardizing addresses...');
  const { data: updatedData, stats } = standardizeAddresses(data);

  // Print report
  printReport(stats, options.dryRun);

  if (!options.dryRun) {
    // Create backup if requested
    if (options.backup) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupPath = inputPath.replace('.json', `.backup-${timestamp}.json`);
      console.log(`💾 Creating backup: ${backupPath}`);
      fs.copyFileSync(inputPath, backupPath);
    }

    // Save updated data
    console.log(`\n💾 Saving standardized data to: ${outputPath}`);
    fs.writeFileSync(outputPath, JSON.stringify(updatedData, null, 2), 'utf8');
    console.log('✅ Done!\n');
  } else {
    console.log('ℹ️  To apply these changes, run without --dry-run flag\n');
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { parseLocation, standardizeAddresses };

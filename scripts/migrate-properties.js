#!/usr/bin/env node

/**
 * Properties Data Migration Script
 *
 * This script migrates the large properties.json file into optimized,
 * smaller files organized by category.
 *
 * Usage:
 *   node scripts/migrate-properties.js [options]
 *
 * Options:
 *   --dry-run       Show what would be done without making changes
 *   --validate      Validate the data structure before migration
 *   --backup        Create backup of original file (default: true)
 *   --split         Split into category files (default: true)
 *   --optimize      Apply optimizations (URL normalization, etc.)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceFile: path.join(__dirname, '../data/properties.json'),
  backupFile: path.join(__dirname, '../data/properties.backup.json'),
  outputDir: path.join(__dirname, '../data'),
  categoriesDir: path.join(__dirname, '../data/categories'),
  cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com',
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  validate: args.includes('--validate'),
  backup: !args.includes('--no-backup'),
  split: !args.includes('--no-split'),
  optimize: args.includes('--optimize'),
};

console.log('🚀 Properties Migration Script');
console.log('================================');
console.log('Options:', options);
console.log('');

// Main execution
async function main() {
  try {
    // Step 1: Load and validate source data
    console.log('📂 Loading source data...');
    const sourceData = loadSourceData();

    if (options.validate) {
      console.log('✅ Validating data structure...');
      validateData(sourceData);
    }

    // Step 2: Create backup
    if (options.backup && !options.dryRun) {
      console.log('💾 Creating backup...');
      createBackup(sourceData);
    }

    // Step 3: Analyze current structure
    console.log('📊 Analyzing data...');
    const analysis = analyzeData(sourceData);
    printAnalysis(analysis);

    // Step 4: Optimize data if requested
    let optimizedData = sourceData;
    if (options.optimize) {
      console.log('⚡ Optimizing data...');
      optimizedData = optimizeData(sourceData);
      const newAnalysis = analyzeData(optimizedData);
      console.log(`   Reduced from ${analysis.totalSize} to ${newAnalysis.totalSize}`);
      console.log(`   Savings: ${((1 - newAnalysis.totalSize / analysis.totalSize) * 100).toFixed(1)}%`);
    }

    // Step 5: Split into category files
    if (options.split) {
      console.log('📁 Splitting into category files...');
      if (!options.dryRun) {
        splitIntoCategories(optimizedData);
      } else {
        console.log('   [DRY RUN] Would create:');
        console.log('   - data/properties-index.json');
        console.log('   - data/categories/propiedades.json');
        console.log('   - data/categories/oficinas.json');
        console.log('   - data/categories/solares.json');
      }
    }

    // Step 6: Generate validation report
    console.log('📋 Generating report...');
    generateReport(sourceData, optimizedData, analysis);

    console.log('');
    console.log('✨ Migration completed successfully!');

    if (options.dryRun) {
      console.log('');
      console.log('ℹ️  This was a dry run. No files were modified.');
      console.log('   Run without --dry-run to apply changes.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Load source data from JSON file
function loadSourceData() {
  try {
    const data = fs.readFileSync(CONFIG.sourceFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load source file: ${error.message}`);
  }
}

// Validate data structure
function validateData(data) {
  const errors = [];

  // Check top-level structure
  if (!data.categories) {
    errors.push('Missing "categories" object');
  }
  if (!data.featured) {
    errors.push('Missing "featured" array');
  }

  // Check categories
  if (data.categories) {
    ['propiedades', 'oficinas', 'solares'].forEach(category => {
      if (!data.categories[category]) {
        errors.push(`Missing category: ${category}`);
      }
    });

    // Validate propiedades
    if (data.categories.propiedades) {
      validatePropertyCategory(data.categories.propiedades, 'propiedades', errors);
    }

    // Validate oficinas
    if (data.categories.oficinas) {
      validatePropertyCategory(data.categories.oficinas, 'oficinas', errors);
    }

    // Validate solares
    if (data.categories.solares) {
      validateSolarCategory(data.categories.solares, errors);
    }
  }

  if (errors.length > 0) {
    console.error('   ❌ Validation errors found:');
    errors.forEach(error => console.error(`      - ${error}`));
    throw new Error('Data validation failed');
  }

  console.log('   ✅ Data structure is valid');
}

// Validate property category
function validatePropertyCategory(category, name, errors) {
  if (!category.name) {
    errors.push(`${name}: missing "name" field`);
  }
  if (!category.description) {
    errors.push(`${name}: missing "description" field`);
  }
  if (!Array.isArray(category.properties)) {
    errors.push(`${name}: "properties" must be an array`);
  } else {
    category.properties.forEach((prop, index) => {
      validateProperty(prop, `${name}[${index}]`, errors);
    });
  }
}

// Validate individual property
function validateProperty(property, path, errors) {
  const required = ['id', 'title', 'price', 'currency', 'location', 'type', 'area', 'image', 'description', 'features', 'status', 'badge'];

  required.forEach(field => {
    if (property[field] === undefined) {
      errors.push(`${path}: missing required field "${field}"`);
    }
  });

  // Validate field types
  if (property.price !== undefined && typeof property.price !== 'number') {
    errors.push(`${path}: "price" must be a number`);
  }
  if (property.currency !== undefined && !['USD', 'DOP'].includes(property.currency)) {
    errors.push(`${path}: "currency" must be USD or DOP`);
  }
  if (property.features !== undefined && !Array.isArray(property.features)) {
    errors.push(`${path}: "features" must be an array`);
  }
}

// Validate solar category
function validateSolarCategory(category, errors) {
  if (!category.name) {
    errors.push('solares: missing "name" field');
  }
  if (!category.description) {
    errors.push('solares: missing "description" field');
  }
  if (category.isListFormat !== true) {
    errors.push('solares: "isListFormat" must be true');
  }
  if (!Array.isArray(category.data)) {
    errors.push('solares: "data" must be an array');
  } else {
    category.data.forEach((location, index) => {
      if (!location.ubicacion) {
        errors.push(`solares.data[${index}]: missing "ubicacion"`);
      }
      if (!Array.isArray(location.solares)) {
        errors.push(`solares.data[${index}]: "solares" must be an array`);
      }
    });
  }
}

// Analyze data structure and size
function analyzeData(data) {
  const json = JSON.stringify(data);
  const totalSize = Buffer.byteLength(json, 'utf8');

  const propiedadesCount = data.categories?.propiedades?.properties?.length || 0;
  const oficinasCount = data.categories?.oficinas?.properties?.length || 0;
  const solaresCount = data.categories?.solares?.data?.length || 0;
  const featuredCount = data.featured?.length || 0;

  // Count total solares (individual lots)
  let totalSolaresLots = 0;
  if (data.categories?.solares?.data) {
    data.categories.solares.data.forEach(location => {
      totalSolaresLots += location.solares?.length || 0;
    });
  }

  // Count properties with galleries
  let propertiesWithGalleries = 0;
  let totalGalleryImages = 0;

  if (data.categories?.propiedades?.properties) {
    data.categories.propiedades.properties.forEach(prop => {
      if (prop.gallery && prop.gallery.length > 0) {
        propertiesWithGalleries++;
        totalGalleryImages += prop.gallery.length;
      }
    });
  }

  return {
    totalSize,
    propiedadesCount,
    oficinasCount,
    solaresCount,
    totalSolaresLots,
    featuredCount,
    propertiesWithGalleries,
    totalGalleryImages,
  };
}

// Print analysis results
function printAnalysis(analysis) {
  console.log('');
  console.log('   Analysis Results:');
  console.log('   ─────────────────');
  console.log(`   Total size: ${formatBytes(analysis.totalSize)}`);
  console.log(`   Properties: ${analysis.propiedadesCount}`);
  console.log(`   Offices: ${analysis.oficinasCount}`);
  console.log(`   Solar locations: ${analysis.solaresCount} (${analysis.totalSolaresLots} lots)`);
  console.log(`   Featured: ${analysis.featuredCount}`);
  console.log(`   Properties with galleries: ${analysis.propertiesWithGalleries}`);
  console.log(`   Total gallery images: ${analysis.totalGalleryImages}`);
  console.log('');
}

// Optimize data structure
function optimizeData(data) {
  const optimized = JSON.parse(JSON.stringify(data)); // Deep clone

  // Optimization 1: Normalize image URLs
  if (optimized.categories?.propiedades?.properties) {
    optimized.categories.propiedades.properties =
      optimized.categories.propiedades.properties.map(normalizePropertyUrls);
  }

  if (optimized.categories?.oficinas?.properties) {
    optimized.categories.oficinas.properties =
      optimized.categories.oficinas.properties.map(normalizePropertyUrls);
  }

  // Optimization 2: Convert featured to references (if split mode)
  if (options.split && optimized.featured) {
    optimized.featured = optimized.featured.map(prop => ({
      id: prop.id,
      category: findPropertyCategory(data, prop.id),
    }));
  }

  return optimized;
}

// Normalize property URLs to use relative paths
function normalizePropertyUrls(property) {
  const cdnBase = CONFIG.cdnBase;

  // Extract base path from image URL
  if (property.image && property.image.startsWith(cdnBase)) {
    const relativePath = property.image.replace(cdnBase + '/', '');
    const pathParts = relativePath.split('/');

    if (pathParts.length >= 3) {
      const folder = pathParts.slice(0, -1).join('/');
      const filename = pathParts[pathParts.length - 1];

      property.imageBase = folder;
      property.image = filename;

      // Normalize gallery URLs
      if (property.gallery && Array.isArray(property.gallery)) {
        property.gallery = property.gallery.map(url => {
          if (url.startsWith(cdnBase + '/' + folder)) {
            return url.replace(cdnBase + '/' + folder + '/', '');
          }
          return url;
        });
      }
    }
  }

  return property;
}

// Find which category a property belongs to
function findPropertyCategory(data, propertyId) {
  if (data.categories.propiedades.properties.some(p => p.id === propertyId)) {
    return 'propiedades';
  }
  if (data.categories.oficinas.properties.some(p => p.id === propertyId)) {
    return 'oficinas';
  }
  return null;
}

// Create backup of original file
function createBackup(data) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = CONFIG.backupFile.replace('.json', `-${timestamp}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`   ✅ Backup created: ${path.basename(backupFile)}`);
  } catch (error) {
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

// Split data into separate category files
function splitIntoCategories(data) {
  // Create categories directory
  if (!fs.existsSync(CONFIG.categoriesDir)) {
    fs.mkdirSync(CONFIG.categoriesDir, { recursive: true });
  }

  // Create index file with metadata
  const index = {
    version: '2.0',
    lastUpdated: new Date().toISOString(),
    cdnBase: CONFIG.cdnBase,
    categories: {
      propiedades: {
        name: data.categories.propiedades.name,
        description: data.categories.propiedades.description,
        count: data.categories.propiedades.properties.length,
        dataUrl: 'categories/propiedades.json',
      },
      oficinas: {
        name: data.categories.oficinas.name,
        description: data.categories.oficinas.description,
        count: data.categories.oficinas.properties.length,
        dataUrl: 'categories/oficinas.json',
      },
      solares: {
        name: data.categories.solares.name,
        description: data.categories.solares.description,
        count: data.categories.solares.data.length,
        dataUrl: 'categories/solares.json',
      },
    },
    featured: data.featured,
  };

  // Write index file
  const indexPath = path.join(CONFIG.outputDir, 'properties-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  console.log(`   ✅ Created: properties-index.json (${formatBytes(fs.statSync(indexPath).size)})`);

  // Write category files
  ['propiedades', 'oficinas'].forEach(category => {
    const categoryData = {
      name: data.categories[category].name,
      description: data.categories[category].description,
      properties: data.categories[category].properties,
    };

    const categoryPath = path.join(CONFIG.categoriesDir, `${category}.json`);
    fs.writeFileSync(categoryPath, JSON.stringify(categoryData, null, 2), 'utf8');
    console.log(`   ✅ Created: categories/${category}.json (${formatBytes(fs.statSync(categoryPath).size)})`);
  });

  // Write solares file
  const solaresData = {
    name: data.categories.solares.name,
    description: data.categories.solares.description,
    isListFormat: true,
    data: data.categories.solares.data,
  };

  const solaresPath = path.join(CONFIG.categoriesDir, 'solares.json');
  fs.writeFileSync(solaresPath, JSON.stringify(solaresData, null, 2), 'utf8');
  console.log(`   ✅ Created: categories/solares.json (${formatBytes(fs.statSync(solaresPath).size)})`);
}

// Generate migration report
function generateReport(originalData, optimizedData, analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    original: analysis,
    changes: {
      filesCreated: options.split ? [
        'properties-index.json',
        'categories/propiedades.json',
        'categories/oficinas.json',
        'categories/solares.json',
      ] : [],
      optimizationsApplied: options.optimize ? [
        'URL normalization',
        'Featured references',
      ] : [],
    },
  };

  const reportPath = path.join(CONFIG.outputDir, 'migration-report.json');

  if (!options.dryRun) {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`   ✅ Report saved: migration-report.json`);
  }
}

// Utility: Format bytes to human-readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Run the script
main();

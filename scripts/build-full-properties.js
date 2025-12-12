#!/usr/bin/env node

/**
 * Build Full Properties File
 *
 * Combines split category files back into a single properties.json file
 * for backward compatibility.
 *
 * Usage:
 *   node scripts/build-full-properties.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  indexFile: path.join(__dirname, '../data/properties-index.json'),
  categoriesDir: path.join(__dirname, '../data/categories'),
  outputFile: path.join(__dirname, '../data/properties.json'),
};

console.log('🔨 Building full properties.json from split files');
console.log('=================================================');
console.log('');

async function main() {
  try {
    // Check if split files exist
    if (!fs.existsSync(CONFIG.indexFile)) {
      throw new Error('Index file not found. Run migrate-properties.js first.');
    }

    // Load index
    console.log('📂 Loading index file...');
    const index = JSON.parse(fs.readFileSync(CONFIG.indexFile, 'utf8'));

    // Load categories
    console.log('📂 Loading category files...');
    const categories = {};

    for (const [categoryName, categoryInfo] of Object.entries(index.categories)) {
      const categoryFile = path.join(__dirname, '../data', categoryInfo.dataUrl);

      if (!fs.existsSync(categoryFile)) {
        throw new Error(`Category file not found: ${categoryFile}`);
      }

      console.log(`   Loading ${categoryName}...`);
      categories[categoryName] = JSON.parse(fs.readFileSync(categoryFile, 'utf8'));
    }

    // Build full data structure
    console.log('🔨 Building full data structure...');
    const fullData = {
      categories,
      featured: index.featured,
    };

    // Expand featured references if needed
    fullData.featured = fullData.featured.map(featured => {
      if (featured.category && featured.id) {
        // It's a reference, expand it
        const category = categories[featured.category];
        if (category && category.properties) {
          const property = category.properties.find(p => p.id === featured.id);
          if (property) {
            return property;
          }
        }
        console.warn(`   ⚠️  Featured reference not found: ${featured.id} in ${featured.category}`);
        return featured;
      }
      // Already a full property
      return featured;
    });

    // Restore full URLs if they were normalized
    console.log('🔗 Restoring full URLs...');
    const cdnBase = index.cdnBase || 'https://lowest.nyc3.cdn.digitaloceanspaces.com';

    ['propiedades', 'oficinas'].forEach(categoryName => {
      if (categories[categoryName] && categories[categoryName].properties) {
        categories[categoryName].properties = categories[categoryName].properties.map(prop =>
          expandPropertyUrls(prop, cdnBase)
        );
      }
    });

    // Expand URLs in featured too
    fullData.featured = fullData.featured.map(prop => expandPropertyUrls(prop, cdnBase));

    // Write output file
    console.log('💾 Writing output file...');
    fs.writeFileSync(
      CONFIG.outputFile,
      JSON.stringify(fullData, null, 2),
      'utf8'
    );

    const stats = fs.statSync(CONFIG.outputFile);
    console.log(`   ✅ Created: ${path.basename(CONFIG.outputFile)} (${formatBytes(stats.size)})`);

    // Generate stats
    const propCount = categories.propiedades?.properties?.length || 0;
    const ofcCount = categories.oficinas?.properties?.length || 0;
    const solCount = categories.solares?.data?.length || 0;

    console.log('');
    console.log('📊 Summary:');
    console.log(`   Propiedades: ${propCount}`);
    console.log(`   Oficinas: ${ofcCount}`);
    console.log(`   Solares: ${solCount} locations`);
    console.log(`   Featured: ${fullData.featured.length}`);
    console.log(`   Total size: ${formatBytes(stats.size)}`);

    console.log('');
    console.log('✨ Build completed successfully!');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Expand normalized URLs back to full URLs
function expandPropertyUrls(property, cdnBase) {
  const prop = { ...property };

  // Check if URLs are normalized (have imageBase)
  if (prop.imageBase) {
    // Restore full URL for image
    if (prop.image && !prop.image.startsWith('http')) {
      prop.image = `${cdnBase}/${prop.imageBase}/${prop.image}`;
    }

    // Restore full URLs for gallery
    if (prop.gallery && Array.isArray(prop.gallery)) {
      prop.gallery = prop.gallery.map(url => {
        if (!url.startsWith('http')) {
          return `${cdnBase}/${prop.imageBase}/${url}`;
        }
        return url;
      });
    }

    // Remove imageBase as it's no longer needed
    delete prop.imageBase;
  }

  return prop;
}

// Format bytes to human-readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

main();

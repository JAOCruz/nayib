#!/usr/bin/env node

/**
 * Properties Data Validation Script
 *
 * Validates properties.json against the JSON schema and checks for
 * common data issues.
 *
 * Usage:
 *   node scripts/validate-properties.js [file]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const defaultFile = path.join(__dirname, '../data/properties.json');
const schemaFile = path.join(__dirname, '../schemas/properties-schema.json');

// Get file to validate from command line or use default
const fileToValidate = process.argv[2] || defaultFile;

console.log('🔍 Properties Validation');
console.log('========================');
console.log(`File: ${path.basename(fileToValidate)}`);
console.log('');

// Validation results
const results = {
  errors: [],
  warnings: [],
  info: [],
  similarNames: [],
  toStandardize: [],
  toConfirmWithOwners: [],
  bestPractices: [],
};

async function main() {
  try {
    // Load data
    console.log('📂 Loading data...');
    const data = loadJSON(fileToValidate);

    // Load schema if available
    let schema = null;
    if (fs.existsSync(schemaFile)) {
      console.log('📋 Loading schema...');
      schema = loadJSON(schemaFile);
    }

    // Run validations
    console.log('✅ Running validations...');
    console.log('');

    validateStructure(data);
    validateProperties(data);
    validateSolares(data);
    validateFeatured(data);
    validateUrls(data);
    checkDuplicates(data);
    checkInconsistencies(data);
    checkSimilarNames(data);
    checkStandardization(data);
    checkPricingIssues(data);
    generateBestPractices(data);

    // Print results
    printResults();

    // Exit with error code if there are errors
    if (results.errors.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load ${filePath}: ${error.message}`);
  }
}

function validateStructure(data) {
  console.log('1️⃣  Validating structure...');

  // Check top-level keys
  if (!data.categories) {
    results.errors.push('Missing "categories" object');
  }
  if (!data.featured) {
    results.errors.push('Missing "featured" array');
  }

  // Check categories exist
  if (data.categories) {
    ['propiedades', 'oficinas', 'solares'].forEach(cat => {
      if (!data.categories[cat]) {
        results.errors.push(`Missing category: ${cat}`);
      }
    });
  }

  console.log(`   ✓ Structure check complete`);
}

function validateProperties(data) {
  console.log('2️⃣  Validating properties...');

  let totalChecked = 0;
  let issuesFound = 0;

  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category || !category.properties) return;

    category.properties.forEach((prop, index) => {
      totalChecked++;

      // Check required fields
      const required = ['id', 'title', 'price', 'currency', 'location', 'type', 'area', 'image', 'description', 'features', 'status', 'badge'];
      required.forEach(field => {
        if (prop[field] === undefined || prop[field] === null) {
          results.errors.push(`${categoryName}[${index}] (${prop.id || 'unknown'}): missing "${field}"`);
          issuesFound++;
        }
      });

      // Check data types
      if (prop.price !== undefined && typeof prop.price !== 'number') {
        results.errors.push(`${categoryName}[${index}] (${prop.id}): "price" must be a number`);
        issuesFound++;
      }

      if (prop.currency && !['USD', 'DOP'].includes(prop.currency)) {
        results.errors.push(`${categoryName}[${index}] (${prop.id}): invalid currency "${prop.currency}"`);
        issuesFound++;
      }

      if (prop.features && !Array.isArray(prop.features)) {
        results.errors.push(`${categoryName}[${index}] (${prop.id}): "features" must be an array`);
        issuesFound++;
      }

      // Check for empty values
      if (prop.title && prop.title.trim() === '') {
        results.warnings.push(`${categoryName}[${index}] (${prop.id}): empty title`);
      }

      if (prop.description && prop.description.trim().length < 20) {
        results.warnings.push(`${categoryName}[${index}] (${prop.id}): description too short (${prop.description.length} chars)`);
      }

      // Check area format
      if (prop.area && !prop.area.match(/\d+(\.\d+)?\s*(-\s*\d+(\.\d+)?\s*)?m²/)) {
        results.warnings.push(`${categoryName}[${index}] (${prop.id}): area format may be incorrect "${prop.area}"`);
      }

      // Check gallery
      if (prop.gallery) {
        if (!Array.isArray(prop.gallery)) {
          results.errors.push(`${categoryName}[${index}] (${prop.id}): "gallery" must be an array`);
          issuesFound++;
        } else if (prop.gallery.length === 0) {
          results.warnings.push(`${categoryName}[${index}] (${prop.id}): empty gallery array`);
        }
      }
    });
  });

  console.log(`   ✓ Checked ${totalChecked} properties${issuesFound > 0 ? ` (${issuesFound} issues)` : ''}`);
}

function validateSolares(data) {
  console.log('3️⃣  Validating solares...');

  const solares = data.categories?.solares;
  if (!solares) {
    results.errors.push('Solares category not found');
    return;
  }

  if (!solares.isListFormat) {
    results.warnings.push('Solares category missing "isListFormat: true"');
  }

  if (!Array.isArray(solares.data)) {
    results.errors.push('Solares data must be an array');
    return;
  }

  let totalLocations = 0;
  let totalLots = 0;
  let issuesFound = 0;

  solares.data.forEach((location, locIndex) => {
    totalLocations++;

    if (!location.ubicacion) {
      results.errors.push(`Solares location[${locIndex}]: missing "ubicacion"`);
      issuesFound++;
    }

    if (!Array.isArray(location.solares)) {
      results.errors.push(`Solares location[${locIndex}] (${location.ubicacion}): "solares" must be an array`);
      issuesFound++;
      return;
    }

    location.solares.forEach((solar, solarIndex) => {
      totalLots++;

      // Check required fields
      const required = ['area_m2', 'precio_usd_m2', 'estatus_legal'];
      required.forEach(field => {
        if (solar[field] === undefined) {
          results.errors.push(`Solares ${location.ubicacion}[${solarIndex}]: missing "${field}"`);
          issuesFound++;
        }
      });

      // Validate estatus_legal
      const validStatuses = ['CON TÍTULO', 'DESLINDADO', 'SIN DESLINDAR', 'EN PROCESO'];
      if (solar.estatus_legal && !validStatuses.includes(solar.estatus_legal)) {
        results.warnings.push(`Solares ${location.ubicacion}[${solarIndex}]: unknown legal status "${solar.estatus_legal}"`);
      }

      // Check for unrealistic values
      if (typeof solar.area_m2 === 'number') {
        if (solar.area_m2 <= 0) {
          results.errors.push(`Solares ${location.ubicacion}[${solarIndex}]: invalid area ${solar.area_m2}`);
          issuesFound++;
        }
        if (solar.area_m2 > 100000000) {
          results.warnings.push(`Solares ${location.ubicacion}[${solarIndex}]: very large area ${solar.area_m2.toLocaleString()} m²`);
        }
      }

      if (typeof solar.precio_usd_m2 === 'number') {
        if (solar.precio_usd_m2 < 0) {
          results.errors.push(`Solares ${location.ubicacion}[${solarIndex}]: negative price ${solar.precio_usd_m2}`);
          issuesFound++;
        }
        if (solar.precio_usd_m2 > 50000 && solar.precio_usd_m2 < 100000) {
          results.warnings.push(`Solares ${location.ubicacion}[${solarIndex}]: unusual price per m² $${solar.precio_usd_m2.toLocaleString()} (might be total price?)`);
        }
        if (solar.precio_usd_m2 > 1000000) {
          results.info.push(`Solares ${location.ubicacion}[${solarIndex}]: very high price $${solar.precio_usd_m2.toLocaleString()} (likely total price, not per m²)`);
        }
      }
    });
  });

  console.log(`   ✓ Checked ${totalLocations} locations with ${totalLots} lots${issuesFound > 0 ? ` (${issuesFound} issues)` : ''}`);
}

function validateFeatured(data) {
  console.log('4️⃣  Validating featured properties...');

  if (!Array.isArray(data.featured)) {
    results.errors.push('Featured must be an array');
    return;
  }

  // Check if featured properties exist in categories
  data.featured.forEach((featuredProp, index) => {
    let found = false;

    // Check if it's a reference or full property
    if (featuredProp.category && featuredProp.id) {
      // It's a reference
      results.info.push(`Featured[${index}]: using reference format (optimized)`);
      found = true;
    } else {
      // It's a full property - check if it exists in categories
      ['propiedades', 'oficinas'].forEach(categoryName => {
        const category = data.categories?.[categoryName];
        if (category?.properties) {
          const exists = category.properties.some(p => p.id === featuredProp.id);
          if (exists) {
            found = true;
          }
        }
      });

      if (!found) {
        results.warnings.push(`Featured[${index}] (${featuredProp.id}): not found in any category (duplicated data)`);
      }
    }
  });

  console.log(`   ✓ Checked ${data.featured.length} featured properties`);
}

function validateUrls(data) {
  console.log('5️⃣  Validating URLs...');

  let totalUrls = 0;
  let invalidUrls = 0;

  function checkUrl(url, context) {
    totalUrls++;
    if (!url) {
      results.errors.push(`${context}: empty URL`);
      invalidUrls++;
      return;
    }

    // Check if it's a valid URL format
    if (!url.match(/^https?:\/\/.+/)) {
      // Check if it's a relative path (optimized format)
      if (!url.match(/^[a-zA-Z0-9_\-\/]+\.(png|jpg|jpeg|webp|gif)$/i)) {
        results.warnings.push(`${context}: unusual URL format "${url}"`);
      }
    }

    // Check for common issues
    if (url.includes(' ')) {
      results.errors.push(`${context}: URL contains spaces "${url}"`);
      invalidUrls++;
    }
  }

  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category?.properties) return;

    category.properties.forEach((prop, index) => {
      const context = `${categoryName}[${index}] (${prop.id})`;

      if (prop.image) {
        checkUrl(prop.image, `${context}.image`);
      }

      if (prop.gallery && Array.isArray(prop.gallery)) {
        prop.gallery.forEach((url, urlIndex) => {
          checkUrl(url, `${context}.gallery[${urlIndex}]`);
        });
      }
    });
  });

  console.log(`   ✓ Checked ${totalUrls} URLs${invalidUrls > 0 ? ` (${invalidUrls} invalid)` : ''}`);
}

function checkDuplicates(data) {
  console.log('6️⃣  Checking for duplicates...');

  const ids = new Set();
  let duplicates = 0;

  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category?.properties) return;

    category.properties.forEach(prop => {
      if (ids.has(prop.id)) {
        results.errors.push(`Duplicate ID found: ${prop.id}`);
        duplicates++;
      } else {
        ids.add(prop.id);
      }
    });
  });

  console.log(`   ✓ Checked for duplicate IDs${duplicates > 0 ? ` (${duplicates} found)` : ''}`);
}

function checkInconsistencies(data) {
  console.log('7️⃣  Checking for inconsistencies...');

  // Check currency consistency
  const currencies = {};

  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category?.properties) return;

    category.properties.forEach(prop => {
      currencies[prop.currency] = (currencies[prop.currency] || 0) + 1;
    });
  });

  if (Object.keys(currencies).length > 1) {
    results.info.push(`Multiple currencies in use: ${Object.entries(currencies).map(([curr, count]) => `${curr} (${count})`).join(', ')}`);
  }

  // Check for missing showPrice field
  let missingShowPrice = 0;
  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category?.properties) return;

    category.properties.forEach(prop => {
      if (prop.showPrice === undefined) {
        missingShowPrice++;
      }
    });
  });

  if (missingShowPrice > 0) {
    results.info.push(`${missingShowPrice} properties missing "showPrice" field (will default to true)`);
  }

  console.log(`   ✓ Inconsistency check complete`);
}

function checkSimilarNames(data) {
  console.log('8️⃣  Checking for similar property names...');

  const allProperties = [];

  // Collect all properties with their info
  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category?.properties) return;

    category.properties.forEach((prop, index) => {
      allProperties.push({
        id: prop.id,
        title: prop.title,
        location: prop.location,
        category: categoryName,
        index: index
      });
    });
  });

  // Check for similar names
  let similarCount = 0;
  for (let i = 0; i < allProperties.length; i++) {
    for (let j = i + 1; j < allProperties.length; j++) {
      const prop1 = allProperties[i];
      const prop2 = allProperties[j];

      // Calculate similarity
      const similarity = calculateSimilarity(prop1.title, prop2.title);

      // If very similar but not exact match
      if (similarity > 0.75 && prop1.title !== prop2.title) {
        results.similarNames.push({
          property1: `${prop1.category}[${prop1.index}] "${prop1.title}" (${prop1.id})`,
          property2: `${prop2.category}[${prop2.index}] "${prop2.title}" (${prop2.id})`,
          similarity: `${(similarity * 100).toFixed(0)}%`,
          possibleDuplicate: similarity > 0.9
        });
        similarCount++;
      }

      // Check for same location and similar title
      if (prop1.location === prop2.location && similarity > 0.6 && prop1.title !== prop2.title) {
        results.toConfirmWithOwners.push({
          type: 'similar_location_and_name',
          property1: `${prop1.id}: "${prop1.title}"`,
          property2: `${prop2.id}: "${prop2.title}"`,
          location: prop1.location,
          question: '¿Son la misma propiedad o dos diferentes?'
        });
      }
    }
  }

  console.log(`   ✓ Found ${similarCount} pairs of similar names`);
}

// Calculate string similarity (0 to 1)
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance algorithm
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function checkStandardization(data) {
  console.log('9️⃣  Checking for fields to standardize...');

  // Collect unique values for key fields
  const fieldValues = {
    status: new Set(),
    badge: new Set(),
    type: new Set(),
    areaFormats: new Set(),
    legalStatus: new Set()
  };

  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category?.properties) return;

    category.properties.forEach(prop => {
      if (prop.status) fieldValues.status.add(prop.status);
      if (prop.badge) fieldValues.badge.add(prop.badge);
      if (prop.type) fieldValues.type.add(prop.type);
      if (prop.area) fieldValues.areaFormats.add(prop.area);
    });
  });

  // Check solares legal status
  if (data.categories?.solares?.data) {
    data.categories.solares.data.forEach(location => {
      location.solares.forEach(solar => {
        if (solar.estatus_legal) fieldValues.legalStatus.add(solar.estatus_legal);
      });
    });
  }

  // Analyze status field
  if (fieldValues.status.size > 10) {
    results.toStandardize.push({
      field: 'status',
      uniqueValues: fieldValues.status.size,
      examples: Array.from(fieldValues.status).slice(0, 10),
      suggestion: 'Considerar estandarizar a un conjunto limitado de valores (ej: "Disponible", "En construcción", "Entregado", "Vendido")'
    });
  }

  // Analyze badge field
  if (fieldValues.badge.size > 10) {
    results.toStandardize.push({
      field: 'badge',
      uniqueValues: fieldValues.badge.size,
      examples: Array.from(fieldValues.badge).slice(0, 10),
      suggestion: 'Considerar estandarizar a badges consistentes (ej: "Destacado", "Nuevo", "Entrega Inmediata", "Oportunidad")'
    });
  }

  // Analyze type field
  if (fieldValues.type.size > 0) {
    results.toStandardize.push({
      field: 'type',
      uniqueValues: fieldValues.type.size,
      allValues: Array.from(fieldValues.type).sort(),
      suggestion: 'Revisar si todos los tipos son necesarios o se pueden consolidar'
    });
  }

  // Check for N/A areas
  const naAreas = [];
  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category?.properties) return;

    category.properties.forEach((prop, index) => {
      if (prop.area && (prop.area === 'N/A' || prop.area === 'Proyecto Aprobado')) {
        naAreas.push({
          property: `${categoryName}[${index}] "${prop.title}" (${prop.id})`,
          currentValue: prop.area
        });
      }
    });
  });

  if (naAreas.length > 0) {
    results.toConfirmWithOwners.push({
      type: 'missing_area',
      count: naAreas.length,
      properties: naAreas.slice(0, 5),
      question: '¿Cuál es el área de estas propiedades? Actualmente está como "N/A" o "Proyecto Aprobado"',
      showingFirst: naAreas.length > 5 ? 5 : naAreas.length
    });
  }

  // Check for inconsistent legal status
  const inconsistentLegal = [];
  if (data.categories?.solares?.data) {
    data.categories.solares.data.forEach(location => {
      location.solares.forEach((solar, idx) => {
        // Check for "CON TITULO" without accent
        if (solar.estatus_legal === 'CON TITULO') {
          inconsistentLegal.push({
            location: location.ubicacion,
            index: idx,
            current: 'CON TITULO',
            shouldBe: 'CON TÍTULO'
          });
        }
        // Check for other non-standard values
        const validStatuses = ['CON TÍTULO', 'DESLINDADO', 'SIN DESLINDAR', 'EN PROCESO'];
        if (!validStatuses.includes(solar.estatus_legal)) {
          inconsistentLegal.push({
            location: location.ubicacion,
            index: idx,
            current: solar.estatus_legal,
            shouldBe: '(Revisar - no está en valores estándar)'
          });
        }
      });
    });
  }

  if (inconsistentLegal.length > 0) {
    results.toStandardize.push({
      field: 'estatus_legal (solares)',
      issues: inconsistentLegal.length,
      examples: inconsistentLegal.slice(0, 5),
      suggestion: 'Usar solo: "CON TÍTULO", "DESLINDADO", "SIN DESLINDAR", "EN PROCESO"'
    });
  }

  console.log(`   ✓ Found ${results.toStandardize.length} fields to standardize`);
}

function checkPricingIssues(data) {
  console.log('🔟 Analyzing pricing and currency issues...');

  const pricingIssues = [];
  const dopProperties = [];

  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category?.properties) return;

    category.properties.forEach((prop, index) => {
      // Check for DOP currency
      if (prop.currency === 'DOP') {
        dopProperties.push({
          property: `${categoryName}[${index}] "${prop.title}" (${prop.id})`,
          price: `${prop.price.toLocaleString()} DOP`,
          location: prop.location
        });
      }

      // Check for suspiciously low prices in USD
      if (prop.currency === 'USD' && prop.price < 50000 && prop.showPrice !== false) {
        pricingIssues.push({
          property: `${categoryName}[${index}] "${prop.title}" (${prop.id})`,
          issue: 'Precio muy bajo para USD',
          price: `$${prop.price.toLocaleString()} USD`,
          question: '¿El precio es correcto o debería estar en DOP?'
        });
      }

      // Check for suspiciously high prices
      if (prop.currency === 'USD' && prop.price > 10000000) {
        pricingIssues.push({
          property: `${categoryName}[${index}] "${prop.title}" (${prop.id})`,
          issue: 'Precio muy alto',
          price: `$${prop.price.toLocaleString()} USD`,
          question: '¿El precio es correcto?'
        });
      }

      // Check for prices ending in exactly 000
      if (prop.price % 1000 === 0 && prop.price > 100000) {
        // This might be a rounded estimate - could confirm with owners
        // Not adding to results unless it's suspicious
      }
    });
  });

  // Analyze solares pricing
  const solaresPricingIssues = [];
  if (data.categories?.solares?.data) {
    data.categories.solares.data.forEach(location => {
      location.solares.forEach((solar, idx) => {
        // Check if price seems like total price instead of per m²
        if (typeof solar.precio_usd_m2 === 'number' && solar.precio_usd_m2 > 50000) {
          const possiblePricePerM2 = Math.round(solar.precio_usd_m2 / solar.area_m2);
          solaresPricingIssues.push({
            location: location.ubicacion,
            index: idx,
            currentPricePerM2: `$${solar.precio_usd_m2.toLocaleString()}`,
            area: `${typeof solar.area_m2 === 'number' ? solar.area_m2.toLocaleString() : solar.area_m2} m²`,
            possibleCorrection: typeof solar.area_m2 === 'number' ? `¿Debería ser $${possiblePricePerM2.toLocaleString()}/m²?` : 'N/A',
            question: 'Parece precio total, no precio por m²'
          });
        }
      });
    });
  }

  // Add to results
  if (dopProperties.length > 0) {
    results.toConfirmWithOwners.push({
      type: 'dop_currency',
      count: dopProperties.length,
      properties: dopProperties,
      question: 'Estas propiedades están en DOP (no USD). ¿Es correcto? La mayoría están en USD.',
      note: 'Si son excepciones válidas, está bien. Solo confirmar.'
    });
  }

  if (pricingIssues.length > 0) {
    results.toConfirmWithOwners.push({
      type: 'suspicious_prices',
      count: pricingIssues.length,
      issues: pricingIssues,
      question: 'Revisar estos precios que parecen inusuales'
    });
  }

  if (solaresPricingIssues.length > 0) {
    results.toConfirmWithOwners.push({
      type: 'solares_price_confusion',
      count: solaresPricingIssues.length,
      issues: solaresPricingIssues.slice(0, 10),
      question: 'Estos solares tienen precios muy altos por m² - probablemente sea el precio total',
      suggestion: 'Dividir el valor entre el área para obtener el precio real por m²',
      showingFirst: solaresPricingIssues.length > 10 ? 10 : solaresPricingIssues.length
    });
  }

  console.log(`   ✓ Found ${dopProperties.length} DOP properties, ${pricingIssues.length} suspicious prices, ${solaresPricingIssues.length} solares pricing issues`);
}

function generateBestPractices(data) {
  console.log('1️⃣1️⃣  Generating best practices recommendations...');

  // Analyze current structure
  const stats = {
    totalProps: 0,
    withGallery: 0,
    withPaymentPlan: 0,
    withApartmentTypes: 0,
    withShowPrice: 0
  };

  ['propiedades', 'oficinas'].forEach(categoryName => {
    const category = data.categories?.[categoryName];
    if (!category?.properties) return;

    category.properties.forEach(prop => {
      stats.totalProps++;
      if (prop.gallery && prop.gallery.length > 0) stats.withGallery++;
      if (prop.payment_plan) stats.withPaymentPlan++;
      if (prop.apartment_types) stats.withApartmentTypes++;
      if (prop.showPrice !== undefined) stats.withShowPrice++;
    });
  });

  // Generate recommendations
  results.bestPractices.push({
    category: 'Campos Requeridos',
    practices: [
      '✅ Siempre incluir: id, title, price, currency, location, type, area, image, description, features, status, badge',
      '✅ Si no quieres mostrar el precio, usa: "showPrice": false',
      '✅ Usa "N/A" solo temporalmente, obtén el dato real lo antes posible'
    ]
  });

  results.bestPractices.push({
    category: 'Imágenes',
    practices: [
      `✅ ${stats.withGallery} de ${stats.totalProps} propiedades tienen galería (${((stats.withGallery/stats.totalProps)*100).toFixed(0)}%)`,
      '✅ Recomendado: Mínimo 5-10 imágenes por propiedad',
      '✅ Orden sugerido: Fachada, sala, cocina, habitaciones, baños, extras',
      '✅ Formato recomendado: JPG/PNG, máximo 2MB por imagen'
    ]
  });

  results.bestPractices.push({
    category: 'Precios',
    practices: [
      '✅ Por defecto usar USD (es el estándar del mercado)',
      '✅ Solo usar DOP para propiedades que explícitamente lo requieran',
      '✅ Para solares: Guardar precio por m² (no precio total)',
      '✅ Si el precio está por confirmar, usar "showPrice": false',
      '⚠️  Evitar redondear demasiado (ej: 500,000 vs 487,500)'
    ]
  });

  results.bestPractices.push({
    category: 'Campos de Texto',
    practices: [
      '✅ Status: Usar valores estándar ("Disponible", "En construcción", "Entregado")',
      '✅ Badge: Usar categorías claras ("Destacado", "Nuevo", "Oportunidad")',
      '✅ Area: Siempre incluir "m²" (ej: "120 m²" o "120 - 150 m²")',
      '✅ Description: Mínimo 50 caracteres, describir lo más atractivo primero'
    ]
  });

  results.bestPractices.push({
    category: 'Solares',
    practices: [
      '✅ ubicacion: Nombre claro y consistente',
      '✅ area_m2: Área en metros cuadrados (número)',
      '✅ precio_usd_m2: PRECIO POR M² (no precio total)',
      '✅ estatus_legal: Solo usar: "CON TÍTULO", "DESLINDADO", "SIN DESLINDAR", "EN PROCESO"',
      '✅ frente_m y fondo_m: null si no aplica'
    ]
  });

  results.bestPractices.push({
    category: 'Nuevas Propiedades',
    practices: [
      '1️⃣ Copiar una propiedad existente similar como plantilla',
      '2️⃣ Cambiar el ID (formato: prop-[ubicacion]-[numero], ej: prop-piantini-001)',
      '3️⃣ Rellenar todos los campos requeridos',
      '4️⃣ Subir imágenes al CDN primero',
      '5️⃣ Ejecutar: npm run validate',
      '6️⃣ Corregir errores si hay',
      '7️⃣ Hacer commit con mensaje claro: "Add new property: [nombre]"'
    ]
  });

  results.bestPractices.push({
    category: 'Mantenimiento',
    practices: [
      '✅ Ejecutar npm run validate antes de cada commit',
      '✅ Revisar warnings aunque no sean errores críticos',
      '✅ Actualizar propiedades vendidas: cambiar status a "Vendido" (no eliminar)',
      '✅ Mantener archivo ordenado por categoría',
      '✅ Hacer backups periódicos del archivo'
    ]
  });

  console.log(`   ✓ Generated ${results.bestPractices.length} best practice categories`);
}

function printResults() {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('📊 VALIDATION RESULTS');
  console.log('═══════════════════════════════════════════');
  console.log('');

  // Critical Errors
  if (results.errors.length > 0) {
    console.log(`❌ ERRORES CRÍTICOS (${results.errors.length}):`);
    console.log('   Estos DEBEN corregirse antes de hacer commit');
    console.log('');
    results.errors.forEach(error => console.log(`   • ${error}`));
    console.log('');
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${results.warnings.length}):`);
    console.log('   No críticos pero deberían revisarse');
    console.log('');
    results.warnings.slice(0, 10).forEach(warning => console.log(`   • ${warning}`));
    if (results.warnings.length > 10) {
      console.log(`   ... y ${results.warnings.length - 10} más`);
    }
    console.log('');
  }

  // Similar Names
  if (results.similarNames.length > 0) {
    console.log('═══════════════════════════════════════════');
    console.log(`🔍 NOMBRES SIMILARES ENCONTRADOS (${results.similarNames.length} pares)`);
    console.log('═══════════════════════════════════════════');
    console.log('Estas propiedades tienen nombres muy parecidos.');
    console.log('Revisar si son duplicados o propiedades diferentes.');
    console.log('');

    results.similarNames.slice(0, 10).forEach((pair, idx) => {
      console.log(`${idx + 1}. Similitud: ${pair.similarity} ${pair.possibleDuplicate ? '⚠️  POSIBLE DUPLICADO' : ''}`);
      console.log(`   A) ${pair.property1}`);
      console.log(`   B) ${pair.property2}`);
      console.log('');
    });

    if (results.similarNames.length > 10) {
      console.log(`   ... y ${results.similarNames.length - 10} pares más`);
      console.log('');
    }
  }

  // Fields to Standardize
  if (results.toStandardize.length > 0) {
    console.log('═══════════════════════════════════════════');
    console.log(`📋 CAMPOS A ESTANDARIZAR (${results.toStandardize.length})`);
    console.log('═══════════════════════════════════════════');
    console.log('Estos campos tienen múltiples variaciones.');
    console.log('Estandarizarlos mejora la consistencia.');
    console.log('');

    results.toStandardize.forEach((item, idx) => {
      console.log(`${idx + 1}. Campo: "${item.field}"`);
      if (item.uniqueValues) {
        console.log(`   Valores únicos: ${item.uniqueValues}`);
      }
      if (item.allValues) {
        console.log(`   Todos los valores:`);
        item.allValues.forEach(val => console.log(`      - "${val}"`));
      }
      if (item.examples) {
        console.log(`   Ejemplos de inconsistencias:`);
        item.examples.slice(0, 3).forEach(ex => {
          if (typeof ex === 'string') {
            console.log(`      - "${ex}"`);
          } else {
            console.log(`      - ${ex.location || ex.current}: "${ex.current}" → "${ex.shouldBe}"`);
          }
        });
        if (item.examples.length > 3) {
          console.log(`      ... y ${item.examples.length - 3} más`);
        }
      }
      if (item.suggestion) {
        console.log(`   💡 Sugerencia: ${item.suggestion}`);
      }
      console.log('');
    });
  }

  // Questions for Owners
  if (results.toConfirmWithOwners.length > 0) {
    console.log('═══════════════════════════════════════════');
    console.log(`❓ PREGUNTAS PARA CONFIRMAR CON DUEÑOS (${results.toConfirmWithOwners.length})`);
    console.log('═══════════════════════════════════════════');
    console.log('Estos datos deben confirmarse con los propietarios.');
    console.log('');

    results.toConfirmWithOwners.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.question}`);

      if (item.type === 'dop_currency') {
        console.log(`   Total: ${item.count} propiedades en DOP`);
        console.log(`   ℹ️  ${item.note}`);
        console.log('');
        item.properties.forEach(prop => {
          console.log(`   • ${prop.property}`);
          console.log(`     Precio: ${prop.price}`);
          console.log(`     Ubicación: ${prop.location}`);
        });
      } else if (item.type === 'suspicious_prices') {
        console.log(`   Total: ${item.count} precios sospechosos`);
        console.log('');
        item.issues.forEach(issue => {
          console.log(`   • ${issue.property}`);
          console.log(`     ${issue.issue}: ${issue.price}`);
          console.log(`     ❓ ${issue.question}`);
        });
      } else if (item.type === 'solares_price_confusion') {
        console.log(`   Total: ${item.count} solares con precios posiblemente incorrectos`);
        console.log(`   💡 ${item.suggestion}`);
        console.log(`   Mostrando primeros ${item.showingFirst}:`);
        console.log('');
        item.issues.forEach(issue => {
          console.log(`   • ${issue.location} [${issue.index}]`);
          console.log(`     Precio actual por m²: ${issue.currentPricePerM2}`);
          console.log(`     Área: ${issue.area}`);
          console.log(`     ${issue.possibleCorrection}`);
        });
      } else if (item.type === 'missing_area') {
        console.log(`   Total: ${item.count} propiedades sin área definida`);
        console.log(`   Mostrando primeras ${item.showingFirst}:`);
        console.log('');
        item.properties.forEach(prop => {
          console.log(`   • ${prop.property}`);
          console.log(`     Valor actual: "${prop.currentValue}"`);
        });
      } else if (item.type === 'similar_location_and_name') {
        console.log(`   • Propiedad 1: ${item.property1}`);
        console.log(`   • Propiedad 2: ${item.property2}`);
        console.log(`   • Ubicación: ${item.location}`);
      }

      console.log('');
    });
  }

  // Best Practices
  if (results.bestPractices.length > 0) {
    console.log('═══════════════════════════════════════════');
    console.log('💡 MEJORES PRÁCTICAS RECOMENDADAS');
    console.log('═══════════════════════════════════════════');
    console.log('Guía para mantener calidad de datos consistente.');
    console.log('');

    results.bestPractices.forEach((section, idx) => {
      console.log(`${idx + 1}. ${section.category}`);
      console.log('   ' + '─'.repeat(40));
      section.practices.forEach(practice => {
        console.log(`   ${practice}`);
      });
      console.log('');
    });
  }

  // Information
  if (results.info.length > 0) {
    console.log('═══════════════════════════════════════════');
    console.log(`ℹ️  INFORMACIÓN ADICIONAL (${results.info.length})`);
    console.log('═══════════════════════════════════════════');
    results.info.forEach(info => console.log(`   • ${info}`));
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 RESUMEN');
  console.log('═══════════════════════════════════════════');
  console.log(`❌ Errores críticos: ${results.errors.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`🔍 Nombres similares: ${results.similarNames.length} pares`);
  console.log(`📋 Campos a estandarizar: ${results.toStandardize.length}`);
  console.log(`❓ Preguntas para dueños: ${results.toConfirmWithOwners.length}`);
  console.log('');

  if (results.errors.length === 0) {
    console.log('✅ Sin errores críticos - OK para commit');
  } else {
    console.log('🛑 Corregir errores críticos antes de commit');
  }
  console.log('');
}

// Run validation
main();

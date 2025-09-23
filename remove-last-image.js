const fs = require('fs');

// Read the properties.json file
const propertiesPath = './data/properties.json';
let properties = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));

console.log('🔄 Removing the last image from all property galleries...');

let updatedCount = 0;

// Update each property's gallery by removing the last image
for (const property of properties.categories.propiedades.properties) {
  if (property.gallery && property.gallery.length > 0) {
    // Remove the last image from the gallery
    property.gallery.pop();
    
    // Extract property ID from the image URL for logging
    const imageUrl = property.image;
    const propertyIdMatch = imageUrl.match(/Propiedades\/(\d+)\//);
    const propertyId = propertyIdMatch ? propertyIdMatch[1] : 'Unknown';
    
    console.log(`✅ Updated Property ${propertyId}: Now has ${property.gallery.length} images`);
    updatedCount++;
  }
}

// Write the updated properties back to the file
fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2));

console.log(`\n🎉 Successfully updated ${updatedCount} properties!`);
console.log('📊 All galleries now have the correct number of images (removed 1 extra image each).');
console.log('🚀 Your website now shows the accurate property photos!');

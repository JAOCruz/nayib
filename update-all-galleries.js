const fs = require('fs');

// Image counts from the script results
const imageCounts = {
  1: 12, 2: 21, 3: 21, 4: 11, 5: 13, 6: 10, 7: 21, 8: 13, 9: 18, 10: 20,
  11: 12, 12: 11, 13: 19, 14: 10, 15: 19, 16: 11, 17: 20, 18: 20, 19: 19, 20: 20,
  21: 9, 22: 10, 23: 10, 24: 5, 25: 5, 26: 10, 27: 10, 28: 10, 29: 10, 30: 9,
  31: 7, 32: 10, 33: 10, 34: 10, 35: 9, 36: 11, 37: 8, 38: 8, 39: 6, 40: 7,
  50: 7, 51: 10, 52: 5, 42: 9, 43: 10, 44: 6, 45: 7, 46: 4, 47: 9, 48: 4,
  53: 4, 54: 6, 55: 6, 56: 5, 57: 10, 58: 9, 59: 5, 60: 5, 61: 7, 62: 7,
  63: 6, 64: 8, 65: 10, 66: 10, 67: 7, 68: 10, 69: 5, 70: 5, 71: 8, 72: 9,
  73: 5, 74: 5, 75: 5, 76: 5, 77: 5, 78: 5
};

// Function to generate gallery URLs for a property
function generateGallery(propertyId, imageCount) {
  const gallery = [];
  for (let i = 1; i <= imageCount; i++) {
    gallery.push(`https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/${propertyId}/${i}.png`);
  }
  return gallery;
}

// Read the properties.json file
const propertiesPath = './data/properties.json';
let properties = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));

console.log('🔄 Updating all property galleries...');

let updatedCount = 0;

// Update each property's gallery
for (const property of properties.categories.propiedades.properties) {
  // Extract property ID from the image URL
  const imageUrl = property.image;
  const propertyIdMatch = imageUrl.match(/Propiedades\/(\d+)\//);
  
  if (propertyIdMatch) {
    const propertyId = parseInt(propertyIdMatch[1]);
    const expectedImageCount = imageCounts[propertyId];
    
    if (expectedImageCount && expectedImageCount > 0) {
      // Generate the complete gallery
      const newGallery = generateGallery(propertyId, expectedImageCount);
      
      // Update the property's gallery
      property.gallery = newGallery;
      
      console.log(`✅ Updated Property ${propertyId}: ${newGallery.length} images`);
      updatedCount++;
    }
  }
}

// Write the updated properties back to the file
fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2));

console.log(`\n🎉 Successfully updated ${updatedCount} properties!`);
console.log('📊 All galleries now have the correct number of images.');
console.log('🚀 Your website now shows all available property photos!');

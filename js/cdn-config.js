// Digital Ocean Spaces CDN Configuration
const CDN_CONFIG = {
    BASE_URL: 'https://lowest.nyc3.cdn.digitaloceanspaces.com',
    PROPERTIES_FOLDER: 'Propiedades',
    
    // Property image counts and CDN bases
    PROPERTIES: {
        1: {
            name: 'Playa Nueva Romana',
            imageCount: 9,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/1'
        },
        2: {
            name: 'Santiago',
            imageCount: 20,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/2'
        },
        3: {
            name: 'Santiago Flora y Urbanismo',
            imageCount: 20,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/3'
        },
        4: {
            name: 'Cap Cana',
            imageCount: 11,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/4'
        },
        5: {
            name: 'Bávaro',
            imageCount: 12,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/5'
        },
        6: {
            name: 'La Julia',
            imageCount: 9,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/6'
        },
        7: {
            name: 'Bella Vista Sur',
            imageCount: 23,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/7'
        },
        8: {
            name: 'El Cacique',
            imageCount: 12,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/8'
        },
        9: {
            name: 'Las Terrenas',
            imageCount: 29,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/9'
        },
        10: {
            name: 'Juan Dolio',
            imageCount: 15,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/10'
        },
        11: {
            name: 'El Millón',
            imageCount: 18,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/11'
        },
        12: {
            name: 'Bella Vista',
            imageCount: 12,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/12'
        },
        13: {
            name: 'Samaná',
            imageCount: 1,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/13'
        }
    }
};

// Helper function to generate image URLs for a property
function getPropertyImageUrls(propertyId) {
    const property = CDN_CONFIG.PROPERTIES[propertyId];
    if (!property) return [];
    
    const urls = [];
    for (let i = 1; i <= property.imageCount; i++) {
        urls.push(`${property.cdnBase}/${i}.png`);
    }
    return urls;
}

// Helper function to get main image URL for a property
function getPropertyMainImageUrl(propertyId) {
    const property = CDN_CONFIG.PROPERTIES[propertyId];
    if (!property) return '';
    return `${property.cdnBase}/1.png`;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CDN_CONFIG, getPropertyImageUrls, getPropertyMainImageUrl };
}

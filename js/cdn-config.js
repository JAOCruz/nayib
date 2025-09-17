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
        },
        14: {
            name: 'Bella Vista',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/14'
        },
        15: {
            name: 'Naco',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/15'
        },
        16: {
            name: 'Samaná Vista Mare',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/16'
        },
        17: {
            name: 'Renacimiento',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/17'
        },
        18: {
            name: 'Casa de Campo',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/18'
        },
        19: {
            name: 'Torre Anacaona',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/19'
        },
        20: {
            name: 'Elegante Penthouse en La Julia',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/20'
        },
        21: {
            name: 'Apartamento Elegante en Naco',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/21'
        },
        22: {
            name: 'Penthouse en Bella Vista',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/22'
        },
        23: {
            name: 'Loft en Los Cacicazgos',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/23'
        },
        24: {
            name: 'Proyecto Apartamentos - Respaldo Los Tres Ojos',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/24'
        },
        25: {
            name: 'Proyecto Apartamentos - Ensanche Isabelita',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/25'
        },
        26: {
            name: 'Apartamento Nuevo Amueblado - Av. Anacaona',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/26'
        },
        27: {
            name: 'Habitación en Alquiler - Los Restauradores',
            imageCount: 1,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/27'
        },
        28: {
            name: 'Apartamento en Bella Vista',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/28'
        },
        29: {
            name: 'Apartamento de Oportunidad en La Julia',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/29'
        },
        30: {
            name: 'Pent House frente al Parque Mirador Sur',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/30'
        },
        31: {
            name: 'Dos Torres de Apartamentos - La Esperilla',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/31'
        },
        32: {
            name: 'Apartamento en Zona Universitaria',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/32'
        },
        33: {
            name: 'Apartamento en Mirador Norte',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/33'
        },
        34: {
            name: 'Hermoso Penthouse de Lujo Amueblado - Mirador Norte',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/34'
        },
        35: {
            name: 'Espectacular Apartamento de Oportunidad en La Esperilla',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/35'
        },
        36: {
            name: 'Pent-House de Oportunidad en Piantini',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/36'
        },
        37: {
            name: 'Apartamento de Oportunidad en Naco',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/37'
        },
        38: {
            name: 'Oportunidad Única en Los Cacicazgos - Piso 17',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/38'
        },
        39: {
            name: 'Hermosa Villa Amueblada en Jarabacoa',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/39'
        },
        40: {
            name: 'Nuevos Apartamentos Lujosos en La Julia',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/40'
        },
        50: {
            name: 'Apartamentos desde $157,000 USD en Bella Vista',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/50'
        },
        51: {
            name: 'Espaciosos Apartamentos en La Julia - Torre Innovadora',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/51'
        },
        52: {
            name: 'Apartamento en Sector Paraíso',
            imageCount: 5,
            cdnBase: 'https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/52'
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

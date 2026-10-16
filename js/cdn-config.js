// Digital Ocean Spaces CDN Configuration
const CDN_CONFIG = {
    BASE_URL: '/fotos',
    PROPERTIES_FOLDER: 'Propiedades',
    
    // Property image counts and CDN bases
    PROPERTIES: {
        1: {
            name: 'Playa Nueva Romana',
            imageCount: 12,
            cdnBase: '/fotos/Propiedades/1'
        },
        2: {
            name: 'Santiago',
            imageCount: 21,
            cdnBase: '/fotos/Propiedades/2'
        },
        3: {
            name: 'Santiago Flora y Urbanismo',
            imageCount: 21,
            cdnBase: '/fotos/Propiedades/3'
        },
        4: {
            name: 'Cap Cana',
            imageCount: 11,
            cdnBase: '/fotos/Propiedades/4'
        },
        5: {
            name: 'Bávaro',
            imageCount: 13,
            cdnBase: '/fotos/Propiedades/5'
        },
        6: {
            name: 'La Julia',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/6'
        },
        7: {
            name: 'Bella Vista Sur',
            imageCount: 21,
            cdnBase: '/fotos/Propiedades/7'
        },
        8: {
            name: 'El Cacique',
            imageCount: 13,
            cdnBase: '/fotos/Propiedades/8'
        },
        9: {
            name: 'Las Terrenas',
            imageCount: 18,
            cdnBase: '/fotos/Propiedades/9'
        },
        10: {
            name: 'Juan Dolio',
            imageCount: 20,
            cdnBase: '/fotos/Propiedades/10'
        },
        11: {
            name: 'El Millón',
            imageCount: 12,
            cdnBase: '/fotos/Propiedades/11'
        },
        12: {
            name: 'Bella Vista',
            imageCount: 11,
            cdnBase: '/fotos/Propiedades/12'
        },
        13: {
            name: 'Samaná',
            imageCount: 19,
            cdnBase: '/fotos/Propiedades/13'
        },
        14: {
            name: 'Bella Vista',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/14'
        },
        15: {
            name: 'Naco',
            imageCount: 19,
            cdnBase: '/fotos/Propiedades/15'
        },
        16: {
            name: 'Samaná Vista Mare',
            imageCount: 11,
            cdnBase: '/fotos/Propiedades/16'
        },
        17: {
            name: 'Renacimiento',
            imageCount: 20,
            cdnBase: '/fotos/Propiedades/17'
        },
        18: {
            name: 'Casa de Campo',
            imageCount: 20,
            cdnBase: '/fotos/Propiedades/18'
        },
        19: {
            name: 'Torre Anacaona',
            imageCount: 19,
            cdnBase: '/fotos/Propiedades/19'
        },
        20: {
            name: 'Elegante Penthouse en La Julia',
            imageCount: 20,
            cdnBase: '/fotos/Propiedades/20'
        },
        21: {
            name: 'Apartamento Elegante en Naco',
            imageCount: 9,
            cdnBase: '/fotos/Propiedades/21'
        },
        22: {
            name: 'Penthouse en Bella Vista',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/22'
        },
        23: {
            name: 'Loft en Los Cacicazgos',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/23'
        },
        24: {
            name: 'Proyecto Apartamentos - Respaldo Los Tres Ojos',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/24'
        },
        25: {
            name: 'Proyecto Apartamentos - Ensanche Isabelita',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/25'
        },
        26: {
            name: 'Apartamento Nuevo Amueblado - Av. Anacaona',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/26'
        },
        27: {
            name: 'Habitación en Alquiler - Los Restauradores',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/27'
        },
        28: {
            name: 'Apartamento en Bella Vista',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/28'
        },
        29: {
            name: 'Apartamento de Oportunidad en La Julia',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/29'
        },
        30: {
            name: 'Pent House frente al Parque Mirador Sur',
            imageCount: 9,
            cdnBase: '/fotos/Propiedades/30'
        },
        31: {
            name: 'Dos Torres de Apartamentos - La Esperilla',
            imageCount: 7,
            cdnBase: '/fotos/Propiedades/31'
        },
        32: {
            name: 'Apartamento en Zona Universitaria',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/32'
        },
        33: {
            name: 'Apartamento en Mirador Norte',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/33'
        },
        34: {
            name: 'Hermoso Penthouse de Lujo Amueblado - Mirador Norte',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/34'
        },
        35: {
            name: 'Espectacular Apartamento de Oportunidad en La Esperilla',
            imageCount: 9,
            cdnBase: '/fotos/Propiedades/35'
        },
        36: {
            name: 'Pent-House de Oportunidad en Piantini',
            imageCount: 11,
            cdnBase: '/fotos/Propiedades/36'
        },
        37: {
            name: 'Apartamento de Oportunidad en Naco',
            imageCount: 8,
            cdnBase: '/fotos/Propiedades/37'
        },
        38: {
            name: 'Oportunidad Única en Los Cacicazgos - Piso 17',
            imageCount: 8,
            cdnBase: '/fotos/Propiedades/38'
        },
        39: {
            name: 'Hermosa Villa Amueblada en Jarabacoa',
            imageCount: 6,
            cdnBase: '/fotos/Propiedades/39'
        },
        40: {
            name: 'Nuevos Apartamentos Lujosos en La Julia',
            imageCount: 7,
            cdnBase: '/fotos/Propiedades/40'
        },
        50: {
            name: 'Apartamentos desde $157,000 USD en Bella Vista',
            imageCount: 7,
            cdnBase: '/fotos/Propiedades/50'
        },
        51: {
            name: 'Espaciosos Apartamentos en La Julia - Torre Innovadora',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/51'
        },
        52: {
            name: 'Apartamento en Sector Paraíso',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/52'
        },
        40: {
            name: 'Apartamentos Nuevos por el Sector Esperilla - Conarte VIII',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/40'
        },
        42: {
            name: 'Proyecto Sector El Vergel',
            imageCount: 9,
            cdnBase: '/fotos/Propiedades/42'
        },
        43: {
            name: 'Los Cacicazgos - Concepto Elegante y Lujoso',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/43'
        },
        44: {
            name: 'Torre Moderna en Naco - Bloque A',
            imageCount: 6,
            cdnBase: '/fotos/Propiedades/44'
        },
        45: {
            name: 'Torre Moderna en Naco - Segunda Torre',
            imageCount: 7,
            cdnBase: '/fotos/Propiedades/45'
        },
        46: {
            name: 'Torre Moderna en Naco - Tercera Torre',
            imageCount: 4,
            cdnBase: '/fotos/Propiedades/46'
        },
        47: {
            name: 'Penthouse en Piantini - Piso 14',
            imageCount: 9,
            cdnBase: '/fotos/Propiedades/47'
        },
        48: {
            name: 'Torre Moderna de 23 Niveles - Los Cacicazgos',
            imageCount: 4,
            cdnBase: '/fotos/Propiedades/48'
        },
        53: {
            name: 'Juan Dolio Beach - Torre Moderna de 19 Pisos',
            imageCount: 4,
            cdnBase: '/fotos/Propiedades/53'
        },
        54: {
            name: 'Torre Moderna y Vanguardista en Bella Vista',
            imageCount: 6,
            cdnBase: '/fotos/Propiedades/54'
        },
        55: {
            name: 'Torre Moderna de 18 Niveles - Los Cacicazgos',
            imageCount: 6,
            cdnBase: '/fotos/Propiedades/55'
        },
        56: {
            name: 'Apartamentos Nuevos y Económicos en Vista Hermosa',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/56'
        },
        57: {
            name: 'Proyecto de 11 Niveles en La Esperilla',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/57'
        },
        58: {
            name: 'Proyecto de 15 Niveles en La Esperilla',
            imageCount: 9,
            cdnBase: '/fotos/Propiedades/58'
        },
        59: {
            name: 'Proyecto de Oficinas Comerciales en Bella Vista',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/59'
        },
        60: {
            name: 'Torre de Apartamentos en La Esperilla',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/60'
        },
        61: {
            name: 'Apartamentos en El Vergel',
            imageCount: 7,
            cdnBase: '/fotos/Propiedades/61'
        },
        62: {
            name: 'Torre en Renacimiento',
            imageCount: 7,
            cdnBase: '/fotos/Propiedades/62'
        },
        63: {
            name: 'Torre de Lujo en Urbanización Real',
            imageCount: 6,
            cdnBase: '/fotos/Propiedades/63'
        },
        64: {
            name: 'Proyecto de Lujo en La Esperilla',
            imageCount: 8,
            cdnBase: '/fotos/Propiedades/64'
        },
        65: {
            name: 'Altos de Arroyo Hondo',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/65'
        },
        66: {
            name: 'Lujosos Apartamentos en Arroyo Hondo',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/66'
        },
        67: {
            name: 'Apartamento Exclusivo en Naco',
            imageCount: 7,
            cdnBase: '/fotos/Propiedades/67'
        },
        68: {
            name: 'La Julia - Vistas al Mar',
            imageCount: 10,
            cdnBase: '/fotos/Propiedades/68'
        },
        69: {
            name: 'Apartamento Especial en Cap Cana',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/69'
        },
        70: {
            name: 'Apartamento Especial en Cap Cana - Segunda Unidad',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/70'
        },
        71: {
            name: 'Apartamento Amueblado en Alquiler - La Esperilla',
            imageCount: 8,
            cdnBase: '/fotos/Propiedades/71'
        },
        72: {
            name: 'Bella Vista - Vistas a la Ciudad y al Mar',
            imageCount: 9,
            cdnBase: '/fotos/Propiedades/72'
        },
        73: {
            name: 'Bella Vista - Precio de Oportunidad',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/73'
        },
        74: {
            name: 'Apartamento en El Cacique - Vista al Mar',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/74'
        },
        75: {
            name: 'Alquiler de Oportunidad en Naco',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/75'
        },
        76: {
            name: 'Torre Moderna de 23 Niveles - Bella Vista',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/76'
        },
        77: {
            name: 'Apartamento de Oportunidad en Naco',
            imageCount: 5,
            cdnBase: '/fotos/Propiedades/77'
        },
        78: {
            name: 'Apartamento en Sector Paraíso',
            imageCount: 4,
            cdnBase: '/fotos/Propiedades/78'
        },
        79: {
            name: 'Apartamento de Oportunidad en La Julia',
            imageCount: 9,
            cdnBase: '/fotos/Propiedades/79'
        },
        80: {
            name: 'Apartamento Amueblado en Piantini',
            imageCount: 12,
            cdnBase: '/fotos/Propiedades/80'
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

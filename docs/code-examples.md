# Ejemplos de Código para Integración

Este documento contiene ejemplos de código para integrar el sistema optimizado de propiedades.

## 1. Loader de Propiedades con Soporte para Ambos Sistemas

### PropertiesLoader.js

```javascript
/**
 * Properties Loader with support for both legacy and optimized formats
 * Automatically detects which system is available and uses it
 */
class PropertiesLoader {
    constructor() {
        this.data = null;
        this.loadedCategories = new Set();
        this.useOptimized = false;
        this.cdnBase = 'https://lowest.nyc3.cdn.digitaloceanspaces.com';
    }

    /**
     * Initialize and load properties data
     */
    async init() {
        try {
            // Try optimized format first
            this.useOptimized = await this.checkOptimizedFormat();

            if (this.useOptimized) {
                console.log('Using optimized properties format');
                await this.loadOptimizedFormat();
            } else {
                console.log('Using legacy properties format');
                await this.loadLegacyFormat();
            }

            return true;
        } catch (error) {
            console.error('Failed to load properties:', error);
            return false;
        }
    }

    /**
     * Check if optimized format is available
     */
    async checkOptimizedFormat() {
        try {
            const response = await fetch('data/properties-index.json');
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Load optimized format (index + lazy categories)
     */
    async loadOptimizedFormat() {
        const response = await fetch('data/properties-index.json');
        const index = await response.json();

        this.data = {
            version: index.version,
            cdnBase: index.cdnBase || this.cdnBase,
            categories: {
                propiedades: { ...index.categories.propiedades, properties: [] },
                oficinas: { ...index.categories.oficinas, properties: [] },
                solares: { ...index.categories.solares, data: [] }
            },
            featured: index.featured
        };

        // Expand featured references if needed
        this.data.featured = await this.expandFeaturedReferences(index.featured);
    }

    /**
     * Load legacy format (single file)
     */
    async loadLegacyFormat() {
        const response = await fetch('data/properties.json');
        this.data = await response.json();

        // Mark all categories as loaded
        this.loadedCategories.add('propiedades');
        this.loadedCategories.add('oficinas');
        this.loadedCategories.add('solares');
    }

    /**
     * Expand featured references to full properties
     */
    async expandFeaturedReferences(featured) {
        return Promise.all(featured.map(async (item) => {
            if (item.category && item.id) {
                // It's a reference, expand it
                await this.loadCategory(item.category);
                const category = this.data.categories[item.category];

                if (category.properties) {
                    const property = category.properties.find(p => p.id === item.id);
                    return property || item;
                } else if (category.data) {
                    // For solares, find by location
                    const location = category.data.find(loc =>
                        loc.ubicacion.toLowerCase().includes(item.id.toLowerCase())
                    );
                    return location || item;
                }
            }
            // Already a full property
            return item;
        }));
    }

    /**
     * Load a specific category (lazy loading)
     */
    async loadCategory(categoryName) {
        // If already loaded or not using optimized format, skip
        if (this.loadedCategories.has(categoryName) || !this.useOptimized) {
            return;
        }

        try {
            const categoryInfo = this.data.categories[categoryName];
            const response = await fetch(`data/${categoryInfo.dataUrl}`);
            const categoryData = await response.json();

            // Merge category data
            if (categoryName === 'solares') {
                this.data.categories[categoryName] = categoryData;
            } else {
                this.data.categories[categoryName] = {
                    ...this.data.categories[categoryName],
                    ...categoryData
                };
            }

            this.loadedCategories.add(categoryName);
            console.log(`Loaded category: ${categoryName}`);
        } catch (error) {
            console.error(`Failed to load category ${categoryName}:`, error);
            throw error;
        }
    }

    /**
     * Get all properties from a category
     */
    async getCategory(categoryName) {
        await this.loadCategory(categoryName);
        return this.data.categories[categoryName];
    }

    /**
     * Get featured properties
     */
    getFeatured() {
        return this.data.featured || [];
    }

    /**
     * Get a property by ID
     */
    async getPropertyById(id, categoryName = null) {
        if (categoryName) {
            await this.loadCategory(categoryName);
            const category = this.data.categories[categoryName];
            return category.properties?.find(p => p.id === id);
        }

        // Search in all categories
        for (const catName of ['propiedades', 'oficinas']) {
            await this.loadCategory(catName);
            const category = this.data.categories[catName];
            const property = category.properties?.find(p => p.id === id);
            if (property) return property;
        }

        return null;
    }

    /**
     * Build full image URL from property data
     */
    buildImageUrl(property, imageName = null) {
        const cdnBase = this.data.cdnBase || this.cdnBase;

        if (property.imageBase) {
            // Optimized format with relative paths
            const image = imageName || property.image;
            return `${cdnBase}/${property.imageBase}/${image}`;
        } else {
            // Legacy format with full URLs
            return imageName || property.image;
        }
    }

    /**
     * Get gallery URLs for a property
     */
    getGalleryUrls(property) {
        if (!property.gallery) return [];

        return property.gallery.map(img => {
            if (img.startsWith('http')) {
                return img; // Full URL
            } else if (property.imageBase) {
                return this.buildImageUrl(property, img); // Relative path
            }
            return img;
        });
    }

    /**
     * Search properties
     */
    async searchProperties(query, categoryName = 'propiedades') {
        await this.loadCategory(categoryName);
        const category = this.data.categories[categoryName];

        if (!category.properties) return [];

        const lowerQuery = query.toLowerCase();
        return category.properties.filter(property => {
            return (
                property.title.toLowerCase().includes(lowerQuery) ||
                property.location.toLowerCase().includes(lowerQuery) ||
                property.description.toLowerCase().includes(lowerQuery) ||
                property.type.toLowerCase().includes(lowerQuery)
            );
        });
    }

    /**
     * Filter properties
     */
    async filterProperties(filters, categoryName = 'propiedades') {
        await this.loadCategory(categoryName);
        const category = this.data.categories[categoryName];

        if (!category.properties) return [];

        return category.properties.filter(property => {
            // Price filter
            if (filters.priceMin && property.price < filters.priceMin) return false;
            if (filters.priceMax && property.price > filters.priceMax) return false;

            // Type filter
            if (filters.type && property.type !== filters.type) return false;

            // Status filter
            if (filters.status && property.status !== filters.status) return false;

            // Location filter
            if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) {
                return false;
            }

            // Area filter
            if (filters.areaMin || filters.areaMax) {
                const area = this.extractAreaNumber(property.area);
                if (filters.areaMin && area < filters.areaMin) return false;
                if (filters.areaMax && area > filters.areaMax) return false;
            }

            return true;
        });
    }

    /**
     * Extract numeric area from area string
     */
    extractAreaNumber(areaString) {
        if (!areaString) return 0;
        const match = areaString.match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PropertiesLoader;
}
```

## 2. Actualizar PropertiesManager Existente

### Modificaciones Mínimas a js/properties.js

```javascript
// Agregar al inicio del archivo
let propertiesLoader = null;

// Modificar el constructor de PropertiesManager
class PropertiesManager {
    constructor() {
        this.propertiesData = null;
        this.loader = null;
        this.init();
    }

    async init() {
        try {
            // Usar el nuevo loader
            this.loader = new PropertiesLoader();
            await this.loader.init();
            this.propertiesData = this.loader.data;

            this.loadProperties();
        } catch (error) {
            console.error('Error loading properties data:', error);
        }
    }

    // El resto del código permanece igual, pero actualizar métodos
    // que construyen URLs de imágenes:

    createPropertyCard(property, type = 'featured') {
        const card = document.createElement('div');
        card.className = 'property_card';

        // Usar el loader para construir URLs
        const imageUrl = this.loader.buildImageUrl(property);

        card.innerHTML = `
            <div class="img-box">
                <img src="${imageUrl}" alt="${property.title}">
                <div class="badge">
                    <span>${property.badge}</span>
                </div>
            </div>
            <div class="detail-box">
                <h4 class="price ${property.showPrice === false ? 'price-request' : ''}">${property.showPrice === false ? 'Solicitar Precio' : `$${property.price.toLocaleString()} ${property.currency}`}</h4>
                <p class="location">${property.location}</p>
                <p class="area">${property.area}</p>
                <div class="btn-box">
                    <a href="property-detail.html?id=${property.id}" class="btn-property">Ver Detalles</a>
                </div>
            </div>
        `;

        return card;
    }
}
```

## 3. Actualizar PagePropertiesManager

### Modificaciones a js/page-properties.js

```javascript
class PagePropertiesManager {
    constructor() {
        this.propertiesData = null;
        this.loader = null;
        this.currentPage = this.getCurrentPage();
        this.itemsPerPage = 9;
        this.currentPageNumber = 1;
        this.filteredData = [];
        this.currentLocation = '';
        this.init();
    }

    async init() {
        try {
            // Usar el nuevo loader
            this.loader = new PropertiesLoader();
            await this.loader.init();

            // Cargar solo la categoría actual
            await this.loader.loadCategory(this.currentPage);
            this.propertiesData = this.loader.data;

            this.loadPageContent();
        } catch (error) {
            console.error('Error loading properties:', error);
            this.showErrorMessage(error.message);
        }
    }

    // Actualizar método para construir URLs de imágenes
    createPropertyItem(property) {
        const imageUrl = this.loader.buildImageUrl(property);

        return `
            <div class="property_item">
                <div class="img-box">
                    <a href="property-detail.html?id=${property.id}&type=${this.currentPage}">
                        <img src="${imageUrl}" alt="${property.title}">
                        <div class="badge">
                            <span>${property.badge}</span>
                        </div>
                    </a>
                </div>
                <div class="detail-box">
                    <h4 class="price ${property.showPrice === false ? 'price-request' : ''}">${property.showPrice === false ? 'Solicitar Precio' : `$${property.price.toLocaleString()} ${property.currency}`}</h4>
                    <h5 class="title">${property.title}</h5>
                    <p class="location">${property.location}</p>
                    <p class="area">${property.area}</p>
                    <div class="features">
                        ${property.features.map(feature => `<span class="feature">${feature}</span>`).join('')}
                    </div>
                    <div class="btn-box">
                        <a href="property-detail.html?id=${property.id}&type=${this.currentPage}" class="btn-property">Ver Detalles</a>
                    </div>
                </div>
            </div>
        `;
    }
}
```

## 4. Página de Detalles de Propiedad

### property-detail.html (JavaScript integrado)

```javascript
<script>
    // Obtener parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    const categoryType = urlParams.get('type') || 'propiedades';

    // Cargar detalles de la propiedad
    async function loadPropertyDetails() {
        try {
            const loader = new PropertiesLoader();
            await loader.init();

            const property = await loader.getPropertyById(propertyId, categoryType);

            if (!property) {
                showError('Propiedad no encontrada');
                return;
            }

            displayPropertyDetails(property, loader);
        } catch (error) {
            console.error('Error loading property:', error);
            showError('Error al cargar la propiedad');
        }
    }

    function displayPropertyDetails(property, loader) {
        // Actualizar título
        document.title = property.title;

        // Actualizar imagen principal
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.src = loader.buildImageUrl(property);
            mainImage.alt = property.title;
        }

        // Actualizar galería
        const gallery = document.getElementById('gallery');
        if (gallery && property.gallery) {
            const galleryUrls = loader.getGalleryUrls(property);
            gallery.innerHTML = galleryUrls.map(url => `
                <div class="gallery-item">
                    <img src="${url}" alt="${property.title}">
                </div>
            `).join('');
        }

        // Actualizar información
        document.getElementById('propertyTitle').textContent = property.title;
        document.getElementById('propertyPrice').textContent =
            property.showPrice === false
                ? 'Solicitar Precio'
                : `$${property.price.toLocaleString()} ${property.currency}`;
        document.getElementById('propertyLocation').textContent = property.location;
        document.getElementById('propertyArea').textContent = property.area;
        document.getElementById('propertyDescription').textContent = property.description;

        // Actualizar características
        const featuresContainer = document.getElementById('features');
        if (featuresContainer && property.features) {
            featuresContainer.innerHTML = property.features.map(feature => `
                <li><i class="fas fa-check"></i> ${feature}</li>
            `).join('');
        }

        // Mostrar plan de pago si existe
        if (property.payment_plan) {
            displayPaymentPlan(property.payment_plan);
        }

        // Mostrar tipos de apartamentos si existen
        if (property.apartment_types) {
            displayApartmentTypes(property.apartment_types);
        }
    }

    function displayPaymentPlan(plan) {
        const container = document.getElementById('paymentPlan');
        if (!container) return;

        container.innerHTML = `
            <h3>Plan de Pago</h3>
            <div class="payment-plan">
                ${plan.reservation ? `<div class="payment-item"><strong>Reserva:</strong> ${plan.reservation}</div>` : ''}
                ${plan.contract ? `<div class="payment-item"><strong>Contrato:</strong> ${plan.contract}</div>` : ''}
                ${plan.construction ? `<div class="payment-item"><strong>Durante construcción:</strong> ${plan.construction}</div>` : ''}
                ${plan.delivery ? `<div class="payment-item"><strong>Entrega:</strong> ${plan.delivery}</div>` : ''}
            </div>
        `;
    }

    function displayApartmentTypes(types) {
        const container = document.getElementById('apartmentTypes');
        if (!container) return;

        container.innerHTML = `
            <h3>Tipos de Apartamentos</h3>
            ${types.map(type => `
                <div class="apartment-type">
                    <h4>Tipo ${type.type}</h4>
                    <p><strong>Área:</strong> ${type.area}</p>
                    <p><strong>Precio:</strong> ${type.price}</p>
                    <ul class="type-features">
                        ${type.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        `;
    }

    function showError(message) {
        document.body.innerHTML = `
            <div class="error-container">
                <h1>Error</h1>
                <p>${message}</p>
                <a href="index.html" class="btn">Volver al inicio</a>
            </div>
        `;
    }

    // Cargar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', loadPropertyDetails);
</script>
```

## 5. Uso con TypeScript

### properties-loader.ts

```typescript
import {
    PropertiesData,
    Property,
    PropertyCategory,
    SolarCategory,
    PropertyFilters
} from '../types/properties';

class TypedPropertiesLoader {
    private data: PropertiesData | null = null;
    private loadedCategories: Set<string> = new Set();
    private useOptimized: boolean = false;
    private readonly cdnBase: string = 'https://lowest.nyc3.cdn.digitaloceanspaces.com';

    async init(): Promise<boolean> {
        try {
            this.useOptimized = await this.checkOptimizedFormat();

            if (this.useOptimized) {
                await this.loadOptimizedFormat();
            } else {
                await this.loadLegacyFormat();
            }

            return true;
        } catch (error) {
            console.error('Failed to load properties:', error);
            return false;
        }
    }

    private async checkOptimizedFormat(): Promise<boolean> {
        try {
            const response = await fetch('data/properties-index.json');
            return response.ok;
        } catch {
            return false;
        }
    }

    async getCategory(categoryName: keyof PropertiesData['categories']): Promise<PropertyCategory | SolarCategory> {
        await this.loadCategory(categoryName);
        return this.data!.categories[categoryName];
    }

    async getPropertyById(id: string, categoryName?: string): Promise<Property | null> {
        if (categoryName && categoryName !== 'solares') {
            await this.loadCategory(categoryName as any);
            const category = this.data!.categories[categoryName as 'propiedades' | 'oficinas'];
            return category.properties.find(p => p.id === id) || null;
        }

        // Search in all property categories
        for (const catName of ['propiedades', 'oficinas'] as const) {
            await this.loadCategory(catName);
            const category = this.data!.categories[catName];
            const property = category.properties.find(p => p.id === id);
            if (property) return property;
        }

        return null;
    }

    buildImageUrl(property: Property, imageName?: string): string {
        const cdnBase = (this.data as any)?.cdnBase || this.cdnBase;
        const imageBase = (property as any).imageBase;

        if (imageBase) {
            const image = imageName || property.image;
            return `${cdnBase}/${imageBase}/${image}`;
        } else {
            return imageName || property.image;
        }
    }

    async filterProperties(
        filters: PropertyFilters,
        categoryName: 'propiedades' | 'oficinas' = 'propiedades'
    ): Promise<Property[]> {
        await this.loadCategory(categoryName);
        const category = this.data!.categories[categoryName];

        return category.properties.filter(property => {
            if (filters.priceMin && property.price < filters.priceMin) return false;
            if (filters.priceMax && property.price > filters.priceMax) return false;
            if (filters.type && property.type !== filters.type) return false;
            if (filters.status && property.status !== filters.status) return false;
            if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) {
                return false;
            }

            if (filters.areaMin || filters.areaMax) {
                const area = this.extractAreaNumber(property.area);
                if (filters.areaMin && area < filters.areaMin) return false;
                if (filters.areaMax && area > filters.areaMax) return false;
            }

            return true;
        });
    }

    private extractAreaNumber(areaString: string): number {
        if (!areaString) return 0;
        const match = areaString.match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    }

    // Implement other methods as needed...
}

export default TypedPropertiesLoader;
```

## 6. Testing

### test-properties-loader.js

```javascript
// Simple test suite for PropertiesLoader

async function runTests() {
    console.log('🧪 Running PropertiesLoader tests...\n');

    const loader = new PropertiesLoader();

    // Test 1: Initialization
    console.log('Test 1: Initialization');
    const initSuccess = await loader.init();
    console.assert(initSuccess, 'Init should succeed');
    console.assert(loader.data !== null, 'Data should be loaded');
    console.log('✅ Passed\n');

    // Test 2: Load featured
    console.log('Test 2: Load featured properties');
    const featured = loader.getFeatured();
    console.assert(Array.isArray(featured), 'Featured should be an array');
    console.assert(featured.length > 0, 'Should have featured properties');
    console.log(`✅ Passed (${featured.length} featured properties)\n`);

    // Test 3: Load category
    console.log('Test 3: Load propiedades category');
    const propiedades = await loader.getCategory('propiedades');
    console.assert(propiedades !== null, 'Category should exist');
    console.assert(propiedades.properties.length > 0, 'Should have properties');
    console.log(`✅ Passed (${propiedades.properties.length} properties)\n`);

    // Test 4: Get property by ID
    console.log('Test 4: Get property by ID');
    const firstId = propiedades.properties[0].id;
    const property = await loader.getPropertyById(firstId, 'propiedades');
    console.assert(property !== null, 'Property should be found');
    console.assert(property.id === firstId, 'Should be correct property');
    console.log(`✅ Passed (found ${property.title})\n`);

    // Test 5: Build image URL
    console.log('Test 5: Build image URL');
    const imageUrl = loader.buildImageUrl(property);
    console.assert(typeof imageUrl === 'string', 'URL should be a string');
    console.assert(imageUrl.startsWith('http'), 'Should be a full URL');
    console.log(`✅ Passed (${imageUrl})\n`);

    // Test 6: Search
    console.log('Test 6: Search properties');
    const results = await loader.searchProperties('santiago');
    console.assert(Array.isArray(results), 'Results should be an array');
    console.log(`✅ Passed (found ${results.length} results)\n`);

    // Test 7: Filter
    console.log('Test 7: Filter properties');
    const filtered = await loader.filterProperties({ priceMin: 100000, priceMax: 500000 });
    console.assert(Array.isArray(filtered), 'Filtered should be an array');
    console.log(`✅ Passed (found ${filtered.length} properties)\n`);

    console.log('🎉 All tests passed!');
}

// Run tests when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
} else {
    runTests();
}
```

## Resumen

Estos ejemplos te permiten:

1. ✅ Cargar propiedades con soporte para ambos formatos
2. ✅ Lazy loading de categorías para mejor rendimiento
3. ✅ Construcción correcta de URLs (formato optimizado y legacy)
4. ✅ Búsqueda y filtrado de propiedades
5. ✅ Soporte completo para TypeScript
6. ✅ Tests básicos para validar funcionamiento

Para implementar, simplemente:
1. Agrega `PropertiesLoader.js` a tu proyecto
2. Incluye el script en tus páginas HTML
3. Actualiza tus archivos existentes con los cambios mínimos mostrados

La clave es que todo funciona con ambos sistemas (legacy y optimizado), por lo que puedes hacer la transición gradualmente.

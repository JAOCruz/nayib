/**
 * LÓGICA DEL CARRUSEL DE IMÁGENES
 * Usa event delegation para máxima compatibilidad con HTML generado dinámicamente.
 * Los botones usan data-attributes en lugar de inline onclick.
 */
window.propertyCarousel = {
    currentIndices: {},

    getThumbnails: function (propertyId) {
        var container = document.getElementById('gallery-' + propertyId);
        if (!container) return [];
        return Array.from(container.querySelectorAll('.thumbnail'));
    },

    nextImage: function (propertyId) {
        var thumbnails = this.getThumbnails(propertyId);
        if (thumbnails.length === 0) return;

        if (this.currentIndices[propertyId] === undefined) {
            this.currentIndices[propertyId] = 0;
        }

        var newIndex = this.currentIndices[propertyId] + 1;
        if (newIndex >= thumbnails.length) newIndex = 0;

        this.updateGallery(propertyId, newIndex, thumbnails);
    },

    previousImage: function (propertyId) {
        var thumbnails = this.getThumbnails(propertyId);
        if (thumbnails.length === 0) return;

        if (this.currentIndices[propertyId] === undefined) {
            this.currentIndices[propertyId] = 0;
        }

        var newIndex = this.currentIndices[propertyId] - 1;
        if (newIndex < 0) newIndex = thumbnails.length - 1;

        this.updateGallery(propertyId, newIndex, thumbnails);
    },

    goToImage: function (propertyId, index) {
        var thumbnails = this.getThumbnails(propertyId);
        this.updateGallery(propertyId, index, thumbnails);
    },

    updateGallery: function (propertyId, index, thumbnails) {
        this.currentIndices[propertyId] = index;

        var mainImage = document.getElementById('main-image-' + propertyId);
        if (mainImage && thumbnails[index]) {
            mainImage.src = thumbnails[index].src;
        }

        var counter = document.getElementById('image-counter-' + propertyId);
        if (counter) {
            counter.innerText = (index + 1) + ' / ' + thumbnails.length;
        }

        thumbnails.forEach(function (thumb, i) {
            if (i === index) thumb.classList.add('active');
            else thumb.classList.remove('active');
        });
    }
};

// Event delegation for carousel controls
document.addEventListener('click', function (e) {
    var button = e.target.closest('[data-action]');
    if (!button) return;

    var action = button.getAttribute('data-action');
    var propertyId = button.getAttribute('data-property-id');
    if (!propertyId) return;

    e.preventDefault();
    e.stopPropagation();

    if (action === 'prev') {
        window.propertyCarousel.previousImage(propertyId);
    } else if (action === 'next') {
        window.propertyCarousel.nextImage(propertyId);
    } else if (action === 'goto') {
        var index = parseInt(button.getAttribute('data-index'), 10);
        window.propertyCarousel.goToImage(propertyId, index);
    }
});

/**
 * CLASE PRINCIPAL DE GESTIÓN DE PROPIEDADES
 */
class PropertiesManager {
    constructor() {
        this.propertiesData = null;
        this.init();
    }

    async init() {
        try {
            const response = await fetch('data/properties.json');
            this.propertiesData = await response.json();
            this.loadProperties();
        } catch (error) {
            console.error('Error loading properties data:', error);
        }
    }

    loadProperties() {
        this.loadFeaturedProperties();
        // Carga inicial de todas las propiedades (categoría por defecto o todas)
        this.filterByCategory('propiedades');
    }

    loadFeaturedProperties() {
        const featuredContainer = document.getElementById('featuredPropertiesContainer');
        if (!featuredContainer || !this.propertiesData) return;

        const featured = this.propertiesData.featured;
        featuredContainer.innerHTML = '';

        featured.forEach((property) => {
            // Usamos createPropertyItem también aquí si quieres carrusel en destacados,
            // o createPropertyCard si quieres la versión simple.
            // Aquí mantengo tu createPropertyCard original para destacados:
            const propertyCard = this.createPropertyCard(property);
            featuredContainer.appendChild(propertyCard);
        });
    }

    // Crea tarjeta simple para sección "Destacados" (sin carrusel complejo)
    createPropertyCard(property) {
        const card = document.createElement('div');
        card.className = 'property_card';

        card.innerHTML = `
            <div class="img-box">
                <img src="${property.image}" alt="${property.title}">
                <div class="badge">
                    <span>${property.badge}</span>
                </div>
            </div>
            <div class="detail-box">
                <h4 class="price ${property.showPrice === false ? 'price-request' : ''}">
                    ${property.showPrice === false ? 'A Consultar' : `$${property.price.toLocaleString()} ${property.currency}`}
                </h4>
                <p class="location">${property.location}</p>
                <p class="area">${property.area}</p>
                <div class="btn-box">
                    <a href="property-detail.html?id=${property.id}" class="btn-property">Ver Detalles</a>
                </div>
            </div>
        `;
        return card;
    }

    // --- FUNCIÓN ACTUALIZADA CON EL CARRUSEL ---
    createPropertyItem(property) {
        // Determinar imágenes a usar
        const hasGallery = property.gallery && property.gallery.length > 0;
        const images = hasGallery ? property.gallery : [property.image];

        // Generar HTML del carrusel con IDs ÚNICOS basados en property.id
        const galleryHTML = `
            <div class="property-gallery-container" id="gallery-${property.id}">
                <div class="main-image-container">
                    <img src="${images[0]}" 
                         alt="${property.title}" 
                         class="main-image" 
                         id="main-image-${property.id}">
                    
                    <div class="badge">
                        <span>${property.badge}</span>
                    </div>

                    ${hasGallery && images.length > 1 ? `
                        <button type="button" class="carousel-nav prev" data-action="prev" data-property-id="${property.id}">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button type="button" class="carousel-nav next" data-action="next" data-property-id="${property.id}">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="image-counter" id="image-counter-${property.id}">
                            1 / ${images.length}
                        </div>
                    ` : ''}
                </div>
                
                ${hasGallery && images.length > 1 ? `
                    <div class="thumbnail-container">
                        ${images.map((imgSrc, index) => `
                            <img src="${imgSrc}"
                                 class="thumbnail ${index === 0 ? 'active' : ''}"
                                 data-action="goto" data-property-id="${property.id}" data-index="${index}"
                                 alt="thumbnail">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        return `
            <div class="property_item">
                <div class="img-box-wrapper">
                    ${galleryHTML}
                </div>
                <div class="detail-box">
                    <h4 class="price">$${property.price.toLocaleString()} ${property.currency}</h4>
                    <h5 class="title">${property.title}</h5>
                    <p class="location">${property.location}</p>
                    <p class="area">${property.area}</p>
                    <div class="features">
                        ${property.features ? property.features.slice(0, 3).map(f => `<span class="feature">${f}</span>`).join('') : ''}
                    </div>
                    <div class="btn-box">
                        <a href="property-detail.html?id=${property.id}" class="btn-property">Ver Detalles</a>
                    </div>
                </div>
            </div>
        `;
    }

    // --- SECCIÓN SOLARES (Sin cambios lógicos, solo integración) ---
    createSolaresList(solaresData) {
        return solaresData.map(location => `
            <div class="location_group">
                <h4 class="location_title">${location.ubicacion}</h4>
                <div class="solares_table">
                    <div class="table_header">
                        <div class="col_area">Área (m²)</div>
                        <div class="col_frente">Frente (m)</div>
                        <div class="col_fondo">Fondo (m)</div>
                        <div class="col_precio">Precio USD/m²</div>
                        <div class="col_estatus">Estatus Legal</div>
                        <div class="col_total">Total USD</div>
                    </div>
                    ${location.solares.map(solar => this.createSolarRow(solar)).join('')}
                </div>
            </div>
        `).join('');
    }

    createSolarRow(solar) {
        const totalPrice = typeof solar.area_m2 === 'string' ? 'CONSULTAR' :
            (solar.precio_usd_m2 === 'CONSULTAR' ? 'CONSULTAR' :
                (solar.area_m2 * solar.precio_usd_m2).toLocaleString());

        return `
            <div class="solar_row">
                <div class="col_area">${typeof solar.area_m2 === 'string' ? solar.area_m2 : solar.area_m2.toLocaleString()}</div>
                <div class="col_frente">${solar.frente_m ? solar.frente_m.toLocaleString() : '-'}</div>
                <div class="col_fondo">${solar.fondo_m ? solar.fondo_m.toLocaleString() : '-'}</div>
                <div class="col_precio">${solar.precio_usd_m2 === 'CONSULTAR' ? 'CONSULTAR' : '$' + solar.precio_usd_m2.toLocaleString()}</div>
                <div class="col_estatus">
                    <span class="estatus_badge ${solar.estatus_legal ? solar.estatus_legal.toLowerCase().replace(/\s+/g, '_') : ''}">
                        ${solar.estatus_legal}
                    </span>
                </div>
                <div class="col_total">${totalPrice === 'CONSULTAR' ? 'CONSULTAR' : '$' + totalPrice}</div>
            </div>
        `;
    }

    // --- FILTRADO POR CATEGORÍA ---
    filterByCategory(category) {
        const propertiesContainer = document.querySelector('.properties_container');
        if (!propertiesContainer) return;

        // Gestión visual de botones activos (si existen)
        if (event && event.target && event.target.classList.contains('filter_btn')) {
            document.querySelectorAll('.filter_btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        }

        // Si es "all", cargamos todas las propiedades de todas las categorías
        if (category === 'all') {
            let allProperties = [];
            // Recorremos las categorías del JSON para juntar todas las 'properties'
            Object.values(this.propertiesData.categories).forEach(cat => {
                if (cat.properties) {
                    allProperties = allProperties.concat(cat.properties);
                }
            });

            propertiesContainer.innerHTML = `
                <div class="properties_grid">
                    ${allProperties.map(property => this.createPropertyItem(property)).join('')}
                </div>
            `;
            return;
        }

        // Obtener datos de la categoría específica
        const categoryData = this.propertiesData.categories[category];
        if (!categoryData) return;

        // Renderizado según el tipo (Lista para solares, Grid para propiedades)
        if (categoryData.isListFormat && category === 'solares') {
            propertiesContainer.innerHTML = `
                <div class="category_section">
                    <div class="category_header">
                        <h3>${categoryData.name}</h3>
                        <p>${categoryData.description}</p>
                    </div>
                    <div class="solares_list">
                        ${this.createSolaresList(categoryData.data)}
                    </div>
                </div>
            `;
        } else {
            // Caso estándar (Apartamentos, Casas, Oficinas, etc.)
            propertiesContainer.innerHTML = `
                <div class="category_section">
                    <div class="category_header">
                        <h3>${categoryData.name}</h3>
                        <p>${categoryData.description}</p>
                    </div>
                    <div class="properties_grid">
                        ${categoryData.properties.map(property => this.createPropertyItem(property)).join('')}
                    </div>
                </div>
            `;
        }
    }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', function () {
    // Asignamos la instancia a window para poder acceder al manager si fuera necesario
    window.propertiesManager = new PropertiesManager();
});

// Función global para llamar al filtro desde el HTML (botones onclick)
window.filterProperties = function (category) {
    if (window.propertiesManager) {
        window.propertiesManager.filterByCategory(category);
    }
};
// Property Detail Handler
class PropertyDetailManager {
    constructor() {
        this.propertiesData = null;
        this.propertyId = this.getPropertyIdFromUrl();
        this.propertyType = this.getPropertyTypeFromUrl();
        this.init();
    }

    getPropertyIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    getPropertyTypeFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('type') || 'propiedades'; // Default a propiedades
    }

    async init() {
        try {
            console.log('PropertyDetailManager.init() started');
            console.log('Property ID:', this.propertyId);
            console.log('Property Type:', this.propertyType);

            const baseUrl = window.location.origin;
            // Rutas posibles para encontrar el JSON
            const possiblePaths = [
                'data/properties.json',
                `${baseUrl}/data/properties.json`,
                './data/properties.json'
            ];

            let loaded = false;
            for (const path of possiblePaths) {
                try {
                    const response = await fetch(path);
                    if (!response.ok) continue;

                    const text = await response.text();
                    // Intentamos limpiar BOM o caracteres extraños antes de parsear
                    const cleanedText = text.trim().replace(/^\uFEFF/, '');

                    try {
                        this.propertiesData = JSON.parse(cleanedText);
                        loaded = true;
                        console.log('Data loaded from:', path);
                        break;
                    } catch (e) {
                        console.error('JSON parse error:', e);
                    }
                } catch (err) {
                    continue;
                }
            }

            if (loaded) {
                this.loadPropertyDetail();
            } else {
                this.showErrorMessage('No se pudo cargar la información de propiedades.');
            }

        } catch (error) {
            console.error('Error in init:', error);
            this.showErrorMessage('Ocurrió un error al inicializar la página.');
        }
    }

    // Lógica centralizada para encontrar la propiedad
    findProperty() {
        const data = this.propertiesData;
        const id = this.propertyId;
        const type = this.propertyType;

        // 1. Si es tipo SOLARES, usamos la lógica especial
        if (type === 'solares' && data.categories.solares) {
            return this.findSolarProperty(id);
        }

        // 2. Si es una propiedad normal, buscamos en su categoría específica primero
        if (data.categories[type] && data.categories[type].properties) {
            const found = data.categories[type].properties.find(p => p.id === id);
            if (found) return found;
        }

        // 3. Buscar en Destacados (Featured)
        if (data.featured) {
            const found = data.featured.find(p => p.id === id);
            if (found) return found;
        }

        // 4. Búsqueda de emergencia: Buscar en TODAS las categorías normales (menos solares)
        for (const catKey in data.categories) {
            if (catKey === 'solares') continue; // Estructura diferente
            const category = data.categories[catKey];
            if (category.properties) {
                const found = category.properties.find(p => p.id === id);
                if (found) return found;
            }
        }

        return null;
    }

    // Lógica específica para extraer un Solar (que tiene estructura compleja)
    findSolarProperty(id) {
        // Tu lógica original de parsing de IDs de solares
        try {
            const solaresData = this.propertiesData.categories.solares.data;
            let location = null;
            let index = 0;

            if (id.includes('loc___') && id.includes('___idx___')) {
                const parts = id.split('___');
                const locationName = decodeURIComponent(parts[1]);
                index = parseInt(parts[3]);
                location = solaresData.find(loc => loc.ubicacion === locationName);
            } else if (id.includes('-')) {
                // Formato antiguo
                const parts = id.split('-');
                index = parseInt(parts[parts.length - 1]);
                const slugTarget = parts.slice(0, -1).join('-'); // Reconstruir slug
                location = solaresData.find(loc => this.slugify(loc.ubicacion).includes(parts[0]));
            }

            if (location && location.solares && location.solares[index]) {
                // Construimos un objeto "Propiedad" falso para el renderizado
                const solar = location.solares[index];
                return {
                    ...solar,
                    id: id,
                    title: `Solar en ${location.ubicacion}`,
                    location: location.ubicacion,
                    type: 'Solar',
                    image: 'images/s-4.jpg',
                    description: `Solar ubicado en ${location.ubicacion} con ${solar.area_m2} m².`,
                    gallery: ['images/s-4.jpg', 'images/s-2.jpg', 'images/s-3.jpg'] // Imágenes default
                };
            }
        } catch (e) {
            console.error('Error parsing solar ID', e);
        }
        return null;
    }

    loadPropertyDetail() {
        if (!this.propertyId || !this.propertiesData) {
            this.showErrorMessage('No se encontró la propiedad solicitada.');
            return;
        }

        const property = this.findProperty();

        // Si es tipo solares, aunque lo encontremos, mostramos el formulario directo (tu lógica original)
        if (this.propertyType === 'solares') {
            console.log('Solar found, showing contact form');
            // Usamos showErrorMessage como "hack" para mostrar el form de solares
            this.showErrorMessage('Solar View');
            return;
        }

        if (property) {
            console.log('Found property:', property);
            this.renderPropertyDetail(property);
        } else {
            console.error('Property not found with ID:', this.propertyId);
            this.showErrorMessage('No se encontró la propiedad solicitada.');
        }
    }

    slugify(text) {
        return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    }

    renderPropertyDetail(property) {
        const container = document.getElementById('property-detail-container');

        // Determinar imágenes
        let galleryImages = [];
        if (property.gallery && property.gallery.length > 0) {
            galleryImages = property.gallery.map(src => ({ src: src, alt: property.title }));
        } else if (property.image) {
            galleryImages = [{ src: property.image, alt: property.title }];
        }

        const hasImages = galleryImages.length > 0;

        // Renderizado del HTML
        const html = `
            <div class="row">
                <div class="col-lg-8">
                    <div class="property-gallery">
                        ${hasImages ? `
                        <div class="property-gallery-container" id="gallery-${property.id}">
                            <div class="main-image-container">
                                <img src="${galleryImages[0].src}" alt="${galleryImages[0].alt}" class="main-image" id="main-image-${property.id}">
                                
                                ${galleryImages.length > 1 ? `
                                    <button class="carousel-nav prev" onclick="window.propertyCarousel.previousImage('${property.id}')">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                    <button class="carousel-nav next" onclick="window.propertyCarousel.nextImage('${property.id}')">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                    <div class="image-counter" id="image-counter-${property.id}">
                                        1 / ${galleryImages.length}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="thumbnail-container">
                                ${galleryImages.map((img, index) => `
                                    <img src="${img.src}" alt="${img.alt}" class="thumbnail ${index === 0 ? 'active' : ''}" 
                                         onclick="window.propertyCarousel.goToImage('${property.id}', ${index})">
                                `).join('')}
                            </div>
                        </div>
                        ` : '<p>No hay imágenes disponibles</p>'}
                    </div>
                    
                    <div class="property-info mt-4">
                        <h2 class="property-title">${property.title}</h2>
                        <p class="property-price">${this.formatPrice(property)}</p>
                        
                        <div class="property-meta">
                            <div class="meta-item"><i class="fas fa-map-marker-alt"></i> <span>${property.location}</span></div>
                            <div class="meta-item"><i class="fas fa-home"></i> <span>${property.type || property.categoryType}</span></div>
                            ${property.area ? `<div class="meta-item"><i class="fas fa-ruler-combined"></i> <span>${property.area}</span></div>` : ''}
                            ${property.units ? `<div class="meta-item"><i class="fas fa-building"></i> <span>${property.units} unidades</span></div>` : ''}
                        </div>
                        
                        <div class="property-description mt-4">
                            <h4>Descripción</h4>
                            <p>${property.description}</p>
                        </div>
                        
                        ${this.renderFeatures(property)}
                        ${this.renderApartmentTypes(property)}
                        ${this.renderPaymentPlan(property)}
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <div class="contact-form">
                        <h4>Solicitar Información</h4>
                        <form id="contactForm">
                            <div class="form-group">
                                <label>Nombre</label>
                                <input type="text" class="form-control" id="name" required>
                            </div>
                            <div class="form-group">
                                <label>Correo Electrónico</label>
                                <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="form-group">
                                <label>Teléfono</label>
                                <input type="tel" class="form-control" id="phone" required>
                            </div>
                            <div class="form-group">
                                <label>Mensaje</label>
                                <textarea class="form-control" id="message" rows="4">Estoy interesado en: ${property.title}</textarea>
                            </div>
                            <button type="submit" class="btn-contact">Enviar Solicitud</button>
                        </form>
                    </div>

                    <div class="property-info mt-4">
                         <h4>Contacto Directo</h4>
                         <div class="meta-item mb-2"><i class="fas fa-phone"></i> <span>+1 (809) 864-1996</span></div>
                         <div class="meta-item"><i class="fas fa-envelope"></i> <span>lowestwessin@realestatewl.com</span></div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Manejo simple del submit
        document.getElementById('contactForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Gracias por su mensaje. Nos pondremos en contacto pronto.');
        });
    }

    renderFeatures(property) {
        if (!property.features || property.features.length === 0) return '';
        return `
            <div class="property-features mt-4">
                <h4>Características</h4>
                <div class="feature-list">
                    ${property.features.map(f => `<div class="feature-item"><i class="fas fa-check-circle"></i> <span>${f}</span></div>`).join('')}
                </div>
            </div>`;
    }

    renderApartmentTypes(property) {
        if (!property.apartment_types || property.apartment_types.length === 0) return '';
        return `
            <div class="mt-4">
                <h4>Tipos de Apartamentos</h4>
                ${property.apartment_types.map(apt => `
                    <div class="card mb-2">
                        <div class="card-header">Tipo ${apt.type} (${apt.area})</div>
                        <div class="card-body">
                            <ul>${apt.features.map(f => `<li>${f}</li>`).join('')}</ul>
                        </div>
                    </div>`).join('')}
            </div>`;
    }

    renderPaymentPlan(property) {
        if (!property.payment_plan) return '';
        const p = property.payment_plan;
        return `
            <div class="mt-4">
                <h4>Plan de Pago</h4>
                <ul class="list-group">
                    <li class="list-group-item">Reserva: ${p.reservation}</li>
                    <li class="list-group-item">Contrato: ${p.contract}</li>
                    <li class="list-group-item">Construcción: ${p.construction}</li>
                    <li class="list-group-item">Entrega: ${p.delivery}</li>
                </ul>
            </div>`;
    }

    formatPrice(property) {
        if (property.showPrice === false) return 'A Consultar';
        return property.price ? `$${property.price.toLocaleString()} ${property.currency || 'USD'}` : 'A Consultar';
    }

    // Esta función maneja TANTO errores como el formulario especial de SOLARES
    showErrorMessage(message) {
        const container = document.getElementById('property-detail-container');

        // CASO ESPECIAL: Si es tipo SOLARES, mostramos el form específico (Tu lógica original adaptada)
        if (this.propertyType === 'solares') {
            const solar = this.findSolarProperty(this.propertyId);
            const locationName = solar ? solar.location : 'este solar';

            // Renderizamos solo el form de contacto para solares
            container.innerHTML = `
                <div class="row">
                    <div class="col-lg-8 offset-lg-2">
                        <div class="contact-form">
                            <h3>¿Desea contactarnos sobre este solar?</h3>
                            <p>Complete el formulario para recibir más información sobre el solar en ${locationName}.</p>
                            <form id="solarForm">
                                <div class="form-group"><label>Nombre</label><input class="form-control" required></div>
                                <div class="form-group"><label>Email</label><input class="form-control" type="email" required></div>
                                <div class="form-group"><label>Teléfono</label><input class="form-control" required></div>
                                <div class="form-group"><label>Mensaje</label><textarea class="form-control" rows="4">Me interesa el solar en ${locationName}.</textarea></div>
                                <button type="submit" class="btn-contact">Enviar</button>
                            </form>
                        </div>
                    </div>
                </div>`;

            document.getElementById('solarForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                container.innerHTML = `<div class="alert alert-success">Gracias, le contactaremos pronto.</div>`;
            });
            return;
        }

        // Caso de error real
        container.innerHTML = `
            <div class="property-not-found text-center">
                <h3>Lo sentimos</h3>
                <p>${message}</p>
                <a href="propiedades.html" class="btn-property">Volver a Propiedades</a>
            </div>
        `;
    }
}

/**
 * LOGICA DEL CARRUSEL (GLOBAL)
 * Reemplazamos la clase local anterior por este objeto global 
 * para que coincida con lo usado en properties.js y el HTML generado.
 */
window.propertyCarousel = {
    currentIndices: {},

    getThumbnails: function (propertyId) {
        const container = document.getElementById(`gallery-${propertyId}`);
        if (!container) return [];
        return Array.from(container.querySelectorAll('.thumbnail'));
    },

    nextImage: function (propertyId) {
        const thumbnails = this.getThumbnails(propertyId);
        if (thumbnails.length === 0) return;

        if (this.currentIndices[propertyId] === undefined) this.currentIndices[propertyId] = 0;

        let newIndex = this.currentIndices[propertyId] + 1;
        if (newIndex >= thumbnails.length) newIndex = 0;

        this.updateGallery(propertyId, newIndex, thumbnails);
    },

    previousImage: function (propertyId) {
        const thumbnails = this.getThumbnails(propertyId);
        if (thumbnails.length === 0) return;

        if (this.currentIndices[propertyId] === undefined) this.currentIndices[propertyId] = 0;

        let newIndex = this.currentIndices[propertyId] - 1;
        if (newIndex < 0) newIndex = thumbnails.length - 1;

        this.updateGallery(propertyId, newIndex, thumbnails);
    },

    goToImage: function (propertyId, index) {
        const thumbnails = this.getThumbnails(propertyId);
        this.updateGallery(propertyId, index, thumbnails);
    },

    updateGallery: function (propertyId, index, thumbnails) {
        this.currentIndices[propertyId] = index;

        const mainImage = document.getElementById(`main-image-${propertyId}`);
        if (mainImage && thumbnails[index]) {
            mainImage.src = thumbnails[index].src;
        }

        const counter = document.getElementById(`image-counter-${propertyId}`);
        if (counter) {
            counter.innerText = `${index + 1} / ${thumbnails.length}`;
        }

        thumbnails.forEach((thumb, i) => {
            if (i === index) thumb.classList.add('active');
            else thumb.classList.remove('active');
        });
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    new PropertyDetailManager();
});
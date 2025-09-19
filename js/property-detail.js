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
        return urlParams.get('type') || 'propiedades';
    }

    async init() {
        try {
            // Get the base URL of the current page
            const baseUrl = window.location.origin;
            
            const possiblePaths = [
                'data/properties.json',
                './data/properties.json',
                '/data/properties.json',
                `${baseUrl}/data/properties.json`,
                `${baseUrl}/data/properties.json?t=${Date.now()}` // Cache buster with absolute URL
            ];

            let loaded = false;
            for (const path of possiblePaths) {
                try {
                    console.log(`Attempting to fetch properties data from: ${path}`);
                    const response = await fetch(path);
                    console.log('Response status:', response.status);
                    console.log('Response ok:', response.ok);
                    
                    if (!response.ok) {
                        console.log(`Failed to fetch from ${path}, trying next path...`);
                        continue;
                    }
                    
                    const text = await response.text();
                    console.log('Raw response text (first 100 chars):', text.substring(0, 100));
                    
                    // Try to parse the JSON manually to catch any parsing errors
                    try {
                        this.propertiesData = JSON.parse(text);
                        console.log('JSON parsed successfully');
                    } catch (parseError) {
                        console.error('JSON parse error:', parseError);
                        // Try to fix common JSON issues and parse again
                        const cleanedText = text.trim().replace(/^\uFEFF/, ''); // Remove BOM if present
                        try {
                            this.propertiesData = JSON.parse(cleanedText);
                            console.log('JSON parsed successfully after cleaning');
                        } catch (secondParseError) {
                            console.error('JSON parse error after cleaning:', secondParseError);
                            throw secondParseError;
                        }
                    }
                    
                    console.log('Properties data loaded successfully from:', path);
                    this.loadPropertyDetail();
                    loaded = true;
                    break; // Success, exit the loop
                } catch (error) {
                    console.error(`Error loading from ${path}:`, error);
                    continue; // Try next path
                }
            }

            if (!loaded) {
                console.error('Failed to load properties data from all attempted paths');
                this.showErrorMessage('No se pudo cargar la información de propiedades.');
            }
        } catch (error) {
            console.error('Error in init:', error);
            this.showErrorMessage('Ocurrió un error al inicializar la página.');
        }
    }

    loadPropertyDetail() {
        if (!this.propertyId || !this.propertiesData) {
            this.showErrorMessage('No se encontró la propiedad solicitada.');
            return;
        }

        try {
            let property = null;
            
            // Check in regular properties
            if (this.propertyType === 'propiedades' && this.propertiesData.categories.propiedades) {
                property = this.propertiesData.categories.propiedades.properties.find(p => p.id === this.propertyId);
            }
            
            // Check in oficinas
            if (!property && this.propertyType === 'oficinas' && this.propertiesData.categories.oficinas) {
                property = this.propertiesData.categories.oficinas.properties.find(p => p.id === this.propertyId);
            }
            
            // Check in featured properties
            if (!property && this.propertiesData.featured) {
                property = this.propertiesData.featured.find(p => p.id === this.propertyId);
            }
            
            // Check in solares (different structure)
            if (!property && this.propertyType === 'solares' && this.propertiesData.categories.solares) {
                // For solares, we need to handle the different data structure
                // The ID format would be location-index, like "bella-vista-0"
                if (this.propertyId.includes('-')) {
                    const [locationSlug, indexStr] = this.propertyId.split('-');
                    const index = parseInt(indexStr);
                    
                    // Find the location
                    const location = this.propertiesData.categories.solares.data.find(loc => 
                        this.slugify(loc.ubicacion) === locationSlug
                    );
                    
                    if (location && location.solares && location.solares[index]) {
                        property = {
                            ...location.solares[index],
                            id: this.propertyId,
                            title: `Solar en ${location.ubicacion}`,
                            location: location.ubicacion,
                            type: 'Solar',
                            image: 'images/s-4.jpg', // Default image for solares
                            description: `Solar ubicado en ${location.ubicacion} con ${location.solares[index].area_m2} m².`
                        };
                    }
                }
            }
            
            if (property) {
                this.renderPropertyDetail(property);
            } else {
                this.showErrorMessage('No se encontró la propiedad solicitada.');
            }
        } catch (error) {
            console.error('Error loading property detail:', error);
            this.showErrorMessage('Ocurrió un error al cargar los detalles de la propiedad.');
        }
    }

    slugify(text) {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    }

    renderPropertyDetail(property) {
        const container = document.getElementById('property-detail-container');
        
        // Determine if it's a solar or regular property
        const isSolar = this.propertyType === 'solares';
        
        let galleryImages = [];
        if (isSolar) {
            // For solares, use a default set of images
            galleryImages = [
                { src: 'images/s-4.jpg', alt: 'Vista del terreno' },
                { src: 'images/s-2.jpg', alt: 'Vista adicional' },
                { src: 'images/s-3.jpg', alt: 'Vista panorámica' }
            ];
        } else if (property.gallery && property.gallery.length > 0) {
            // If property has a gallery array, use those images
            galleryImages = property.gallery.map(src => ({ 
                src: src, 
                alt: `${property.title} - Vista` 
            }));
        } else {
            // For regular properties without gallery, use the property image and some defaults
            galleryImages = [
                { src: property.image, alt: property.title },
                { src: 'images/s-1.jpg', alt: 'Vista interior' },
                { src: 'images/s-2.jpg', alt: 'Vista adicional' }
            ];
        }
        
        // Create HTML for property details
        let html = `
            <div class="row">
                <div class="col-lg-8">
                    <div class="property-gallery">
                        <img src="${galleryImages[0].src}" alt="${galleryImages[0].alt}" class="main-image" id="main-image">
                        <div class="thumbnail-container">
                            ${galleryImages.map((img, index) => `
                                <img src="${img.src}" alt="${img.alt}" class="thumbnail" onclick="document.getElementById('main-image').src='${img.src}'">
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="property-info">
                        <h2 class="property-title">${property.title}</h2>
                        <p class="property-price">${this.formatPrice(property)}</p>
                        
                        <div class="property-meta">
                            <div class="meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${property.location}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-home"></i>
                                <span>${property.type}</span>
                            </div>
                            ${property.area ? `
                            <div class="meta-item">
                                <i class="fas fa-ruler-combined"></i>
                                <span>${property.area}</span>
                            </div>
                            ` : ''}
                            ${property.units ? `
                            <div class="meta-item">
                                <i class="fas fa-building"></i>
                                <span>${property.units} unidades</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="property-description">
                            <h4>Descripción</h4>
                            <p>${property.description}</p>
                        </div>
                        
                        ${this.renderFeatures(property)}
                        
                        ${this.renderSolarDetails(property, isSolar)}
                        
                        ${this.renderApartmentTypes(property)}
                        
                        ${this.renderPaymentPlan(property)}
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <div class="contact-form">
                        <h4>Solicitar Información</h4>
                        <form>
                            <div class="form-group">
                                <label for="name">Nombre</label>
                                <input type="text" class="form-control" id="name" placeholder="Su nombre">
                            </div>
                            <div class="form-group">
                                <label for="email">Correo Electrónico</label>
                                <input type="email" class="form-control" id="email" placeholder="Su correo electrónico">
                            </div>
                            <div class="form-group">
                                <label for="phone">Teléfono</label>
                                <input type="tel" class="form-control" id="phone" placeholder="Su número de teléfono">
                            </div>
                            <div class="form-group">
                                <label for="message">Mensaje</label>
                                <textarea class="form-control" id="message" rows="4" placeholder="Su mensaje"></textarea>
                            </div>
                            <button type="submit" class="btn-contact">Enviar Solicitud</button>
                        </form>
                    </div>
                    
                    <div class="property-info mt-4">
                        <h4>Contacto Directo</h4>
                        <div class="meta-item mb-2">
                            <i class="fas fa-phone"></i>
                            <span>+1 (809) 864-1996</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-envelope"></i>
                            <span>lowestwessin@realestatewl.com</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    renderFeatures(property) {
        if (!property.features || property.features.length === 0) {
            return '';
        }
        
        return `
            <div class="property-features">
                <h4>Características</h4>
                <div class="feature-list">
                    ${property.features.map(feature => `
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>${feature}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderSolarDetails(property, isSolar) {
        if (!isSolar) {
            return '';
        }
        
        return `
            <div class="property-solar-details">
                <h4>Detalles del Terreno</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <tbody>
                            <tr>
                                <th>Área (m²)</th>
                                <td>${typeof property.area_m2 === 'string' ? property.area_m2 : property.area_m2.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <th>Frente (m)</th>
                                <td>${property.frente_m ? property.frente_m.toLocaleString() : '-'}</td>
                            </tr>
                            <tr>
                                <th>Fondo (m)</th>
                                <td>${property.fondo_m ? property.fondo_m.toLocaleString() : '-'}</td>
                            </tr>
                            <tr>
                                <th>Precio USD/m²</th>
                                <td>${property.precio_usd_m2 === 'CONSULTAR' ? 'CONSULTAR' : '$' + property.precio_usd_m2.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <th>Estatus Legal</th>
                                <td>${property.estatus_legal}</td>
                            </tr>
                            <tr>
                                <th>Precio Total</th>
                                <td>${this.calculateTotalPrice(property)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    renderApartmentTypes(property) {
        if (!property.apartment_types || property.apartment_types.length === 0) {
            return '';
        }
        
        return `
            <div class="property-apartment-types mt-4">
                <h4>Tipos de Apartamentos</h4>
                <div class="accordion" id="apartmentTypesAccordion">
                    ${property.apartment_types.map((apt, index) => `
                        <div class="card">
                            <div class="card-header" id="heading${index}">
                                <h5 class="mb-0">
                                    <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${index}" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="collapse${index}">
                                        APARTAMENTOS TIPO ${apt.type} (${apt.area})
                                    </button>
                                </h5>
                            </div>
                            <div id="collapse${index}" class="collapse ${index === 0 ? 'show' : ''}" aria-labelledby="heading${index}" data-parent="#apartmentTypesAccordion">
                                <div class="card-body">
                                    <ul class="list-unstyled">
                                        ${apt.features.map(feature => `<li><i class="fas fa-check-circle mr-2"></i>${feature}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderPaymentPlan(property) {
        if (!property.payment_plan) {
            return '';
        }
        
        return `
            <div class="property-payment-plan mt-4">
                <h4>Forma de Pago</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <tbody>
                            <tr>
                                <th>Reserva</th>
                                <td>${property.payment_plan.reservation}</td>
                            </tr>
                            <tr>
                                <th>Firma del contrato</th>
                                <td>${property.payment_plan.contract}</td>
                            </tr>
                            <tr>
                                <th>Durante construcción</th>
                                <td>${property.payment_plan.construction}</td>
                            </tr>
                            <tr>
                                <th>Contra-entrega</th>
                                <td>${property.payment_plan.delivery}</td>
                            </tr>
                            ${property.delivery ? `
                            <tr>
                                <th>Fecha de entrega</th>
                                <td>${property.delivery}</td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    calculateTotalPrice(property) {
        if (typeof property.area_m2 === 'string') return 'CONSULTAR';
        if (property.precio_usd_m2 === 'CONSULTAR') return 'CONSULTAR';
        
        const totalPrice = property.area_m2 * property.precio_usd_m2;
        return '$' + totalPrice.toLocaleString();
    }
    
    formatPrice(property) {
        if (property.price) {
            return `$${property.price.toLocaleString()} ${property.currency || 'USD'}`;
        } else if (property.precio_usd_m2) {
            if (property.precio_usd_m2 === 'CONSULTAR') {
                return 'Precio: CONSULTAR';
            } else {
                return `$${property.precio_usd_m2.toLocaleString()} USD/m²`;
            }
        }
        return 'Precio: CONSULTAR';
    }

    showErrorMessage(message) {
        const container = document.getElementById('property-detail-container');
        container.innerHTML = `
            <div class="property-not-found">
                <h3>Lo sentimos</h3>
                <p>${message}</p>
                <a href="propiedades.html" class="btn-contact">Ver todas las propiedades</a>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new PropertyDetailManager();
});

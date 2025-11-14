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
            console.log('PropertyDetailManager.init() started');
            console.log('Property ID from URL:', this.propertyId);
            console.log('Property Type from URL:', this.propertyType);
            
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
                    
                    // Add a timeout to ensure we don't get stuck
                    const timeoutPromise = new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject(new Error('Timeout loading property details'));
                        }, 5000); // 5 second timeout
                    });
                    
                    try {
                        // Race between the property loading and the timeout
                        await Promise.race([
                            new Promise(resolve => {
                                try {
                                    this.loadPropertyDetail();
                                    resolve();
                                } catch (err) {
                                    console.error('Error in loadPropertyDetail:', err);
                                    resolve();
                                }
                            }),
                            timeoutPromise
                        ]);
                        
                        loaded = true;
                        break; // Success, exit the loop
                    } catch (timeoutError) {
                        console.error('Timeout loading property details:', timeoutError);
                        this.showErrorMessage('La carga de detalles tomó demasiado tiempo. Por favor, inténtelo de nuevo.');
                        return;
                    }
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
            console.error('Property ID or data not available:', { id: this.propertyId, dataAvailable: !!this.propertiesData });
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
                console.log('Checking solares for ID:', this.propertyId);
                
                // For solares, we need to handle the different data structure
                // The ID format is now loc___[encodedLocationName]___idx___[index]
                var location = null;
                var index = 0;
                var locationName = '';
                
                // Try the new format first
                if (this.propertyId.includes('loc___') && this.propertyId.includes('___idx___')) {
                    // Parse the new ID format
                    const parts = this.propertyId.split('___');
                    if (parts.length >= 4) {
                        const encodedLocationName = parts[1];
                        locationName = decodeURIComponent(encodedLocationName);
                        const indexStr = parts[3];
                        index = parseInt(indexStr);
                        
                        console.log('Looking for location name:', locationName, 'index:', index);
                        
                        // Log all available locations for debugging
                        if (this.propertiesData.categories.solares.data) {
                            console.log('Available locations:', 
                                this.propertiesData.categories.solares.data.map(loc => ({
                                    name: loc.ubicacion,
                                    solaresCount: loc.solares ? loc.solares.length : 0
                                }))
                            );
                        }
                        
                        // Find the location by exact name match
                        location = this.propertiesData.categories.solares.data.find(loc => 
                            loc.ubicacion === locationName
                        );
                    }
                } else if (this.propertyId.includes('-')) {
                    // Fallback for the old format (location-index)
                    console.log('Using fallback for old ID format');
                    const parts = this.propertyId.split('-');
                    const locationSlug = parts[0];
                    const indexStr = parts[parts.length - 1]; // Get the last part as the index
                    index = parseInt(indexStr);
                    
                    console.log('Looking for location slug:', locationSlug, 'index:', index);
                    
                    // Log all available locations for debugging
                    if (this.propertiesData.categories.solares.data) {
                        console.log('Available locations:', 
                            this.propertiesData.categories.solares.data.map(loc => ({
                                name: loc.ubicacion,
                                slug: this.slugify(loc.ubicacion),
                                solaresCount: loc.solares ? loc.solares.length : 0
                            }))
                        );
                    }
                    
                    // Find the location
                    location = this.propertiesData.categories.solares.data.find(loc => 
                        this.slugify(loc.ubicacion) === locationSlug
                    );
                    
                    if (location) {
                        locationName = location.ubicacion;
                    }
                }
                    
                    console.log('Found location:', location ? location.ubicacion : 'Not found');
                    
                    if (location && location.solares) {
                        console.log('Solares in location:', location.solares.length);
                        console.log('Looking for index:', index);
                        
                        if (location.solares[index]) {
                            console.log('Found solar at index:', index, location.solares[index]);
                            
                            property = {
                                ...location.solares[index],
                                id: this.propertyId,
                                title: `Solar en ${location.ubicacion}`,
                                location: location.ubicacion,
                                type: 'Solar',
                                image: 'images/s-4.jpg', // Default image for solares
                                description: `Solar ubicado en ${location.ubicacion} con ${location.solares[index].area_m2} m².`
                            };
                        } else {
                            console.error('Solar not found at index:', index);
                        }
                    } else {
                        console.error('Location has no solares or location not found');
                    }
                } else {
                    console.error('Invalid property ID format for solares:', this.propertyId);
                }
            
            
            // For solares, always show the contact form instead of property details
            if (this.propertyType === 'solares') {
                console.log('Solar found, showing contact form instead of details');
                this.showErrorMessage('No se encontró la propiedad solicitada.');
            } else if (property) {
                console.log('Found property:', property);
                this.renderPropertyDetail(property);
            } else {
                console.error('Property not found with ID:', this.propertyId);
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
                        <div class="property-gallery-container">
                            <div class="main-image-container">
                                <img src="${galleryImages[0].src}" alt="${galleryImages[0].alt}" class="main-image" id="main-image">
                                ${galleryImages.length > 1 ? `
                                    <button class="carousel-nav prev" id="prev-btn" onclick="propertyCarousel.previousImage()">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                    <button class="carousel-nav next" id="next-btn" onclick="propertyCarousel.nextImage()">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                    <div class="image-counter" id="image-counter">
                                        1 / ${galleryImages.length}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="thumbnail-container">
                                ${galleryImages.map((img, index) => `
                                    <img src="${img.src}" alt="${img.alt}" class="thumbnail ${index === 0 ? 'active' : ''}" 
                                         onclick="propertyCarousel.goToImage(${index})" data-index="${index}">
                                `).join('')}
                            </div>
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
        
        // Check if this is a Dominican Peso property
        const isDominicanPeso = property.location === 'Bella Vista Sur' && 
                               (property.precio_usd_m2 === 1050000 || property.precio_usd_m2 === 2800000);
        
        // Check if the value is likely a total price rather than a price per m²
        // Values over 10,000 are likely total prices, not price per m²
        const isLikelyTotalPrice = typeof property.precio_usd_m2 === 'number' && property.precio_usd_m2 > 10000;
        
        // Calculate price per m² for properties with total price stored
        let pricePerM2;
        if (isDominicanPeso || isLikelyTotalPrice) {
            // For Dominican Peso properties or properties with total prices,
            // the stored value is the total price
            // We need to calculate the price per m²
            pricePerM2 = typeof property.area_m2 === 'string' ? 'CONSULTAR' : 
                        (property.precio_usd_m2 === 'CONSULTAR' ? 'CONSULTAR' : 
                         Math.round(property.precio_usd_m2 / property.area_m2));
        } else {
            // For properties with price per m², use the stored value
            pricePerM2 = property.precio_usd_m2;
        }
        
        // Format price display
        const priceDisplay = pricePerM2 === 'CONSULTAR' ? 'CONSULTAR' : 
                            (isDominicanPeso ? 'RD$' + pricePerM2.toLocaleString() + ' DOP/m²' : 
                                              '$' + pricePerM2.toLocaleString() + ' USD/m²');
        
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
                                <th>Precio por m²</th>
                                <td>${priceDisplay}</td>
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
        
        // Special case for Bella Vista Sur solares which are in DOP (Dominican Peso)
        const isDominicanPeso = property.location === 'Bella Vista Sur' && 
                               (property.precio_usd_m2 === 1050000 || property.precio_usd_m2 === 2800000);
        
        // Check if the value is likely a total price rather than a price per m²
        // Values over 10,000 are likely total prices, not price per m²
        const isLikelyTotalPrice = typeof property.precio_usd_m2 === 'number' && property.precio_usd_m2 > 10000;
        
        if (isDominicanPeso) {
            // For Dominican Peso properties, the stored value is the total price
            return 'RD$' + property.precio_usd_m2.toLocaleString() + ' DOP';
        } else if (isLikelyTotalPrice) {
            // For properties with total price stored in precio_usd_m2
            return '$' + property.precio_usd_m2.toLocaleString() + ' USD';
        } else {
            // For properties with price per m², calculate the total price
            const totalPrice = property.area_m2 * property.precio_usd_m2;
            return '$' + totalPrice.toLocaleString() + ' USD';
        }
    }
    
    formatPrice(property) {
        if (property.price) {
            return `$${property.price.toLocaleString()} ${property.currency || 'USD'}`;
        } else if (property.precio_usd_m2) {
            if (property.precio_usd_m2 === 'CONSULTAR') {
                return 'Precio: CONSULTAR';
            } else {
                // Special case for Bella Vista Sur solares which are in DOP (Dominican Peso)
                if (property.location === 'Bella Vista Sur' && 
                   (property.precio_usd_m2 === 1050000 || property.precio_usd_m2 === 2800000)) {
                    return `RD$${property.precio_usd_m2.toLocaleString()} DOP/m²`;
                } else {
                    return `$${property.precio_usd_m2.toLocaleString()} USD/m²`;
                }
            }
        }
        return 'Precio: CONSULTAR';
    }

    showErrorMessage(message) {
        const container = document.getElementById('property-detail-container');
        
            // For solares, show contact form instead of error message
        if (this.propertyType === 'solares') {
            const solarId = this.propertyId;
            let locationName = '';
            let solarDetails = '';
            let area = '';
            let priceInfo = '';
            let solar = null; // Define solar variable at this scope
            let index = 0;
            
            console.log('Showing contact form for solar ID:', solarId);
            
            // Try to extract location from the ID using the new format first
            if (solarId && solarId.includes('loc___') && solarId.includes('___idx___')) {
                // Parse the new ID format
                const parts = solarId.split('___');
                if (parts.length >= 4) {
                    const encodedLocationName = parts[1];
                    locationName = decodeURIComponent(encodedLocationName);
                    const indexStr = parts[3];
                    index = parseInt(indexStr);
                    
                    console.log('Contact form: Using new ID format. Location:', locationName, 'Index:', index);
                    
                    // Try to get additional details from the data
                    try {
                        if (this.propertiesData && this.propertiesData.categories && this.propertiesData.categories.solares) {
                            console.log('Available locations for contact form:', 
                                this.propertiesData.categories.solares.data.map(loc => ({
                                    name: loc.ubicacion,
                                    solaresCount: loc.solares ? loc.solares.length : 0
                                }))
                            );
                            
                            const location = this.propertiesData.categories.solares.data.find(loc => 
                                loc.ubicacion === locationName
                            );
                            
                            console.log('Found location for contact form:', location ? location.ubicacion : 'Not found');
                            
                            if (location && location.solares && location.solares[index]) {
                                solar = location.solares[index]; // Assign to the outer scope variable
                                console.log('Found solar for contact form:', solar);
                                area = solar.area_m2 ? `${solar.area_m2.toLocaleString()} m²` : '';
                                
                                // Check if this is a Dominican Peso property
                                const isDominicanPeso = locationName === 'Bella Vista Sur' && 
                                                      (solar.precio_usd_m2 === 1050000 || solar.precio_usd_m2 === 2800000);
                                
                                // Check if the value is likely a total price rather than a price per m²
                                const isLikelyTotalPrice = typeof solar.precio_usd_m2 === 'number' && solar.precio_usd_m2 > 10000;
                                
                                if (isDominicanPeso) {
                                    priceInfo = `RD$${solar.precio_usd_m2.toLocaleString()} DOP`;
                                } else if (isLikelyTotalPrice) {
                                    priceInfo = `$${solar.precio_usd_m2.toLocaleString()} USD`;
                                } else if (typeof solar.precio_usd_m2 === 'number') {
                                    priceInfo = `$${solar.precio_usd_m2.toLocaleString()} USD/m²`;
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error getting solar details for contact form:', error);
                    }
                }
            } 
            // Fall back to the old format if needed
            else if (solarId && solarId.includes('-')) {
                const locationSlug = solarId.split('-')[0];
                const indexStr = solarId.split('-')[1];
                index = parseInt(indexStr);
                
                console.log('Contact form: Using old ID format. Location slug:', locationSlug, 'Index:', index);
                
                // First, try to get the actual location name from the data
                try {
                    if (this.propertiesData && this.propertiesData.categories && this.propertiesData.categories.solares) {
                        const location = this.propertiesData.categories.solares.data.find(loc => 
                            this.slugify(loc.ubicacion) === locationSlug
                        );
                        
                        if (location) {
                            // Use the actual location name from the data
                            locationName = location.ubicacion;
                            
                            if (location.solares && location.solares[index]) {
                                solar = location.solares[index]; // Assign to the outer scope variable
                                console.log('Found solar for contact form (old format):', solar);
                                area = solar.area_m2 ? `${solar.area_m2.toLocaleString()} m²` : '';
                                
                                // Check if this is a Dominican Peso property
                                const isDominicanPeso = locationName === 'Bella Vista Sur' && 
                                                      (solar.precio_usd_m2 === 1050000 || solar.precio_usd_m2 === 2800000);
                                
                                // Check if the value is likely a total price rather than a price per m²
                                const isLikelyTotalPrice = typeof solar.precio_usd_m2 === 'number' && solar.precio_usd_m2 > 10000;
                                
                                if (isDominicanPeso) {
                                    priceInfo = `RD$${solar.precio_usd_m2.toLocaleString()} DOP`;
                                } else if (isLikelyTotalPrice) {
                                    priceInfo = `$${solar.precio_usd_m2.toLocaleString()} USD`;
                                } else if (typeof solar.precio_usd_m2 === 'number') {
                                    priceInfo = `$${solar.precio_usd_m2.toLocaleString()} USD/m²`;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error getting location name for contact form:', error);
                }
                
                // If we couldn't get the name from data, fall back to reconstructing from slug
                if (!locationName) {
                    locationName = locationSlug.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                }
            }
            
            // Debug information
            console.log('Solar ID:', solarId);
            console.log('Location Name:', locationName);
            console.log('Solar Object:', solar);
            
            // Create the pre-filled message with available details in the format requested
            let prefilledMessage = `Me interesa el solar en ${locationName || 'esta ubicación'}`;
            
            // Make sure we have the solar data
            if (!solar) {
                console.warn('Solar data not available for message generation');
                // Try to get solar data directly from the properties data
                try {
                    if (this.propertiesData && this.propertiesData.categories && this.propertiesData.categories.solares) {
                        // Log all available locations to help with debugging
                        console.log('All available locations:', 
                            this.propertiesData.categories.solares.data.map(loc => loc.ubicacion)
                        );
                        
                        // Try to find the location by name
                        const location = this.propertiesData.categories.solares.data.find(loc => 
                            loc.ubicacion === locationName
                        );
                        
                        if (location && location.solares && location.solares[index]) {
                            solar = location.solares[index];
                            console.log('Found solar data in fallback code:', solar);
                        }
                    }
                } catch (error) {
                    console.error('Error in fallback solar data retrieval:', error);
                }
                
                if (!solar) {
                    prefilledMessage += `. Por favor, contáctenme para obtener más información sobre este solar.`;
                }
            }
            
            if (solar) {
                // Add area information if available
                if (solar.area_m2) {
                    console.log('Area:', solar.area_m2);
                    prefilledMessage += `, del tamaño de ${solar.area_m2.toLocaleString()} m²`;
                } else {
                    console.warn('Area not available');
                }
                
                // Add price information
                if (solar.precio_usd_m2) {
                    console.log('Price:', solar.precio_usd_m2);
                    // Check if this is a Dominican Peso property
                    const isDominicanPeso = locationName === 'Bella Vista Sur' && 
                                         (solar.precio_usd_m2 === 1050000 || solar.precio_usd_m2 === 2800000);
                    
                    // Check if the value is likely a total price rather than a price per m²
                    const isLikelyTotalPrice = typeof solar.precio_usd_m2 === 'number' && solar.precio_usd_m2 > 10000;
                    
                    if (isDominicanPeso || isLikelyTotalPrice) {
                        // For properties with total price stored
                        prefilledMessage += ` por ${isDominicanPeso ? 'RD$' : '$'}${solar.precio_usd_m2.toLocaleString()} ${isDominicanPeso ? 'DOP' : 'USD'}`;
                    } else {
                        // For properties with price per m² stored
                        const totalPrice = solar.area_m2 * solar.precio_usd_m2;
                        prefilledMessage += ` por $${totalPrice.toLocaleString()} USD`;
                    }
                } else {
                    console.warn('Price not available');
                }
                
                // Add additional details if available
                if (solar.frente_m) {
                    prefilledMessage += `, con frente de ${solar.frente_m} m`;
                }
                
                if (solar.fondo_m) {
                    prefilledMessage += `, fondo de ${solar.fondo_m} m`;
                }
                
                if (solar.estatus_legal) {
                    prefilledMessage += `, estatus legal: ${solar.estatus_legal}`;
                }
                
                prefilledMessage += `. Por favor, contáctenme para obtener más información sobre este solar.`;
            }
            
            // Log the final message
            console.log('Final message:', prefilledMessage);
            
            // Create the form HTML without jQuery
            const formHtml = `
                <div class="row">
                    <div class="col-lg-8 offset-lg-2">
                        <div class="contact-form">
                            <h3>¿Desea contactarnos sobre este solar?</h3>
                            <p>Complete el formulario a continuación para recibir más información sobre este solar en ${locationName}.</p>
                            
                            <div id="form-container">
                                <div class="form-group">
                                    <label for="name">Nombre*</label>
                                    <input type="text" class="form-control" id="name" placeholder="Su nombre" required>
                                </div>
                                <div class="form-group">
                                    <label for="email">Correo Electrónico*</label>
                                    <input type="email" class="form-control" id="email" placeholder="Su correo electrónico" required>
                                </div>
                                <div class="form-group">
                                    <label for="phone">Teléfono*</label>
                                    <input type="tel" class="form-control" id="phone" placeholder="Su número de teléfono" required>
                                </div>
                                <div class="form-group">
                                    <label for="message">Mensaje</label>
                                    <textarea class="form-control" id="message" rows="4">${prefilledMessage}</textarea>
                                </div>
                                <button type="button" id="submit-button" class="btn-contact">Enviar Solicitud</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = formHtml;
            
            // Add event listener to the submit button after the DOM is updated
            setTimeout(() => {
                try {
                    const submitButton = document.getElementById('submit-button');
                    if (submitButton) {
                        submitButton.addEventListener('click', function() {
                            // Get form values
                            const name = document.getElementById('name').value;
                            const email = document.getElementById('email').value;
                            const phone = document.getElementById('phone').value;
                            const message = document.getElementById('message').value;
                            
                            // Validate form
                            if (!name || !email || !phone) {
                                alert('Por favor complete todos los campos requeridos.');
                                return;
                            }
                            
                            // Create form data
                            const formData = {
                                form_type: 'solar_inquiry',
                                solar_id: solarId,
                                solar_location: locationName,
                                name: name,
                                email: email,
                                phone: phone,
                                message: message
                            };
                            
                            console.log('Submitting form with data:', formData);
                            
                            // Use fetch API instead of jQuery AJAX
                            fetch('https://submit-form.com/BFgZ45QHC', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(formData)
                            })
                            .then(response => {
                                console.log('Form submission response:', response);
                                if (response.ok) {
                                    // Show success message
                                    document.getElementById('form-container').innerHTML = `
                                        <div class="alert alert-success">
                                            <h4>¡Gracias por su interés!</h4>
                                            <p>Hemos recibido su solicitud y nos pondremos en contacto con usted a la brevedad.</p>
                                        </div>
                                    `;
                                } else {
                                    throw new Error('Error en el envío del formulario');
                                }
                            })
                            .catch(error => {
                                console.error('Error submitting form:', error);
                                alert('Ocurrió un error al enviar el formulario. Por favor, inténtelo de nuevo más tarde.');
                            });
                        });
                    }
                } catch (error) {
                    console.error('Error setting up form submission:', error);
                }
            }, 100);
        } else {
            // Regular error message for other property types
            container.innerHTML = `
                <div class="property-not-found">
                    <h3>Lo sentimos</h3>
                    <p>${message}</p>
                    <a href="propiedades.html" class="btn-contact">Ver todas las propiedades</a>
                </div>
            `;
        }
    }
}

// Property Carousel Manager
class PropertyCarousel {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.init();
    }

    init() {
        // Get all thumbnail images to determine the total count
        const thumbnails = document.querySelectorAll('.thumbnail');
        this.images = Array.from(thumbnails).map(thumb => ({
            src: thumb.src,
            alt: thumb.alt
        }));
        
        if (this.images.length > 0) {
            this.updateNavigation();
            this.addKeyboardSupport();
        }
    }

    addKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard navigation when the gallery is visible
            if (!document.getElementById('main-image')) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextImage();
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Optional: Close any modal or return to first image
                    this.goToImage(0);
                    break;
            }
        });
        
        // Add touch/swipe support for mobile
        this.addTouchSupport();
    }

    addTouchSupport() {
        const mainImageContainer = document.querySelector('.main-image-container');
        if (!mainImageContainer) return;

        let startX = 0;
        let endX = 0;

        mainImageContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        mainImageContainer.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            this.handleSwipe(startX, endX);
        });
    }

    handleSwipe(startX, endX) {
        const threshold = 50; // Minimum distance for a swipe
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe left - next image
                this.nextImage();
            } else {
                // Swipe right - previous image
                this.previousImage();
            }
        }
    }

    goToImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        this.currentIndex = index;
        this.updateMainImage();
        this.updateThumbnails();
        this.updateCounter();
        this.updateNavigation();
    }

    nextImage() {
        if (this.currentIndex < this.images.length - 1) {
            this.goToImage(this.currentIndex + 1);
        }
    }

    previousImage() {
        if (this.currentIndex > 0) {
            this.goToImage(this.currentIndex - 1);
        }
    }

    updateMainImage() {
        const mainImage = document.getElementById('main-image');
        if (mainImage && this.images[this.currentIndex]) {
            mainImage.src = this.images[this.currentIndex].src;
            mainImage.alt = this.images[this.currentIndex].alt;
        }
    }

    updateThumbnails() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentIndex);
        });
    }

    updateCounter() {
        const counter = document.getElementById('image-counter');
        if (counter) {
            counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        }
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentIndex === this.images.length - 1;
        }
    }
}

// Global carousel instance
let propertyCarousel;

// Disable jQuery AJAX globally to prevent the unshiftHeader error
if (window.jQuery) {
    // Save original jQuery ajax function
    const originalAjax = jQuery.ajax;
    
    // Override jQuery's ajax function
    jQuery.ajax = function(url, options) {
        console.log('jQuery AJAX intercepted and blocked');
        // Return a dummy promise that never resolves
        return {
            done: function() { return this; },
            fail: function() { return this; },
            always: function() { return this; }
        };
    };
    
    // Also disable ajaxSetup
    jQuery.ajaxSetup = function() {
        console.log('jQuery ajaxSetup intercepted and blocked');
    };
    
    console.log('jQuery AJAX has been disabled');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Ensure jQuery AJAX is disabled
    if (window.jQuery) {
        jQuery(document).off('submit', 'form');
        jQuery(document).off('click', '[type="submit"]');
    }
    
    new PropertyDetailManager();
    
    // Initialize carousel after a short delay to ensure DOM is ready
    setTimeout(() => {
        propertyCarousel = new PropertyCarousel();
    }, 100);
});

// Properties Data Handler
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
        this.loadSpecialties();
        this.loadAllProperties();
    }

    loadFeaturedProperties() {
        const featuredContainer = document.getElementById('featuredPropertiesContainer');
        if (!featuredContainer || !this.propertiesData) return;

        const featured = this.propertiesData.featured;
        featuredContainer.innerHTML = '';

        featured.forEach((property, index) => {
            const propertyCard = this.createPropertyCard(property, 'featured');
            featuredContainer.appendChild(propertyCard);
        });
    }

    loadSpecialties() {
        const specialtiesContainer = document.querySelector('.sale_container');
        if (!specialtiesContainer || !this.propertiesData) return;

        // The specialties section is now static in index.html with the 3 main categories
        // No dynamic loading needed as we only have 3 main categories: Propiedades, Solares, Oficinas
    }

    loadAllProperties() {
        const propertiesContainer = document.querySelector('.properties_container');
        if (!propertiesContainer || !this.propertiesData) return;

        // This method is now handled by page-properties.js for specific pages
        // No dynamic loading needed here as each page handles its own content
    }

    createPropertyCard(property, type = 'featured') {
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

    createSpecialtyBox(category, index) {
        const box = document.createElement('div');
        box.className = 'box';
        
        const imageIndex = (index % 6) + 1; // Cycle through s-1.jpg to s-6.jpg
        
        box.innerHTML = `
            <div class="img-box">
                <img src="images/s-${imageIndex}.jpg" alt="${category.name}">
            </div>
            <div class="detail-box">
                <h6>${category.name}</h6>
                <p>${category.description}</p>
            </div>
        `;

        return box;
    }

    createCategorySection(category, categoryKey) {
        const section = document.createElement('div');
        section.className = 'category_section';
        
        if (category.isListFormat && categoryKey === 'solares') {
            section.innerHTML = `
                <div class="category_header">
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                </div>
                <div class="solares_list">
                    ${this.createSolaresList(category.data)}
                </div>
            `;
        } else {
            section.innerHTML = `
                <div class="category_header">
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                </div>
                <div class="properties_grid">
                    ${category.properties.map(property => this.createPropertyItem(property)).join('')}
                </div>
            `;
        }

        return section;
    }

    createPropertyItem(property) {
        return `
            <div class="property_item">
                <div class="img-box">
                    <img src="${property.image}" alt="${property.title}">
                    <div class="badge">
                        <span>${property.badge}</span>
                    </div>
                </div>
                <div class="detail-box">
                    <h4 class="price">$${property.price.toLocaleString()} ${property.currency}</h4>
                    <h5 class="title">${property.title}</h5>
                    <p class="location">${property.location}</p>
                    <p class="area">${property.area}</p>
                    <div class="features">
                        ${property.features.map(feature => `<span class="feature">${feature}</span>`).join('')}
                    </div>
                    <div class="btn-box">
                        <a href="#" class="btn-property">Ver Detalles</a>
                    </div>
                </div>
            </div>
        `;
    }

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
                    <span class="estatus_badge ${solar.estatus_legal.toLowerCase().replace(/\s+/g, '_')}">${solar.estatus_legal}</span>
                </div>
                <div class="col_total">${totalPrice === 'CONSULTAR' ? 'CONSULTAR' : '$' + totalPrice}</div>
            </div>
        `;
    }

    // Filter properties by category
    filterByCategory(category) {
        const propertiesContainer = document.querySelector('.properties_container');
        if (!propertiesContainer) return;

        // Update active filter button
        document.querySelectorAll('.filter_btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        if (category === 'all') {
            this.loadAllProperties();
            return;
        }

        const categoryData = this.propertiesData.categories[category];
        if (!categoryData) return;

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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new PropertiesManager();
});

// Add filter functionality
function filterProperties(category) {
    const manager = new PropertiesManager();
    manager.filterByCategory(category);
}

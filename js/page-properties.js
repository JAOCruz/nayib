// Page-specific Properties Handler
class PagePropertiesManager {
    constructor() {
        this.propertiesData = null;
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('propiedades.html')) return 'propiedades';
        if (path.includes('solares.html')) return 'solares';
        if (path.includes('oficinas.html')) return 'oficinas';
        return 'propiedades';
    }

    async init() {
        try {
            const response = await fetch('data/properties.json');
            this.propertiesData = await response.json();
            this.loadPageContent();
        } catch (error) {
            console.error('Error loading properties data:', error);
        }
    }

    loadPageContent() {
        switch (this.currentPage) {
            case 'propiedades':
                this.loadPropiedades();
                break;
            case 'solares':
                this.loadSolares();
                break;
            case 'oficinas':
                this.loadOficinas();
                break;
        }
    }

    loadPropiedades() {
        const propertiesContainer = document.querySelector('.properties_container');
        if (!propertiesContainer || !this.propertiesData) return;

        const propiedadesCategory = this.propertiesData.categories.propiedades;
        if (!propiedadesCategory) return;

        propertiesContainer.innerHTML = `
            <div class="category_section">
                <div class="category_header">
                    <h3>${propiedadesCategory.name}</h3>
                    <p>${propiedadesCategory.description}</p>
                </div>
                <div class="properties_grid">
                    ${propiedadesCategory.properties.map(property => this.createPropertyItem(property)).join('')}
                </div>
            </div>
        `;
    }

    loadSolares() {
        const propertiesContainer = document.querySelector('.properties_container');
        if (!propertiesContainer || !this.propertiesData) return;

        const solaresCategory = this.propertiesData.categories.solares;
        if (!solaresCategory) return;

        // Store original data for filtering
        this.originalSolaresData = solaresCategory.data;
        this.filteredSolaresData = [...solaresCategory.data];

        this.renderSolares();
        this.setupSolaresFilters();
    }

    renderSolares() {
        const propertiesContainer = document.querySelector('.properties_container');
        const solaresCategory = this.propertiesData.categories.solares;
        
        propertiesContainer.innerHTML = `
            <div class="category_section">
                <div class="category_header">
                    <h3>${solaresCategory.name}</h3>
                    <p>${solaresCategory.description}</p>
                </div>
                <div class="solares_list">
                    ${this.createSolaresList(this.filteredSolaresData)}
                </div>
            </div>
        `;

        // Update results count
        const totalSolares = this.filteredSolaresData.reduce((total, location) => total + location.solares.length, 0);
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `Mostrando ${totalSolares} solares de ${this.originalSolaresData.reduce((total, location) => total + location.solares.length, 0)} total`;
        }
    }

    setupSolaresFilters() {
        const locationSearch = document.getElementById('locationSearch');
        const areaMin = document.getElementById('areaMin');
        const areaMax = document.getElementById('areaMax');
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        const legalStatus = document.getElementById('legalStatus');
        const applyFilters = document.getElementById('applyFilters');
        const clearFilters = document.getElementById('clearFilters');

        if (applyFilters) {
            applyFilters.addEventListener('click', () => this.applySolaresFilters());
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearSolaresFilters());
        }

        if (locationSearch) {
            locationSearch.addEventListener('input', () => this.applySolaresFilters());
        }
    }

    applySolaresFilters() {
        const locationSearch = document.getElementById('locationSearch')?.value.toLowerCase() || '';
        const areaMin = parseFloat(document.getElementById('areaMin')?.value) || 0;
        const areaMax = parseFloat(document.getElementById('areaMax')?.value) || Infinity;
        const priceMin = parseFloat(document.getElementById('priceMin')?.value) || 0;
        const priceMax = parseFloat(document.getElementById('priceMax')?.value) || Infinity;
        const legalStatus = document.getElementById('legalStatus')?.value || '';

        this.filteredSolaresData = this.originalSolaresData.map(location => {
            const filteredSolares = location.solares.filter(solar => {
                // Location filter
                if (locationSearch && !location.ubicacion.toLowerCase().includes(locationSearch)) {
                    return false;
                }

                // Area filter
                const area = typeof solar.area_m2 === 'string' ? 0 : solar.area_m2;
                if (area < areaMin || area > areaMax) {
                    return false;
                }

                // Price filter (price per m²)
                if (solar.precio_usd_m2 === 'CONSULTAR') {
                    // If price filter is active, exclude "CONSULTAR" properties
                    if (priceMin > 0 || priceMax < Infinity) {
                        return false;
                    }
                } else {
                    const pricePerM2 = solar.precio_usd_m2;
                    if (pricePerM2 < priceMin || pricePerM2 > priceMax) {
                        return false;
                    }
                }

                // Legal status filter
                if (legalStatus && solar.estatus_legal !== legalStatus) {
                    return false;
                }

                return true;
            });

            return {
                ...location,
                solares: filteredSolares
            };
        }).filter(location => location.solares.length > 0);

        this.renderSolares();
    }

    clearSolaresFilters() {
        document.getElementById('locationSearch').value = '';
        document.getElementById('areaMin').value = '';
        document.getElementById('areaMax').value = '';
        document.getElementById('priceMin').value = '';
        document.getElementById('priceMax').value = '';
        document.getElementById('legalStatus').value = '';

        this.filteredSolaresData = [...this.originalSolaresData];
        this.renderSolares();
    }

    loadOficinas() {
        const propertiesContainer = document.querySelector('.properties_container');
        if (!propertiesContainer || !this.propertiesData) return;

        const oficinasCategory = this.propertiesData.categories.oficinas;
        if (!oficinasCategory) return;

        propertiesContainer.innerHTML = `
            <div class="category_section">
                <div class="category_header">
                    <h3>${oficinasCategory.name}</h3>
                    <p>${oficinasCategory.description}</p>
                </div>
                <div class="properties_grid">
                    ${oficinasCategory.properties.map(property => this.createPropertyItem(property)).join('')}
                </div>
            </div>
        `;
    }

    createCategorySection(category, categoryKey) {
        const section = document.createElement('div');
        section.className = 'category_section';
        section.innerHTML = `
            <div class="category_header">
                <h3>${category.name}</h3>
                <p>${category.description}</p>
            </div>
            <div class="properties_grid">
                ${category.properties.map(property => this.createPropertyItem(property)).join('')}
            </div>
        `;

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
                    <p class="roi"><strong>ROI:</strong> ${property.roi}</p>
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new PagePropertiesManager();
});

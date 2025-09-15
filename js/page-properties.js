// Page-specific Properties Handler
class PagePropertiesManager {
    constructor() {
        this.propertiesData = null;
        this.currentPage = this.getCurrentPage();
        this.itemsPerPage = 10;
        this.currentPageNumber = 1;
        this.filteredData = [];
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
        // Get the base URL of the current page
        const baseUrl = window.location.origin;
        
        const possiblePaths = [
            'data/properties.json',
            './data/properties.json',
            '/data/properties.json',
            `${baseUrl}/data/properties.json`,
            `${baseUrl}/data/properties.json?t=${Date.now()}` // Cache buster with absolute URL
        ];

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
                
                try {
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
                    console.log('Data has categories:', !!this.propertiesData.categories);
                    console.log('Data has solares:', !!this.propertiesData.categories?.solares);
                    
                    this.loadPageContent();
                    return; // Success, exit the function
                } catch (jsonError) {
                    console.error('Error processing JSON:', jsonError);
                    throw jsonError;
                }
            } catch (error) {
                console.error(`Error loading from ${path}:`, error);
                continue; // Try next path
            }
        }
        
        // If all paths failed
        console.error('Failed to load properties data from all attempted paths');
        this.showErrorMessage();
    }

    loadPageContent() {
        console.log('Loading page content for:', this.currentPage);
        console.log('Properties data available:', !!this.propertiesData);
        
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
        console.log('loadSolares called');
        const propertiesContainer = document.querySelector('.properties_container');
        console.log('Properties container found:', !!propertiesContainer);
        console.log('Properties data available:', !!this.propertiesData);
        
        // Create a debug div to show information on the page
        const debugDiv = document.createElement('div');
        debugDiv.style.padding = '10px';
        debugDiv.style.margin = '10px 0';
        debugDiv.style.border = '1px solid red';
        debugDiv.style.backgroundColor = '#ffeeee';
        
        if (!propertiesContainer) {
            console.error('Properties container not found!');
            debugDiv.innerHTML = '<strong>Error:</strong> Properties container not found!';
            document.body.appendChild(debugDiv);
            return;
        }
        
        if (!this.propertiesData) {
            console.error('Properties data not available!');
            debugDiv.innerHTML = '<strong>Error:</strong> Properties data not available!';
            propertiesContainer.appendChild(debugDiv);
            return;
        }

        try {
            console.log('Properties data type:', typeof this.propertiesData);
            console.log('Is properties data array?', Array.isArray(this.propertiesData));
            
            // Try to access some properties to see if it's properly parsed
            const keys = Object.keys(this.propertiesData);
            console.log('Top-level keys in data:', keys.join(', '));
            
            // Debug: Check if categories exists
            if (!this.propertiesData.categories) {
                console.error('No categories found in properties data!');
                console.log('Properties data structure:', keys);
                debugDiv.innerHTML = '<strong>Error:</strong> No categories found in data. Available keys: ' + keys.join(', ');
                propertiesContainer.appendChild(debugDiv);
                this.showErrorMessage('No categories found in data');
                return;
            }

            const categoryKeys = Object.keys(this.propertiesData.categories);
            console.log('Category keys:', categoryKeys.join(', '));
            
            const solaresCategory = this.propertiesData.categories.solares;
            console.log('Solares category found:', !!solaresCategory);
            
            if (!solaresCategory) {
                console.error('Solares category not found in data!');
                console.log('Available categories:', categoryKeys);
                debugDiv.innerHTML = '<strong>Error:</strong> Solares category not found. Available categories: ' + categoryKeys.join(', ');
                propertiesContainer.appendChild(debugDiv);
                this.showErrorMessage('Solares category not found');
                return;
            }

            console.log('Solares category keys:', Object.keys(solaresCategory).join(', '));
            
            // Check if data property exists in solares category
            if (!solaresCategory.data || !Array.isArray(solaresCategory.data)) {
                console.error('Solares data is missing or not an array!');
                console.log('Solares category structure:', Object.keys(solaresCategory));
                debugDiv.innerHTML = '<strong>Error:</strong> Solares data is missing or not an array! Solares keys: ' + Object.keys(solaresCategory).join(', ');
                propertiesContainer.appendChild(debugDiv);
                this.showErrorMessage('Solares data is missing or invalid');
                return;
            }

            console.log('Solares data is array of length:', solaresCategory.data.length);
            
            // Store original data for filtering
            this.originalSolaresData = solaresCategory.data;
            this.filteredSolaresData = [...solaresCategory.data];
            this.filteredData = this.filteredSolaresData;
            this.currentPageNumber = 1;

            console.log('About to render solares...');
            console.log('Filtered data length:', this.filteredData.length);
            
            // If we got this far, remove the debug div
            if (debugDiv.parentNode) {
                debugDiv.parentNode.removeChild(debugDiv);
            }
            
            this.renderSolares();
            this.setupSolaresFilters();
            this.setupPagination();
        } catch (error) {
            console.error('Error in loadSolares:', error);
            debugDiv.innerHTML = '<strong>Error in loadSolares:</strong> ' + error.message;
            propertiesContainer.appendChild(debugDiv);
        }
    }

    renderSolares() {
        console.log('renderSolares called');
        const propertiesContainer = document.querySelector('.properties_container');
        const solaresCategory = this.propertiesData.categories.solares;
        const paginatedData = this.getPaginatedData();
        
        console.log('Properties container in renderSolares:', !!propertiesContainer);
        console.log('Solares category in renderSolares:', !!solaresCategory);
        console.log('Paginated data:', paginatedData);
        console.log('Paginated data length:', paginatedData.length);
        
        if (!propertiesContainer) {
            console.error('Properties container not found in renderSolares!');
            return;
        }
        
        const htmlContent = `
            <div class="category_section">
                <div class="category_header">
                    <h3>${solaresCategory.name}</h3>
                    <p>${solaresCategory.description}</p>
                </div>
                <div class="solares_list">
                    ${this.createSolaresList(paginatedData)}
                </div>
            </div>
        `;
        
        console.log('HTML content to be inserted:', htmlContent);
        propertiesContainer.innerHTML = htmlContent;
        console.log('HTML inserted into container');

        this.updatePaginationInfo();
    }

    getPaginatedData() {
        console.log('getPaginatedData called');
        console.log('Filtered data:', this.filteredData);
        console.log('Filtered data length:', this.filteredData.length);
        
        const startIndex = (this.currentPageNumber - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        
        // Flatten the data for pagination
        const allSolares = [];
        this.filteredData.forEach(location => {
            console.log('Processing location:', location.ubicacion);
            console.log('Location solares count:', location.solares.length);
            location.solares.forEach(solar => {
                allSolares.push({
                    ...solar,
                    ubicacion: location.ubicacion
                });
            });
        });

        console.log('All solares flattened:', allSolares.length);
        const paginatedSolares = allSolares.slice(startIndex, endIndex);
        console.log('Paginated solares:', paginatedSolares.length);
        
        // Group back by location for display
        const groupedData = {};
        paginatedSolares.forEach(solar => {
            if (!groupedData[solar.ubicacion]) {
                groupedData[solar.ubicacion] = {
                    ubicacion: solar.ubicacion,
                    solares: []
                };
            }
            const { ubicacion, ...solarData } = solar;
            groupedData[solar.ubicacion].solares.push(solarData);
        });

        const result = Object.values(groupedData);
        console.log('Final grouped data:', result);
        return result;
    }

    updatePaginationInfo() {
        const totalItems = this.filteredData.reduce((total, location) => total + location.solares.length, 0);
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        // Update results count
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            const startItem = (this.currentPageNumber - 1) * this.itemsPerPage + 1;
            const endItem = Math.min(this.currentPageNumber * this.itemsPerPage, totalItems);
            resultsCount.textContent = `Mostrando ${startItem}-${endItem} de ${totalItems} solares`;
        }

        // Update pagination info
        const paginationInfo = document.getElementById('pagination_info');
        if (paginationInfo) {
            paginationInfo.textContent = `Página ${this.currentPageNumber} de ${totalPages}`;
        }

        // Update pagination controls
        this.updatePaginationControls(totalPages);
    }

    updatePaginationControls(totalPages) {
        const prevButton = document.getElementById('prev_page');
        const nextButton = document.getElementById('next_page');
        const pageNumbers = document.getElementById('page_numbers');

        if (prevButton) {
            prevButton.disabled = this.currentPageNumber === 1;
        }

        if (nextButton) {
            nextButton.disabled = this.currentPageNumber === totalPages || totalPages === 0;
        }

        if (pageNumbers) {
            this.renderPageNumbers(totalPages);
        }
    }

    renderPageNumbers(totalPages) {
        const pageNumbers = document.getElementById('page_numbers');
        if (!pageNumbers) return;

        let html = '';
        const currentPage = this.currentPageNumber;
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                html += `<span class="page_number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
            }
        } else {
            // Show pages with ellipsis
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    html += `<span class="page_number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
                }
                html += '<span class="page_number ellipsis">...</span>';
                html += `<span class="page_number" data-page="${totalPages}">${totalPages}</span>`;
            } else if (currentPage >= totalPages - 2) {
                html += '<span class="page_number" data-page="1">1</span>';
                html += '<span class="page_number ellipsis">...</span>';
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    html += `<span class="page_number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
                }
            } else {
                html += '<span class="page_number" data-page="1">1</span>';
                html += '<span class="page_number ellipsis">...</span>';
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    html += `<span class="page_number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
                }
                html += '<span class="page_number ellipsis">...</span>';
                html += `<span class="page_number" data-page="${totalPages}">${totalPages}</span>`;
            }
        }

        pageNumbers.innerHTML = html;

        // Add click event listeners to page numbers
        pageNumbers.querySelectorAll('.page_number:not(.ellipsis)').forEach(pageNumber => {
            pageNumber.addEventListener('click', () => {
                const page = parseInt(pageNumber.dataset.page);
                this.goToPage(page);
            });
        });
    }

    setupPagination() {
        const prevButton = document.getElementById('prev_page');
        const nextButton = document.getElementById('next_page');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (this.currentPageNumber > 1) {
                    this.goToPage(this.currentPageNumber - 1);
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const totalItems = this.filteredData.reduce((total, location) => total + location.solares.length, 0);
                const totalPages = Math.ceil(totalItems / this.itemsPerPage);
                if (this.currentPageNumber < totalPages) {
                    this.goToPage(this.currentPageNumber + 1);
                }
            });
        }
    }

    goToPage(pageNumber) {
        this.currentPageNumber = pageNumber;
        this.renderSolares();
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

        // Update filtered data and reset to first page
        this.filteredData = this.filteredSolaresData;
        this.currentPageNumber = 1;
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
        this.filteredData = this.filteredSolaresData;
        this.currentPageNumber = 1;
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
        console.log('createSolaresList called with data:', solaresData);
        console.log('Data length:', solaresData.length);
        
        if (!solaresData || solaresData.length === 0) {
            console.log('No solares data to display');
            return '<div class="no-data">No hay solares disponibles</div>';
        }
        
        const result = solaresData.map(location => {
            console.log('Creating list for location:', location.ubicacion);
            console.log('Location solares:', location.solares);
            return `
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
            `;
        }).join('');
        
        console.log('Generated HTML for solares list:', result);
        return result;
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

    showErrorMessage(errorDetails = '') {
        const propertiesContainer = document.querySelector('.properties_container');
        if (!propertiesContainer) return;

        // Get current page and URL information for debugging
        const currentPath = window.location.pathname;
        const currentOrigin = window.location.origin;
        const fullUrl = window.location.href;

        propertiesContainer.innerHTML = `
            <div class="error_message">
                <h3>Error al cargar los datos</h3>
                <p>No se pudieron cargar los datos de los solares. Por favor, intente recargar la página.</p>
                <p>Si el problema persiste, contacte al administrador.</p>
                <details>
                    <summary>Información de depuración (para desarrolladores)</summary>
                    <p>URL actual: ${fullUrl}</p>
                    <p>Ruta: ${currentPath}</p>
                    <p>Origen: ${currentOrigin}</p>
                    <p>Rutas intentadas: data/properties.json, ./data/properties.json, /data/properties.json, ${currentOrigin}/data/properties.json</p>
                    ${errorDetails ? `<p>Error específico: ${errorDetails}</p>` : ''}
                    <p>Datos cargados: ${this.propertiesData ? 'Sí' : 'No'}</p>
                    ${this.propertiesData ? `<p>Estructura de datos: ${Object.keys(this.propertiesData).join(', ')}</p>` : ''}
                </details>
                <button onclick="location.reload()" class="btn_filter">Recargar Página</button>
                <button onclick="localStorage.clear(); location.reload()" class="btn_filter">Limpiar Cache y Recargar</button>
            </div>
        `;

        // Update results count to show error
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = 'Error al cargar los datos';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new PagePropertiesManager();
});

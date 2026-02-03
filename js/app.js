// ===== SEGURIDAD Y SANITIZACIÓN =====

/**
 * Sanitiza texto para prevenir XSS attacks
 * Escapa caracteres especiales de HTML
 */
function sanitizeHTML(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Crea un elemento seguro con texto sanitizado
 */
function createSafeElement(tag, text, attributes = {}) {
    const elem = document.createElement(tag);
    if (text) {
        elem.textContent = text;  // textContent es seguro contra XSS
    }
    Object.entries(attributes).forEach(([key, value]) => {
        if (typeof value === 'string') {
            elem.setAttribute(key, value);
        }
    });
    return elem;
}

/**
 * Valida y sanitiza URLs
 */
function validateURL(url) {
    if (typeof url !== 'string') return '';
    try {
        const parsed = new URL(url, window.location.href);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }
        return parsed.href;
    } catch (e) {
        return '';
    }
}

/**
 * Valida que una coordenada sea válida
 */
function isValidCoordinate(lat, lng) {
    try {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        
        // Validar que no sean NaN o Infinity
        if (!isFinite(latNum) || !isFinite(lngNum)) {
            return false;
        }
        
        // Validar rangos
        if (latNum < -90 || latNum > 90) {
            return false;
        }
        if (lngNum < -180 || lngNum > 180) {
            return false;
        }
        
        return true;
    } catch (e) {
        return false;
    }
}

// ===== APLICACIÓN PRINCIPAL =====

let map;
let museums = [];
let selectedMuseums = new Set(); // Museos seleccionados para la ruta
let optimizedRoute = [];
let markers = {};
let routeLines = [];
let startMarker = null;
let routeGroup = null;

// Configuración global
let config = {
    startLat: 19.4326,
    startLng: -99.1332,
    museumTimeSpent: 90,
    transportMode: 'driving',
    restTime: 15
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
    loadConfig();
    
    // Cargar CSV automáticamente
    setTimeout(() => {
        loadCSVAutomatically();
    }, 500);
});

function initMap() {
    // Centro en Ciudad de México
    map = L.map('map').setView([19.4326, -99.1332], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(map);

    // Crear grupo para rutas
    routeGroup = L.featureGroup().addTo(map);
}

function setupEventListeners() {
    // Botones principales
    document.getElementById('btnLoadCSV').addEventListener('click', loadCSV);
    document.getElementById('btnOptimizeRoute').addEventListener('click', optimizeRoute);
    document.getElementById('btnClearRoute').addEventListener('click', clearRoute);
    document.getElementById('btnSettings').addEventListener('click', openSettings);
    document.getElementById('btnAutoDownload').addEventListener('click', autoOptimizeAndDownload);

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', switchTab);
    });

    // Búsqueda con debouncing para mejor rendimiento en móviles
    let searchDebounceTimeout;
    document.getElementById('searchMuseum').addEventListener('input', function(e) {
        clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = setTimeout(() => {
            filterMuseums();
        }, 150); // Debounce de 150ms
    });

    // Input file
    document.getElementById('csvFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            processCSVFile(file);
        }
    });
}

// ===== CARGA AUTOMÁTICA DE CSV =====
async function loadCSVAutomatically() {
    try {
        // Detectar si estamos en GitHub Pages o servidor local
        const isGitHubPages = window.location.hostname.includes('github.io');
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Construir rutas basadas en donde estemos
        let baseUrl = '';
        if (isGitHubPages) {
            // GitHub Pages: usar ruta relativa desde el repositorio
            baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        } else if (isLocalhost) {
            // Servidor local: usar ruta relativa
            baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
        } else {
            // Otro servidor: usar ruta relativa
            baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
        }

        // Intentar cargar el CSV automáticamente - preferir CSV con categorías
        const csvFiles = ['museos_cdmx_con_categorias.csv', 'museos_cdmx_con_coordenadas.csv', 'museos_cdmx.csv'];
        
        console.log('Detectado:', { isGitHubPages, isLocalhost, baseUrl });
        
        for (let csvFile of csvFiles) {
            try {
                // Intentar desde raíz primero (más confiable)
                let csvUrl = '/' + csvFile;
                console.log(`Intentando cargar: ${csvUrl}`);
                
                let response = await fetch(csvUrl);
                
                // Si no funciona desde raíz, intentar con URL base
                if (!response.ok) {
                    csvUrl = baseUrl + csvFile;
                    console.log(`Reintentando con baseUrl: ${csvUrl}`);
                    response = await fetch(csvUrl);
                }
                
                if (response.ok) {
                    const csv = await response.text();
                    const results = Papa.parse(csv, { header: true, skipEmptyLines: true });

                    // PapaParse puede reportar "warnings" en errors que no son reales
                    const criticalErrors = results.errors.filter(e => e.code !== 'TooManyFields');
                    
                    museums = results.data.filter(row => row.nombre_oficial && row.nombre_oficial.trim());
                    
                    if (museums.length === 0) {
                        console.error('No se encontraron museos en el CSV');
                        continue;
                    }

                    // Si el CSV tiene coordenadas, usarlas
                    if (museums[0] && museums[0].latitud && museums[0].longitud) {
                        museums = museums.map(m => {
                            const lat = parseFloat(m.latitud);
                            const lng = parseFloat(m.longitud);
                            
                            if (!isValidCoordinate(lat, lng)) {
                                console.warn(`Coordenadas inválidas para ${m.nombre_oficial}: lat=${lat}, lng=${lng}`);
                                return {
                                    ...m,
                                    lat: 19.4326,
                                    lng: -99.1332,
                                    categoria: m.categoria || 'Otro',
                                    _invalid: true
                                };
                            }
                            
                            return {
                                ...m,
                                lat: lat,
                                lng: lng,
                                categoria: m.categoria || 'Otro'
                            };
                        });
                        
                        // Filtrar museos con coordenadas inválidas
                        museums = museums.filter(m => !m._invalid);
                    } else {
                        // Geocodificar
                        showMessage(`Geocodificando ${museums.length} museos... esto puede tomar unos minutos`, 'info');
                        await geocodeMuseums();
                    }

                    // Reiniciar selección de museos y ruta
                    selectedMuseums.clear();
                    optimizedRoute = [];
                    
                    displayMuseums();
                    buildCategoryFilters();
                    buildAlcaldiaFilters();
                    buildTopMuseumsFilter();
                    document.getElementById('btnOptimizeRoute').disabled = false;
                    document.getElementById('btnAutoDownload').disabled = false;
                    
                    // Mostrar cuál CSV se cargó
                    const tipo = csvFile.includes('categorias') ? ' (con categorías)' : ' (sin categorías)';
                    showMessage(`✓ ${museums.length} museos cargados${tipo}`, 'success');
                    console.log('CSV cargado exitosamente:', csvUrl, 'Archivo:', csvFile);
                    return;
                }
            } catch (error) {
                console.log(`No se encontró ${csvFile}:`, error.message);
                continue;
            }
        }
        
        // Si no encontró ningún archivo, mostrar instrucción
        showMessage('📁 No se encontró CSV. Carga uno manualmente o verifica que esté en la raíz del proyecto.', 'info');
    } catch (error) {
        console.error('Error en carga automática:', error);
        showMessage('❌ Error al cargar automáticamente. Intenta cargar manualmente.', 'error');
    }
}

// ===== CARGA MANUAL DE CSV =====
function loadCSV() {
    document.getElementById('csvFile').click();
}

function processCSVFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const csv = event.target.result;
            const results = Papa.parse(csv, { header: true });

            if (results.errors.length > 0) {
                showMessage('Error al parsear CSV', 'error');
                return;
            }

            museums = results.data.filter(row => row.nombre_oficial);

            // Reiniciar selección de museos y ruta
            selectedMuseums.clear();
            optimizedRoute = [];

            // Si el CSV tiene coordenadas, usarlas; si no, geocodificar
            if (museums[0].latitud && museums[0].longitud) {
                museums = museums.map(m => {
                    const lat = parseFloat(m.latitud);
                    const lng = parseFloat(m.longitud);
                    
                    if (!isValidCoordinate(lat, lng)) {
                        return {
                            ...m,
                            lat: 19.4326,
                            lng: -99.1332,
                            _invalid: true
                        };
                    }
                    
                    return {
                        ...m,
                        lat: lat,
                        lng: lng
                    };
                });
                
                museums = museums.filter(m => !m._invalid);
                displayMuseums();
                showMessage(`✓ ${museums.length} museos cargados desde CSV`, 'success');
            } else {
                showMessage(`Geocodificando ${museums.length} museos...`, 'info');
                geocodeMuseums().then(() => {
                    displayMuseums();
                });
            }

            document.getElementById('btnOptimizeRoute').disabled = false;
            document.getElementById('btnAutoDownload').disabled = false;
        } catch (error) {
            console.error('CSV loading error:', error);
            showMessage('❌ Error al cargar el CSV. Por favor intenta de nuevo.', 'error');
        }
    };
    reader.readAsText(file);
}

// ===== CARGA DE CSV =====
function loadCSV() {
    document.getElementById('csvFile').click();
}

document.getElementById('csvFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const csv = event.target.result;
            const results = Papa.parse(csv, { header: true });

            if (results.errors.length > 0) {
                showMessage('Error al parsear CSV', 'error');
                return;
            }

            museums = results.data.filter(row => row.nombre_oficial);

            // Si el CSV tiene coordenadas, usarlas; si no, geocodificar
            if (museums[0].latitud && museums[0].longitud) {
                museums = museums.map(m => {
                    const lat = parseFloat(m.latitud);
                    const lng = parseFloat(m.longitud);
                    
                    if (!isValidCoordinate(lat, lng)) {
                        return {
                            ...m,
                            lat: 19.4326,
                            lng: -99.1332,
                            _invalid: true
                        };
                    }
                    
                    return {
                        ...m,
                        lat: lat,
                        lng: lng
                    };
                });
                
                museums = museums.filter(m => !m._invalid);
                displayMuseums();
            } else {
                showMessage('El CSV no tiene coordenadas. Geocodificando...', 'success');
                geocodeMuseums();
            }

            document.getElementById('btnOptimizeRoute').disabled = false;
        } catch (error) {
            console.error('CSV loading error:', error);
            showMessage('❌ Error al cargar el CSV. Por favor intenta de nuevo.', 'error');
        }
    };
    reader.readAsText(file);
});

// ===== GEOCODIFICACIÓN =====
async function geocodeMuseums() {
    const showLoading = true;
    let geocoded = 0;

    for (let i = 0; i < museums.length; i++) {
        const museum = museums[i];
        const address = `${museum.calle || ''}, ${museum.colonia || ''}, ${museum.cp || ''}, CDMX, México`;

        try {
            const coords = await getCoordinatesOSM(address);
            museums[i].lat = coords.lat;
            museums[i].lng = coords.lng;
            geocoded++;
            
            // Mostrar progreso cada 5 museos
            if (geocoded % 5 === 0) {
                showMessage(`Geocodificados ${geocoded}/${museums.length} museos`, 'success');
            }
        } catch (error) {
            console.error(`Error geocodificando ${museum.nombre_oficial}:`, error);
            museums[i].lat = 19.4326;
            museums[i].lng = -99.1332;
        }

        // Delay para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    displayMuseums();
    showMessage(`✓ Geocodificación completa: ${geocoded}/${museums.length} museos`, 'success');
}

// ===== NOMINATIM API (OpenStreetMap) =====
async function getCoordinatesOSM(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };
    }

    throw new Error('No encontrado');
}

// ===== DISTANCIAS =====
async function getDistance(from, to) {
    // Usar OSRM (Open Source Routing Machine)
    const url = `https://router.project-osrm.org/route/v1/${config.transportMode}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const duration = data.routes[0].duration / 60; // Convertir a minutos
            const distance = data.routes[0].distance / 1000; // Convertir a km
            const geometry = data.routes[0].geometry;

            return {
                duration: Math.round(duration),
                distance: distance.toFixed(2),
                geometry: geometry
            };
        }
    } catch (error) {
        console.error('Error obteniendo distancia:', error);
    }

    // Fallback: Haversine (distancia en línea recta)
    return {
        duration: calculateHaversine(from, to) * 3, // Estimación: 3 min por km
        distance: calculateHaversine(from, to).toFixed(2),
        geometry: null
    };
}

function calculateHaversine(from, to) {
    const R = 6371; // Radio terrestre en km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Decodificar polyline de OSRM
function decodePolyline(encoded) {
    const inv = 1.0 / 1e5;
    const decoded = [];
    let previous = [0, 0];
    let i = 0;

    while (i < encoded.length) {
        const ll = [0, 0];
        for (let j = 0; j < 2; j++) {
            let shift = 0;
            let result = 0;
            let byte = 0;
            do {
                byte = encoded.charCodeAt(i++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            ll[j] = previous[j] + (result & 1 ? ~(result >> 1) : result >> 1);
            previous[j] = ll[j];
        }
        decoded.push([ll[0] * inv, ll[1] * inv]);
    }
    return decoded;
}

// ===== INTERFAZ DE USUARIO =====
function displayMuseums() {
    const list = document.getElementById('museumsList');
    list.innerHTML = '';

    // Si es la primera vez, seleccionar todos los museos
    if (selectedMuseums.size === 0) {
        museums.forEach((_, index) => {
            selectedMuseums.add(index);
        });
    }

    museums.forEach((museum, index) => {
        const item = document.createElement('div');
        item.className = 'museum-item';
        const isSelected = selectedMuseums.has(index);
        
        // Crear estructura HTML de forma segura sin innerHTML
        const flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.alignItems = 'center';
        flexContainer.style.gap = '10px';
        flexContainer.style.flex = '1';
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'museum-checkbox';
        checkbox.setAttribute('data-index', String(index));
        checkbox.style.cursor = 'pointer';
        checkbox.style.width = '18px';
        checkbox.style.height = '18px';
        if (isSelected) checkbox.checked = true;
        
        // Contenedor de información
        const infoContainer = document.createElement('div');
        infoContainer.style.flex = '1';
        
        // Nombre del museo (seguro contra XSS)
        const nameDiv = document.createElement('div');
        nameDiv.className = 'museum-name';
        nameDiv.textContent = museum.nombre_oficial || '';
        
        // Información adicional
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'museum-info';
        
        const categoryDiv = document.createElement('div');
        categoryDiv.innerHTML = '<strong>🏷️</strong> ';
        categoryDiv.appendChild(createSafeElement('span', museum.categoria || 'N/A'));
        
        const coloniaDiv = document.createElement('div');
        coloniaDiv.innerHTML = '<strong>📍</strong> ';
        coloniaDiv.appendChild(createSafeElement('span', museum.colonia || 'N/A'));
        
        const costDiv = document.createElement('div');
        costDiv.innerHTML = '<strong>💰</strong> ';
        costDiv.appendChild(createSafeElement('span', museum.costos || 'Consultar'));
        
        const horarioDiv = document.createElement('div');
        horarioDiv.innerHTML = '<strong>🕐</strong> ';
        horarioDiv.appendChild(createSafeElement('span', museum.horarios || 'No especificado'));
        
        detailsDiv.appendChild(categoryDiv);
        detailsDiv.appendChild(coloniaDiv);
        detailsDiv.appendChild(costDiv);
        detailsDiv.appendChild(horarioDiv);
        
        infoContainer.appendChild(nameDiv);
        infoContainer.appendChild(detailsDiv);
        
        flexContainer.appendChild(checkbox);
        flexContainer.appendChild(infoContainer);
        
        // Badge
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = `#${index + 1}`;
        
        item.appendChild(flexContainer);
        item.appendChild(badge);
        
        // Evento para checkbox
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleMuseumSelection(index);
        });

        // Evento para la tarjeta (sin checkbox)
        item.addEventListener('click', (e) => {
            if (e.target !== checkbox && !e.target.closest('.museum-checkbox')) {
                selectMuseum(index);
            }
        });

        list.appendChild(item);
    });

    // Dibujar museos en el mapa
    clearMapMarkers();
    drawMuseumsOnMap();
    drawStartingPoint();
}

function selectMuseum(index) {
    const museum = museums[index];
    
    // Resaltar en lista
    document.querySelectorAll('.museum-item').forEach((item, i) => {
        item.classList.toggle('selected', i === index);
    });

    // Centrar mapa
    if (museum.lat && museum.lng) {
        map.setView([museum.lat, museum.lng], 15);

        // Mostrar popup de forma segura
        const popup = L.popup()
            .setLatLng([museum.lat, museum.lng])
            .setContent(createSafeMuseumDetailPopup(museum))
            .openOn(map);
    }
}

function toggleMuseumSelection(index) {
    if (selectedMuseums.has(index)) {
        selectedMuseums.delete(index);
    } else {
        selectedMuseums.add(index);
    }
    
    // Actualizar checkbox en la UI
    const checkbox = document.querySelector(`[data-index="${index}"]`);
    if (checkbox) {
        checkbox.checked = selectedMuseums.has(index);
    }
}

// Construir filtros de categoría
function buildCategoryFilters() {
    const categorias = [...new Set(museums.map(m => m.categoria).filter(Boolean))].sort();
    const filterContainer = document.getElementById('categoryFilters');
    
    if (!filterContainer) {
        console.warn('No se encontró elemento categoryFilters en el HTML');
        return;
    }

    // Mostrar el contenedor de categorías
    filterContainer.classList.add('active');

    // Obtener el contenedor de checkboxes
    const checkboxContainer = filterContainer.querySelector('.checkbox-container');
    checkboxContainer.innerHTML = '';
    
    // Limpiar y repoblar checkboxes
    categorias.forEach(categoria => {
        const count = museums.filter(m => m.categoria === categoria).length;
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = categoria;
        checkbox.checked = true;
        checkbox.addEventListener('change', filterMuseumsByCategory);
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${categoria} (${count})`));
        checkboxContainer.appendChild(label);
    });

    // Configurar botón de toggle
    const toggleBtn = filterContainer.querySelector('#toggleCategories');
    if (toggleBtn) {
        let isExpanded = true;
        toggleBtn.addEventListener('click', function() {
            isExpanded = !isExpanded;
            checkboxContainer.style.display = isExpanded ? 'flex' : 'none';
            toggleBtn.textContent = isExpanded ? 'Ocultar' : 'Mostrar';
        });
    }

    // Configurar botón de deseleccionar todas
    const deselectBtn = filterContainer.querySelector('#deselectAllCategories');
    if (deselectBtn) {
        deselectBtn.addEventListener('click', function() {
            const allChecked = document.querySelectorAll('#categoryFilters .checkbox-container input:checked').length === categorias.length;
            document.querySelectorAll('#categoryFilters .checkbox-container input[type="checkbox"]').forEach(cb => {
                cb.checked = !allChecked;
            });
            filterMuseumsByCategory();
            deselectBtn.textContent = allChecked ? 'Seleccionar todas' : 'Deseleccionar todas';
        });
    }
}

// Construir filtros de alcaldía
function buildAlcaldiaFilters() {
    const alcaldias = [...new Set(museums.map(m => m.alcaldia).filter(Boolean))].sort();
    const filterContainer = document.getElementById('alcaldiaFilters');
    
    if (!filterContainer) {
        console.warn('No se encontró elemento alcaldiaFilters en el HTML');
        return;
    }

    // Mostrar el contenedor de alcaldías
    filterContainer.classList.add('active');

    // Obtener el contenedor de checkboxes
    const checkboxContainer = filterContainer.querySelector('.checkbox-container');
    checkboxContainer.innerHTML = '';
    
    // Limpiar y repoblar checkboxes
    alcaldias.forEach(alcaldia => {
        const count = museums.filter(m => m.alcaldia === alcaldia).length;
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = alcaldia;
        checkbox.checked = true;
        checkbox.addEventListener('change', () => {
            applyAllFilters();
        });
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${alcaldia} (${count})`));
        checkboxContainer.appendChild(label);
    });

    // Configurar botón de toggle
    const toggleBtn = filterContainer.querySelector('#toggleAlcaldias');
    if (toggleBtn) {
        let isExpanded = true;
        toggleBtn.addEventListener('click', function() {
            isExpanded = !isExpanded;
            checkboxContainer.style.display = isExpanded ? 'flex' : 'none';
            toggleBtn.textContent = isExpanded ? 'Ocultar' : 'Mostrar';
        });
    }

    // Configurar botón de deseleccionar todas
    const deselectBtn = filterContainer.querySelector('#deselectAllAlcaldias');
    if (deselectBtn) {
        deselectBtn.addEventListener('click', function() {
            const allChecked = document.querySelectorAll('#alcaldiaFilters .checkbox-container input:checked').length === alcaldias.length;
            document.querySelectorAll('#alcaldiaFilters .checkbox-container input[type="checkbox"]').forEach(cb => {
                cb.checked = !allChecked;
            });
            applyAllFilters();
            deselectBtn.textContent = allChecked ? 'Seleccionar todas' : 'Deseleccionar todas';
        });
    }
}

// Construir filtros de museos destacados
function buildTopMuseumsFilter() {
    const filterContainer = document.getElementById('topMuseumsFilter');
    
    if (!filterContainer) {
        console.warn('No se encontró elemento topMuseumsFilter en el HTML');
        return;
    }

    // Mostrar el contenedor
    filterContainer.classList.add('active');

    // Obtener el contenedor de checkboxes
    const checkboxContainer = filterContainer.querySelector('.checkbox-container');
    checkboxContainer.innerHTML = '';
    
    // Crear opciones
    const options = [
        { value: 'all', label: 'Todos los museos', checked: true },
        { value: 'top', label: '⭐ Top Museos Destacados', checked: false }
    ];
    
    options.forEach(option => {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'radio';
        checkbox.name = 'topFilter';
        checkbox.value = option.value;
        checkbox.checked = option.checked;
        checkbox.addEventListener('change', applyAllFilters);
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${option.label}`));
        checkboxContainer.appendChild(label);
    });
}

// Aplicar todos los filtros
function applyAllFilters() {
    // Obtener categorías seleccionadas
    const selectedCategories = Array.from(document.querySelectorAll('#categoryFilters input:checked'))
        .map(cb => cb.value);
    
    // Obtener alcaldías seleccionadas
    const selectedAlcaldias = Array.from(document.querySelectorAll('#alcaldiaFilters input:checked'))
        .map(cb => cb.value);
    
    // Obtener opción de museos destacados
    const showTopOnly = document.querySelector('input[name="topFilter"]:checked')?.value === 'top';
    
    // Filtrar museos
    let filteredMuseums = museums.filter(m => 
        selectedCategories.includes(m.categoria) && 
        selectedAlcaldias.includes(m.alcaldia) &&
        (!showTopOnly || m.destacado === 'sí')
    );
    
    // Actualizar selectedMuseums
    selectedMuseums.clear();
    filteredMuseums.forEach((museum) => {
        const originalIndex = museums.indexOf(museum);
        selectedMuseums.add(originalIndex);
    });
    
    displayFilteredMuseums(filteredMuseums);
}

// Filtrar museos por categoría (mantiene compatibilidad)
function filterMuseumsByCategory() {
    applyAllFilters();
}

// Mostrar museos filtrados
function displayFilteredMuseums(filteredMuseums) {
    const list = document.getElementById('museumsList');
    list.innerHTML = '';

    filteredMuseums.forEach((museum) => {
        const originalIndex = museums.indexOf(museum);
        const isSelected = selectedMuseums.has(originalIndex);
        
        const item = document.createElement('div');
        item.className = 'museum-item';
        
        // Crear estructura HTML de forma segura sin innerHTML
        const flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.alignItems = 'center';
        flexContainer.style.gap = '10px';
        flexContainer.style.flex = '1';
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'museum-checkbox';
        checkbox.setAttribute('data-index', String(originalIndex));
        checkbox.style.cursor = 'pointer';
        checkbox.style.width = '18px';
        checkbox.style.height = '18px';
        if (isSelected) checkbox.checked = true;
        
        // Contenedor de información
        const infoContainer = document.createElement('div');
        infoContainer.style.flex = '1';
        
        // Nombre del museo (seguro contra XSS)
        const nameDiv = document.createElement('div');
        nameDiv.className = 'museum-name';
        let nameText = museum.nombre_oficial || '';
        if (museum.destacado === 'sí') {
            nameText = '⭐ ' + nameText;
        }
        nameDiv.textContent = nameText;
        
        // Información adicional
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'museum-info';
        
        const categoryDiv = document.createElement('div');
        categoryDiv.innerHTML = '<strong>🏷️</strong> ';
        categoryDiv.appendChild(createSafeElement('span', museum.categoria || 'N/A'));
        
        const alcaldiaDiv = document.createElement('div');
        alcaldiaDiv.innerHTML = '<strong>🏛️</strong> ';
        alcaldiaDiv.appendChild(createSafeElement('span', museum.alcaldia || 'N/A'));
        
        const coloniaDiv = document.createElement('div');
        coloniaDiv.innerHTML = '<strong>📍</strong> ';
        coloniaDiv.appendChild(createSafeElement('span', museum.colonia || 'N/A'));
        
        const costDiv = document.createElement('div');
        costDiv.innerHTML = '<strong>💰</strong> ';
        costDiv.appendChild(createSafeElement('span', museum.costos || 'Consultar'));
        
        detailsDiv.appendChild(categoryDiv);
        detailsDiv.appendChild(alcaldiaDiv);
        detailsDiv.appendChild(coloniaDiv);
        detailsDiv.appendChild(costDiv);
        
        infoContainer.appendChild(nameDiv);
        infoContainer.appendChild(detailsDiv);
        
        flexContainer.appendChild(checkbox);
        flexContainer.appendChild(infoContainer);
        
        // Badge
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = `#${originalIndex + 1}`;
        
        item.appendChild(flexContainer);
        item.appendChild(badge);
        
        // Evento para checkbox
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleMuseumSelection(originalIndex);
        });

        // Evento para la tarjeta (sin checkbox)
        item.addEventListener('click', (e) => {
            if (e.target !== checkbox && !e.target.closest('.museum-checkbox')) {
                selectMuseum(originalIndex);
            }
        });

        list.appendChild(item);
    });
    
    // Redibujar mapa
    clearMapMarkers();
    drawMuseumsOnMap();
    drawStartingPoint();
}

/**
 * Crea popup seguro para museo en el mapa
 */
function createSafeMuseumPopup(museum) {
    const popupContent = document.createElement('div');
    
    // Título
    const title = document.createElement('div');
    title.className = 'popup-title';
    title.textContent = museum.nombre_oficial;
    popupContent.appendChild(title);
    
    // Info
    const info = document.createElement('div');
    info.className = 'popup-info';
    
    // Colonia
    const coloniaP = document.createElement('p');
    coloniaP.innerHTML = '<strong>📍</strong> ';
    coloniaP.appendChild(createSafeElement('span', museum.colonia || 'N/A'));
    info.appendChild(coloniaP);
    
    // Costos
    const costosP = document.createElement('p');
    costosP.innerHTML = '<strong>💰</strong> ';
    costosP.appendChild(createSafeElement('span', museum.costos || 'Consultar'));
    info.appendChild(costosP);
    
    // Horarios
    const horariosP = document.createElement('p');
    horariosP.innerHTML = '<strong>🕐</strong> ';
    horariosP.appendChild(createSafeElement('span', museum.horarios || 'Consultar'));
    info.appendChild(horariosP);
    
    popupContent.appendChild(info);
    return popupContent;
}

/**
 * Crea popup seguro para detalles de museo
 */
function createSafeMuseumDetailPopup(museum) {
    const popupContent = document.createElement('div');
    
    // Título
    const titleDiv = document.createElement('div');
    titleDiv.className = 'popup-title';
    titleDiv.textContent = museum.nombre_oficial;
    popupContent.appendChild(titleDiv);
    
    // Info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'popup-info';
    
    // Dirección
    if (museum.calle) {
        const dirP = document.createElement('p');
        dirP.innerHTML = '<strong>Dirección:</strong> ';
        dirP.appendChild(createSafeElement('span', museum.calle));
        infoDiv.appendChild(dirP);
    }
    
    // Colonia
    if (museum.colonia) {
        const colP = document.createElement('p');
        colP.innerHTML = '<strong>Colonia:</strong> ';
        colP.appendChild(createSafeElement('span', museum.colonia));
        infoDiv.appendChild(colP);
    }
    
    // Costo
    if (museum.costos) {
        const costP = document.createElement('p');
        costP.innerHTML = '<strong>Costo:</strong> ';
        costP.appendChild(createSafeElement('span', museum.costos));
        infoDiv.appendChild(costP);
    }
    
    // Horarios
    if (museum.horarios) {
        const horP = document.createElement('p');
        horP.innerHTML = '<strong>Horarios:</strong> ';
        horP.appendChild(createSafeElement('span', museum.horarios));
        infoDiv.appendChild(horP);
    }
    
    popupContent.appendChild(infoDiv);
    return popupContent;
}

function drawMuseumsOnMap() {
    museums.forEach((museum, index) => {
        if (!museum.lat || !museum.lng) return;

        const marker = L.circleMarker([museum.lat, museum.lng], {
            radius: 8,
            fillColor: '#667eea',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });

        // Crear popup de forma segura
        const popupContent = createSafeMuseumPopup(museum);

        marker.bindPopup(popupContent);
        marker.on('click', () => selectMuseum(index));
        marker.addTo(map);
        markers[index] = marker;
    });
}

function drawStartingPoint() {
    // Eliminar marcador anterior
    if (startMarker) map.removeLayer(startMarker);

    // Crear icono con emoji - contrasta bien con el mapa
    const emojiIcon = L.divIcon({
        html: '<div style="font-size: 40px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.4));">🎯</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
        className: 'emoji-marker'
    });

    // Crear círculo primero
    const circle = L.circle([config.startLat, config.startLng], {
        radius: 200,
        color: '#4285F4',
        fill: true,
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 5'
    });
    circle.addTo(map);
    
    // Agregar animación de pulso
    animateStartMarkerPulse(circle);

    startMarker = L.marker([config.startLat, config.startLng], { 
        icon: emojiIcon,
        draggable: true  // Permitir arrastrar
    });
    
    startMarker.bindPopup('🎯 <strong>PUNTO DE INICIO</strong><br><small>Arrastra para mover la ubicación</small>');
    startMarker.addTo(map);
    
    // Eventos de arrastre
    startMarker.on('dragstart', () => {
        showMessage('📍 Arrastrando punto de inicio...', 'info');
        startMarker._icon.classList.add('dragging');
    });
    
    startMarker.on('drag', () => {
        // Actualizar posición del círculo mientras se arrastra
        const pos = startMarker.getLatLng();
        circle.setLatLng(pos);
    });
    
    startMarker.on('dragend', () => {
        startMarker._icon.classList.remove('dragging');
        const newPos = startMarker.getLatLng();
        config.startLat = newPos.lat;
        config.startLng = newPos.lng;
        showMessage(`✅ Punto actualizado a: ${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`, 'success');
        
        // Actualizar la información en localStorage
        saveConfig();
    });
    
    // Permitir clic para editar coordenadas
    startMarker.on('click', () => {
        startMarker.openPopup();
    });
}

// Función para animar el pulso del marcador de inicio
function animateStartMarkerPulse(circle) {
    let maxRadius = 300;
    let minRadius = 200;
    let expanding = true;
    let animationInterval;
    
    const animate = () => {
        let currentRadius = circle.getRadius();
        let step = 2;
        
        if (expanding) {
            currentRadius += step;
            if (currentRadius >= maxRadius) {
                expanding = false;
            }
        } else {
            currentRadius -= step;
            if (currentRadius <= minRadius) {
                expanding = true;
            }
        }
        
        circle.setRadius(currentRadius);
    };
    
    // Iniciar animación
    animationInterval = setInterval(animate, 30);
    
    // Guardar ID para poder detenerla después
    circle._animationInterval = animationInterval;
}

function clearMapMarkers() {
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {};
}

function filterMuseums() {
    const query = document.getElementById('searchMuseum').value.toLowerCase().trim();
    const items = document.querySelectorAll('.museum-item');
    let visibleCount = 0;

    items.forEach((item) => {
        // Obtener el nombre del museo desde el texto mostrado
        const nameDiv = item.querySelector('.museum-name');
        const infoDiv = item.querySelector('.museum-info');
        
        if (!nameDiv) return;
        
        const name = nameDiv.textContent.toLowerCase();
        const info = infoDiv ? infoDiv.textContent.toLowerCase() : '';
        
        const match = query === '' || name.includes(query) || info.includes(query);
        
        item.style.display = match ? 'block' : 'none';
        if (match) visibleCount++;
    });

    // Mostrar mensaje si no hay resultados
    const list = document.getElementById('museumsList');
    let noResultsMsg = list.querySelector('.no-results-msg');
    
    if (visibleCount === 0 && query !== '') {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-msg';
            noResultsMsg.style.padding = '20px';
            noResultsMsg.style.textAlign = 'center';
            noResultsMsg.style.color = '#a0aec0';
            noResultsMsg.style.fontSize = '0.9em';
            list.appendChild(noResultsMsg);
        }
        noResultsMsg.textContent = `📭 No se encontraron museos con "${query}"`;
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

function switchTab(e) {
    const tabName = e.target.dataset.tab;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// ===== OPTIMIZACIÓN DE RUTA (TSP) =====
async function optimizeRoute() {
    if (museums.length < 2) {
        showMessage('Se necesitan al menos 2 museos', 'error');
        return;
    }

    document.getElementById('btnOptimizeRoute').disabled = true;
    
    // Mostrar barra de progreso
    showProgress('⏳ Iniciando optimización...', 0);

    try {
        // Implementar algoritmo TSP aproximado (Nearest Neighbor)
        const route = await calculateOptimalRoute();
        optimizedRoute = route;

        displayRoute();
        drawRouteOnMap();
        
        // Mostrar progreso completo
        updateProgress(100, '✅ ¡Ruta optimizada!');
        showMessage('✅ ¡Ruta optimizada correctamente! Incluye retorno a casa', 'success');
        
        // Ocultar barra después de 2 segundos
        setTimeout(hideProgress, 2000);

    } catch (error) {
        console.error('Route optimization error:', error);
        showMessage('❌ Error al optimizar la ruta. Por favor, intenta de nuevo.', 'error');
        hideProgress();
    } finally {
        document.getElementById('btnOptimizeRoute').disabled = false;
    }
}

async function calculateOptimalRoute() {
    // Filtrar solo museos seleccionados
    const selectedMuseumsArray = Array.from(selectedMuseums)
        .map(index => museums[index])
        .filter(m => m && m.lat && m.lng);

    if (selectedMuseumsArray.length < 2) {
        showMessage('Selecciona al menos 2 museos para optimizar la ruta', 'error');
        throw new Error('Menos de 2 museos seleccionados');
    }

    // Algoritmo Nearest Neighbor para TSP aproximado
    const startPoint = {
        lat: config.startLat,
        lng: config.startLng,
        name: 'Punto de inicio'
    };

    let currentPoint = startPoint;
    let unvisited = [...selectedMuseumsArray];
    let route = [];
    let totalTime = 0;
    let totalDistance = 0;
    const totalMuseums = unvisited.length;

    // Mostrar estado inicial con barra
    showProgress('⏳ Iniciando optimización...', 5);

    while (unvisited.length > 0) {
        let nearest = null;
        let nearestDist = Infinity;
        let nearestIdx = -1;

        // Encontrar el museo más cercano (Nearest Neighbor)
        for (let i = 0; i < unvisited.length; i++) {
            const dist = calculateHaversine(currentPoint, unvisited[i]);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = unvisited[i];
                nearestIdx = i;
            }
        }

        // Mostrar progreso en barra visual
        const visitados = totalMuseums - unvisited.length;
        const progress = Math.round((visitados / totalMuseums) * 100);
        const museumName = nearest.nombre_oficial.substring(0, 35);
        updateProgress(progress, `${progress}% - Procesando: ${museumName}...`);

        // Obtener distancia real
        const distInfo = await getDistance(currentPoint, nearest);

        route.push({
            museum: nearest,
            travelTime: distInfo.duration,
            travelDistance: distInfo.distance,
            visitTime: config.museumTimeSpent,
            restTime: config.restTime,
            geometry: distInfo.geometry
        });

        totalTime += distInfo.duration + config.museumTimeSpent + config.restTime;
        totalDistance += parseFloat(distInfo.distance);

        unvisited.splice(nearestIdx, 1);
        currentPoint = nearest;

        // Delay para no sobrecargar las APIs
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Agregar retorno a casa al final
    updateProgress(95, '🏠 Calculando retorno a casa...');
    const returnInfo = await getDistance(currentPoint, startPoint);
    
    route.push({
        museum: { ...startPoint, nombre_oficial: '🏠 Regreso a casa' },
        travelTime: returnInfo.duration,
        travelDistance: returnInfo.distance,
        visitTime: 0,
        restTime: 0,
        geometry: returnInfo.geometry,
        isReturn: true  // Marcar como retorno
    });

    totalTime += returnInfo.duration;
    totalDistance += parseFloat(returnInfo.distance);

    return {
        steps: route,
        totalTime,
        totalDistance
    };
}

function clearRoute() {
    optimizedRoute = [];
    routeGroup.clearLayers();
    document.getElementById('routeInfo').innerHTML = `
        <div style="padding: 20px; text-align: center; color: #718096;">
            <i class="fas fa-route"></i> Optimiza una ruta para ver detalles
        </div>
    `;
    showMessage('Ruta limpiada', 'info');
}

async function autoOptimizeAndDownload() {
    const selectedCount = selectedMuseums.size;
    
    if (selectedCount < 2) {
        showMessage('Selecciona al menos 2 museos para descargar el plan', 'error');
        return;
    }

    document.getElementById('btnAutoDownload').disabled = true;
    
    try {
        // Verificar si ya existe una ruta óptima calculada con los mismos museos seleccionados
        const routeExists = optimizedRoute && optimizedRoute.steps && optimizedRoute.steps.length > 0;
        
        if (routeExists) {
            // Si la ruta ya existe, solo descargar
            showProgress('📥 Descargando plan existente...', 50);
            await new Promise(resolve => setTimeout(resolve, 500));
            downloadPDF();
            
            updateProgress(100, '✅ ¡Plan descargado!');
            showMessage('✅ Plan descargado correctamente', 'success');
            setTimeout(hideProgress, 1500);
        } else {
            // Si no existe, calcular y descargar
            showProgress('⏳ Optimizando ruta para descargar...', 0);

            // Calcular la ruta óptima
            const route = await calculateOptimalRoute();
            optimizedRoute = route;

            // Mostrar progreso casi completo
            updateProgress(95, '📊 Generando PDF...');

            // Descargar el PDF automáticamente
            await new Promise(resolve => setTimeout(resolve, 500));
            downloadPDF();

            // Mostrar progreso completo
            updateProgress(100, '✅ ¡Plan descargado!');
            showMessage('✅ ¡Plan óptimo descargado correctamente!', 'success');
            
            // Mostrar la ruta en el mapa también
            displayRoute();
            drawRouteOnMap();
            
            // Ocultar barra después de 2 segundos
            setTimeout(hideProgress, 2000);
        }

    } catch (error) {
        console.error('Download error:', error);
        showMessage('❌ Error: No se pudo generar el plan. Intenta de nuevo.', 'error');
        hideProgress();
    } finally {
        document.getElementById('btnAutoDownload').disabled = false;
    }
}

/**
 * Crea un elemento de paso de ruta de forma segura
 */
function createSafeRouteStepElement(step, index, isReturn, currentTime) {
    const museum = step.museum;
    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + currentTime);
    
    const stepDiv = document.createElement('div');
    stepDiv.className = 'route-step';
    
    const bgColor = isReturn ? '#fff8e1' : '#f9fafb';
    const borderColor = isReturn ? '#ffa500' : '#FF6B35';
    const stepLat = isReturn ? config.startLat : museum.lat;
    const stepLng = isReturn ? config.startLng : museum.lng;
    const stepZoom = isReturn ? 15 : 16;
    
    // Dataset
    stepDiv.dataset.lat = stepLat;
    stepDiv.dataset.lng = stepLng;
    stepDiv.dataset.zoom = stepZoom;
    
    // Estilos
    stepDiv.style.background = bgColor;
    stepDiv.style.borderLeftColor = borderColor;
    stepDiv.style.cursor = 'pointer';
    stepDiv.style.transition = 'all 0.2s';
    stepDiv.style.padding = '12px';
    stepDiv.style.marginBottom = '10px';
    stepDiv.style.borderRadius = '5px';
    stepDiv.style.borderLeft = '4px solid ' + borderColor;
    
    // Event listeners en lugar de inline handlers
    stepDiv.addEventListener('mouseover', function() {
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        this.style.transform = 'translateX(4px)';
    });
    
    stepDiv.addEventListener('mouseout', function() {
        this.style.boxShadow = 'none';
        this.style.transform = 'translateX(0)';
    });
    
    // Step number
    const numberDiv = document.createElement('div');
    numberDiv.className = 'step-number';
    numberDiv.style.color = isReturn ? '#ff6b6b' : '#FF6B35';
    numberDiv.textContent = isReturn ? '🏠 Retorno a Casa' : `📍 Paso ${index + 1}`;
    stepDiv.appendChild(numberDiv);
    
    // Museum name
    const museumDiv = document.createElement('div');
    museumDiv.className = 'step-museum';
    museumDiv.style.fontWeight = '600';
    museumDiv.textContent = museum.nombre_oficial;
    stepDiv.appendChild(museumDiv);
    
    // Details
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'step-details';
    
    if (!isReturn && museum.categoria) {
        const catP = document.createElement('p');
        catP.innerHTML = '<strong>🏷️</strong> ';
        catP.appendChild(createSafeElement('span', museum.categoria));
        detailsDiv.appendChild(catP);
    }
    
    if (museum.colonia) {
        const colP = document.createElement('p');
        colP.innerHTML = '<strong>📍</strong> ';
        colP.appendChild(createSafeElement('span', museum.colonia));
        detailsDiv.appendChild(colP);
    }
    
    // Traslado
    const trasladoP = document.createElement('p');
    trasladoP.innerHTML = '<strong>⏱️ Traslado:</strong> ';
    trasladoP.appendChild(createSafeElement('span', step.travelTime + ' min'));
    detailsDiv.appendChild(trasladoP);
    
    if (!isReturn) {
        const visitaP = document.createElement('p');
        visitaP.innerHTML = '<strong>⏰ Visita:</strong> ';
        visitaP.appendChild(createSafeElement('span', step.visitTime + ' min'));
        detailsDiv.appendChild(visitaP);
        
        const descansoP = document.createElement('p');
        descansoP.innerHTML = '<strong>💤 Descanso:</strong> ';
        descansoP.appendChild(createSafeElement('span', step.restTime + ' min'));
        detailsDiv.appendChild(descansoP);
    }
    
    // Distancia
    const distP = document.createElement('p');
    distP.innerHTML = '<strong>📏 Distancia:</strong> ';
    distP.appendChild(createSafeElement('span', step.travelDistance + ' km'));
    detailsDiv.appendChild(distP);
    
    // Llegada
    const llegadaP = document.createElement('p');
    llegadaP.innerHTML = '<strong>🕐 Llegada aproximada:</strong> ';
    llegadaP.appendChild(createSafeElement('span', arrivalTime.toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})));
    detailsDiv.appendChild(llegadaP);
    
    if (!isReturn && museum.costos) {
        const costoP = document.createElement('p');
        costoP.innerHTML = '<strong>💰 Costo:</strong> ';
        costoP.appendChild(createSafeElement('span', museum.costos));
        detailsDiv.appendChild(costoP);
    }
    
    // Hint
    const hintP = document.createElement('p');
    hintP.style.color = '#666';
    hintP.style.fontSize = '12px';
    hintP.style.marginTop = '8px';
    hintP.textContent = '👆 Haz clic para ir a este lugar en el mapa';
    detailsDiv.appendChild(hintP);
    
    stepDiv.appendChild(detailsDiv);
    return stepDiv;
}

function displayRoute() {
    const routeInfo = document.getElementById('routeInfo');
    
    if (!optimizedRoute.steps) {
        routeInfo.innerHTML = '';
        const noRouteDiv = document.createElement('div');
        noRouteDiv.style.padding = '20px';
        noRouteDiv.style.textAlign = 'center';
        noRouteDiv.textContent = 'No hay ruta';
        routeInfo.appendChild(noRouteDiv);
        return;
    }

    // Limpiar DOM
    routeInfo.innerHTML = '';
    
    // Crear resumen
    const summary = document.createElement('div');
    summary.className = 'route-summary';
    summary.style.padding = '15px';
    summary.style.backgroundColor = '#edf2f7';
    summary.style.borderRadius = '5px';
    summary.style.marginBottom = '15px';
    summary.style.borderLeft = '4px solid #667eea';
    
    const timeItem = document.createElement('div');
    timeItem.className = 'summary-item';
    timeItem.style.display = 'flex';
    timeItem.style.justifyContent = 'space-between';
    timeItem.style.padding = '5px 0';
    timeItem.innerHTML = '<strong>⏱️ Tiempo total:</strong> ';
    timeItem.appendChild(createSafeElement('span', formatTime(optimizedRoute.totalTime)));
    summary.appendChild(timeItem);
    
    const distItem = document.createElement('div');
    distItem.className = 'summary-item';
    distItem.style.display = 'flex';
    distItem.style.justifyContent = 'space-between';
    distItem.style.padding = '5px 0';
    distItem.innerHTML = '<strong>📏 Distancia total:</strong> ';
    distItem.appendChild(createSafeElement('span', optimizedRoute.totalDistance + ' km'));
    summary.appendChild(distItem);
    
    const museosItem = document.createElement('div');
    museosItem.className = 'summary-item';
    museosItem.style.display = 'flex';
    museosItem.style.justifyContent = 'space-between';
    museosItem.style.padding = '5px 0';
    museosItem.innerHTML = '<strong>🏛️ Museos visitados:</strong> ';
    museosItem.appendChild(createSafeElement('span', (optimizedRoute.steps.length - 1) + ' (+ retorno a casa)'));
    summary.appendChild(museosItem);
    
    routeInfo.appendChild(summary);
    
    // Agregar steps
    let currentTime = 0;
    optimizedRoute.steps.forEach((step, index) => {
        currentTime += step.travelTime;
        const isReturn = step.isReturn;
        
        const stepElement = createSafeRouteStepElement(step, index, isReturn, currentTime);
        routeInfo.appendChild(stepElement);
        
        if (!isReturn) {
            currentTime += step.visitTime + step.restTime;
        }
    });
    
    // Agregar botón de descarga
    const downloadContainer = document.createElement('div');
    downloadContainer.style.position = 'sticky';
    downloadContainer.style.bottom = '0';
    downloadContainer.style.padding = '20px';
    downloadContainer.style.gap = '12px';
    downloadContainer.style.display = 'flex';
    downloadContainer.style.flexDirection = 'row';
    downloadContainer.style.background = 'linear-gradient(135deg, #FFE5D9, #FFF0E6)';
    downloadContainer.style.borderRadius = '8px';
    downloadContainer.style.marginTop = '15px';
    downloadContainer.style.border = '3px solid #FF6B35';
    downloadContainer.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.2)';
    downloadContainer.style.zIndex = '100';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-success';
    downloadBtn.style.flex = '1';
    downloadBtn.style.padding = '14px';
    downloadBtn.style.fontWeight = '700';
    downloadBtn.style.fontSize = '15px';
    downloadBtn.style.borderRadius = '6px';
    downloadBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    downloadBtn.style.border = 'none';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.transition = 'all 0.3s';
    downloadBtn.style.color = 'white';
    downloadBtn.innerHTML = '<i class="fas fa-download" style="margin-right: 8px;"></i> Descargar Plan (CSV)';
    
    // Event listeners para el botón
    downloadBtn.addEventListener('mouseover', function() {
        this.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.4)';
        this.style.transform = 'translateY(-2px)';
    });
    
    downloadBtn.addEventListener('mouseout', function() {
        this.style.boxShadow = 'none';
        this.style.transform = 'translateY(0)';
    });
    
    downloadBtn.addEventListener('click', downloadItinerary);
    
    downloadContainer.appendChild(downloadBtn);
    routeInfo.appendChild(downloadContainer);
    
    // Agregar event listeners a los items de ruta
    document.querySelectorAll('.route-step').forEach(item => {
        item.addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const zoom = parseInt(this.dataset.zoom);
            if (!isNaN(lat) && !isNaN(lng)) {
                map.setView([lat, lng], zoom);
                document.querySelector('[data-tab="map"]').click();
            }
        });
    });

    // Cambiar a tab de ruta
    document.querySelector('[data-tab="route"]').click();
}

function drawRouteOnMap() {
    // Limpiar rutas anteriores
    routeGroup.clearLayers();

    const startPoint = {
        lat: config.startLat,
        lng: config.startLng
    };

    let currentPoint = startPoint;

    // Dibujar líneas y conexiones
    optimizedRoute.steps.forEach((step, index) => {
        const museum = step.museum;

        // Dibujar línea de la ruta - MEJORADA (más visible)
        if (step.geometry) {
            try {
                const decoded = decodePolyline(step.geometry);
                const polyline = L.polyline(decoded, {
                    color: '#FF6B35',  // Naranja vibrante
                    weight: 5,         // Más grueso
                    opacity: 0.9,      // Más opaco
                    dashArray: '8, 4'  // Guiones más grandes
                });
                routeGroup.addLayer(polyline);
            } catch (e) {
                console.log('No se pudo decodificar geometría, usando línea directa');
                const line = L.polyline([
                    [currentPoint.lat, currentPoint.lng],
                    [museum.lat, museum.lng]
                ], {
                    color: '#FF6B35',
                    weight: 5,
                    opacity: 0.9
                });
                routeGroup.addLayer(line);
            }
        } else {
            // Fallback: línea directa
            const line = L.polyline([
                [currentPoint.lat, currentPoint.lng],
                [museum.lat, museum.lng]
            ], {
                color: '#FF6B35',
                weight: 5,
                opacity: 0.9
            });
            routeGroup.addLayer(line);
        }

        // Crear marcador con número - MEJORADO
        const numberIcon = L.divIcon({
            html: `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #FF6B35, #F7931E);
                    border-radius: 50%;
                    color: white;
                    font-weight: bold;
                    font-size: 18px;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    cursor: pointer;
                    transition: transform 0.2s;
                ">
                    ${index + 1}
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
            className: 'route-step-marker'
        });

        const stepMarker = L.marker([museum.lat, museum.lng], { icon: numberIcon });
        
        stepMarker.bindPopup(`
            <div class="popup-title">Paso ${index + 1}</div>
            <div class="popup-info">
                <p><strong>${museum.nombre_oficial}</strong></p>
                ${museum.categoria ? `<p>📌 Categoría: ${museum.categoria}</p>` : ''}
                <p>⏱️ Traslado: ${step.travelTime} min</p>
                <p>⏰ Visita: ${step.visitTime} min</p>
                <p>📏 Distancia: ${step.travelDistance} km</p>
                ${museum.costos ? `<p>💰 Costo: ${museum.costos}</p>` : ''}
            </div>
        `, {
            maxWidth: 300
        });

        // Añadir evento de click para centrar el mapa
        stepMarker.on('click', () => {
            map.setView([museum.lat, museum.lng], 16);
            stepMarker.openPopup();
        });

        routeGroup.addLayer(stepMarker);

        // Actualizar punto actual
        currentPoint = museum;
    });

    // Ajustar vista al routeGroup
    const bounds = routeGroup.getBounds();
    if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80] });
    }

    // Agregar punto de inicio visible
    drawStartingPoint();
}

// ===== DESCARGA =====
function downloadItinerary() {
    if (!optimizedRoute.steps) return;

    let csv = 'Paso,Museo,Colonia,Calle,Código Postal,Costo,Horarios,Traslado (min),Visita (min),Descanso (min),Distancia (km)\n';

    optimizedRoute.steps.forEach((step, index) => {
        const museum = step.museum;
        const row = [
            index + 1,
            `"${museum.nombre_oficial}"`,
            museum.colonia || 'N/A',
            `"${museum.calle || 'N/A'}"`,
            museum.cp || 'N/A',
            `"${museum.costos || 'Consultar'}"`,
            `"${museum.horarios || 'Consultar'}"`,
            step.travelTime,
            step.visitTime,
            step.restTime,
            step.travelDistance
        ].join(',');
        csv += row + '\n';
    });

    // Agregar resumen
    csv += '\nResumen\n';
    csv += `Total de museos,${optimizedRoute.steps.length}\n`;
    csv += `Tiempo total,${formatTime(optimizedRoute.totalTime)}\n`;
    csv += `Distancia total,${optimizedRoute.totalDistance} km\n`;

    downloadFile(csv, 'plan_visita_museos.csv', 'text/csv');
    showMessage('✓ Plan descargado como CSV', 'success');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

// ===== CONFIGURACIÓN =====
function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    loadConfigToForm();
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
    document.getElementById('messageContainer').innerHTML = '';
}

function loadConfig() {
    const saved = localStorage.getItem('museosConfig');
    if (saved) {
        config = JSON.parse(saved);
    }
}

// Función para guardar configuración
function saveConfig() {
    localStorage.setItem('museosConfig', JSON.stringify(config));
}

function loadConfigToForm() {
    document.getElementById('startLat').value = config.startLat;
    document.getElementById('startLng').value = config.startLng;
    document.getElementById('museumTimeSpent').value = config.museumTimeSpent;
    document.getElementById('transportMode').value = config.transportMode;
    document.getElementById('restTime').value = config.restTime;
}

function saveSettings() {
    config.startLat = parseFloat(document.getElementById('startLat').value);
    config.startLng = parseFloat(document.getElementById('startLng').value);
    config.museumTimeSpent = parseInt(document.getElementById('museumTimeSpent').value);
    config.transportMode = document.getElementById('transportMode').value;
    config.restTime = parseInt(document.getElementById('restTime').value);

    localStorage.setItem('museosConfig', JSON.stringify(config));
    
    document.getElementById('messageContainer').innerHTML = '<div class="message success">✓ Configuración guardada</div>';
    
    // Redibujar punto de inicio
    drawStartingPoint();

    setTimeout(closeSettings, 1500);
}

// ===== MENSAJES =====
function showMessage(text, type = 'info') {
    const container = document.getElementById('messageContainer') || createMessageContainer();
    const msg = document.createElement('div');
    msg.className = `message show ${type}`;
    msg.textContent = text;
    container.innerHTML = '';
    container.appendChild(msg);

    setTimeout(() => {
        if (msg.parentNode) msg.remove();
    }, 5000);
}

// Funciones para la barra de progreso visual
function showProgress(text, percent = 0) {
    const container = document.getElementById('progressContainer');
    if (!container) return; // Si no existe el contenedor, ignorar
    
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    
    if (container && progressText && progressBar) {
        container.style.display = 'block';
        progressText.textContent = text;
        progressBar.style.width = percent + '%';
    }
}

function updateProgress(percent, text) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
        progressBar.style.width = percent + '%';
        if (text) progressText.textContent = text;
    }
}

function hideProgress() {
    const container = document.getElementById('progressContainer');
    if (container) {
        container.style.display = 'none';
    }
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'messageContainer';
    document.body.insertBefore(container, document.body.firstChild);
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 999; width: 350px;';
    return container;
}

// Función para descargar PDF
function downloadPDF() {
    if (!optimizedRoute.steps) {
        showMessage('No hay ruta optimizada para descargar', 'error');
        return;
    }

    // Crear contenido HTML para el PDF (sin DOCTYPE ni estructura HTML completa)
    let htmlContent = `
        <div style="font-family: 'Arial', sans-serif; color: #333;">
            <div style="text-align: center; border-bottom: 3px solid #FF6B35; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #FF6B35; font-size: 28px; margin: 0;">🗺️ Plan de Visita a Museos CDMX</h1>
                <p style="color: #666; margin: 5px 0 0 0;">Ruta Optimizada para Tu Recorrido</p>
            </div>

            <div style="background: #fff8e1; padding: 15px; border-left: 4px solid #FF6B35; margin-bottom: 30px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600;">
                    <span>📊 Total de Museos:</span>
                    <span>${optimizedRoute.steps.length - 1} (+ retorno a casa)</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600;">
                    <span>⏱️ Tiempo Total:</span>
                    <span>${formatTime(optimizedRoute.totalTime)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600;">
                    <span>📏 Distancia Total:</span>
                    <span>${optimizedRoute.totalDistance.toFixed(2)} km</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0; font-weight: 600;">
                    <span>📍 Punto de Inicio:</span>
                    <span>🏠 Tu Hogar</span>
                </div>
            </div>
    `;

    let currentTime = 0;

    // Agregar cada paso
    optimizedRoute.steps.forEach((step, index) => {
        const museum = step.museum;
        currentTime += step.travelTime;
        const arrivalTime = new Date();
        arrivalTime.setMinutes(arrivalTime.getMinutes() + currentTime);

        const isReturn = step.isReturn;
        const borderColor = isReturn ? '#ffa500' : '#FF6B35';
        const bgColor = isReturn ? '#fff8e1' : '#f9fafb';

        htmlContent += `
            <div style="background: ${bgColor}; padding: 20px; margin-bottom: 15px; border-left: 5px solid ${borderColor}; border-radius: 4px;">
                <div style="background: linear-gradient(135deg, ${isReturn ? '#ffa500' : '#FF6B35'}, ${isReturn ? '#ff8c00' : '#F7931E'}); color: white; padding: 8px 12px; border-radius: 4px; display: inline-block; font-weight: 700; margin-bottom: 10px; font-size: 18px;">
                    ${isReturn ? '🏠' : index + 1}
                </div>
                <div style="font-size: 18px; font-weight: 700; color: #333; margin-bottom: 10px;">${isReturn ? 'Retorno a Casa' : museum.nombre_oficial}</div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                    ${!isReturn ? `<div style="margin-bottom: 5px;"><strong style="color: #FF6B35;">📌 Categoría:</strong> ${museum.categoria || 'N/A'}</div>` : ''}
                    <div style="margin-bottom: 5px;"><strong style="color: #FF6B35;">📍 Ubicación:</strong> ${museum.colonia || 'N/A'}</div>
                    
                    ${!isReturn ? `<div style="margin-bottom: 5px;"><strong style="color: #FF6B35;">💰 Costo:</strong> ${museum.costos || 'Consultar'}</div>` : ''}
                    <div style="margin-bottom: 5px;"><strong style="color: #FF6B35;">⏱️ Traslado:</strong> ${step.travelTime} min</div>
                    
                    ${!isReturn ? `<div style="margin-bottom: 5px;"><strong style="color: #FF6B35;">⏰ Visita:</strong> ${step.visitTime} min</div>` : ''}
                    ${!isReturn ? `<div style="margin-bottom: 5px;"><strong style="color: #FF6B35;">💤 Descanso:</strong> ${step.restTime} min</div>` : ''}
                    
                    <div style="margin-bottom: 5px;"><strong style="color: #FF6B35;">📏 Distancia:</strong> ${step.travelDistance} km</div>
                    <div style="margin-bottom: 5px;"><strong style="color: #FF6B35;">🕐 Llegada:</strong> ${arrivalTime.toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}</div>
                    
                    ${!isReturn && museum.horarios ? `<div style="margin-bottom: 5px; grid-column: 1/3;"><strong style="color: #FF6B35;">🕒 Horarios:</strong> ${museum.horarios}</div>` : ''}
                </div>
            </div>
        `;

        if (!isReturn) {
            currentTime += step.visitTime + step.restTime;
        }
    });

    htmlContent += `
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
                <p>✨ Este plan fue optimizado automáticamente para minimizar tiempo de traslado</p>
                <p>Generado el ${new Date().toLocaleDateString('es-MX')} - Museos CDMX Explorer</p>
            </div>
        </div>
    `;

    // Usar html2pdf para generar el PDF
    const opt = {
        margin: 10,
        filename: 'plan_visita_museos_cdmx.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { 
            orientation: 'portrait', 
            unit: 'mm', 
            format: 'a4'
        }
    };

    html2pdf().set(opt).from(htmlContent).save();
    showMessage('✓ Plan descargado como PDF', 'success');
}

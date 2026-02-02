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

    // Búsqueda
    document.getElementById('searchMuseum').addEventListener('input', filterMuseums);

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
                        museums = museums.map(m => ({
                            ...m,
                            lat: parseFloat(m.latitud),
                            lng: parseFloat(m.longitud),
                            categoria: m.categoria || 'Otro'  // Agregar categoría si existe
                        }));
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
        showMessage('Error al cargar automáticamente. Intenta cargar manualmente.', 'error');
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
                museums = museums.map(m => ({
                    ...m,
                    lat: parseFloat(m.latitud),
                    lng: parseFloat(m.longitud)
                }));
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
            showMessage('Error al cargar el CSV: ' + error.message, 'error');
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
                museums = museums.map(m => ({
                    ...m,
                    lat: parseFloat(m.latitud),
                    lng: parseFloat(m.longitud)
                }));
                displayMuseums();
            } else {
                showMessage('El CSV no tiene coordenadas. Geocodificando...', 'success');
                geocodeMuseums();
            }

            document.getElementById('btnOptimizeRoute').disabled = false;
        } catch (error) {
            showMessage('Error al cargar el CSV: ' + error.message, 'error');
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
        
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <input type="checkbox" class="museum-checkbox" data-index="${index}" ${isSelected ? 'checked' : ''} style="cursor: pointer; width: 18px; height: 18px;">
                <div style="flex: 1;">
                    <div class="museum-name">${museum.nombre_oficial}</div>
                    <div class="museum-info">
                        <div><strong>📍</strong> ${museum.colonia || 'N/A'}</div>
                        <div><strong>💰</strong> ${museum.costos || 'Consultar'}</div>
                        <div><strong>🕐</strong> ${museum.horarios || 'No especificado'}</div>
                    </div>
                </div>
            </div>
            <div class="badge">#${index + 1}</div>
        `;

        // Evento para checkbox
        const checkbox = item.querySelector('.museum-checkbox');
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

        // Mostrar popup
        const popup = L.popup()
            .setLatLng([museum.lat, museum.lng])
            .setContent(`
                <div class="popup-title">${museum.nombre_oficial}</div>
                <div class="popup-info">
                    <p><strong>Dirección:</strong> ${museum.calle || 'N/A'}</p>
                    <p><strong>Colonia:</strong> ${museum.colonia || 'N/A'}</p>
                    <p><strong>Costo:</strong> ${museum.costos || 'Consultar'}</p>
                    <p><strong>Horarios:</strong> ${museum.horarios || 'Consultar'}</p>
                </div>
            `)
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
    let filterContainer = document.getElementById('categoryFilters');
    
    if (!filterContainer) {
        // Crear contenedor si no existe
        const searchBox = document.querySelector('.search-box');
        if (!searchBox) {
            console.warn('No se encontró .search-box para crear filtros de categoría');
            return;
        }
        
        const newDiv = document.createElement('div');
        newDiv.id = 'categoryFilters';
        newDiv.style.padding = '10px';
        newDiv.style.borderBottom = '1px solid #eee';
        searchBox.parentNode.insertBefore(newDiv, searchBox.nextSibling);
        filterContainer = newDiv;
    }
    
    filterContainer.innerHTML = '<strong>🏷️ Categorías:</strong> ';
    
    // Botón para seleccionar/deseleccionar todas
    const toggleBtn = document.createElement('button');
    toggleBtn.style.marginLeft = '10px';
    toggleBtn.style.padding = '4px 10px';
    toggleBtn.style.fontSize = '12px';
    toggleBtn.style.borderRadius = '4px';
    toggleBtn.style.border = '1px solid #FF6B35';
    toggleBtn.style.backgroundColor = '#fff';
    toggleBtn.style.color = '#FF6B35';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.fontWeight = '600';
    toggleBtn.textContent = 'Deseleccionar todas';
    toggleBtn.addEventListener('click', function() {
        const allChecked = document.querySelectorAll('#categoryFilters input:checked').length === categorias.length;
        document.querySelectorAll('#categoryFilters input[type="checkbox"]').forEach(cb => {
            cb.checked = !allChecked;
        });
        filterMuseumsByCategory();
        toggleBtn.textContent = allChecked ? 'Seleccionar todas' : 'Deseleccionar todas';
    });
    filterContainer.appendChild(toggleBtn);
    
    // Crear contenedor para checkboxes
    const checkboxContainer = document.createElement('div');
    checkboxContainer.style.marginTop = '8px';
    filterContainer.appendChild(checkboxContainer);
    
    categorias.forEach(categoria => {
        const count = museums.filter(m => m.categoria === categoria).length;
        const label = document.createElement('label');
        label.style.marginRight = '15px';
        label.style.cursor = 'pointer';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = categoria;
        checkbox.checked = true;
        checkbox.addEventListener('change', filterMuseumsByCategory);
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${categoria} (${count})`));
        checkboxContainer.appendChild(label);
    });
}

// Filtrar museos por categoría
function filterMuseumsByCategory() {
    const selectedCategories = Array.from(document.querySelectorAll('#categoryFilters input:checked'))
        .map(cb => cb.value);
    
    const filteredMuseums = museums.filter(m => selectedCategories.includes(m.categoria));
    
    // Actualizar selectedMuseums para que solo contenga los museos que coinciden con el filtro actual
    selectedMuseums.clear();
    filteredMuseums.forEach((museum) => {
        const originalIndex = museums.indexOf(museum);
        selectedMuseums.add(originalIndex);
    });
    
    const list = document.getElementById('museumsList');
    list.innerHTML = '';

    filteredMuseums.forEach((museum) => {
        const originalIndex = museums.indexOf(museum);
        const isSelected = selectedMuseums.has(originalIndex);
        
        const item = document.createElement('div');
        item.className = 'museum-item';
        
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <input type="checkbox" class="museum-checkbox" data-index="${originalIndex}" ${isSelected ? 'checked' : ''} style="cursor: pointer; width: 18px; height: 18px;">
                <div style="flex: 1;">
                    <div class="museum-name">${museum.nombre_oficial}</div>
                    <div class="museum-info">
                        <div><strong>🏷️</strong> ${museum.categoria || 'N/A'}</div>
                        <div><strong>📍</strong> ${museum.colonia || 'N/A'}</div>
                        <div><strong>💰</strong> ${museum.costos || 'Consultar'}</div>
                    </div>
                </div>
            </div>
            <div class="badge">#${originalIndex + 1}</div>
        `;

        // Evento para checkbox
        const checkbox = item.querySelector('.museum-checkbox');
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

        const popupContent = `
            <div class="popup-title">${museum.nombre_oficial}</div>
            <div class="popup-info">
                <p><strong>📍</strong> ${museum.colonia || 'N/A'}</p>
                <p><strong>💰</strong> ${museum.costos || 'Consultar'}</p>
                <p><strong>🕐</strong> ${museum.horarios || 'Consultar'}</p>
            </div>
        `;

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
    const query = document.getElementById('searchMuseum').value.toLowerCase();
    const items = document.querySelectorAll('.museum-item');

    items.forEach((item, index) => {
        const museum = museums[index];
        const match = museum.nombre_oficial.toLowerCase().includes(query) ||
                     museum.colonia.toLowerCase().includes(query);
        item.style.display = match ? 'block' : 'none';
    });
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
        showMessage('❌ Error al optimizar: ' + error.message, 'error');
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
        showMessage('❌ Error: ' + error.message, 'error');
        hideProgress();
    } finally {
        document.getElementById('btnAutoDownload').disabled = false;
    }
}

function displayRoute() {
    const routeInfo = document.getElementById('routeInfo');
    
    if (!optimizedRoute.steps) {
        routeInfo.innerHTML = '<div style="padding: 20px; text-align: center;">No hay ruta</div>';
        return;
    }

    let html = `
        <div class="route-summary">
            <div class="summary-item">
                <strong>⏱️ Tiempo total:</strong>
                <span>${formatTime(optimizedRoute.totalTime)}</span>
            </div>
            <div class="summary-item">
                <strong>📏 Distancia total:</strong>
                <span>${optimizedRoute.totalDistance} km</span>
            </div>
            <div class="summary-item">
                <strong>🏛️ Museos visitados:</strong>
                <span>${optimizedRoute.steps.length - 1}</span> (+ retorno a casa)
            </div>
        </div>
    `;

    let currentTime = 0;

    optimizedRoute.steps.forEach((step, index) => {
        const museum = step.museum;
        currentTime += step.travelTime;
        const arrivalTime = new Date();
        arrivalTime.setMinutes(arrivalTime.getMinutes() + currentTime);

        // Estilos diferentes para retorno a casa
        const isReturn = step.isReturn;
        const stepClass = isReturn ? 'route-step' : 'route-step';
        const bgColor = isReturn ? '#fff8e1' : '#f9fafb';
        const stepLat = isReturn ? config.startLat : museum.lat;
        const stepLng = isReturn ? config.startLng : museum.lng;
        const stepZoom = isReturn ? 15 : 16;

        html += `
            <div class="route-step" 
                 data-lat="${stepLat}" 
                 data-lng="${stepLng}" 
                 data-zoom="${stepZoom}"
                 style="background: ${bgColor}; border-left-color: ${isReturn ? '#ffa500' : '#FF6B35'}; cursor: pointer; transition: all 0.2s;" 
                 onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.transform='translateX(4px)';" 
                 onmouseout="this.style.boxShadow='none'; this.style.transform='translateX(0);'">
                <div class="step-number" style="color: ${isReturn ? '#ff6b6b' : '#FF6B35'};">
                    ${isReturn ? '🏠 Retorno a Casa' : `📍 Paso ${index + 1}`}
                </div>
                <div class="step-museum" style="font-weight: 600;">${museum.nombre_oficial}</div>
                <div class="step-details">
                    ${!isReturn ? `<p><strong>🏷️</strong> ${museum.categoria || 'N/A'}</p>` : ''}
                    <p><strong>📍</strong> ${museum.colonia || 'N/A'}</p>
                    <p><strong>⏱️ Traslado:</strong> ${step.travelTime} min</p>
                    ${!isReturn ? `<p><strong>⏰ Visita:</strong> ${step.visitTime} min</p>` : ''}
                    ${!isReturn ? `<p><strong>💤 Descanso:</strong> ${step.restTime} min</p>` : ''}
                    <p><strong>📏 Distancia:</strong> ${step.travelDistance} km</p>
                    <p><strong>🕐 Llegada aproximada:</strong> ${arrivalTime.toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}</p>
                    ${!isReturn ? `<p><strong>💰 Costo:</strong> ${museum.costos || 'Consultar'}</p>` : ''}
                    <p style="color: #666; font-size: 12px; margin-top: 8px;">👆 Haz clic para ir a este lugar en el mapa</p>
                </div>
            </div>
        `;

        if (!isReturn) {
            currentTime += step.visitTime + step.restTime;
        }
    });

    html += `
        <div style="position: sticky; bottom: 0; padding: 20px; gap: 12px; display: flex; flex-direction: row; background: linear-gradient(135deg, #FFE5D9, #FFF0E6); border-radius: 8px; margin-top: 15px; border: 3px solid #FF6B35; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.2); z-index: 100;">
            <button class="btn btn-success" style="flex: 1; padding: 14px; font-weight: 700; font-size: 15px; border-radius: 6px; background: linear-gradient(135deg, #10b981, #059669); border: none; cursor: pointer; transition: all 0.3s; color: white;" 
                    onmouseover="this.style.boxShadow='0 6px 12px rgba(16, 185, 129, 0.4)'; this.style.transform='translateY(-2px)';" 
                    onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0);'"
                    onclick="downloadItinerary()">
                <i class="fas fa-download" style="margin-right: 8px;"></i> Descargar Plan (CSV)
            </button>
        </div>
    `;

    routeInfo.innerHTML = html;
    
    // Agregar event listeners a los items de ruta después de crear el HTML
    document.querySelectorAll('.route-step').forEach(item => {
        item.addEventListener('click', function() {
            const lat = parseFloat(this.getAttribute('data-lat'));
            const lng = parseFloat(this.getAttribute('data-lng'));
            const zoom = parseInt(this.getAttribute('data-zoom'));
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

// ===== APLICACIÓN PRINCIPAL =====

let map;
let museums = [];
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

        // Intentar cargar el CSV automáticamente
        const csvFiles = ['museos_cdmx_con_coordenadas.csv', 'museos_cdmx.csv'];
        
        console.log('Detectado:', { isGitHubPages, isLocalhost, baseUrl });
        
        for (let csvFile of csvFiles) {
            try {
                // Intentar con URL absoluta primero
                let csvUrl = baseUrl + csvFile;
                console.log(`Intentando cargar: ${csvUrl}`);
                
                let response = await fetch(csvUrl);
                
                // Si no funciona, intentar desde raíz
                if (!response.ok) {
                    csvUrl = '/' + csvFile;
                    console.log(`Reintentando desde raíz: ${csvUrl}`);
                    response = await fetch(csvUrl);
                }
                
                if (response.ok) {
                    const csv = await response.text();
                    const results = Papa.parse(csv, { header: true });

                    if (results.errors.length > 0) {
                        console.error('Error al parsear CSV');
                        continue;
                    }

                    museums = results.data.filter(row => row.nombre_oficial);

                    // Si el CSV tiene coordenadas, usarlas
                    if (museums[0] && museums[0].latitud && museums[0].longitud) {
                        museums = museums.map(m => ({
                            ...m,
                            lat: parseFloat(m.latitud),
                            lng: parseFloat(m.longitud)
                        }));
                    } else {
                        // Geocodificar
                        showMessage(`Geocodificando ${museums.length} museos... esto puede tomar unos minutos`, 'info');
                        await geocodeMuseums();
                    }

                    displayMuseums();
                    document.getElementById('btnOptimizeRoute').disabled = false;
                    showMessage(`✓ ${museums.length} museos cargados automáticamente`, 'success');
                    console.log('CSV cargado exitosamente:', csvUrl);
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

    museums.forEach((museum, index) => {
        const item = document.createElement('div');
        item.className = 'museum-item';
        item.innerHTML = `
            <div class="museum-name">${museum.nombre_oficial}</div>
            <div class="museum-info">
                <div><strong>📍</strong> ${museum.colonia || 'N/A'}</div>
                <div><strong>💰</strong> ${museum.costos || 'Consultar'}</div>
                <div><strong>🕐</strong> ${museum.horarios || 'No especificado'}</div>
            </div>
            <div class="badge">#${index + 1}</div>
        `;

        item.addEventListener('click', () => selectMuseum(index));
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

    // Crear icono rojo personalizado
    const redIcon = L.icon({
        iconUrl: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"%3E%3Ccircle cx="12" cy="12" r="10" fill="%23ff0000" stroke="white" stroke-width="2"/%3E%3Ctext x="12" y="15" text-anchor="middle" fill="white" font-size="12" font-weight="bold"%3E◉%3C/text%3E%3C/svg%3E',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });

    startMarker = L.marker([config.startLat, config.startLng], { icon: redIcon });
    startMarker.bindPopup('🏁 <strong>PUNTO DE INICIO</strong><br>Haz clic para la información de la ruta');
    startMarker.addTo(map);

    // Agregar círculo alrededor del marcador para mayor visibilidad
    const circle = L.circle([config.startLat, config.startLng], {
        radius: 200,
        color: '#ff0000',
        fill: false,
        weight: 2,
        opacity: 0.5,
        dashArray: '5, 5'
    });
    circle.addTo(map);
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

    try {
        showMessage('Calculando ruta óptima... esto puede tomar un momento', 'success');

        // Implementar algoritmo TSP aproximado (Nearest Neighbor)
        const route = await calculateOptimalRoute();
        optimizedRoute = route;

        displayRoute();
        drawRouteOnMap();
        showMessage('✓ Ruta optimizada correctamente', 'success');

    } catch (error) {
        showMessage('Error al optimizar: ' + error.message, 'error');
    } finally {
        document.getElementById('btnOptimizeRoute').disabled = false;
    }
}

async function calculateOptimalRoute() {
    // Algoritmo Nearest Neighbor para TSP aproximado
    const startPoint = {
        lat: config.startLat,
        lng: config.startLng,
        name: 'Punto de inicio'
    };

    let currentPoint = startPoint;
    let unvisited = [...museums];
    let route = [];
    let totalTime = 0;
    let totalDistance = 0;

    while (unvisited.length > 0) {
        let nearest = null;
        let nearestDist = Infinity;
        let nearestIdx = -1;

        // Encontrar el museo más cercano
        for (let i = 0; i < unvisited.length; i++) {
            const dist = calculateHaversine(currentPoint, unvisited[i]);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = unvisited[i];
                nearestIdx = i;
            }
        }

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
                <strong>🏛️ Museos:</strong>
                <span>${optimizedRoute.steps.length}</span>
            </div>
        </div>
    `;

    let currentTime = 0;

    optimizedRoute.steps.forEach((step, index) => {
        const museum = step.museum;
        currentTime += step.travelTime;
        const arrivalTime = new Date();
        arrivalTime.setMinutes(arrivalTime.getMinutes() + currentTime);

        html += `
            <div class="route-step">
                <div class="step-number">Paso ${index + 1}</div>
                <div class="step-museum">${museum.nombre_oficial}</div>
                <div class="step-details">
                    <p><strong>📍</strong> ${museum.colonia}</p>
                    <p><strong>⏱️ Traslado:</strong> ${step.travelTime} min</p>
                    <p><strong>⏰ Visita:</strong> ${step.visitTime} min</p>
                    <p><strong>💤 Descanso:</strong> ${step.restTime} min</p>
                    <p><strong>📏 Distancia:</strong> ${step.travelDistance} km</p>
                    <p><strong>🕐 Llegada aproximada:</strong> ${arrivalTime.toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}</p>
                    <p><strong>💰 Costo:</strong> ${museum.costos || 'Consultar'}</p>
                </div>
            </div>
        `;

        currentTime += step.visitTime + step.restTime;
    });

    html += `
        <div style="padding: 15px; gap: 10px; display: flex; flex-direction: column;">
            <button class="btn btn-success" style="width: 100%;" onclick="downloadItinerary()">
                <i class="fas fa-download"></i> Descargar Plan (CSV)
            </button>
            <button class="btn btn-primary" style="width: 100%;" onclick="downloadPDF()">
                <i class="fas fa-file-pdf"></i> Descargar Pasaporte (PDF)
            </button>
        </div>
    `;

    routeInfo.innerHTML = html;

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

        // Dibujar línea de la ruta
        if (step.geometry) {
            try {
                const decoded = decodePolyline(step.geometry);
                const polyline = L.polyline(decoded, {
                    color: '#48bb78',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '5, 5'
                });
                routeGroup.addLayer(polyline);
            } catch (e) {
                console.log('No se pudo decodificar geometría, usando línea directa');
                const line = L.polyline([
                    [currentPoint.lat, currentPoint.lng],
                    [museum.lat, museum.lng]
                ], {
                    color: '#48bb78',
                    weight: 3,
                    opacity: 0.8
                });
                routeGroup.addLayer(line);
            }
        } else {
            // Fallback: línea directa
            const line = L.polyline([
                [currentPoint.lat, currentPoint.lng],
                [museum.lat, museum.lng]
            ], {
                color: '#48bb78',
                weight: 3,
                opacity: 0.8
            });
            routeGroup.addLayer(line);
        }

        // Agregar número de paso en el marcador
        const stepMarker = L.circleMarker([museum.lat, museum.lng], {
            radius: 12,
            fillColor: '#48bb78',
            color: '#fff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        });

        const label = L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'step-label'
        });
        label.setContent(`<strong style="color: white; font-size: 14px;">${index + 1}</strong>`);
        stepMarker.bindTooltip(label);
        
        stepMarker.bindPopup(`
            <div class="popup-title">Paso ${index + 1}</div>
            <div class="popup-info">
                <p><strong>${museum.nombre_oficial}</strong></p>
                <p>Traslado: ${step.travelTime} min</p>
                <p>Visita: ${step.visitTime} min</p>
                <p>Distancia: ${step.travelDistance} km</p>
            </div>
        `);

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

function createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'messageContainer';
    document.body.insertBefore(container, document.body.firstChild);
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 999; width: 350px;';
    return container;
}

// Función para descargar PDF
function downloadPDF() {
    showMessage('Abriendo generador de pasaporte...', 'info');
    window.open('generar_pdf.html', '_blank');
}

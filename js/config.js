/**
 * Configuración de Entornos
 * Detecta automáticamente el entorno y aplica configuración correspondiente
 */

const CONFIG = {
    // Detectar entorno
    environment: detectEnvironment(),
    
    // URLs de APIs
    apis: {
        osm: 'https://nominatim.openstreetmap.org/search',
        osrm: 'https://router.project-osrm.org/route/v1',
        tiles: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    },
    
    // Configuración de museos
    museums: {
        defaultCsvFiles: ['museos_cdmx_con_coordenadas.csv', 'museos_cdmx.csv'],
        defaultLocation: { lat: 19.4326, lng: -99.1332 }, // CDMX Centro
    },
    
    // Configuración de mapa
    map: {
        defaultZoom: 12,
        maxZoom: 19,
        tileAttribution: '© OpenStreetMap'
    },
    
    // Timeouts
    timeouts: {
        geocoding: 300,  // ms entre requests
        routing: 100,    // ms entre requests
        messageDisplay: 5000  // ms para mostrar mensajes
    }
};

/**
 * Detectar ambiente de ejecución
 */
function detectEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname.includes('github.io')) {
        // Para GitHub Pages, construir URL correctamente
        // Ej: https://usuario.github.io/repo/ -> https://raw.githubusercontent.com/usuario/repo/main/
        const pathParts = window.location.pathname.split('/').filter(p => p);
        const username = hostname.split('.')[0];
        const repo = pathParts[0] || '';
        
        return {
            name: 'github-pages',
            isProduction: true,
            isLocal: false,
            url: `https://raw.githubusercontent.com/${username}/${repo}/main/`,
            description: 'GitHub Pages'
        };
    } else if (hostname.includes('vercel.app') || hostname.includes('now.sh')) {
        return {
            name: 'vercel',
            isProduction: true,
            isLocal: false,
            url: window.location.origin + '/',
            description: 'Vercel'
        };
    } else if (hostname.includes('netlify.app')) {
        return {
            name: 'netlify',
            isProduction: true,
            isLocal: false,
            url: window.location.origin + '/',
            description: 'Netlify'
        };
    } else if (hostname.includes('onrender.com')) {
        return {
            name: 'render',
            isProduction: true,
            isLocal: false,
            url: window.location.origin + '/',
            description: 'Render'
        };
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return {
            name: 'local-server',
            isProduction: false,
            isLocal: true,
            url: window.location.origin + window.location.pathname.replace(/[^/]*$/, ''),
            description: 'Servidor Local'
        };
    } else if (protocol === 'file:') {
        return {
            name: 'file-system',
            isProduction: false,
            isLocal: true,
            url: window.location.pathname.replace(/[^/]*$/, ''),
            description: 'Sistema de Archivos (NO RECOMENDADO)'
        };
    } else {
        return {
            name: 'unknown',
            isProduction: true,
            isLocal: false,
            url: window.location.origin + '/',
            description: 'Servidor Desconocido'
        };
    }
}

/**
 * Construir URL para cargar archivos
 */
function getFileUrl(filename) {
    const env = CONFIG.environment;
    
    if (env.name === 'file-system') {
        console.warn('⚠️  Sistema de archivos detectado. Usar servidor local.');
        return filename;
    }
    
    // Construir URL completa
    let url = env.url + filename;
    
    // Asegurar que no tenga dobles slashes
    url = url.replace(/([^:]\/)\/+/g, '$1');
    
    return url;
}

/**
 * Log de configuración
 */
function logConfiguration() {
    const env = CONFIG.environment;
    console.log('%c🏛️ CDMX MUSEOS - Configuración', 'color: #667eea; font-size: 14px; font-weight: bold;');
    console.log('%cEntorno:', 'color: #667eea; font-weight: bold;', env.description);
    console.log('%cProducción:', 'color: #667eea; font-weight: bold;', env.isProduction);
    console.log('%cURL Base:', 'color: #667eea; font-weight: bold;', env.url);
    console.log('%cAPI OSM:', 'color: #667eea; font-weight: bold;', CONFIG.apis.osm);
    console.log('%cAPI OSRM:', 'color: #667eea; font-weight: bold;', CONFIG.apis.osrm);
}

// Exportar para usar en otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, getFileUrl, detectEnvironment };
}

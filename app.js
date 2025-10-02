
// Configuración de paginación
const POKEMON_PER_PAGE = 24;
const TOTAL_POKEMON = 1025;
const TOTAL_PAGES = Math.ceil(TOTAL_POKEMON / POKEMON_PER_PAGE); // 43 páginas

// Variables globales para el estado de la aplicación
let currentPage = 1;
let isSearchMode = false;
let currentSearchResults = [];

// Estados de la aplicación
const ESTADOS = {
    CARGANDO_LISTA: 'Lista cargando...',
    BUSCANDO: 'Buscando...',
    ERROR: 'Error...',
    DESDE_CACHE: 'Desde caché ✅',
    LISTO: 'Listo'
};

let estadoActual = ESTADOS.LISTO;
let cachePokemon = new Map(); // Cache para almacenar Pokémon ya cargados

// Historial de búsquedas (localStorage)
const SEARCH_HISTORY_KEY = 'searchHistory';
const SEARCH_HISTORY_LIMIT = 10;
const THEME_KEY = 'theme';
const FAVORITES_KEY = 'favorites';
const FAVORITES_LIMIT = 50;

// Gestión de temas
function inicializarTema() {
    const temaGuardado = localStorage.getItem(THEME_KEY) || 'light';
    cambiarTema(temaGuardado);
}

function cambiarTema(tema) {
    const body = document.body;
    const iconoTema = document.querySelector('.theme-icon');
    
    if (tema === 'dark') {
        body.setAttribute('data-theme', 'dark');
        iconoTema.textContent = '☀️';
        localStorage.setItem(THEME_KEY, 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
        iconoTema.textContent = '🌙';
        localStorage.setItem(THEME_KEY, 'light');
    }
}

function alternarTema() {
    const temaActual = document.body.getAttribute('data-theme');
    const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';
    cambiarTema(nuevoTema);
}

// Gestión de favoritos
function obtenerFavoritos() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function guardarFavoritos(favoritos) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritos));
    } catch (e) {
        console.error('Error al guardar favoritos:', e);
    }
}

function agregarAFavoritos(pokemon) {
    let favoritos = obtenerFavoritos();
    
    // Verificar si ya existe
    if (favoritos.some(fav => fav.id === pokemon.id)) {
        mostrarMensajeBusqueda(`${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} ya está en favoritos`, 'info');
        return false;
    }
    
    // Verificar límite
    if (favoritos.length >= FAVORITES_LIMIT) {
        mostrarMensajeBusqueda(`Límite de ${FAVORITES_LIMIT} favoritos alcanzado`, 'error');
        return false;
    }
    
    favoritos.push(pokemon);
    guardarFavoritos(favoritos);
    mostrarMensajeBusqueda(`${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} agregado a favoritos`, 'success');
    actualizarBotonFavorito(pokemon.id, true);
    actualizarContadorFavoritos();
    return true;
}

function removerDeFavoritos(idPokemon) {
    let favoritos = obtenerFavoritos();
    const pokemon = favoritos.find(fav => fav.id === idPokemon);
    
    if (pokemon) {
        favoritos = favoritos.filter(fav => fav.id !== idPokemon);
        guardarFavoritos(favoritos);
        mostrarMensajeBusqueda(`${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} removido de favoritos`, 'info');
        actualizarBotonFavorito(idPokemon, false);
        actualizarContadorFavoritos();
        
        // Si estamos en la vista de favoritos, actualizar la vista
        if (vistaActual === 'favoritos') {
            mostrarFavoritos();
        }
        return true;
    }
    return false;
}

function esFavorito(idPokemon) {
    const favoritos = obtenerFavoritos();
    return favoritos.some(fav => fav.id === idPokemon);
}

function actualizarBotonFavorito(idPokemon, esFav) {
    const boton = document.querySelector(`[data-pokemon-id="${idPokemon}"] .favorite-btn`);
    if (boton) {
        if (esFav) {
            boton.innerHTML = '❤️';
            boton.title = 'Remover de favoritos';
            boton.classList.add('favorito');
        } else {
            boton.innerHTML = '🤍';
            boton.title = 'Agregar a favoritos';
            boton.classList.remove('favorito');
        }
    }
}

function obtenerHistorialBusqueda() {
    try {
        const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function guardarHistorialBusqueda(historial) {
    try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(historial));
    } catch (e) {
        // ignorar errores de cuota o disponibilidad
    }
}

function agregarAlHistorialBusqueda(termino) {
    const normalizado = termino.trim().toLowerCase();
    if (!normalizado) return;
    let historial = obtenerHistorialBusqueda();
    historial = historial.filter(item => item !== normalizado);
    historial.unshift(normalizado);
    if (historial.length > SEARCH_HISTORY_LIMIT) {
        historial = historial.slice(0, SEARCH_HISTORY_LIMIT);
    }
    guardarHistorialBusqueda(historial);
    renderizarHistorialBusqueda();
}

function renderizarHistorialBusqueda() {
    const listaEl = document.getElementById('search-history-list');
    const contenedor = document.getElementById('search-history');
    if (!listaEl || !contenedor) return;
    const historial = obtenerHistorialBusqueda();
    listaEl.innerHTML = '';
    if (historial.length === 0) {
        contenedor.style.display = 'none';
        return;
    }
    contenedor.style.display = 'block';
    historial.forEach(termino => {
        const li = document.createElement('li');
        li.textContent = termino;
        li.setAttribute('role', 'button');
        li.addEventListener('click', () => {
            const input = document.getElementById('search-input');
            input.value = termino;
            buscarPokemon();
        });
        listaEl.appendChild(li);
    });
}


function crearTarjetaPokemonElement(pokemon, indice) {
    const tarjetaPokemon = document.createElement("div")
    tarjetaPokemon.className = "pokemon-card"
    tarjetaPokemon.setAttribute('data-pokemon-id', pokemon.id)
    
    // Contenedor de imagen con estado de carga
    const contenedorImagen = document.createElement("div")
    contenedorImagen.className = "image-container"
    
    // Placeholder mientras carga la imagen
    const placeholderImagen = document.createElement("div")
    placeholderImagen.className = "image-placeholder"
    placeholderImagen.innerHTML = "🔄"
    
    // Imagen del pokémon
    const imagenPokemon = document.createElement("img")
    imagenPokemon.src = pokemon.image
    imagenPokemon.alt = pokemon.name
    imagenPokemon.className = "pokemon-image"
    imagenPokemon.loading = "lazy"
    imagenPokemon.style.display = "none" // Ocultar hasta que cargue
    
    // Mostrar imagen cuando cargue
    imagenPokemon.onload = function() {
        placeholderImagen.style.display = "none"
        imagenPokemon.style.display = "block"
        imagenPokemon.style.opacity = "0"
        setTimeout(() => {
            imagenPokemon.style.opacity = "1"
        }, 50)
    }
    
    // Manejar error de imagen
    imagenPokemon.onerror = function() {
        placeholderImagen.innerHTML = "❌"
        placeholderImagen.style.color = "#e53e3e"
    }
    
    contenedorImagen.appendChild(placeholderImagen)
    contenedorImagen.appendChild(imagenPokemon)
    
    // Contenedor de información
    const infoPokemon = document.createElement("div")
    infoPokemon.className = "pokemon-info"
    
    // Nombre y ID
    const nombrePokemon = document.createElement("h3")
    nombrePokemon.innerHTML = `${pokemon.id}. ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`;
    
    // Tipos
    const tiposPokemon = document.createElement("div")
    tiposPokemon.className = "pokemon-types"
    pokemon.types.forEach(tipo => {
        const spanTipo = document.createElement("span")
        spanTipo.className = `type ${tipo}`
        spanTipo.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1)
        tiposPokemon.appendChild(spanTipo)
    });
    
    // Altura y peso
    const estadisticasPokemon = document.createElement("div")
    estadisticasPokemon.className = "pokemon-stats"
    estadisticasPokemon.innerHTML = `
        <p><strong>Altura:</strong> ${pokemon.height / 10}m</p>
        <p><strong>Peso:</strong> ${pokemon.weight / 10}kg</p>
    `;
    
    // Botón de favoritos
    const botonFavorito = document.createElement("button")
    botonFavorito.className = "favorite-btn"
    botonFavorito.innerHTML = esFavorito(pokemon.id) ? '❤️' : '🤍'
    botonFavorito.title = esFavorito(pokemon.id) ? 'Remover de favoritos' : 'Agregar a favoritos'
    if (esFavorito(pokemon.id)) {
        botonFavorito.classList.add('favorito')
    }
    
    botonFavorito.addEventListener('click', function(e) {
        e.stopPropagation() // Evitar que se abra el modal
        if (esFavorito(pokemon.id)) {
            removerDeFavoritos(pokemon.id)
        } else {
            agregarAFavoritos(pokemon)
        }
    })
    
    // Ensamblar la tarjeta
    infoPokemon.appendChild(nombrePokemon)
    infoPokemon.appendChild(tiposPokemon)
    infoPokemon.appendChild(estadisticasPokemon)
    
    tarjetaPokemon.appendChild(contenedorImagen)
    tarjetaPokemon.appendChild(infoPokemon)
    tarjetaPokemon.appendChild(botonFavorito)
    
    // Agregar event listener para mostrar la ficha del Pokémon
    tarjetaPokemon.addEventListener('click', function() {
        mostrarDetallesPokemon(pokemon.id);
    });
    
    return tarjetaPokemon;
}

// Función de compatibilidad (mantener para no romper código existente)
function crearTarjetaPokemon(pokemon, indice) {
    const tarjetaPokemon = crearTarjetaPokemonElement(pokemon, indice);
    document.getElementById("pokemon-container").appendChild(tarjetaPokemon);
}

function mostrarMensajeError() {
    const contenedor = document.getElementById("pokemon-container");
    contenedor.innerHTML = `
        <div class="error-message">
            <h3>Error al cargar los pokémones</h3>
            <p>No se pudieron obtener los datos. Por favor, intenta de nuevo más tarde.</p>
        </div>
    `;
}

// Función para mostrar los detalles del Pokémon en el modal
function mostrarDetallesPokemon(idPokemon) {
    const modal = document.getElementById('pokemon-modal');
    const cargaModal = document.getElementById('modal-loading');
    const detallesPokemon = document.getElementById('pokemon-details');
    
    // Mostrar el modal con animación suave
    modal.style.display = 'block';
    // Usar requestAnimationFrame para asegurar que el DOM se actualice
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    cargaModal.style.display = 'block';
    detallesPokemon.style.display = 'none';
    detallesPokemon.classList.remove('show');
    
    // Obtener información detallada del Pokémon
    fetch(`https://pokeapi.co/api/v2/pokemon/${idPokemon}`)
        .then(response => response.json())
        .then(datosPokemon => {
            // Crear el contenido del modal primero
            detallesPokemon.innerHTML = crearContenidoModalPokemon(datosPokemon);
            
            // Usar requestAnimationFrame para transición suave
            requestAnimationFrame(() => {
                cargaModal.style.display = 'none';
                detallesPokemon.style.display = 'block';
                // Pequeño delay para la transición
                setTimeout(() => {
                    detallesPokemon.classList.add('show');
                }, 50);
            });
        })
        .catch(error => {
            console.error('Error al obtener detalles del Pokémon:', error);
            cargaModal.innerHTML = `
                <div class="error-message">
                    <h3>Error al cargar los detalles</h3>
                    <p>No se pudieron obtener los datos del Pokémon.</p>
                </div>
            `;
        });
}

// Función para crear el contenido del modal con la información del Pokémon
function crearContenidoModalPokemon(pokemon) {
    const habilidades = pokemon.abilities.map(ability => ability.ability.name).join(', ');
    const imagenUrl = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
    
    // Preload de la imagen para mejor rendimiento
    if (imagenUrl) {
        const img = new Image();
        img.src = imagenUrl;
    }
    
    return `
        <div class="modal-header">
            <img src="${imagenUrl}" 
                 alt="${pokemon.name}" 
                 class="modal-pokemon-image"
                 loading="eager">
            <h2 class="modal-pokemon-name">${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
            <p class="modal-pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</p>
            <div class="modal-pokemon-types">
                ${pokemon.types.map(type => `
                    <span class="type ${type.type.name}">${type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)}</span>
                `).join('')}
            </div>
        </div>
        
        <div class="modal-content-body">
            <div class="modal-section">
                <h3>Estadísticas Físicas</h3>
                <div class="modal-stats">
                    <div class="stat-item">
                        <div class="stat-label">Altura</div>
                        <div class="stat-value">${(pokemon.height / 10).toFixed(1)}m</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Peso</div>
                        <div class="stat-value">${(pokemon.weight / 10).toFixed(1)}kg</div>
                    </div>
                </div>
            </div>
            
            <div class="modal-section">
                <h3>Habilidades</h3>
                <div class="modal-abilities">
                    ${pokemon.abilities.map(ability => `
                        <div class="ability-item">${ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1)}</div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Función para cerrar el modal
function cerrarModal() {
    const modal = document.getElementById('pokemon-modal');
    const detallesPokemon = document.getElementById('pokemon-details');
    
    // Remover clase show para animación de salida
    modal.classList.remove('show');
    detallesPokemon.classList.remove('show');
    
    // Ocultar modal después de la animación
    setTimeout(() => {
        modal.style.display = 'none';
    }, 200);
}

// Variables globales para almacenar todos los Pokémon
let allPokemon = [];

// Función para buscar Pokémon
function buscarPokemon() {
    const inputBusqueda = document.getElementById('search-input');
    const mensajeBusqueda = document.getElementById('search-message');
    const contenedorPokemon = document.getElementById('pokemon-container');
    
    const terminoBusqueda = inputBusqueda.value.trim().toLowerCase();
    
    if (!terminoBusqueda) {
        mostrarMensajeBusqueda('Por favor, ingresa un nombre o número de Pokémon', 'error');
        return;
    }
    
    // Verificar si ya tenemos el Pokémon en caché
    if (cachePokemon.has(terminoBusqueda)) {
        const pokemonCache = cachePokemon.get(terminoBusqueda);
        actualizarEstado(ESTADOS.DESDE_CACHE);
        mostrarEstadoCarga(true);
        
        setTimeout(() => {
            contenedorPokemon.innerHTML = '';
            mostrarTarjetasPokemon([pokemonCache]);
            mostrarEstadoCarga(false);
            mostrarMensajeBusqueda(`¡Encontrado en caché! ${pokemonCache.name.charAt(0).toUpperCase() + pokemonCache.name.slice(1)}`, 'success');
            actualizarEstado(ESTADOS.LISTO);
        }, 500); // Pequeño delay para mostrar el estado de caché
        return;
    }
    
    // Ocultar controles de paginación durante la búsqueda
    document.getElementById('pagination-top').style.display = 'none';
    document.getElementById('pagination-bottom').style.display = 'none';
    
    // Ocultar mensaje anterior y mostrar loading
    mensajeBusqueda.classList.remove('show');
    contenedorPokemon.innerHTML = '';
    isSearchMode = true;
    
    // Actualizar estado a buscando
    actualizarEstado(ESTADOS.BUSCANDO);
    mostrarEstadoCarga(true);
    
    // Buscar en la API
    fetch(`https://pokeapi.co/api/v2/pokemon/${terminoBusqueda}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Pokémon no encontrado');
            }
            return response.json();
        })
        .then(datosPokemon => {
            const pokemon = {
                name: datosPokemon.name,
                id: datosPokemon.id,
                image: datosPokemon.sprites.other['official-artwork'].front_default || datosPokemon.sprites.front_default,
                types: datosPokemon.types.map(type => type.type.name),
                height: datosPokemon.height,
                weight: datosPokemon.weight,
                abilities: datosPokemon.abilities.map(ability => ability.ability.name)
            };
            
            // Guardar en caché
            cachePokemon.set(terminoBusqueda, pokemon);
            
            mostrarEstadoCarga(false);
            currentSearchResults = [pokemon];
            mostrarTarjetasPokemon([pokemon]);
            mostrarMensajeBusqueda(`¡Encontrado! ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`, 'success');
            agregarAlHistorialBusqueda(terminoBusqueda);
            actualizarEstado(ESTADOS.LISTO);
        })
        .catch(error => {
            mostrarEstadoCarga(false);
            actualizarEstado(ESTADOS.ERROR);
            mostrarMensajeBusqueda(`No se encontró ningún Pokémon con "${terminoBusqueda}". Intenta con otro nombre o número.`, 'error');
            
            // Volver al estado listo después de 3 segundos
            setTimeout(() => {
                actualizarEstado(ESTADOS.LISTO);
            }, 3000);
        });
}

// Función para mostrar mensajes de búsqueda
function mostrarMensajeBusqueda(mensaje, tipo) {
    const mensajeBusqueda = document.getElementById('search-message');
    mensajeBusqueda.textContent = mensaje;
    mensajeBusqueda.className = `search-message show ${tipo}`;
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        mensajeBusqueda.classList.remove('show');
    }, 5000);
}

function actualizarEstado(nuevoEstado) {
    estadoActual = nuevoEstado;
    const elementoCarga = document.getElementById('loading');
    if (elementoCarga) {
        // Agregar íconos según el estado
        const iconosEstados = {
            [ESTADOS.BUSCANDO]: '🔍',
            [ESTADOS.CARGANDO_LISTA]: '⏳',
            [ESTADOS.ERROR]: '❌',
            [ESTADOS.DESDE_CACHE]: '✅',
            [ESTADOS.LISTO]: '✨'
        };
        
        const icono = iconosEstados[nuevoEstado] || '✨';
        elementoCarga.innerHTML = `${icono} ${estadoActual}`;
        
        // Actualizar atributo data-estado para estilos CSS
        const mapeoEstados = {
            [ESTADOS.BUSCANDO]: 'buscando',
            [ESTADOS.CARGANDO_LISTA]: 'cargando-lista',
            [ESTADOS.ERROR]: 'error',
            [ESTADOS.DESDE_CACHE]: 'desde-cache',
            [ESTADOS.LISTO]: 'listo'
        };
        
        const claseEstado = mapeoEstados[nuevoEstado] || 'listo';
        elementoCarga.setAttribute('data-estado', claseEstado);
    }
    console.log(`Estado actualizado: ${estadoActual}`);
}

function mostrarEstadoCarga(mostrar = true) {
    const elementoCarga = document.getElementById('loading');
    if (elementoCarga) {
        if (mostrar) {
            elementoCarga.classList.remove('hidden');
            // Pequeño delay para asegurar que la animación se vea
            setTimeout(() => {
                elementoCarga.style.transform = 'translateX(0)';
                elementoCarga.style.opacity = '1';
            }, 10);
        } else {
            elementoCarga.style.transform = 'translateX(100%)';
            elementoCarga.style.opacity = '0';
            // Remover la clase hidden después de la animación
            setTimeout(() => {
                elementoCarga.classList.add('hidden');
            }, 300);
        }
    }
}

// Función para limpiar búsqueda y mostrar todos los Pokémon
function limpiarBusqueda() {
    const inputBusqueda = document.getElementById('search-input');
    const mensajeBusqueda = document.getElementById('search-message');
    
    inputBusqueda.value = '';
    mensajeBusqueda.classList.remove('show');
    isSearchMode = false;
    currentSearchResults = [];
    
    // Mostrar controles de paginación nuevamente
    document.getElementById('pagination-top').style.display = 'block';
    document.getElementById('pagination-bottom').style.display = 'block';
    
    // Actualizar estado y cargar la página actual
    actualizarEstado(ESTADOS.LISTO);
    cargarPaginaPokemon(currentPage);
}

// Función modificada para almacenar todos los Pokémon en la variable global
// Función para cargar Pokémon con paginación
function cargarPaginaPokemon(pagina = 1) {
    const contenedorPokemon = document.getElementById("pokemon-container");
    
    // Actualizar estado a cargando lista
    actualizarEstado(ESTADOS.CARGANDO_LISTA);
    mostrarEstadoCarga(true);
    contenedorPokemon.innerHTML = '';
    
    // Calcular offset para la página actual
    const offset = (pagina - 1) * POKEMON_PER_PAGE;
    const limite = Math.min(POKEMON_PER_PAGE, TOTAL_POKEMON - offset);
    
    // URL para obtener los Pokémon de la página actual
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limite}`;
    
    fetch(url)
        .then(response => response.json())
        .then(datos => {
            // Crear promesas para obtener detalles de cada Pokémon
            const promesasPokemon = datos.results.map(pokemon => {
                return fetch(pokemon.url)
                    .then(response => response.json())
                    .then(datosPokemon => {
                        return {
                            name: datosPokemon.name,
                            id: datosPokemon.id,
                            image: datosPokemon.sprites.other['official-artwork'].front_default || datosPokemon.sprites.front_default,
                            types: datosPokemon.types.map(type => type.type.name),
                            height: datosPokemon.height,
                            weight: datosPokemon.weight,
                            abilities: datosPokemon.abilities.map(ability => ability.ability.name)
                        };
                    });
            });
            
            return Promise.all(promesasPokemon);
        })
        .then(detallesPokemon => {
            // Ocultar loading
            mostrarEstadoCarga(false);
            
            // Mostrar los Pokémon de la página actual
            mostrarTarjetasPokemon(detallesPokemon);
            
            // Actualizar controles de paginación
            actualizarControlesPaginacion(pagina, detallesPokemon.length);
            
            // Actualizar estado a listo
            actualizarEstado(ESTADOS.LISTO);
        })
        .catch(error => {
            console.error("Error al cargar la página:", error);
            mostrarEstadoCarga(false);
            actualizarEstado(ESTADOS.ERROR);
            mostrarMensajeError();
            
            // Volver al estado listo después de 3 segundos
            setTimeout(() => {
                actualizarEstado(ESTADOS.LISTO);
            }, 3000);
        });
}

// Función para mostrar las tarjetas de Pokémon
function mostrarTarjetasPokemon(listaPokemon) {
    const contenedorPokemon = document.getElementById("pokemon-container");
    
    // Limpiar completamente el contenedor
    contenedorPokemon.innerHTML = '';
    
    // Validar que la lista no esté vacía
    if (!listaPokemon || listaPokemon.length === 0) {
        return;
    }
    
    // Crear un fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    listaPokemon.forEach((pokemon, indice) => {
        const tarjetaPokemon = crearTarjetaPokemonElement(pokemon, indice);
        fragment.appendChild(tarjetaPokemon);
    });
    
    // Agregar todas las tarjetas de una vez
    contenedorPokemon.appendChild(fragment);
}

// Función para actualizar los controles de paginación
function actualizarControlesPaginacion(pagina, cantidadPokemon) {
    currentPage = pagina;
    
    // Actualizar información de paginación
    const inicioPokemon = (pagina - 1) * POKEMON_PER_PAGE + 1;
    const finPokemon = inicioPokemon + cantidadPokemon - 1;
    
    const infoPaginacion = `Página ${pagina} de ${TOTAL_PAGES} - Mostrando ${cantidadPokemon} de ${TOTAL_POKEMON} Pokémon`;
    document.getElementById('pagination-info').textContent = infoPaginacion;
    document.getElementById('pagination-info-bottom').textContent = infoPaginacion;
    
    // Actualizar botones de navegación
    const botonesPrimero = document.querySelectorAll('#first-page, #first-page-bottom');
    const botonesAnterior = document.querySelectorAll('#prev-page, #prev-page-bottom');
    const botonesSiguiente = document.querySelectorAll('#next-page, #next-page-bottom');
    const botonesUltimo = document.querySelectorAll('#last-page, #last-page-bottom');
    
    // Habilitar/deshabilitar botones según la página actual
    botonesPrimero.forEach(btn => btn.disabled = pagina === 1);
    botonesAnterior.forEach(btn => btn.disabled = pagina === 1);
    botonesSiguiente.forEach(btn => btn.disabled = pagina === TOTAL_PAGES);
    botonesUltimo.forEach(btn => btn.disabled = pagina === TOTAL_PAGES);
    
    // Generar números de página
    generarNumerosPagina(pagina, 'page-numbers');
    generarNumerosPagina(pagina, 'page-numbers-bottom');
}

// Función para generar los números de página
function generarNumerosPagina(paginaActual, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = '';
    
    // Lógica para mostrar páginas con elipsis
    const paginasAMostrar = 7; // Número máximo de páginas a mostrar
    const mitadPaginas = Math.floor(paginasAMostrar / 2);
    
    let paginaInicio = Math.max(1, paginaActual - mitadPaginas);
    let paginaFin = Math.min(TOTAL_PAGES, paginaInicio + paginasAMostrar - 1);
    
    // Ajustar si estamos cerca del final
    if (paginaFin - paginaInicio < paginasAMostrar - 1) {
        paginaInicio = Math.max(1, paginaFin - paginasAMostrar + 1);
    }
    
    // Agregar primera página y elipsis si es necesario
    if (paginaInicio > 1) {
        agregarNumeroPagina(1, paginaActual, contenedor);
        if (paginaInicio > 2) {
            agregarElipsis(contenedor);
        }
    }
    
    // Agregar páginas del rango
    for (let i = paginaInicio; i <= paginaFin; i++) {
        agregarNumeroPagina(i, paginaActual, contenedor);
    }
    
    // Agregar elipsis y última página si es necesario
    if (paginaFin < TOTAL_PAGES) {
        if (paginaFin < TOTAL_PAGES - 1) {
            agregarElipsis(contenedor);
        }
        agregarNumeroPagina(TOTAL_PAGES, paginaActual, contenedor);
    }
}

// Función auxiliar para agregar un número de página
function agregarNumeroPagina(numeroPagina, paginaActual, contenedor) {
    const elementoPagina = document.createElement('div');
    elementoPagina.className = `page-number ${numeroPagina === paginaActual ? 'active' : ''}`;
    elementoPagina.textContent = numeroPagina;
    elementoPagina.addEventListener('click', () => irAPagina(numeroPagina));
    contenedor.appendChild(elementoPagina);
}

// Función auxiliar para agregar elipsis
function agregarElipsis(contenedor) {
    const elipsis = document.createElement('div');
    elipsis.className = 'page-number ellipsis';
    elipsis.textContent = '...';
    contenedor.appendChild(elipsis);
}

// Función para ir a una página específica
function irAPagina(pagina) {
    if (pagina < 1 || pagina > TOTAL_PAGES || pagina === currentPage) return;
    
    // Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Cargar la página
    cargarPaginaPokemon(pagina);
}

// Funciones de navegación
function irAPrimeraPagina() {
    irAPagina(1);
}

function irAPaginaAnterior() {
    if (currentPage > 1) {
        irAPagina(currentPage - 1);
    }
}

function irAPaginaSiguiente() {
    if (currentPage < TOTAL_PAGES) {
        irAPagina(currentPage + 1);
    }
}

function irAUltimaPagina() {
    irAPagina(TOTAL_PAGES);
}

// Gestión de vistas (todos vs favoritos)
let vistaActual = 'todos'; // 'todos' o 'favoritos'

function cambiarVista(nuevaVista) {
    // Limpiar el contenedor antes de cambiar de vista
    const contenedorPokemon = document.getElementById('pokemon-container');
    contenedorPokemon.innerHTML = '';
    
    vistaActual = nuevaVista;
    const botonTodos = document.getElementById('view-all');
    const botonFavoritos = document.getElementById('view-favorites');
    
    // Actualizar botones activos
    if (nuevaVista === 'todos') {
        botonTodos.classList.add('active');
        botonFavoritos.classList.remove('active');
        // Mostrar búsqueda y paginación para todos
        document.querySelector('.search-container').style.display = 'block';
        document.getElementById('pagination-top').style.display = 'block';
        document.getElementById('pagination-bottom').style.display = 'block';
    } else {
        botonTodos.classList.remove('active');
        botonFavoritos.classList.add('active');
        // Ocultar búsqueda y paginación para favoritos
        document.querySelector('.search-container').style.display = 'none';
        document.getElementById('pagination-top').style.display = 'none';
        document.getElementById('pagination-bottom').style.display = 'none';
    }
    
    // Cargar contenido según la vista
    if (nuevaVista === 'favoritos') {
        mostrarFavoritos();
    } else {
        cargarPaginaPokemon(currentPage);
    }
}

function mostrarFavoritos() {
    const favoritos = obtenerFavoritos();
    const contenedorPokemon = document.getElementById('pokemon-container');
    
    // Limpiar completamente el contenedor primero
    contenedorPokemon.innerHTML = '';
    
    // Asegurar que estamos en la vista de favoritos
    vistaActual = 'favoritos';
    
    if (favoritos.length === 0) {
        contenedorPokemon.innerHTML = `
            <div class="empty-favorites">
                <h3>No tienes favoritos aún</h3>
                <p>Agrega Pokémon a tus favoritos haciendo clic en el corazón ❤️</p>
            </div>
        `;
    } else {
        // Mostrar solo los favoritos reales
        mostrarTarjetasPokemon(favoritos);
    }
}

function actualizarContadorFavoritos() {
    const favoritos = obtenerFavoritos();
    const contador = document.getElementById('favorites-count');
    contador.textContent = `(${favoritos.length})`;
}

// Event listeners principales
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tema
    inicializarTema();
    
    // Cargar la primera página de Pokémon
    cargarPaginaPokemon(1);
    // Renderizar historial al iniciar
    renderizarHistorialBusqueda();
    // Actualizar contador de favoritos
    actualizarContadorFavoritos();
    
    // Event listeners para la búsqueda
    const botonBusqueda = document.getElementById('search-button');
    const inputBusqueda = document.getElementById('search-input');
    
    // Búsqueda al hacer clic en el botón
    botonBusqueda.addEventListener('click', buscarPokemon);
    
    // Búsqueda al presionar Enter
    inputBusqueda.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            buscarPokemon();
        }
    });
    
    // Limpiar búsqueda al borrar todo el contenido
    inputBusqueda.addEventListener('input', function() {
        if (this.value.trim() === '') {
            limpiarBusqueda();
        }
    });
    
    // Event listeners para controles de paginación superiores
    document.getElementById('first-page').addEventListener('click', irAPrimeraPagina);
    document.getElementById('prev-page').addEventListener('click', irAPaginaAnterior);
    document.getElementById('next-page').addEventListener('click', irAPaginaSiguiente);
    document.getElementById('last-page').addEventListener('click', irAUltimaPagina);
    
    // Event listeners para controles de paginación inferiores
    document.getElementById('first-page-bottom').addEventListener('click', irAPrimeraPagina);
    document.getElementById('prev-page-bottom').addEventListener('click', irAPaginaAnterior);
    document.getElementById('next-page-bottom').addEventListener('click', irAPaginaSiguiente);
    document.getElementById('last-page-bottom').addEventListener('click', irAUltimaPagina);
    
    // Event listener para el botón de cerrar del modal
    const botonCerrar = document.querySelector('.close');
    botonCerrar.addEventListener('click', cerrarModal);
    
    // Event listener para cerrar al hacer clic fuera del modal
    const modal = document.getElementById('pokemon-modal');
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            cerrarModal();
        }
    });
    
    // Event listener para cerrar con la tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            cerrarModal();
        }
    });
    
    // Event listener para el botón de cambio de tema
    const botonTema = document.getElementById('theme-toggle');
    botonTema.addEventListener('click', alternarTema);
    
    // Event listeners para navegación entre vistas
    const botonTodos = document.getElementById('view-all');
    const botonFavoritos = document.getElementById('view-favorites');
    
    botonTodos.addEventListener('click', () => cambiarVista('todos'));
    botonFavoritos.addEventListener('click', () => cambiarVista('favoritos'));
});

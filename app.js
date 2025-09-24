
// Configuración de paginación
const POKEMON_PER_PAGE = 24;
const TOTAL_POKEMON = 1025;
const TOTAL_PAGES = Math.ceil(TOTAL_POKEMON / POKEMON_PER_PAGE); // 43 páginas

// Variables globales para el estado de la aplicación
let currentPage = 1;
let isSearchMode = false;
let currentSearchResults = [];


function createPokemonCard(pokemon, index) {
    const pokemonCard = document.createElement("div")
    pokemonCard.className = "pokemon-card"
    
    // Contenedor de imagen con estado de carga
    const imageContainer = document.createElement("div")
    imageContainer.className = "image-container"
    
    // Placeholder mientras carga la imagen
    const imagePlaceholder = document.createElement("div")
    imagePlaceholder.className = "image-placeholder"
    imagePlaceholder.innerHTML = "🔄"
    
    // Imagen del pokémon
    const pokemonImage = document.createElement("img")
    pokemonImage.src = pokemon.image
    pokemonImage.alt = pokemon.name
    pokemonImage.className = "pokemon-image"
    pokemonImage.loading = "lazy"
    pokemonImage.style.display = "none" // Ocultar hasta que cargue
    
    // Mostrar imagen cuando cargue
    pokemonImage.onload = function() {
        imagePlaceholder.style.display = "none"
        pokemonImage.style.display = "block"
        pokemonImage.style.opacity = "0"
        setTimeout(() => {
            pokemonImage.style.opacity = "1"
        }, 50)
    }
    
    // Manejar error de imagen
    pokemonImage.onerror = function() {
        imagePlaceholder.innerHTML = "❌"
        imagePlaceholder.style.color = "#e53e3e"
    }
    
    imageContainer.appendChild(imagePlaceholder)
    imageContainer.appendChild(pokemonImage)
    
    // Contenedor de información
    const pokemonInfo = document.createElement("div")
    pokemonInfo.className = "pokemon-info"
    
    // Nombre y ID
    const pokemonName = document.createElement("h3")
    pokemonName.innerHTML = `${pokemon.id}. ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`;
    
    // Tipos
    const pokemonTypes = document.createElement("div")
    pokemonTypes.className = "pokemon-types"
    pokemon.types.forEach(type => {
        const typeSpan = document.createElement("span")
        typeSpan.className = `type ${type}`
        typeSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1)
        pokemonTypes.appendChild(typeSpan)
    });
    
    // Altura y peso
    const pokemonStats = document.createElement("div")
    pokemonStats.className = "pokemon-stats"
    pokemonStats.innerHTML = `
        <p><strong>Altura:</strong> ${pokemon.height / 10}m</p>
        <p><strong>Peso:</strong> ${pokemon.weight / 10}kg</p>
    `;
    
    // Ensamblar la tarjeta
    pokemonInfo.appendChild(pokemonName)
    pokemonInfo.appendChild(pokemonTypes)
    pokemonInfo.appendChild(pokemonStats)
    
    pokemonCard.appendChild(imageContainer)
    pokemonCard.appendChild(pokemonInfo)
    
    // Agregar event listener para mostrar la ficha del Pokémon
    pokemonCard.addEventListener('click', function() {
        showPokemonDetails(pokemon.id);
    });
    
    // Agregar con delay para animación
    setTimeout(() => {
        document.getElementById("pokemon-container").appendChild(pokemonCard)
    }, index * 100);
}

function showErrorMessage() {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
        loadingElement.classList.add("hidden");
    }
    
    const container = document.getElementById("pokemon-container");
    container.innerHTML = `
        <div class="error-message">
            <h3>Error al cargar los pokémones</h3>
            <p>No se pudieron obtener los datos. Por favor, intenta de nuevo más tarde.</p>
        </div>
    `;
}

// Función para mostrar los detalles del Pokémon en el modal
function showPokemonDetails(pokemonId) {
    const modal = document.getElementById('pokemon-modal');
    const modalLoading = document.getElementById('modal-loading');
    const pokemonDetails = document.getElementById('pokemon-details');
    
    // Mostrar el modal y el loading
    modal.style.display = 'block';
    modalLoading.style.display = 'block';
    pokemonDetails.style.display = 'none';
    pokemonDetails.classList.remove('show');
    
    // Obtener información detallada del Pokémon
    fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
        .then(response => response.json())
        .then(pokemonData => {
            // Ocultar loading y mostrar detalles
            modalLoading.style.display = 'none';
            pokemonDetails.style.display = 'block';
            pokemonDetails.classList.add('show');
            
            // Crear el contenido del modal
            pokemonDetails.innerHTML = createPokemonModalContent(pokemonData);
        })
        .catch(error => {
            console.error('Error al obtener detalles del Pokémon:', error);
            modalLoading.innerHTML = `
                <div class="error-message">
                    <h3>Error al cargar los detalles</h3>
                    <p>No se pudieron obtener los datos del Pokémon.</p>
                </div>
            `;
        });
}

// Función para crear el contenido del modal con la información del Pokémon
function createPokemonModalContent(pokemon) {
    const abilities = pokemon.abilities.map(ability => ability.ability.name).join(', ');
    
    return `
        <div class="modal-header">
            <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" 
                 alt="${pokemon.name}" 
                 class="modal-pokemon-image">
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
function closeModal() {
    const modal = document.getElementById('pokemon-modal');
    modal.style.display = 'none';
}

// Variables globales para almacenar todos los Pokémon
let allPokemon = [];

// Función para buscar Pokémon
function searchPokemon() {
    const searchInput = document.getElementById('search-input');
    const searchMessage = document.getElementById('search-message');
    const pokemonContainer = document.getElementById('pokemon-container');
    const loadingElement = document.getElementById('loading');
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        showSearchMessage('Por favor, ingresa un nombre o número de Pokémon', 'error');
        return;
    }
    
    // Ocultar controles de paginación durante la búsqueda
    document.getElementById('pagination-top').style.display = 'none';
    document.getElementById('pagination-bottom').style.display = 'none';
    
    // Ocultar mensaje anterior y mostrar loading
    searchMessage.classList.remove('show');
    loadingElement.classList.remove('hidden');
    pokemonContainer.innerHTML = '';
    isSearchMode = true;
    
    // Buscar en la API
    fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Pokémon no encontrado');
            }
            return response.json();
        })
        .then(pokemonData => {
            const pokemon = {
                name: pokemonData.name,
                id: pokemonData.id,
                image: pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default,
                types: pokemonData.types.map(type => type.type.name),
                height: pokemonData.height,
                weight: pokemonData.weight,
                abilities: pokemonData.abilities.map(ability => ability.ability.name)
            };
            
            loadingElement.classList.add('hidden');
            currentSearchResults = [pokemon];
            displayPokemonCards([pokemon]);
            showSearchMessage(`¡Encontrado! ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`, 'success');
        })
        .catch(error => {
            loadingElement.classList.add('hidden');
            showSearchMessage(`No se encontró ningún Pokémon con "${searchTerm}". Intenta con otro nombre o número.`, 'error');
        });
}

// Función para mostrar mensajes de búsqueda
function showSearchMessage(message, type) {
    const searchMessage = document.getElementById('search-message');
    searchMessage.textContent = message;
    searchMessage.className = `search-message show ${type}`;
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        searchMessage.classList.remove('show');
    }, 5000);
}

// Función para limpiar búsqueda y mostrar todos los Pokémon
function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const searchMessage = document.getElementById('search-message');
    
    searchInput.value = '';
    searchMessage.classList.remove('show');
    isSearchMode = false;
    currentSearchResults = [];
    
    // Mostrar controles de paginación nuevamente
    document.getElementById('pagination-top').style.display = 'block';
    document.getElementById('pagination-bottom').style.display = 'block';
    
    // Cargar la página actual
    loadPokemonPage(currentPage);
}

// Función modificada para almacenar todos los Pokémon en la variable global
// Función para cargar Pokémon con paginación
function loadPokemonPage(page = 1) {
    const loadingElement = document.getElementById("loading");
    const pokemonContainer = document.getElementById("pokemon-container");
    
    // Mostrar loading
    loadingElement.classList.remove("hidden");
    pokemonContainer.innerHTML = '';
    
    // Calcular offset para la página actual
    const offset = (page - 1) * POKEMON_PER_PAGE;
    const limit = Math.min(POKEMON_PER_PAGE, TOTAL_POKEMON - offset);
    
    // URL para obtener los Pokémon de la página actual
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Crear promesas para obtener detalles de cada Pokémon
            const pokemonPromises = data.results.map(pokemon => {
                return fetch(pokemon.url)
                    .then(response => response.json())
                    .then(pokemonData => {
                        return {
                            name: pokemonData.name,
                            id: pokemonData.id,
                            image: pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default,
                            types: pokemonData.types.map(type => type.type.name),
                            height: pokemonData.height,
                            weight: pokemonData.weight,
                            abilities: pokemonData.abilities.map(ability => ability.ability.name)
                        };
                    });
            });
            
            return Promise.all(pokemonPromises);
        })
        .then(pokemonDetails => {
            // Ocultar loading
            loadingElement.classList.add("hidden");
            
            // Mostrar los Pokémon de la página actual
            displayPokemonCards(pokemonDetails);
            
            // Actualizar controles de paginación
            updatePaginationControls(page, pokemonDetails.length);
        })
        .catch(error => {
            console.error("Error al cargar la página:", error);
            loadingElement.classList.add("hidden");
            showErrorMessage();
        });
}

// Función para mostrar las tarjetas de Pokémon
function displayPokemonCards(pokemonList) {
    const pokemonContainer = document.getElementById("pokemon-container");
    pokemonContainer.innerHTML = '';
    
    pokemonList.forEach((pokemon, index) => {
        createPokemonCard(pokemon, index);
    });
}

// Función para actualizar los controles de paginación
function updatePaginationControls(page, pokemonCount) {
    currentPage = page;
    
    // Actualizar información de paginación
    const startPokemon = (page - 1) * POKEMON_PER_PAGE + 1;
    const endPokemon = startPokemon + pokemonCount - 1;
    
    const paginationInfo = `Página ${page} de ${TOTAL_PAGES} - Mostrando ${pokemonCount} de ${TOTAL_POKEMON} Pokémon`;
    document.getElementById('pagination-info').textContent = paginationInfo;
    document.getElementById('pagination-info-bottom').textContent = paginationInfo;
    
    // Actualizar botones de navegación
    const firstButtons = document.querySelectorAll('#first-page, #first-page-bottom');
    const prevButtons = document.querySelectorAll('#prev-page, #prev-page-bottom');
    const nextButtons = document.querySelectorAll('#next-page, #next-page-bottom');
    const lastButtons = document.querySelectorAll('#last-page, #last-page-bottom');
    
    // Habilitar/deshabilitar botones según la página actual
    firstButtons.forEach(btn => btn.disabled = page === 1);
    prevButtons.forEach(btn => btn.disabled = page === 1);
    nextButtons.forEach(btn => btn.disabled = page === TOTAL_PAGES);
    lastButtons.forEach(btn => btn.disabled = page === TOTAL_PAGES);
    
    // Generar números de página
    generatePageNumbers(page, 'page-numbers');
    generatePageNumbers(page, 'page-numbers-bottom');
}

// Función para generar los números de página
function generatePageNumbers(currentPage, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // Lógica para mostrar páginas con elipsis
    const pagesToShow = 7; // Número máximo de páginas a mostrar
    const halfPages = Math.floor(pagesToShow / 2);
    
    let startPage = Math.max(1, currentPage - halfPages);
    let endPage = Math.min(TOTAL_PAGES, startPage + pagesToShow - 1);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage < pagesToShow - 1) {
        startPage = Math.max(1, endPage - pagesToShow + 1);
    }
    
    // Agregar primera página y elipsis si es necesario
    if (startPage > 1) {
        addPageNumber(1, currentPage, container);
        if (startPage > 2) {
            addEllipsis(container);
        }
    }
    
    // Agregar páginas del rango
    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i, currentPage, container);
    }
    
    // Agregar elipsis y última página si es necesario
    if (endPage < TOTAL_PAGES) {
        if (endPage < TOTAL_PAGES - 1) {
            addEllipsis(container);
        }
        addPageNumber(TOTAL_PAGES, currentPage, container);
    }
}

// Función auxiliar para agregar un número de página
function addPageNumber(pageNum, currentPage, container) {
    const pageElement = document.createElement('div');
    pageElement.className = `page-number ${pageNum === currentPage ? 'active' : ''}`;
    pageElement.textContent = pageNum;
    pageElement.addEventListener('click', () => goToPage(pageNum));
    container.appendChild(pageElement);
}

// Función auxiliar para agregar elipsis
function addEllipsis(container) {
    const ellipsis = document.createElement('div');
    ellipsis.className = 'page-number ellipsis';
    ellipsis.textContent = '...';
    container.appendChild(ellipsis);
}

// Función para ir a una página específica
function goToPage(page) {
    if (page < 1 || page > TOTAL_PAGES || page === currentPage) return;
    
    // Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Cargar la página
    loadPokemonPage(page);
}

// Funciones de navegación
function goToFirstPage() {
    goToPage(1);
}

function goToPreviousPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

function goToNextPage() {
    if (currentPage < TOTAL_PAGES) {
        goToPage(currentPage + 1);
    }
}

function goToLastPage() {
    goToPage(TOTAL_PAGES);
}

// Event listeners principales
document.addEventListener('DOMContentLoaded', function() {
    // Cargar la primera página de Pokémon
    loadPokemonPage(1);
    
    // Event listeners para la búsqueda
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    
    // Búsqueda al hacer clic en el botón
    searchButton.addEventListener('click', searchPokemon);
    
    // Búsqueda al presionar Enter
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchPokemon();
        }
    });
    
    // Limpiar búsqueda al borrar todo el contenido
    searchInput.addEventListener('input', function() {
        if (this.value.trim() === '') {
            clearSearch();
        }
    });
    
    // Event listeners para controles de paginación superiores
    document.getElementById('first-page').addEventListener('click', goToFirstPage);
    document.getElementById('prev-page').addEventListener('click', goToPreviousPage);
    document.getElementById('next-page').addEventListener('click', goToNextPage);
    document.getElementById('last-page').addEventListener('click', goToLastPage);
    
    // Event listeners para controles de paginación inferiores
    document.getElementById('first-page-bottom').addEventListener('click', goToFirstPage);
    document.getElementById('prev-page-bottom').addEventListener('click', goToPreviousPage);
    document.getElementById('next-page-bottom').addEventListener('click', goToNextPage);
    document.getElementById('last-page-bottom').addEventListener('click', goToLastPage);
    
    // Event listener para el botón de cerrar del modal
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', closeModal);
    
    // Event listener para cerrar al hacer clic fuera del modal
    const modal = document.getElementById('pokemon-modal');
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Event listener para cerrar con la tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
});

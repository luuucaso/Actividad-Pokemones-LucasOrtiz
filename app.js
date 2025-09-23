
const url = "https://pokeapi.co/api/v2/pokemon?offset=0&limit=20"

function getPokemon(url) {
    fetch(url)
    .then(response =>{
        return response.json()
    })
    .then((datos) =>{
        // Ocultar el mensaje de carga principal
        const loadingElement = document.getElementById("loading");
        if (loadingElement) {
            loadingElement.classList.add("hidden");
        }
        
        // Crear un array de promesas para obtener datos detallados de cada pokémon
        const pokemonPromises = datos.results.map(pokemon => {
            return fetch(pokemon.url)
                .then(response => response.json())
                .then(pokemonData => {
                    return {
                        name: pokemonData.name,
                        id: pokemonData.id,
                        image: pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default,
                        types: pokemonData.types.map(type => type.type.name),
                        height: pokemonData.height,
                        weight: pokemonData.weight
                    };
                });
        });
        
        // Esperar a que se resuelvan todas las promesas
        Promise.all(pokemonPromises)
        .then(pokemonDetails => {
            pokemonDetails.forEach((pokemon, index) => {
                createPokemonCard(pokemon, index);
            });
        })
        .catch(error => {
            console.error("Error al obtener detalles de pokémones:", error);
            showErrorMessage();
        });
    })
    .catch(error =>{
        console.error("Error al obtener los datos:", error);
        showErrorMessage();
    });
}

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

// Llamar a la función cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    getPokemon(url);
});

// Mobile menu toggle
// Ensure the navigation toggle functionality works reliably
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('mobile-menu');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-list a');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });

        // Close mobile menu on link click
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('active');
                menuToggle.classList.remove('open');
            });
        });
    } else {
        console.error('Menu toggle or nav list not found! Make sure the HTML structure matches the script.');
    }
});

// Dynamic watchlist functionality
const saveToWatchlist = (movieTitle) => {
    const savedMovies = JSON.parse(localStorage.getItem('watchlist')) || [];
    if (!savedMovies.includes(movieTitle)) {
        savedMovies.push(movieTitle);
        localStorage.setItem('watchlist', JSON.stringify(savedMovies));
    }
};

const removeFromWatchlist = (movieTitle) => {
    const savedMovies = JSON.parse(localStorage.getItem('watchlist')) || [];
    const updatedMovies = savedMovies.filter(movie => movie !== movieTitle);
    localStorage.setItem('watchlist', JSON.stringify(updatedMovies));
    loadWatchlist();
};

const clearWatchlist = () => {
    localStorage.removeItem('watchlist');
    loadWatchlist();
};

const loadWatchlist = async () => {
    const watchlist = document.getElementById('watchlist-items');
    const savedMovies = JSON.parse(localStorage.getItem('watchlist')) || [];

    watchlist.innerHTML = '';
    if (savedMovies.length > 0) {
        const TMDB_API_KEY = 'f3eb28da740fec4387f1b941d0754601';
        const BASE_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

        for (const movieTitle of savedMovies) {
            try {
                const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${movieTitle}`);
                const data = await response.json();
                const movie = data.results[0];

                const movieCard = document.createElement('div');
                movieCard.className = 'movie-card';
                movieCard.innerHTML = `
                    <img src="${BASE_IMAGE_URL + movie.poster_path}" alt="${movie.title}" />
                    <h4>${movie.title}</h4>
                    <p>${movie.overview || 'Popis není dostupný.'}</p>
                    <button class="remove-from-watchlist" data-title="${movie.title}">Odebrat</button>
                `;
                watchlist.appendChild(movieCard);
            } catch (error) {
                console.error(`Chyba při načítání filmu: ${movieTitle}`, error);
            }
        }

        // Přidáme event listener na tlačítka Odebrat
        watchlist.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-from-watchlist')) {
                const movieTitle = e.target.dataset.title;
                removeFromWatchlist(movieTitle);
            }
        });
    } else {
        watchlist.innerHTML = '<p>Nemáte žádné uložené filmy.</p>';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.id === 'watchlist-page') {
        loadWatchlist();

        const clearButton = document.getElementById('clear-watchlist');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('Opravdu chcete odstranit všechny filmy z watchlistu?')) {
                    clearWatchlist();
                }
            });
        }
    }

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-watchlist')) {
            const movieTitle = e.target.dataset.title;
            if (movieTitle) {
                saveToWatchlist(movieTitle);
                alert(`${movieTitle} byl přidán do watchlistu!`);

                // Refresh watchlist on the watchlist page
                if (document.body.id === 'watchlist-page') {
                    loadWatchlist();
                }
            }
        }
    });
});

// Fetch and populate genres from TMDb API
document.addEventListener('DOMContentLoaded', async () => {
    const genreSelect = document.getElementById('genre');
    const TMDB_API_KEY = 'f3eb28da740fec4387f1b941d0754601';

    try {
        const response = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=cs-CZ`);
        const data = await response.json();

        if (data.genres && data.genres.length > 0) {
            data.genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                genreSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Chyba při načítání žánrů:', error);
    }
});

// Form handling for recommendations with TMDb API
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('filter-form');
    const results = document.getElementById('recommendation-results');
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.style.display = 'none';
    results.appendChild(loader);

    const TMDB_API_KEY = 'f3eb28da740fec4387f1b941d0754601';
    const BASE_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const genre = document.getElementById('genre').value;
        const actor = document.getElementById('actor').value;

        results.innerHTML = '';
        loader.style.display = 'block';

        try {
            let query = 'https://api.themoviedb.org/3/discover/movie?api_key=' + TMDB_API_KEY;

            if (genre) {
                query += `&with_genres=${genre}`;
            }

            if (actor) {
                const actorResponse = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${actor}`);
                const actorData = await actorResponse.json();
                if (actorData.results.length > 0) {
                    const actorId = actorData.results[0].id;
                    query += `&with_cast=${actorId}`;
                }
            }

            const response = await fetch(query);
            const data = await response.json();
            loader.style.display = 'none';

            if (data.results && data.results.length > 0) {
                results.innerHTML = data.results.map(movie => `
                    <div class="movie-card">
                        <img src="${BASE_IMAGE_URL + movie.poster_path}" alt="${movie.title}" />
                        <h4>${movie.title}</h4>
                        <p>${movie.overview || 'Popis není dostupný.'}</p>
                        <button class="add-to-watchlist" data-title="${movie.title}">Přidat do watchlistu</button>
                    </div>
                `).join('');
            } else {
                results.innerHTML = '<p>Nebyly nalezeny žádné filmy.</p>';
            }
        } catch (error) {
            loader.style.display = 'none';
            results.innerHTML = '<p>Chyba při načítání filmů.</p>';
        }
    });
});

// Review submission with star rating
document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-form');
    const reviewList = document.getElementById('review-list');
    const noReviewsText = document.getElementById('no-reviews-text');

    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const movie = document.getElementById('movie').value;
        const rating = document.getElementById('rating').value;
        const reviewText = document.getElementById('review').value;

        if (noReviewsText) {
            noReviewsText.style.display = 'none';
        }

        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <h4>${movie} - ${'★'.repeat(rating)} (${rating} hvězdiček)</h4>
            <p>${reviewText}</p>
        `;

        reviewList.appendChild(reviewItem);

        reviewForm.reset();
    });
});

// Smooth scrolling for navigation
// Ensure smooth scrolling is only applied to internal links
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-list a');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});

// Dark/Light mode toggle
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Přepnout téma';
    toggleButton.className = 'theme-toggle';
    document.body.appendChild(toggleButton);

    toggleButton.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
    });
});

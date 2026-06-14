const BASE_URL = "/api/movies";
const DIRECT_OMDB_URL = "https://www.omdbapi.com/?apikey=a95a3bf8";

async function fetchWithFallback(apiSubPath, directQueryString) {
  try {
    const response = await fetch(`${BASE_URL}/${apiSubPath}`);
    if (response.ok) {
      const data = await response.json();
      if (data && (data.Response === "True" || data.Search)) {
        return data;
      }
    }
  } catch (error) {
    console.warn("Proxy fallback triggered.");
  }

  const directUrl = `${DIRECT_OMDB_URL}&${directQueryString}`;
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw new Error(`Status: ${response.status}`);
  }
  return await response.json();
}

export async function searchMovies(query) {
  if (!query || !query.trim()) {
    return { Search: [], Response: "False", Error: "ჩაწერეთ საძიებო სიტყვა" };
  }
  return fetchWithFallback(`search?s=${encodeURIComponent(query)}`, `s=${encodeURIComponent(query)}`);
}

export async function getMovieDetails(imdbID) {
  if (!imdbID) {
    throw new Error("IMDb ID ცარიელია");
  }
  return fetchWithFallback(`detail?i=${encodeURIComponent(imdbID)}`, `i=${encodeURIComponent(imdbID)}`);
}

const STORAGE_KEYS = {
  WATCHLIST: "movieworld_watchlist",
  USER_PROFILE: "movieworld_user_profile",
  REVIEWS: "movieworld_reviews"
};

export function getSavedMovies() {
  const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
  return data ? JSON.parse(data) : [];
}

export function saveMovie(movie) {
  const watchlist = getSavedMovies();
  if (watchlist.some(item => item.imdbID === movie.imdbID)) {
    return false;
  }
  
  watchlist.push({
    imdbID: movie.imdbID,
    Title: movie.Title,
    Year: movie.Year,
    Type: movie.Type || "movie",
    Poster: movie.Poster,
    Genre: movie.Genre || ""
  });
  
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
  sessionCounter.increment();
  return true;
}

export function removeMovie(imdbID) {
  let watchlist = getSavedMovies();
  watchlist = watchlist.filter(item => item.imdbID !== imdbID);
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
}

export function isMovieSaved(imdbID) {
  const watchlist = getSavedMovies();
  return watchlist.some(item => item.imdbID === imdbID);
}

export function clearWatchlist() {
  localStorage.removeItem(STORAGE_KEYS.WATCHLIST);
}

export function saveUserProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function getUserProfile() {
  const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveMovieReview(imdbID, reviewData) {
  const reviews = getSavedReviews();
  reviews[imdbID] = {
    rating: reviewData.rating,
    comment: reviewData.comment,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
}

export function getSavedReviews() {
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  return data ? JSON.parse(data) : {};
}

export function debounce(callback, delayMs = 400) {
  let timerId;
  return function (...args) {
    const context = this;
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      callback.apply(context, args);
    }, delayMs);
  };
}

export const sessionCounter = (() => {
  let count = 0;
  return {
    increment: () => {
      count += 1;
      return count;
    },
    getCount: () => {
      return count;
    },
    reset: () => {
      count = 0;
    }
  };
})();
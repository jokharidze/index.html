import { 
  searchMovies, 
  getMovieDetails, 
  saveMovie, 
  isMovieSaved, 
  removeMovie,
  debounce
} from "./api.js";

const searchForm = document.getElementById("movie-search-form");
const keywordInput = document.getElementById("movie-keyword-input");
const resultsGrid = document.getElementById("movies-render-grid");
const searchSpinner = document.getElementById("search-spinner");
const errorBoundary = document.getElementById("error-boundary-msg");
const emptyStateBanner = document.getElementById("empty-state-banner");
const fallbackNotification = document.getElementById("fallback-notification");

const detailsModal = document.getElementById("overlay-details-modal");
const closeModalTrigger = document.getElementById("close-modal-trigger");
const modalPopulatedGrid = document.getElementById("modal-populated-grid");

let activeMoviesList = [];
let latestSearchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  checkApiMode();
  
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = keywordInput.value.trim();
      if (val.length >= 2) executeMovieSearch(val);
    });
  }

  if (keywordInput) {
    const debouncedSearch = debounce((text) => {
      if (text.length >= 2) {
        executeMovieSearch(text);
      } else if (text.length === 0) {
        showEmptyState();
      }
    }, 500);

    keywordInput.addEventListener("input", (e) => {
      debouncedSearch(e.target.value.trim());
    });
  }

  if (closeModalTrigger) {
    closeModalTrigger.addEventListener("click", () => {
      closeDetailsModal();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detailsModal.open) {
      closeDetailsModal();
    }
  });

  executeMovieSearch("Dark");
});

async function checkApiMode() {
  try {
    const res = await fetch("/api/movies/search?s=test");
    const data = await res.json();
    if (data.demoMode && fallbackNotification) {
      fallbackNotification.style.display = "flex";
    }
  } catch (err) {
    console.warn(err);
  }
}

async function executeMovieSearch(query) {
  if (query === latestSearchQuery && activeMoviesList.length > 0) return;
  latestSearchQuery = query;

  showSpinner();
  hideError();
  hideEmptyState();

  try {
    const data = await searchMovies(query);
    if (data.Response === "True" && data.Search && data.Search.length > 0) {
      activeMoviesList = data.Search;
      renderGrid(activeMoviesList);
    } else {
      activeMoviesList = [];
      showEmptyState(data.Error || "ფილმები ვერ მოიძებნა.");
    }
  } catch (err) {
    showError(err.message);
  } finally {
    hideSpinner();
  }
}

function renderGrid(movies) {
  if (!resultsGrid) return;
  resultsGrid.innerHTML = "";

  movies.forEach((movie) => {
    const card = document.createElement("article");
    card.className = "movie-card";
    card.id = `movie-${movie.imdbID}`;

    const posterWrap = document.createElement("div");
    posterWrap.className = "movie-card__poster-wrapper";

    const poster = document.createElement("img");
    poster.className = "movie-card__poster";
    poster.src = (movie.Poster && movie.Poster !== "N/A") 
      ? movie.Poster 
      : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500";
    poster.alt = movie.Title;
    poster.loading = "lazy";
    poster.referrerPolicy = "no-referrer";

    const badge = document.createElement("span");
    badge.className = "movie-card__badge";
    badge.textContent = movie.Year;

    posterWrap.appendChild(poster);
    posterWrap.appendChild(badge);

    const body = document.createElement("div");
    body.className = "movie-card__body";

    const meta = document.createElement("span");
    meta.className = "movie-card__meta text-mono";
    meta.textContent = movie.Type || "movie";

    const title = document.createElement("h3");
    title.className = "movie-card__title";
    title.textContent = movie.Title;

    const actions = document.createElement("div");
    actions.className = "movie-card__actions";

    const detBtn = document.createElement("button");
    detBtn.className = "movie-card__button movie-card__button--detail";
    detBtn.textContent = "დეტალურად";
    detBtn.addEventListener("click", () => {
      openDetailsModal(movie.imdbID);
    });

    const saveBtn = document.createElement("button");
    const isSaved = isMovieSaved(movie.imdbID);
    updateBtnState(saveBtn, isSaved);
    
    saveBtn.addEventListener("click", () => {
      const saved = isMovieSaved(movie.imdbID);
      if (saved) {
        removeMovie(movie.imdbID);
        updateBtnState(saveBtn, false);
      } else {
        const added = saveMovie(movie);
        if (added) updateBtnState(saveBtn, true);
      }
    });

    actions.appendChild(detBtn);
    actions.appendChild(saveBtn);
    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(actions);
    card.appendChild(posterWrap);
    card.appendChild(body);
    resultsGrid.appendChild(card);
  });
}

function updateBtnState(btn, isSaved) {
  if (isSaved) {
    btn.className = "movie-card__button movie-card__button--saved";
    btn.innerHTML = "<span>✓</span> სიაშია";
  } else {
    btn.className = "movie-card__button movie-card__button--save";
    btn.innerHTML = "<span>+</span> სიაში";
  }
}

async function openDetailsModal(imdbID) {
  if (!detailsModal || !modalPopulatedGrid) return;
  modalPopulatedGrid.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
      <div class="loading-indicator__spinner"></div>
      <p>მიმდინარეობს ჩატვირთვა...</p>
    </div>
  `;
  detailsModal.showModal();
  detailsModal.classList.add("modal--open");

  try {
    const movie = await getMovieDetails(imdbID);
    if (movie.Response === "True") {
      modalPopulatedGrid.innerHTML = "";

      const pCol = document.createElement("div");
      pCol.className = "modal__poster-column";
      const pImg = document.createElement("img");
      pImg.className = "modal__poster";
      pImg.src = (movie.Poster && movie.Poster !== "N/A") ? movie.Poster : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500";
      pImg.referrerPolicy = "no-referrer";
      pCol.appendChild(pImg);

      const iCol = document.createElement("div");
      iCol.className = "modal__info-column";

      const titleNode = document.createElement("h2");
      titleNode.className = "modal__title";
      titleNode.textContent = movie.Title;

      const genresNode = document.createElement("div");
      genresNode.className = "modal__genres";
      const genres = movie.Genre ? movie.Genre.split(",") : ["კინო"];
      genres.forEach(g => {
        const span = document.createElement("span");
        span.className = "modal__genre-tag";
        span.textContent = g.trim();
        genresNode.appendChild(span);
      });

      const metaRow = document.createElement("div");
      metaRow.className = "modal__meta-row text-mono";
      metaRow.innerHTML = `
        <span class="modal__rating">★ ${movie.imdbRating || "N/A"}</span>
        <span><span class="modal__label">წელი:</span> ${movie.Year || "N/A"}</span>
        <span><span class="modal__label">ხანგრძლივობა:</span> ${movie.Runtime || "N/A"}</span>
      `;

      const plotNode = document.createElement("p");
      plotNode.className = "modal__plot";
      plotNode.textContent = movie.Plot || "";

      const credits = document.createElement("div");
      credits.className = "modal__credits";
      const items = [
        { l: "რეჟისორი", v: movie.Director },
        { l: "სცენარი", v: movie.Writer },
        { l: "მსახიობები", v: movie.Actors },
        { l: "ქვეყანა", v: movie.Country }
      ];
      items.forEach(item => {
        if (item.v && item.v !== "N/A") {
          const row = document.createElement("div");
          row.className = "modal__credit";
          row.innerHTML = `<span class="modal__credit-label">${item.l}:</span> <span>${item.v}</span>`;
          credits.appendChild(row);
        }
      });

      iCol.appendChild(titleNode);
      iCol.appendChild(genresNode);
      iCol.appendChild(metaRow);
      iCol.appendChild(plotNode);
      iCol.appendChild(credits);

      modalPopulatedGrid.appendChild(pCol);
      modalPopulatedGrid.appendChild(iCol);
    }
  } catch (err) {
    console.error(err);
  }
}

function closeDetailsModal() {
  if (detailsModal) {
    detailsModal.classList.remove("modal--open");
    setTimeout(() => { detailsModal.close(); }, 150);
  }
}

function showSpinner() { if(searchSpinner) searchSpinner.style.display = 'flex'; }
function hideSpinner() { if(searchSpinner) searchSpinner.style.display = 'none'; }
function showError(msg) { if(errorBoundary) { errorBoundary.style.display = 'flex'; const d = errorBoundary.querySelector("#error-text-content"); if(d) d.textContent = msg; } }
function hideError() { if(errorBoundary) errorBoundary.style.display = 'none'; }
function showEmptyState(msg) { if(emptyStateBanner) { emptyStateBanner.style.display = 'flex'; const d = emptyStateBanner.querySelector("p"); if(d) d.textContent = msg; } }
function hideEmptyState() { if(emptyStateBanner) emptyStateBanner.style.display = 'none'; }
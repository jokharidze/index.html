import { 
  getSavedMovies, 
  removeMovie, 
  clearWatchlist,
  getMovieDetails,
  sessionCounter 
} from "./api.js";

const watchlistGrid = document.getElementById("watchlist-movies-grid");
const emptyWatchlistBanner = document.getElementById("empty-watchlist-banner");
const totalSavedIndicator = document.getElementById("total-saved-indicator");
const sessionAddsIndicator = document.getElementById("session-adds-indicator");
const bulkClearBtn = document.getElementById("bulk-clear-watchlist");

const detailsModal = document.getElementById("overlay-details-modal");
const closeModalTrigger = document.getElementById("close-modal-trigger");
const modalPopulatedGrid = document.getElementById("modal-populated-grid");

document.addEventListener("DOMContentLoaded", () => {
  refreshWatchlistUI();

  if (bulkClearBtn) {
    bulkClearBtn.addEventListener("click", () => {
      if (confirm("ნამდვილად გსურთ სიის გასუფთავება?")) {
        clearWatchlist();
        refreshWatchlistUI();
      }
    });
  }

  if (closeModalTrigger) {
    closeModalTrigger.addEventListener("click", () => {
      closeDetailsModal();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detailsModal && detailsModal.open) {
      closeDetailsModal();
    }
  });
});

function refreshWatchlistUI() {
  const dataset = getSavedMovies();
  if (totalSavedIndicator) totalSavedIndicator.textContent = dataset.length;
  if (sessionAddsIndicator) sessionAddsIndicator.textContent = sessionCounter.getCount();

  if (dataset.length === 0) {
    if (emptyWatchlistBanner) emptyWatchlistBanner.style.display = "flex";
    if (bulkClearBtn) bulkClearBtn.style.display = "none";
    if (watchlistGrid) watchlistGrid.innerHTML = "";
  } else {
    if (emptyWatchlistBanner) emptyWatchlistBanner.style.display = "none";
    if (bulkClearBtn) bulkClearBtn.style.display = "inline-flex";
    renderWatchlist(dataset);
  }
}

function renderWatchlist(movies) {
  if (!watchlistGrid) return;
  watchlistGrid.innerHTML = "";

  movies.forEach((movie) => {
    const card = document.createElement("article");
    card.className = "movie-card";
    card.id = `watchlist-${movie.imdbID}`;

    const posterWrap = document.createElement("div");
    posterWrap.className = "movie-card__poster-wrapper";

    const poster = document.createElement("img");
    poster.className = "movie-card__poster";
    poster.src = (movie.Poster && movie.Poster !== "N/A") ? movie.Poster : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500";
    poster.alt = movie.Title;
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

    const remBtn = document.createElement("button");
    remBtn.className = "movie-card__button movie-card__button--saved";
    remBtn.style.color = "var(--color-error)";
    remBtn.style.borderColor = "rgba(239, 68, 68, 0.3)";
    remBtn.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
    remBtn.innerHTML = "<span>🗑️</span> წაშლა";
    remBtn.addEventListener("click", () => {
      removeMovie(movie.imdbID);
      refreshWatchlistUI();
    });

    actions.appendChild(detBtn);
    actions.appendChild(remBtn);
    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(actions);
    card.appendChild(posterWrap);
    card.appendChild(body);
    watchlistGrid.appendChild(card);
  });
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

      const genresRow = document.createElement("div");
      genresRow.className = "modal__genres";
      const genres = movie.Genre ? movie.Genre.split(",") : ["კინო"];
      genres.forEach(g => {
        const span = document.createElement("span");
        span.className = "modal__genre-tag";
        span.textContent = g.trim();
        genresRow.appendChild(span);
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
      iCol.appendChild(genresRow);
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
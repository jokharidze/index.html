import { 
  saveUserProfile, 
  getUserProfile, 
  getSavedMovies,
  saveMovieReview,
  getSavedReviews
} from "./api.js";

const profileForm = document.getElementById("user-profile-setup-form");
const usernameInput = document.getElementById("profile-username");
const emailInput = document.getElementById("profile-email");
const favGenreSelect = document.getElementById("profile-fav-genre");
const alertBox = document.getElementById("profile-alert-box");

const activeProfileCard = document.getElementById("active-profile-card");
const noProfileMessage = document.getElementById("no-profile-yet-message");
const renderedUsername = document.getElementById("rendered-username");
const renderedEmail = document.getElementById("rendered-email");
const renderedGenre = document.getElementById("rendered-genre");
const renderedFrequency = document.getElementById("rendered-frequency");
const renderedBio = document.getElementById("rendered-bio");

const reviewsListContainer = document.getElementById("movie-reviews-list-container");

const MOCK_REVIEWABLE_MOVIES = [
  { imdbID: "tt1375666", Title: "Inception" },
  { imdbID: "tt0816692", Title: "Interstellar" },
  { imdbID: "tt0468569", Title: "The Dark Knight" },
  { imdbID: "tt0110912", Title: "Pulp Fiction" }
];

document.addEventListener("DOMContentLoaded", () => {
  renderProfileCard();
  renderReviewsList();

  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearAlert();

      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const favGenre = favGenreSelect.value;
      const bio = document.getElementById("profile-bio-summary").value.trim();

      let watchFrequency = "ყოველდღე";
      const radios = document.getElementsByName("watch_frequency");
      for (const r of radios) {
        if (r.checked) watchFrequency = r.value;
      }

      const newsOpt = document.getElementById("profile-newsletter-opt");
      const newsletter = newsOpt ? newsOpt.checked : false;

      if (username.length < 3) {
        showFeedback("სახელი უნდა შეიცავდეს მინიმუმ 3 ასოს!", "error");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFeedback("მიუთითეთ ვალიდური ელ-ფოსტა!", "error");
        return;
      }

      if (bio.length < 10) {
        showFeedback("აღწერა უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს!", "error");
        return;
      }

      const profile = {
        username,
        email,
        favGenre,
        watchFrequency,
        newsletter,
        bio,
        updatedAt: new Date().toLocaleDateString()
      };

      try {
        saveUserProfile(profile);
        showFeedback("პროფილი წარმატებით შეინახა! 🎉", "success");
        renderProfileCard();
      } catch (err) {
        showFeedback("მონაცემების შენახვა ვერ მოხერხდა.", "error");
      }
    });
  }

  prefillForm();
});

function prefillForm() {
  const profile = getUserProfile();
  if (profile) {
    if (usernameInput) usernameInput.value = profile.username;
    if (emailInput) emailInput.value = profile.email;
    if (favGenreSelect) favGenreSelect.value = profile.favGenre;
    const radios = document.getElementsByName("watch_frequency");
    radios.forEach(r => { if (r.value === profile.watchFrequency) r.checked = true; });
    const opt = document.getElementById("profile-newsletter-opt");
    if (opt) opt.checked = profile.newsletter;
    const bioText = document.getElementById("profile-bio-summary");
    if (bioText) bioText.value = profile.bio || "";
  }
}

function renderProfileCard() {
  const profile = getUserProfile();
  if (profile) {
    if (noProfileMessage) noProfileMessage.style.display = "none";
    if (activeProfileCard) activeProfileCard.style.display = "block";
    if (renderedUsername) renderedUsername.textContent = profile.username;
    if (renderedEmail) renderedEmail.textContent = profile.email;
    if (renderedGenre) renderedGenre.textContent = `საყვარელი ჟანრი: ${profile.favGenre}`;
    if (renderedFrequency) renderedFrequency.textContent = `ყურება: ${profile.watchFrequency}`;
    if (renderedBio) renderedBio.textContent = `„${profile.bio}“`;
  } else {
    if (noProfileMessage) noProfileMessage.style.display = "block";
    if (activeProfileCard) activeProfileCard.style.display = "none";
  }
}

function renderReviewsList() {
  if (!reviewsListContainer) return;
  reviewsListContainer.innerHTML = "";

  const watchlist = getSavedMovies();
  const movies = watchlist.length > 0 ? watchlist : MOCK_REVIEWABLE_MOVIES;

  const formBlock = document.createElement("div");
  formBlock.style.backgroundColor = "rgba(42, 53, 79, 0.25)";
  formBlock.style.padding = "1.25rem";
  formBlock.style.borderRadius = "var(--radius-md)";
  formBlock.style.border = "1px solid var(--color-border)";
  formBlock.style.marginBottom = "1.5rem";

  formBlock.innerHTML = `
    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem;">დაწერე ახალი მიმოხილვა:</h3>
  `;

  const select = document.createElement("select");
  select.className = "form-group__select";
  select.style.marginBottom = "0.75rem";
  movies.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.imdbID;
    opt.textContent = m.Title;
    select.appendChild(opt);
  });
  formBlock.appendChild(select);

  const ratingRow = document.createElement("div");
  ratingRow.style.display = "flex";
  ratingRow.style.alignItems = "center";
  ratingRow.style.gap = "0.5rem";
  ratingRow.style.marginBottom = "0.75rem";
  ratingRow.innerHTML = `<span class="form-group__label" style="margin-bottom:0px;">რეიტინგი:</span>`;
  
  const rSel = document.createElement("select");
  rSel.className = "form-group__select";
  rSel.style.width = "80px";
  for(let i=5; i>=1; i--) {
    rSel.innerHTML += `<option value="${i}">${i} ★</option>`;
  }
  ratingRow.appendChild(rSel);
  formBlock.appendChild(ratingRow);

  const textarea = document.createElement("textarea");
  textarea.className = "form-group__textarea";
  textarea.placeholder = "მიმოხილვის შინაარსი...";
  textarea.style.minHeight = "80px";
  textarea.style.marginBottom = "0.75rem";
  formBlock.appendChild(textarea);

  const btn = document.createElement("button");
  btn.className = "submit-btn";
  btn.style.padding = "0.65rem";
  btn.textContent = "გაგზავნა";
  btn.addEventListener("click", () => {
    const text = textarea.value.trim();
    if (text.length < 5) {
      alert("მიმოხილვა ძალიან მოკლეა!");
      return;
    }
    saveMovieReview(select.value, { rating: rSel.value, comment: text });
    textarea.value = "";
    alert("მიმოხილვა წარმატებით შეინახა!");
    renderReviewsList();
  });
  formBlock.appendChild(btn);
  reviewsListContainer.appendChild(formBlock);

  const reviews = getSavedReviews();
  if (Object.keys(reviews).length === 0) {
    const p = document.createElement("p");
    p.style.color = "var(--color-text-muted)";
    p.style.textAlign = "center";
    p.textContent = "სიით გათვალისწინებული შეფასებები ცარიელია.";
    reviewsListContainer.appendChild(p);
  } else {
    Object.keys(reviews).forEach(imdbID => {
      const r = reviews[imdbID];
      const orig = movies.find(item => item.imdbID === imdbID) || { Title: `ფილმი (${imdbID})` };
      const card = document.createElement("article");
      card.style.backgroundColor = "rgba(21, 28, 44, 0.5)";
      card.style.padding = "1rem";
      card.style.borderRadius = "var(--radius-sm)";
      card.style.border = "1px solid var(--color-border)";
      card.style.position = "relative";
      card.style.marginBottom = "1rem";
      card.innerHTML = `
        <h4 style="font-weight:600; color:var(--color-text-main); margin-bottom:0.25rem;">${orig.Title}</h4>
        <span style="position:absolute; top:1rem; right:1rem; color:var(--color-primary); font-weight:700;">★ ${r.rating}</span>
        <p style="font-size:0.9rem; color:var(--color-text-muted);">${r.comment}</p>
      `;
      reviewsListContainer.appendChild(card);
    });
  }
}

function showFeedback(text, type) {
  if (alertBox) {
    alertBox.className = `form-feedback form-feedback--${type}`;
    alertBox.textContent = text;
  }
}

function clearAlert() {
  if (alertBox) {
    alertBox.className = "form-feedback";
    alertBox.textContent = "";
  }
}
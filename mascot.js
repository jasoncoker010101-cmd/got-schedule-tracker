(() => {
  // This file is still included by index.html for compatibility with the old
  // mascot script tag. The mascot has been removed; this now adds schedule
  // search and browser-local show favorites instead.
  const week = document.getElementById("week");
  if (!week || document.getElementById("showFilters")) return;

  const style = document.createElement("style");
  style.textContent = `
    #showFilters {
      display:flex;
      align-items:center;
      flex-wrap:wrap;
      gap:10px;
      margin:0 0 14px;
      padding:12px;
      border:1px solid var(--line);
      border-radius:12px;
      background:var(--card);
      box-shadow:0 8px 18px rgba(22,33,44,.03);
    }
    #showFilters .show-search {
      flex:1 1 220px;
      min-width:0;
      padding:10px 12px;
      border:1px solid var(--line);
      border-radius:9px;
      background:var(--bg);
      color:var(--ink);
      font:inherit;
    }
    #showFilters .show-search:focus-visible {
      outline:3px solid color-mix(in srgb,var(--accent) 55%,transparent);
      outline-offset:2px;
    }
    #showFilters .favorites-toggle {
      display:flex;
      align-items:center;
      gap:7px;
      color:var(--ink);
      font-weight:700;
      white-space:nowrap;
      cursor:pointer;
    }
    #showFilters .favorites-toggle input { accent-color:var(--accent); }
    #showFilters .show-count {
      color:var(--mute);
      font-size:.82rem;
      white-space:nowrap;
    }
    #week .ev {
      position:relative;
      grid-template-columns:44px minmax(0,1fr) 34px;
      align-items:center;
    }
    #week .show-favorite {
      display:grid;
      place-items:center;
      width:32px;
      height:32px;
      padding:0;
      border:1px solid var(--line);
      border-radius:9px;
      background:var(--bg);
      color:var(--mute);
      font-size:1.15rem;
      line-height:1;
      cursor:pointer;
      transition:color .15s ease,background .15s ease,border-color .15s ease,transform .15s ease;
    }
    #week .show-favorite:hover { transform:scale(1.08); border-color:var(--accent); }
    #week .show-favorite[aria-pressed="true"] {
      color:#8a5c00;
      background:color-mix(in srgb,var(--accent) 22%,var(--card));
      border-color:color-mix(in srgb,var(--accent) 58%,var(--line));
    }
    #showNoResults {
      margin:0 0 14px;
      padding:13px 15px;
      border:1px dashed var(--line);
      border-radius:10px;
      color:var(--mute);
      text-align:center;
    }
    @media(max-width:520px) {
      #showFilters { gap:8px; padding:10px; }
      #showFilters .show-count { flex-basis:100%; }
    }
    @media(prefers-reduced-motion:reduce) {
      #week .show-favorite { transition:none; }
      #week .show-favorite:hover { transform:none; }
    }
  `;
  document.head.appendChild(style);

  const favoritesKey = "gotScheduleFavoriteShows";
  let favorites;
  try {
    const stored = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    favorites = new Set(Array.isArray(stored) ? stored : []);
  } catch (error) {
    favorites = new Set();
  }

  const toolbar = document.createElement("section");
  toolbar.id = "showFilters";
  toolbar.setAttribute("aria-label", "Search and filter schedule shows");

  const searchLabel = document.createElement("label");
  searchLabel.htmlFor = "showSearch";
  searchLabel.hidden = true;
  searchLabel.textContent = "Search shows";

  const search = document.createElement("input");
  search.id = "showSearch";
  search.className = "show-search";
  search.type = "search";
  search.placeholder = "Search this week's shows…";
  search.setAttribute("aria-label", "Search this week's shows");
  search.autocomplete = "off";

  const favoriteLabel = document.createElement("label");
  favoriteLabel.className = "favorites-toggle";
  const favoriteOnly = document.createElement("input");
  favoriteOnly.type = "checkbox";
  favoriteOnly.id = "favoritesOnly";
  const favoriteText = document.createElement("span");
  favoriteText.textContent = "Favorites only";
  favoriteLabel.append(favoriteOnly, favoriteText);

  const count = document.createElement("span");
  count.className = "show-count";
  count.setAttribute("aria-live", "polite");

  toolbar.append(searchLabel, search, favoriteLabel, count);
  week.before(toolbar);

  const noResults = document.createElement("p");
  noResults.id = "showNoResults";
  noResults.textContent = "No shows match your search. Try another title or turn off Favorites only.";
  noResults.hidden = true;
  week.before(noResults);

  const normalize = value => (value || "")
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\\p{L}\\p{N}]+/gu, " ")
    .trim();

  function saveFavorites() {
    try {
      localStorage.setItem(favoritesKey, JSON.stringify([...favorites]));
    } catch (error) {
      // Keep favorites usable for the current page if storage is unavailable.
    }
  }

  function favoriteButton(title) {
    const button = document.createElement("button");
    const isFavorite = favorites.has(title);
    button.className = "show-favorite";
    button.type = "button";
    button.textContent = isFavorite ? "★" : "☆";
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute("aria-label", `${isFavorite ? "Remove" : "Add"} ${title} ${isFavorite ? "from" : "to"} favorites`);
    button.title = `${isFavorite ? "Remove from" : "Add to"} favorites`;
    button.addEventListener("click", () => {
      if (favorites.has(title)) favorites.delete(title);
      else favorites.add(title);
      saveFavorites();
      refresh();
    });
    return button;
  }

  function refresh() {
    const query = normalize(search.value);
    const onlyFavorites = favoriteOnly.checked;
    let total = 0;
    let shown = 0;

    week.querySelectorAll(".ev").forEach(card => {
      const titleNode = card.querySelector(".n");
      if (!titleNode) return;
      const title = titleNode.textContent.trim();
      if (!title) return;
      total++;

      let button = card.querySelector(".show-favorite");
      if (!button) {
        button = favoriteButton(title);
        card.appendChild(button);
      } else {
        const isFavorite = favorites.has(title);
        button.textContent = isFavorite ? "★" : "☆";
        button.setAttribute("aria-pressed", String(isFavorite));
        button.setAttribute("aria-label", `${isFavorite ? "Remove" : "Add"} ${title} ${isFavorite ? "from" : "to"} favorites`);
        button.title = `${isFavorite ? "Remove from" : "Add to"} favorites`;
      }

      const matchesSearch = !query || normalize(title).includes(query);
      const matchesFavorite = !onlyFavorites || favorites.has(title);
      const visible = matchesSearch && matchesFavorite;
      card.hidden = !visible;
      if (visible) shown++;
    });

    week.querySelectorAll(".day").forEach(day => {
      const hasVisibleEvents = [...day.querySelectorAll(".ev")].some(card => !card.hidden);
      const hasEmptyMessage = !!day.querySelector(".none");
      day.hidden = !hasVisibleEvents && !hasEmptyMessage;
    });

    count.textContent = onlyFavorites
      ? `${shown} favorite ${shown === 1 ? "event" : "events"}`
      : `${shown} of ${total} ${total === 1 ? "event" : "events"}`;
    noResults.hidden = shown > 0 || total === 0;
  }

  search.addEventListener("input", refresh);
  favoriteOnly.addEventListener("change", refresh);

  const observer = new MutationObserver(refresh);
  observer.observe(week, {childList:true, subtree:true});
  refresh();
})();

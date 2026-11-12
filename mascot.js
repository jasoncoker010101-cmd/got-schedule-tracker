(() => {
  // Compatibility with index.html's existing mascot.js script include.
  const week = document.getElementById("week");
  if (!week || document.getElementById("showFilters")) return;

  const mainNav = document.querySelector(".main-nav");
  if (mainNav && !mainNav.querySelector('a[href="anime.html"]')) {
    const animeLink = document.createElement("a");
    animeLink.href = "anime.html";
    animeLink.textContent = "Anime Search";
    mainNav.append(animeLink);
  }

  const style = document.createElement("style");
  style.textContent = `
    .main-nav { grid-template-columns:repeat(3,minmax(0,1fr)); }
    #showFilters { display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:0 0 14px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--card);box-shadow:0 8px 18px rgba(22,33,44,.03); }
    #showFilters .show-search { flex:1 1 220px;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--ink);font:inherit; }
    #showFilters .show-search:focus-visible { outline:3px solid color-mix(in srgb,var(--accent) 55%,transparent);outline-offset:2px; }
    #showFilters .favorites-toggle { display:flex;align-items:center;gap:7px;color:var(--ink);font-weight:700;white-space:nowrap;cursor:pointer; }
    #showFilters .favorites-toggle input { accent-color:var(--accent); }
    #showFilters .show-count { color:var(--mute);font-size:.82rem;white-space:nowrap; }
    #week .ev { position:relative;grid-template-columns:44px minmax(0,1fr) 34px;align-items:center; }
    #week .show-favorite { display:grid;place-items:center;width:32px;height:32px;padding:0;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--mute);font-size:1.15rem;line-height:1;cursor:pointer;transition:color .15s ease,background .15s ease,border-color .15s ease,transform .15s ease; }
    #week .show-favorite:hover { transform:scale(1.08);border-color:var(--accent); }
    #week .show-favorite[aria-pressed="true"] { color:#8a5c00;background:color-mix(in srgb,var(--accent) 22%,var(--card));border-color:color-mix(in srgb,var(--accent) 58%,var(--line)); }
    #showNoResults { margin:0 0 14px;padding:13px 15px;border:1px dashed var(--line);border-radius:10px;color:var(--mute);text-align:center; }
    .legend .delayed-legend { display:none !important; }
    @media(max-width:520px) { #showFilters{gap:8px;padding:10px} #showFilters .show-count{flex-basis:100%} .main-nav{gap:6px} .main-nav a{font-size:.82rem;padding:10px 4px} }
    @media(prefers-reduced-motion:reduce) { #week .show-favorite{transition:none} #week .show-favorite:hover{transform:none} }
  `;
  document.head.appendChild(style);

  const favoritesKey = "gotScheduleFavoriteShows";
  let favorites;
  try {
    const stored = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    favorites = new Set(Array.isArray(stored) ? stored : []);
  } catch { favorites = new Set(); }

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

  const normalize = value => (value || "").toLocaleLowerCase().replace(/[’']/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  function saveFavorites() {
    try { localStorage.setItem(favoritesKey, JSON.stringify([...favorites])); } catch {}
  }
  function favoriteButton(title) {
    const button = document.createElement("button");
    const selected = favorites.has(title);
    button.className = "show-favorite";
    button.type = "button";
    button.textContent = selected ? "★" : "☆";
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute("aria-label", `${selected ? "Remove" : "Add"} ${title} ${selected ? "from" : "to"} favorites`);
    button.title = `${selected ? "Remove from" : "Add to"} favorites`;
    button.addEventListener("click", () => {
      if (favorites.has(title)) favorites.delete(title); else favorites.add(title);
      saveFavorites();
      refresh();
    });
    return button;
  }

  let scheduleData = null;
  let twitchIsLive = false;
  let streamEventKey = "";
  async function loadLiveSchedule() {
    try {
      const [scheduleResponse, liveResponse] = await Promise.all([
        fetch(`schedule.json?t=${Date.now()}`, {cache:"no-store"}),
        fetch(`live.json?t=${Date.now()}`, {cache:"no-store"})
      ]);
      if (scheduleResponse.ok) scheduleData = await scheduleResponse.json();
      if (liveResponse.ok) {
        const live = await liveResponse.json();
        twitchIsLive = Boolean(live?.platforms?.twitch || live?.details?.twitch?.live);
      }
      const now = Date.now();
      const candidates = (scheduleData?.events || []).filter(event => {
        const platform = String(event.platform || "").toLowerCase();
        const start = Date.parse(event.start || event.date || "");
        return ["twitch", "rumble"].includes(platform) && Number.isFinite(start) && start <= now && now - start <= 3 * 60 * 60 * 1000 && !/predicted|cancelled|canceled/i.test(event.status || "");
      }).sort((a,b) => Date.parse(b.start || b.date) - Date.parse(a.start || a.date));
      const current = candidates[0];
      streamEventKey = current ? `${current.start || current.date}|${current.platform}|${current.title}` : "";
    } catch (error) {
      console.warn("Could not refresh stream status:", error);
    }
    refresh();
  }

  function updateStreamBadges() {
    // Remove the delayed legend item regardless of whether the page re-rendered.
    document.querySelectorAll(".legend span").forEach(item => {
      if (/Delayed/i.test(item.textContent)) item.remove();
    });
    const now = Date.now();
    (scheduleData?.events || []).forEach(event => {
      const platform = String(event.platform || "").toLowerCase();
      if (!["twitch", "rumble"].includes(platform)) return;
      const startValue = event.start || event.date || "";
      const start = Date.parse(startValue);
      if (!Number.isFinite(start)) return;
      const title = String(event.title || "").trim();
      const eventKey = `${startValue}|${platform}|${title}`;
      const day = [...week.querySelectorAll(".day")].find(box => {
        const heading = box.querySelector("h2");
        return heading && heading.textContent.includes(new Intl.DateTimeFormat("en-US", {timeZone:tz, month:"short", day:"numeric"}).format(new Date(start)));
      });
      if (!day) return;
      const row = [...day.querySelectorAll(".ev")].find(card => card.querySelector(".n")?.textContent.trim() === title);
      if (!row) return;

      const activeEvent = eventKey === streamEventKey;
      const eventLive = activeEvent && twitchIsLive;
      const expired = start <= now && now - start > 3 * 60 * 60 * 1000;
      row.classList.toggle("live", eventLive);
      row.classList.toggle("past", expired || (start <= now && !eventLive && !activeEvent));
      const dot = row.querySelector(".dot");
      if (dot) {
        dot.classList.remove("live", "delayed", "ended", "posted");
        if (eventLive) dot.classList.add("live");
        else if (expired || (start <= now && !activeEvent)) dot.classList.add("ended");
        dot.setAttribute("aria-label", eventLive ? "Live now" : expired || (start <= now && !activeEvent) ? "Ended" : "Waiting for stream");
      }
      const status = row.querySelector(".k");
      if (status) {
        const platformText = (event.labels && event.labels.length ? event.labels.join(" + ") : platform === "rumble" ? "Rumble" : "Twitch");
        status.textContent = `${platformText} · ${eventLive ? "Live now" : expired || (start <= now && !activeEvent) ? "Ended" : "Waiting"}`;
      }
    });
    // Clear stale live badges from any schedule row that is not the current
    // scheduled stream event, especially previous days' streams.
    week.querySelectorAll(".ev.live").forEach(row => {
      const day = row.closest(".day");
      const title = row.querySelector(".n")?.textContent.trim();
      const current = (scheduleData?.events || []).find(event => String(event.title || "").trim() === title && `${event.start || event.date}|${event.platform}|${event.title}` === streamEventKey);
      if (!current || !twitchIsLive || !day?.classList.contains("today")) {
        row.classList.remove("live");
        const dot = row.querySelector(".dot");
        if (dot) dot.classList.remove("live");
        const status = row.querySelector(".k");
        if (status && /Live now/.test(status.textContent)) status.textContent = status.textContent.replace(/Live now/g, "Ended");
      }
    });
  }

  function refresh() {
    const query = normalize(search.value);
    let total = 0;
    let shown = 0;
    week.querySelectorAll(".ev").forEach(card => {
      const titleNode = card.querySelector(".n");
      if (!titleNode) return;
      const title = titleNode.textContent.trim();
      if (!title) return;
      total++;
      let button = card.querySelector(".show-favorite");
      if (!button) { button = favoriteButton(title); card.appendChild(button); }
      else {
        const selected = favorites.has(title);
        button.textContent = selected ? "★" : "☆";
        button.setAttribute("aria-pressed", String(selected));
        button.setAttribute("aria-label", `${selected ? "Remove" : "Add"} ${title} ${selected ? "from" : "to"} favorites`);
        button.title = `${selected ? "Remove from" : "Add to"} favorites`;
      }
      const visible = (!query || normalize(title).includes(query)) && (!favoriteOnly.checked || favorites.has(title));
      card.hidden = !visible;
      if (visible) shown++;
    });
    week.querySelectorAll(".day").forEach(day => {
      const visible = [...day.querySelectorAll(".ev")].some(card => !card.hidden);
      day.hidden = !visible && !day.querySelector(".none");
    });
    count.textContent = favoriteOnly.checked ? `${shown} favorite ${shown === 1 ? "event" : "events"}` : `${shown} of ${total} ${total === 1 ? "event" : "events"}`;
    noResults.hidden = shown > 0 || total === 0;
    updateStreamBadges();
  }

  search.addEventListener("input", refresh);
  favoriteOnly.addEventListener("change", refresh);
  new MutationObserver(refresh).observe(week, {childList:true, subtree:true});
  loadLiveSchedule();
  setInterval(loadLiveSchedule, 2 * 60 * 1000);
  refresh();
})();

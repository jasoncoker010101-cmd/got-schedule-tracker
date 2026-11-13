(function () {
  "use strict";

  const DEFAULT_PATREON_URL = "https://www.patreon.com/cw/gotgames";

  function safePatreonUrl(value) {
    try {
      const url = new URL(String(value || DEFAULT_PATREON_URL));
      const host = url.hostname.toLowerCase();
      const allowed = host === "patreon.com" || host.endsWith(".patreon.com");
      return url.protocol === "https:" && allowed
        ? url.href
        : DEFAULT_PATREON_URL;
    } catch (_error) {
      return DEFAULT_PATREON_URL;
    }
  }

  function createEpisodeLink(row, episode) {
    const link = document.createElement("a");
    link.className = "episode-chip patreon-link";
    link.href = safePatreonUrl(row.patreon_url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "EP " + episode;
    link.title = "Patreon Exclusive. Visit G.O.T. Games on Patreon.";
    link.setAttribute(
      "aria-label",
      "Episode " + episode + ". Patreon-exclusive reaction. Opens Patreon in a new tab."
    );
    return link;
  }

  function createNotice(rows) {
    const notice = document.createElement("aside");
    notice.className = "patreon-exclusive-notice";

    const badge = document.createElement("span");
    badge.className = "patreon-exclusive-badge";
    badge.textContent = "Patreon Exclusive";

    const description = document.createElement("p");
    description.className = "patreon-exclusive-description";
    description.textContent =
      "This reaction is available exclusively to G.O.T. Games Patreon supporters.";

    const link = document.createElement("a");
    link.className = "patreon-exclusive-link";
    link.href = safePatreonUrl(rows[0] && rows[0].patreon_url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Visit G.O.T. Games on Patreon ↗";

    notice.append(badge, description, link);
    return notice;
  }

  const style = document.createElement("style");
  style.textContent = `
    .patreon-exclusive-notice {
      margin: 0 0 12px;
      padding: 12px;
      border: 1px solid rgba(239, 189, 50, .38);
      border-radius: 9px;
      background: rgba(239, 189, 50, .08);
    }
    .patreon-exclusive-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(239, 189, 50, .18);
      color: #efbd32;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .patreon-exclusive-description {
      margin: 8px 0;
      color: #aaa69a;
      font-size: 12px;
      line-height: 1.5;
    }
    .patreon-exclusive-link {
      color: #efbd32;
      font-size: 12px;
      font-weight: 800;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .episode-chip.patreon-link {
      border-color: rgba(239, 189, 50, .55);
      background: rgba(239, 189, 50, .12);
      color: #efbd32;
    }
    .episode-chip.patreon-link:hover {
      border-color: #efbd32;
      background: rgba(239, 189, 50, .24);
    }
  `;
  document.head.append(style);

  window.GOTPatreonLinks = { createEpisodeLink, createNotice };
})();

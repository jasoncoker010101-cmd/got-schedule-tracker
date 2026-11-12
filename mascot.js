(() => {
  const style = document.createElement("style");
  style.textContent = `
    .runner-mascot {
      --mascot-ginger: #c65e24;
      position: fixed;
      z-index: 900;
      left: 0;
      bottom: max(10px, env(safe-area-inset-bottom));
      width: 188px;
      height: 174px;
      pointer-events: none;
      animation: mascot-cross-screen 18s linear infinite;
      will-change: transform;
    }
    .runner-mascot svg { width: 100%; height: 100%; overflow: visible; }
    .runner-mascot .mascot-bob { transform-box: fill-box; transform-origin: center bottom; animation: mascot-bob .34s ease-in-out infinite alternate; }
    .runner-mascot .mascot-wave { transform-box: view-box; transform-origin: 119px 66px; animation: mascot-wave .48s ease-in-out infinite alternate; }
    .runner-mascot .mascot-leg-back { transform-box: view-box; transform-origin: 91px 119px; animation: mascot-run-back .34s ease-in-out infinite alternate; }
    .runner-mascot .mascot-leg-front { transform-box: view-box; transform-origin: 109px 119px; animation: mascot-run-front .34s ease-in-out infinite alternate; }
    .runner-mascot .mascot-award-arm { transform-box: view-box; transform-origin: 83px 72px; animation: mascot-carry .34s ease-in-out infinite alternate; }
    @keyframes mascot-cross-screen { from { transform: translateX(-205px); } to { transform: translateX(calc(100vw + 205px)); } }
    @keyframes mascot-bob { to { translate: 0 -4px; } }
    @keyframes mascot-wave { from { rotate: -13deg; } to { rotate: 20deg; } }
    @keyframes mascot-run-back { from { rotate: 22deg; } to { rotate: -24deg; } }
    @keyframes mascot-run-front { from { rotate: -24deg; } to { rotate: 22deg; } }
    @keyframes mascot-carry { from { rotate: -3deg; } to { rotate: 4deg; } }
    @media (prefers-reduced-motion: reduce) {
      .runner-mascot { animation: none; left: auto; right: 12px; }
      .runner-mascot .mascot-bob, .runner-mascot .mascot-wave,
      .runner-mascot .mascot-leg-back, .runner-mascot .mascot-leg-front,
      .runner-mascot .mascot-award-arm { animation: none; }
    }
  `;
  document.head.append(style);

  const mascot = document.createElement("div");
  mascot.className = "runner-mascot";
  mascot.setAttribute("aria-hidden", "true");
  mascot.innerHTML = `
    <svg viewBox="0 0 200 180" role="presentation" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mascot-shirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f5cf48"/><stop offset="1" stop-color="#d99e13"/>
        </linearGradient>
        <linearGradient id="mascot-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e88a39"/><stop offset=".55" stop-color="#bd4e1f"/><stop offset="1" stop-color="#873516"/>
        </linearGradient>
        <linearGradient id="mascot-skin" x1="0" y1="0" x2=".8" y2="1">
          <stop offset="0" stop-color="#ffd9b5"/><stop offset="1" stop-color="#dfa77c"/>
        </linearGradient>
        <linearGradient id="mascot-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#d9e0e7"/><stop offset="1" stop-color="#929da8"/>
        </linearGradient>
        <linearGradient id="mascot-trousers" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#40536a"/><stop offset="1" stop-color="#202c3b"/>
        </linearGradient>
        <filter id="mascot-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.7" flood-color="#101820" flood-opacity=".25"/>
        </filter>
      </defs>

      <!-- Ground shadow -->
      <ellipse cx="99" cy="165" rx="48" ry="6" fill="#101820" opacity=".15"/>
      <g class="mascot-bob" stroke="#382920" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <!-- Far leg, trousers and sneaker -->
        <g class="mascot-leg-back">
          <path d="m94 113-12 20-15 10 5 7 22-8 15-21" fill="url(#mascot-trousers)"/>
          <path d="m67 141-7 7q-2 3 2 5l23 1q5 0 4-4l-3-7-8 5-6-5" fill="#f2f3f4"/>
          <path d="m62 149 22 1m-15-5 5 4m5-7 5 4" fill="none" stroke="#aeb8c2" stroke-width="1.5"/>
          <path d="m91 126-8 12m13-17-8 12" fill="none" stroke="#718096" stroke-width="1.5"/>
        </g>
        <!-- Back arm and sleeve, holding the awards close -->
        <path d="m76 75-14 8-8 21 7 4 14-16 12-6" fill="url(#mascot-shirt)"/>
        <path d="m62 104-4 9q-1 4 3 5l7-1 5-9-5-5z" fill="url(#mascot-skin)"/>

        <!-- Torso -->
        <path d="M77 67q13-9 29 0l11 9-5 40q-20 12-43 0l2-31-9 7-7-8 12-14z" fill="url(#mascot-shirt)"/>
        <path d="m83 67 10 13 9-13m-10 13-2 34m-15-28 6 3m31-2-8 4" fill="none" stroke="#b77b13" stroke-width="1.6"/>
        <path d="M84 67q9 7 18 0" fill="none" stroke="#fff0ad" stroke-width="2"/>
        <!-- Shirt details -->
        <path d="m108 79 5 2-1 5-5-2z" fill="#f7e6a3" stroke="#b77b13" stroke-width="1"/>
        <circle cx="109" cy="89" r="1.2" fill="#8b6517" stroke="none"/>
        <circle cx="108" cy="96" r="1.2" fill="#8b6517" stroke="none"/>

        <!-- Neck -->
        <path d="m86 60-1 11q8 8 16 0l-2-13" fill="url(#mascot-skin)"/>
        <!-- Ear and face, turned slightly toward the direction he's running -->
        <path d="M75 39q0-24 22-24 20 0 21 23l-2 14q-3 17-21 19-17-2-20-19z" fill="url(#mascot-skin)"/>
        <path d="M76 45q-9-2-8 6 1 7 9 6m39-13q8-1 8 6 0 6-8 7" fill="url(#mascot-skin)"/>
        <path d="M72 50q5-2 8 3m35-2q4-4 8-2" fill="none" stroke="#b77855" stroke-width="1.5"/>

        <!-- Ginger undercut and textured swept-up mohawk -->
        <path d="M76 39q-2-14 7-21 6-5 15-4 13 1 19 13 3 6 1 15-5-4-10-5l-3-12-5 10-5-16-7 16-6-8-1 13q-2-2-5-1z" fill="url(#mascot-hair)"/>
        <path d="m80 30 3-12 6 9m2-1 4-12 4 14m4-3 5-7 2 12" fill="none" stroke="#f3a45a" stroke-width="2"/>
        <path d="M77 42q5-4 9-2m24-1q4-1 7 2" fill="none" stroke="#853916" stroke-width="2"/>
        <path d="m78 43 2 4m32-5-1 5" fill="none" stroke="#a9491c" stroke-width="2"/>

        <!-- Brows, lively eyes, nose, and smile -->
        <path d="m84 40 8-2m13 1 6 2" fill="none" stroke="#71391f" stroke-width="2.2"/>
        <ellipse cx="89" cy="45" rx="2.7" ry="3.4" fill="#fff" stroke="none"/>
        <ellipse cx="107" cy="44" rx="2.7" ry="3.4" fill="#fff" stroke="none"/>
        <ellipse cx="90" cy="46" rx="1.25" ry="2" fill="#3d302a" stroke="none"/>
        <ellipse cx="108" cy="45" rx="1.25" ry="2" fill="#3d302a" stroke="none"/>
        <circle cx="90.4" cy="45.3" r=".55" fill="#fff" stroke="none"/>
        <circle cx="108.4" cy="44.3" r=".55" fill="#fff" stroke="none"/>
        <path d="m98 46-2 8q2 2 5 0" fill="none" stroke="#b77855" stroke-width="1.5"/>
        <path d="M92 57q7 6 14-1" fill="none" stroke="#713c31" stroke-width="1.8"/>
        <path d="M94 58q5 2 9-1" fill="none" stroke="#fff3e7" stroke-width="1.2"/>
        <path d="M82 53q3 2 5 1m25-3q3-1 5-3" fill="none" stroke="#e99c82" stroke-width="1.5" opacity=".8"/>

        <!-- Full ginger beard and moustache, shaped around the smile -->
        <path d="M79 51q4 3 9 1 4 3 9 1 5 2 10-1 5 2 9-2l-2 13q-3 10-14 13l-4 8-5-8q-10-3-13-13z" fill="url(#mascot-hair)"/>
        <path d="M79 53q5 4 10 0 4 4 9 1 5 3 10-1 4 3 8-1l-2 7q-5 4-9 0-5 4-10 0-5 4-10 0-4 3-7 0z" fill="#d87531"/>
        <path d="M82 62q4 3 7 1m19 0q3 1 6-2m-26 7q4 2 7 1m9 2q4-1 7-4m-20 8q4 1 7 3" fill="none" stroke="#f09a53" stroke-width="1.5" opacity=".9"/>
        <path d="M96 62q2 2 4 0" fill="none" stroke="#63331e" stroke-width="1.4"/>
        <!-- Beard sideburns -->
        <path d="M77 44q-3 7 1 13l3-7m34-7q3 7-1 13l-3-7" fill="#ad4b20" stroke="none"/>

        <!-- Award-carrying arm in foreground -->
        <g class="mascot-award-arm">
          <path d="m80 74-10 9 8 15 13-4" fill="none" stroke="url(#mascot-shirt)" stroke-width="10"/>
          <path d="m80 94 8-2 6 4-3 7-10 1-5-4z" fill="url(#mascot-skin)"/>
        </g>

        <!-- Two silver creator awards, side-by-side, with metallic bevels -->
        <g filter="url(#mascot-shadow)" transform="rotate(-5 73 111)">
          <path d="M48 91q0-3 3-3h22l4 4v33H48z" fill="#7f8a95"/>
          <path d="M46 89q0-3 3-3h22l4 4v32H46z" fill="url(#mascot-silver)"/>
          <path d="M49 92h21v25H49z" fill="#f8fafb" stroke="#a6b0ba" stroke-width="1.3"/>
          <path d="m57 98 9 6-9 6z" fill="#9aa5af" stroke="none"/>
          <path d="M49 92h21m-21 3h7" fill="none" stroke="#fff" stroke-width="1.3" opacity=".9"/>
          <text x="59.5" y="114" fill="#5b6670" stroke="none" font-size="4.2" font-weight="700" text-anchor="middle" font-family="sans-serif">SILVER</text>
          <path d="m51 120 3 5 4-4 4 4 4-5" fill="#b7c0c8" stroke="#7f8a95" stroke-width="1"/>
        </g>
        <g filter="url(#mascot-shadow)" transform="rotate(5 101 111)">
          <path d="M78 92q0-3 3-3h22l4 4v32H78z" fill="#7f8a95"/>
          <path d="M76 90q0-3 3-3h22l4 4v32H76z" fill="url(#mascot-silver)"/>
          <path d="M79 93h21v25H79z" fill="#f8fafb" stroke="#a6b0ba" stroke-width="1.3"/>
          <path d="m87 99 9 6-9 6z" fill="#9aa5af" stroke="none"/>
          <path d="M79 93h21m-21 3h7" fill="none" stroke="#fff" stroke-width="1.3" opacity=".9"/>
          <text x="89.5" y="115" fill="#5b6670" stroke="none" font-size="4.2" font-weight="700" text-anchor="middle" font-family="sans-serif">SILVER</text>
          <path d="m81 121 3 5 4-4 4 4 4-5" fill="#b7c0c8" stroke="#7f8a95" stroke-width="1"/>
        </g>
        <!-- Fingers curled around the two awards -->
        <path d="M73 105q7-4 12 1m-12 4q6-3 11 2m-9 3q5-2 9 2" fill="none" stroke="#d9966f" stroke-width="2.2"/>

        <!-- Near leg, trousers and detailed sneaker -->
        <g class="mascot-leg-front">
          <path d="m105 114 12 13 10 15-6 7-18-11-8-18" fill="url(#mascot-trousers)"/>
          <path d="m119 141 8 2 8 7q2 4-3 5l-24-1q-4-1-2-5l5-7 7 6z" fill="#fff"/>
          <path d="m108 151 27 1m-13-8-5 6m12-3-4 4" fill="none" stroke="#aab5bf" stroke-width="1.5"/>
          <path d="m101 123 9 12m-5-16 9 12" fill="none" stroke="#718096" stroke-width="1.5"/>
        </g>

        <!-- Raised waving arm, with sleeve, forearm, palm and individual fingers -->
        <path d="m108 75 13-8 5-13-7-4-10 11-11 4" fill="url(#mascot-shirt)"/>
        <g class="mascot-wave">
          <path d="m124 58 6-18" fill="none" stroke="url(#mascot-skin)" stroke-width="8"/>
          <path d="M128 43q-3-4-1-10 1-3 3-2l2 9m-2 4q0-8 5-11 3-2 4 1l-4 11m-3 1q4-7 9-7 4 1 2 4l-7 8m-8-2q-4-3-6-1-2 2 1 5l7 5q5 2 9-2l7-8" fill="url(#mascot-skin)"/>
          <path d="m129 37 2 6m7-7-3 7m8-3-5 7m-14 5 5 2" fill="none" stroke="#bd805c" stroke-width="1.2"/>
        </g>

        <!-- Trouser waistband and pocket stitching -->
        <path d="m73 111q18 9 43 1l-1 9q-21 9-43-1z" fill="#263646"/>
        <path d="m79 116q5 3 9 3m20-5-1 6m-20 2 1 3" fill="none" stroke="#66788a" stroke-width="1.4"/>
      </g>
    </svg>`;
  document.body.append(mascot);
})();

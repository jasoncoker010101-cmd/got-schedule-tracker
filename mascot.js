(() => {
  const style = document.createElement("style");
  style.textContent = `
    .runner-mascot {
      position: fixed;
      left: 0;
      bottom: max(10px, env(safe-area-inset-bottom));
      width: 150px;
      height: 120px;
      z-index: 900;
      pointer-events: none;
      animation: mascot-run-across 18s linear infinite;
      filter: drop-shadow(0 6px 8px rgba(0,0,0,0.10));
      will-change: transform;
    }
    .runner-mascot svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      display: block;
    }
    .runner-mascot .bob { animation: mascot-bob .28s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center bottom; }
    .runner-mascot .arm-wave { animation: mascot-wave .42s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 110px 58px; }
    .runner-mascot .leg-left { animation: mascot-leg-left .26s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 65px 98px; }
    .runner-mascot .leg-right { animation: mascot-leg-right .26s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 94px 98px; }
    @keyframes mascot-run-across { from { transform: translateX(-180px); } to { transform: translateX(calc(100vw + 180px)); } }
    @keyframes mascot-bob { to { translate: 0 -4px; } }
    @keyframes mascot-wave { from { rotate: -18deg; } to { rotate: 18deg; } }
    @keyframes mascot-leg-left { from { rotate: 16deg; } to { rotate: -16deg; } }
    @keyframes mascot-leg-right { from { rotate: -16deg; } to { rotate: 16deg; } }
    @media (prefers-reduced-motion: reduce) {
      .runner-mascot { animation: none; left: auto; right: 14px; }
      .runner-mascot .bob, .runner-mascot .arm-wave, .runner-mascot .leg-left, .runner-mascot .leg-right { animation: none; }
    }
  `;
  document.head.append(style);

  const mascot = document.createElement("div");
  mascot.className = "runner-mascot";
  mascot.setAttribute("aria-hidden", "true");
  mascot.innerHTML = `
    <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <defs>
        <linearGradient id="shirtGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f6d559"/>
          <stop offset="1" stop-color="#d9a31d"/>
        </linearGradient>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f7d5a1"/>
          <stop offset="1" stop-color="#d99a65"/>
        </linearGradient>
        <linearGradient id="silverGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f5f7fa"/>
          <stop offset="0.5" stop-color="#dfe5eb"/>
          <stop offset="1" stop-color="#a2adb8"/>
        </linearGradient>
      </defs>

      <g class="bob" stroke="#2a1d16" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="93" cy="111" rx="42" ry="5" fill="#111820" opacity="0.12"/>

        <!-- left leg -->
        <g class="leg-left">
          <path d="M70 88 L63 101 L44 102 L44 109 L64 110 L76 92 Z" fill="#3a485a"/>
          <path d="M57 109 L67 110" stroke="#a9b7c3" stroke-width="2"/>
        </g>

        <!-- right leg -->
        <g class="leg-right">
          <path d="M92 88 L101 101 L120 101 L121 109 L98 109 L84 93 Z" fill="#3a485a"/>
          <path d="M98 109 L110 110" stroke="#a9b7c3" stroke-width="2"/>
        </g>

        <!-- torso -->
        <path d="M65 59 L82 48 L99 60 L107 87 L81 100 L58 88 Z" fill="url(#shirtGrad)"/>
        <path d="M84 50 L84 88" stroke="#bf8d14" stroke-width="2"/>
        <path d="M71 64 L78 72 M94 66 L102 72" stroke="#bf8d14" stroke-width="2"/>

        <!-- left arm and play button -->
        <path d="M59 66 L41 71 L30 86 L36 90 L51 82 L60 70 Z" fill="#f3c89d"/>
        <g transform="translate(16 74) rotate(-7)">
          <rect x="0" y="0" width="24" height="24" rx="5" fill="url(#silverGrad)" stroke="#788893" stroke-width="2"/>
          <path d="M9 7 L17 12 L9 17 Z" fill="#5f6973"/>
        </g>

        <!-- right arm and play button -->
        <g class="arm-wave">
          <path d="M109 66 L126 57 L136 40 L131 35 L115 44 L104 58 Z" fill="#f3c89d"/>
          <g transform="translate(130 32) rotate(8)">
            <rect x="0" y="0" width="24" height="24" rx="5" fill="url(#silverGrad)" stroke="#788893" stroke-width="2"/>
            <path d="M9 7 L17 12 L9 17 Z" fill="#5f6973"/>
          </g>
        </g>

        <!-- head -->
        <path d="M61 32 L80 22 L96 25 L108 38 L108 60 L81 68 L59 57 Z" fill="url(#skinGrad)"/>

        <!-- mohawk -->
        <path d="M63 26 L71 12 L79 21 L86 9 L93 21 L101 13 L108 27 L96 29 L86 25 L79 32 L70 29 Z" fill="#d97a2e"/>
        <path d="M68 20 L75 27 L82 18 L90 28 L99 19" fill="none" stroke="#f0a353" stroke-width="2"/>

        <!-- face -->
        <path d="M69 39 L76 37 M95 38 L101 39" fill="none" stroke="#6d3d2e" stroke-width="2"/>
        <ellipse cx="75" cy="43" rx="2.8" ry="3.1" fill="#fff"/>
        <ellipse cx="96" cy="43" rx="2.8" ry="3.1" fill="#fff"/>
        <circle cx="75.5" cy="43.5" r="1.1" fill="#2a201d"/>
        <circle cx="96.5" cy="43.5" r="1.1" fill="#2a201d"/>
        <path d="M85 44 Q88 49 92 45" fill="none" stroke="#ad6d4a" stroke-width="2"/>
        <path d="M74 54 Q84 60 96 54" fill="none" stroke="#7a4132" stroke-width="2"/>

        <!-- beard -->
        <path d="M67 49 Q76 62 86 60 Q95 63 105 49 L102 70 Q92 76 86 75 Q78 77 68 68 Z" fill="#b15d1d"/>
        <path d="M70 51 Q78 58 85 57 Q93 58 101 51" fill="none" stroke="#d58a41" stroke-width="2"/>

        <!-- neck -->
        <path d="M77 62 L92 62 L90 72 L79 72 Z" fill="#f1c89e"/>

        <!-- collar / shirt detail -->
        <path d="M66 84 L100 84 L87 94 L79 94 Z" fill="#c68d14"/>
      </g>
    </svg>
  `;

  document.body.appendChild(mascot);
})();

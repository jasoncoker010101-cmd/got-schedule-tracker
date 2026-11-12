(() => {
  const style = document.createElement('style');
  style.textContent = `
    .runner-mascot {
      position: fixed;
      left: 0;
      bottom: max(10px, env(safe-area-inset-bottom));
      width: 180px;
      height: 136px;
      z-index: 900;
      pointer-events: none;
      animation: mascot-cross-screen 18s linear infinite;
      will-change: transform;
      filter: drop-shadow(0 8px 10px rgba(0,0,0,0.12));
    }
    .runner-mascot svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .runner-mascot .bob { animation: mascot-bob .28s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center bottom; }
    .runner-mascot .wave-arm { animation: mascot-wave .4s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 132px 86px; }
    .runner-mascot .leg-left { animation: mascot-run-left .24s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 82px 120px; }
    .runner-mascot .leg-right { animation: mascot-run-right .24s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 109px 120px; }
    @keyframes mascot-cross-screen { from { transform: translateX(-220px); } to { transform: translateX(calc(100vw + 220px)); } }
    @keyframes mascot-bob { to { translate: 0 -4px; } }
    @keyframes mascot-wave { from { rotate: -18deg; } to { rotate: 18deg; } }
    @keyframes mascot-run-left { from { rotate: 14deg; } to { rotate: -18deg; } }
    @keyframes mascot-run-right { from { rotate: -16deg; } to { rotate: 18deg; } }
    @media (prefers-reduced-motion: reduce) {
      .runner-mascot { animation: none; left: auto; right: 14px; }
      .runner-mascot .bob, .runner-mascot .wave-arm, .runner-mascot .leg-left, .runner-mascot .leg-right { animation: none; }
    }
  `;
  document.head.appendChild(style);

  const mascot = document.createElement('div');
  mascot.className = 'runner-mascot';
  mascot.setAttribute('aria-hidden', 'true');
  mascot.innerHTML = `
    <svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <defs>
        <linearGradient id="shirtG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f9db62"/>
          <stop offset="1" stop-color="#d39a1a"/>
        </linearGradient>
        <linearGradient id="skinG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f7d5a1"/>
          <stop offset="1" stop-color="#d99a65"/>
        </linearGradient>
        <linearGradient id="silverG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f8fbff"/>
          <stop offset="0.45" stop-color="#dde5ec"/>
          <stop offset="1" stop-color="#93a1ad"/>
        </linearGradient>
      </defs>

      <g class="bob" stroke="#311f18" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="106" cy="145" rx="46" ry="6" fill="#1a212a" opacity="0.12"/>

        <!-- Legs -->
        <g class="leg-left">
          <path d="M85 106 L76 124 L56 127 L57 135 L80 136 L94 111 Z" fill="#3b4d5d"/>
          <path d="M64 136 L80 136" stroke="#bac6d1" stroke-width="2"/>
        </g>
        <g class="leg-right">
          <path d="M113 106 L124 124 L146 126 L146 134 L120 136 L105 111 Z" fill="#3b4d5d"/>
          <path d="M123 136 L141 136" stroke="#bac6d1" stroke-width="2"/>
        </g>

        <!-- Body -->
        <path d="M81 72 L106 58 L131 73 L138 109 L108 124 L79 108 Z" fill="url(#shirtG)"/>
        <path d="M95 74 L106 64 L118 75" fill="none" stroke="#c98d14" stroke-width="2"/>
        <path d="M106 64 L106 113" stroke="#cb941b" stroke-width="2"/>
        <path d="M87 83 L97 92 M117 82 L125 89" fill="none" stroke="#cb941b" stroke-width="2"/>

        <!-- Left arm holding button -->
        <path d="M74 81 L51 86 L40 101 L46 106 L62 99 L80 89 Z" fill="#f2c99c"/>
        <g transform="translate(25 99) rotate(-7)">
          <rect x="0" y="0" width="26" height="26" rx="5" fill="url(#silverG)" stroke="#7c8692" stroke-width="2"/>
          <path d="M10 8 L19 13 L10 18 Z" fill="#58646e"/>
        </g>

        <!-- Right arm waving -->
        <g class="wave-arm">
          <path d="M132 79 L153 70 L167 52 L163 46 L146 56 L131 72 Z" fill="#f2c99c"/>
          <path d="M160 47 L170 25 L177 27 L171 49 Z" fill="#f2c99c"/>
          <path d="M171 27 L178 28 L177 32" fill="none" stroke="#b86638" stroke-width="2"/>
        </g>

        <!-- Head -->
        <path d="M79 38 L99 26 L122 30 L139 46 L138 77 L107 90 L80 79 Z" fill="url(#skinG)"/>

        <!-- Mohawk -->
        <path d="M82 31 L90 12 L99 21 L106 8 L114 22 L122 12 L131 31 L118 34 L109 29 L99 37 L90 33 Z" fill="#d57a2e"/>
        <path d="M89 16 L97 25 L106 18 L114 27 L121 18" fill="none" stroke="#f3a75d" stroke-width="2"/>

        <!-- Face -->
        <path d="M89 49 L96 47 M117 48 L123 50" fill="none" stroke="#643e2b" stroke-width="2.2"/>
        <ellipse cx="96" cy="54" rx="3.2" ry="3.5" fill="#fff"/>
        <ellipse cx="119" cy="54" rx="3.2" ry="3.5" fill="#fff"/>
        <circle cx="96.7" cy="54.7" r="1.2" fill="#2d1f1a"/>
        <circle cx="119.7" cy="54.7" r="1.2" fill="#2d1f1a"/>
        <path d="M104 57 Q107 62 111 58" fill="none" stroke="#ab6d52" stroke-width="2"/>
        <path d="M95 68 Q107 76 119 68" fill="none" stroke="#7c4232" stroke-width="2.4"/>

        <!-- Beard -->
        <path d="M82 60 Q95 78 106 74 Q119 79 132 60 L130 86 Q118 96 106 94 Q93 97 82 88 Z" fill="#b96422"/>
        <path d="M88 64 Q99 73 106 71 Q115 73 124 64" fill="none" stroke="#d8893d" stroke-width="2"/>
        <path d="M88 72 Q98 76 106 75 Q115 76 123 71" fill="none" stroke="#7d3c18" stroke-width="2"/>

        <!-- Right silver button -->
        <g transform="translate(148 99) rotate(8)">
          <rect x="0" y="0" width="26" height="26" rx="5" fill="url(#silverG)" stroke="#7c8692" stroke-width="2"/>
          <path d="M10 8 L19 13 L10 18 Z" fill="#58646e"/>
        </g>

        <!-- Collar -->
        <path d="M95 88 L117 88 L111 97 L101 97 Z" fill="#d09c19"/>
      </g>
    </svg>
  `;

  document.body.appendChild(mascot);
})();

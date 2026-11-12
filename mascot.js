(() => {
  const style = document.createElement("style");
  style.textContent = `
    .runner-mascot {
      --ginger-1: #d8752f;
      --ginger-2: #a64818;
      --skin: #f1caa0;
      --shirt: #f0c847;
      --shirt-deep: #c08900;
      --beard: #b55c1a;
      --silver-1: #dfe4ea;
      --silver-2: #a8b3be;
      --silver-3: #6a7581;
      position: fixed;
      left: 0;
      bottom: max(10px, env(safe-area-inset-bottom));
      width: 160px;
      height: 120px;
      z-index: 900;
      pointer-events: none;
      animation: mascot-run-across 18s linear infinite;
      will-change: transform;
      filter: drop-shadow(0 8px 6px rgba(0,0,0,0.12));
    }
    .runner-mascot svg { width: 100%; height: 100%; overflow: visible; }
    .runner-mascot .mascot-bob { transform-box: fill-box; transform-origin: center bottom; animation: mascot-bob .32s ease-in-out infinite alternate; }
    .runner-mascot .mascot-wave { transform-box: fill-box; transform-origin: 111px 58px; animation: mascot-wave .42s ease-in-out infinite alternate; }
    .runner-mascot .mascot-leg-a { transform-box: fill-box; transform-origin: 63px 95px; animation: mascot-leg-a .26s ease-in-out infinite alternate; }
    .runner-mascot .mascot-leg-b { transform-box: fill-box; transform-origin: 93px 95px; animation: mascot-leg-b .26s ease-in-out infinite alternate; }
    .runner-mascot .mascot-arm-left { transform-box: fill-box; transform-origin: 62px 63px; animation: mascot-arm-left .28s ease-in-out infinite alternate; }
    .runner-mascot .mascot-award-sheen { opacity: .28; }
    @keyframes mascot-run-across { from { transform: translateX(-180px); } to { transform: translateX(calc(100vw + 180px)); } }
    @keyframes mascot-bob { to { translate: 0 -3px; } }
    @keyframes mascot-wave { from { rotate: -20deg; } to { rotate: 20deg; } }
    @keyframes mascot-leg-a { from { rotate: 16deg; } to { rotate: -16deg; } }
    @keyframes mascot-leg-b { from { rotate: -18deg; } to { rotate: 18deg; } }
    @keyframes mascot-arm-left { from { rotate: -8deg; } to { rotate: 10deg; } }
    @media (prefers-reduced-motion: reduce) {
      .runner-mascot { animation: none; left: auto; right: 14px; }
      .runner-mascot .mascot-bob, .runner-mascot .mascot-wave,
      .runner-mascot .mascot-leg-a, .runner-mascot .mascot-leg-b,
      .runner-mascot .mascot-arm-left { animation: none; }
    }
  `;
  document.head.append(style);

  const mascot = document.createElement("div");
  mascot.className = "runner-mascot";
  mascot.setAttribute("aria-hidden", "true");
  mascot.innerHTML = `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <defs>
        <linearGradient id="shirtGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#ffd85b"/>
          <stop offset="1" stop-color="#d79f15"/>
        </linearGradient>
        <linearGradient id="skinGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f7d3a6"/>
          <stop offset="1" stop-color="#dfad7b"/>
        </linearGradient>
        <linearGradient id="silverGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f5f7f9"/>
          <stop offset="0.42" stop-color="#dfe6ec"/>
          <stop offset="1" stop-color="#8f9ba6"/>
        </linearGradient>
      </defs>

      <ellipse cx="81" cy="112" rx="42" ry="5" fill="#14181d" opacity="0.12"/>

      <g class="mascot-bob" stroke="#2d1f15" stroke-linecap="round" stroke-linejoin="round">
        <!-- left leg -->
        <g class="mascot-leg-a">
          <path d="M68 86 L60 101 L41 103 L42 109 L62 110 L75 93 Z" fill="#3c4d5b"/>
          <path d="M54 109 L66 110" stroke="#a7b6c0" stroke-width="2"/>
        </g>

        <!-- right leg -->
        <g class="mascot-leg-b">
          <path d="M86 87 L95 101 L112 101 L112 109 L91 109 L80 94 Z" fill="#3c4d5b"/>
          <path d="M93 109 L106 110" stroke="#a7b6c0" stroke-width="2"/>
        </g>

        <!-- torso -->
        <path d="M66 60 L86 46 L104 60 L111 87 L82 103 L53 88 Z" fill="url(#shirtGrad)"/>
        <path d="M70 63 L86 52 L101 63" fill="none" stroke="#d6a11d" stroke-width="2"/>
        <path d="M81 62 L84 86" stroke="#cf9a18" stroke-width="2"/>
        <path d="M91 65 L100 72" stroke="#cf9a18" stroke-width="2"/>
        <path d="M67 70 L75 78" stroke="#cf9a18" stroke-width="2"/>

        <!-- left arm holding a play button -->
        <g class="mascot-arm-left">
          <path d="M53 66 L39 72 L30 86 L36 91 L51 82 L60 68 Z" fill="#f2c89f"/>
          <g transform="translate(18 76) rotate(-6)">
            <rect x="0" y="0" width="22" height="22" rx="4" fill="url(#silverGrad)" stroke="#7c8a95" stroke-width="2"/>
            <path d="M7 6 L17 11 L7 16 Z" fill="#6a7581"/>
          </g>
        </g>

        <!-- right arm waving -->
        <g class="mascot-wave">
          <path d="M106 62 L119 52 L132 36 L127 31 L112 43 L104 57 Z" fill="#f2c89f"/>
          <path d="M126 33 L133 17 L139 18 L136 31 Z" fill="#f2c89f"/>
          <path d="M131 11 L139 18 L134 22" fill="none" stroke="#b7724b" stroke-width="2"/>
        </g>

        <!-- head -->
        <path d="M63 32 L79 22 L97 25 L107 39 L106 55 L81 66 L60 56 Z" fill="url(#skinGrad)"/>
        <path d="M63 35 L58 23 L67 20 L75 28 Z" fill="#d8752f"/>
        <path d="M108 36 L115 29 L122 33 L117 45 Z" fill="#d8752f"/>

        <!-- mohawk -->
        <path d="M63 27 L68 15 L75 22 L82 10 L89 23 L96 15 L103 27 L91 28 L81 24 L74 31 Z" fill="#d8752f"/>
        <path d="M69 20 L73 30 L80 22 L86 32 L96 20" fill="none" stroke="#f2a75c" stroke-width="2"/>

        <!-- face features -->
        <path d="M69 39 L76 37 M93 38 L100 39" fill="none" stroke="#6c3f2b" stroke-width="2"/>
        <ellipse cx="74" cy="43" rx="2.8" ry="3.2" fill="#fefefe"/>
        <ellipse cx="96" cy="43" rx="2.8" ry="3.2" fill="#fefefe"/>
        <circle cx="74.5" cy="43.5" r="1.1" fill="#2d201b"/>
        <circle cx="96.5" cy="43.5" r="1.1" fill="#2d201b"/>
        <path d="M84 43 L88 49 L84 51" fill="none" stroke="#af6d4d" stroke-width="2"/>
        <path d="M76 51 Q86 58 96 51" fill="none" stroke="#7b4533" stroke-width="2"/>

        <!-- beard -->
        <path d="M66 49 Q76 59 86 55 Q96 59 106 49 L103 67 Q92 74 86 72 Q79 75 68 67 Z" fill="#b55c1a"/>
        <path d="M70 52 Q82 61 86 60 Q92 61 100 52" fill="none" stroke="#d08239" stroke-width="2"/>
        <path d="M69 57 Q76 60 80 58 M92 60 Q98 59 102 56" fill="none" stroke="#8f4217" stroke-width="2"/>

        <!-- second silver play button on right side -->
        <g transform="translate(107 77) rotate(6)">
          <rect x="0" y="0" width="22" height="22" rx="4" fill="url(#silverGrad)" stroke="#7c8a95" stroke-width="2"/>
          <path d="M7 6 L17 11 L7 16 Z" fill="#6a7581"/>
        </g>

        <!-- neck and collar -->
        <path d="M79 60 L90 60 L89 67 L80 68 Z" fill="#f2c89f"/>
        <path d="M69 84 L91 84 L86 90 L74 90 Z" fill="#c68f0d"/>
      </g>
    </svg>
  `;

  document.body.append(mascot);
})();

(() => {
  const style = document.createElement("style");
  style.textContent = `
    .runner-mascot {
      --mascot-ginger: #c65e24;
      position: fixed;
      z-index: 900;
      left: 0;
      bottom: max(10px, env(safe-area-inset-bottom));
      width: 150px;
      height: 118px;
      pointer-events: none;
      animation: mascot-cross-screen 18s linear infinite;
      will-change: transform;
    }
    .runner-mascot svg { width: 100%; height: 100%; overflow: visible; }
    .runner-mascot .mascot-body { transform-box: fill-box; transform-origin: center bottom; animation: mascot-bob .34s ease-in-out infinite alternate; }
    .runner-mascot .mascot-arm { transform-box: fill-box; transform-origin: 12% 18%; animation: mascot-wave .48s ease-in-out infinite alternate; }
    .runner-mascot .mascot-leg-a { transform-box: fill-box; transform-origin: 50% 0; animation: mascot-run-a .34s ease-in-out infinite alternate; }
    .runner-mascot .mascot-leg-b { transform-box: fill-box; transform-origin: 50% 0; animation: mascot-run-b .34s ease-in-out infinite alternate; }
    @keyframes mascot-cross-screen { from { transform: translateX(-170px); } to { transform: translateX(calc(100vw + 170px)); } }
    @keyframes mascot-bob { to { translate: 0 -4px; } }
    @keyframes mascot-wave { from { rotate: -18deg; } to { rotate: 28deg; } }
    @keyframes mascot-run-a { from { rotate: -25deg; } to { rotate: 25deg; } }
    @keyframes mascot-run-b { from { rotate: 25deg; } to { rotate: -25deg; } }
    @media (prefers-reduced-motion: reduce) {
      .runner-mascot { animation: none; left: auto; right: 12px; }
      .runner-mascot .mascot-body, .runner-mascot .mascot-arm,
      .runner-mascot .mascot-leg-a, .runner-mascot .mascot-leg-b { animation: none; }
    }
  `;
  document.head.append(style);

  const mascot = document.createElement("div");
  mascot.className = "runner-mascot";
  mascot.setAttribute("aria-hidden", "true");
  mascot.innerHTML = `
    <svg viewBox="0 0 160 125" role="presentation" xmlns="http://www.w3.org/2000/svg">
      <g class="mascot-body" stroke="#34261f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <!-- Legs -->
        <g class="mascot-leg-a"><path d="M72 91 65 108l-14 3" fill="none"/><path d="m50 111 15 1" fill="none" stroke-width="5"/></g>
        <g class="mascot-leg-b"><path d="M91 91 98 107l13 4" fill="none"/><path d="m109 111 13 1" fill="none" stroke-width="5"/></g>
        <!-- Shirt and body -->
        <path d="m62 57-10 34q22 12 46 0L87 57" fill="#e5b82a"/>
        <!-- Head, ears, and face -->
        <path d="M61 35q0-22 20-22t20 22v13q0 18-20 18T61 48z" fill="#f2c49b"/>
        <path d="M61 39q-8-2-7 6t8 5m39-11q8-2 7 6t-8 5" fill="#f2c49b"/>
        <!-- Ginger mohawk -->
        <path d="M63 32 67 18l7 7 6-16 7 16 8-11 5 19q-17-7-30 1z" fill="var(--mascot-ginger)"/>
        <!-- Beard -->
        <path d="M64 46q7 5 17 2 10 3 17-2l-3 13q-5 10-14 10T67 59z" fill="var(--mascot-ginger)"/>
        <path d="M72 45v1m17-1v1" fill="none" stroke-width="4"/>
        <path d="M75 41q6 4 12 0" fill="none" stroke-width="2"/>
        <!-- Two silver creator awards -->
        <g transform="rotate(-8 44 78)">
          <rect x="16" y="60" width="27" height="32" rx="3" fill="#d9dee4"/>
          <rect x="20" y="64" width="19" height="23" rx="2" fill="#f6f7f8" stroke="#9da6af" stroke-width="1.5"/>
          <path d="m26 70 8 5-8 5z" fill="#9da6af" stroke="none"/>
          <text x="29.5" y="91" fill="#5b6570" stroke="none" font-size="4" text-anchor="middle" font-family="sans-serif">SILVER</text>
        </g>
        <g transform="rotate(7 118 78)">
          <rect x="112" y="60" width="27" height="32" rx="3" fill="#d9dee4"/>
          <rect x="116" y="64" width="19" height="23" rx="2" fill="#f6f7f8" stroke="#9da6af" stroke-width="1.5"/>
          <path d="m122 70 8 5-8 5z" fill="#9da6af" stroke="none"/>
          <text x="125.5" y="91" fill="#5b6570" stroke="none" font-size="4" text-anchor="middle" font-family="sans-serif">SILVER</text>
        </g>
        <!-- Waving arm -->
        <g class="mascot-arm">
          <path d="m91 62 12-10 4-15" fill="none" stroke-width="7"/>
          <path d="M106 39q-4-7 0-10m1 9q2-8 7-8m-8 11q6-6 10-3" fill="none" stroke-width="3"/>
        </g>
      </g>
    </svg>`;
  document.body.append(mascot);
})();

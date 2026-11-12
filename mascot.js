(() => {
  const id = "got-mascot-style";
  if (document.getElementById(id) || document.querySelector(".runner-mascot")) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    .runner-mascot {
      position: fixed;
      left: 0;
      bottom: max(10px, env(safe-area-inset-bottom));
      width: 184px;
      height: 142px;
      z-index: 900;
      pointer-events: none;
      animation: got-mascot-cross 20s linear infinite;
      will-change: transform;
      filter: drop-shadow(0 5px 5px rgba(0,0,0,.15));
    }
    .runner-mascot svg { display:block; width:100%; height:100%; overflow:visible; }
    .runner-mascot .mascot-bob { transform-box:fill-box; transform-origin:center bottom; animation:got-mascot-bob .28s ease-in-out infinite alternate; }
    .runner-mascot .mascot-head { transform-box:fill-box; transform-origin:50% 88%; animation:got-mascot-head .9s ease-in-out infinite alternate; }
    .runner-mascot .mascot-wave { transform-box:view-box; transform-origin:139px 61px; animation:got-mascot-wave .42s ease-in-out infinite alternate; }
    .runner-mascot .mascot-left-leg { transform-box:view-box; transform-origin:91px 116px; animation:got-mascot-leg-a .27s ease-in-out infinite alternate; }
    .runner-mascot .mascot-right-leg { transform-box:view-box; transform-origin:111px 116px; animation:got-mascot-leg-b .27s ease-in-out infinite alternate; }
    .runner-mascot .mascot-award { transform-box:view-box; transform-origin:81px 84px; animation:got-mascot-award .32s ease-in-out infinite alternate; }
    .runner-mascot .mouth-open { transform-box:fill-box; transform-origin:center top; animation:got-mascot-talk .42s ease-in-out infinite alternate; }
    .runner-mascot .pupil { transform-box:fill-box; transform-origin:center; animation:got-mascot-look 2.8s ease-in-out infinite; }
    @keyframes got-mascot-cross { from { transform:translateX(-210px); } to { transform:translateX(calc(100vw + 210px)); } }
    @keyframes got-mascot-bob { to { translate:0 -3px; } }
    @keyframes got-mascot-head { from { rotate:-2deg; } to { rotate:2deg; } }
    @keyframes got-mascot-wave { from { rotate:-19deg; } to { rotate:18deg; } }
    @keyframes got-mascot-leg-a { from { rotate:17deg; } to { rotate:-17deg; } }
    @keyframes got-mascot-leg-b { from { rotate:-17deg; } to { rotate:17deg; } }
    @keyframes got-mascot-award { from { rotate:-3deg; } to { rotate:3deg; } }
    @keyframes got-mascot-talk { from { scale:1 .35; } to { scale:1 1; } }
    @keyframes got-mascot-look { 0%,42%,48%,100% { translate:0 0; } 45% { translate:1px 0; } }
    @media (prefers-reduced-motion:reduce) {
      .runner-mascot { animation:none; left:auto; right:12px; }
      .runner-mascot * { animation:none !important; }
    }
  `;
  document.head.append(style);

  const mascot = document.createElement("div");
  mascot.className = "runner-mascot";
  mascot.setAttribute("aria-hidden", "true");
  mascot.innerHTML = `
    <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <defs>
        <linearGradient id="got-shirt" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe16a"/><stop offset="1" stop-color="#d9a51c"/></linearGradient>
        <linearGradient id="got-skin" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#ffdbb0"/><stop offset="1" stop-color="#d99a68"/></linearGradient>
        <linearGradient id="got-ginger" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ed9a4c"/><stop offset=".55" stop-color="#c75b20"/><stop offset="1" stop-color="#8d3919"/></linearGradient>
        <linearGradient id="got-silver" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".45" stop-color="#dce3e9"/><stop offset="1" stop-color="#8995a0"/></linearGradient>
      </defs>

      <g class="mascot-bob" stroke="#34251e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="101" cy="139" rx="41" ry="5" fill="#17202a" opacity=".14" stroke="none"/>

        <!-- Legs attach underneath the shorts; thighs remain visibly connected during the stride. -->
        <path d="M82 103 Q92 109 101 104 L100 117 L86 121 Z" fill="#354759"/>
        <path d="M102 104 Q111 108 121 102 L123 117 L108 121 Z" fill="#354759"/>
        <g class="mascot-left-leg">
          <path d="M91 115 Q91 123 83 130 L68 132 L68 137 L90 138 Q96 135 100 122 L101 115 Z" fill="#3d5265"/>
          <path d="M69 132 Q65 135 67 140 L91 141 Q95 140 92 137 L86 133 Z" fill="#f5f6f7"/>
          <path d="M69 138 L91 139 M77 134 L81 138" fill="none" stroke="#9aa8b4" stroke-width="1.5"/>
        </g>
        <g class="mascot-right-leg">
          <path d="M111 115 Q113 123 121 129 L137 130 L140 135 L118 139 Q111 135 105 122 L104 115 Z" fill="#3d5265"/>
          <path d="M136 130 Q143 130 147 135 Q148 139 143 140 L118 140 Q115 138 119 135 L126 131 Z" fill="#f5f6f7"/>
          <path d="M121 138 L145 138 M132 133 L135 137" fill="none" stroke="#9aa8b4" stroke-width="1.5"/>
        </g>

        <!-- Compact shirt and shoulders -->
        <path d="M76 69 Q83 62 91 61 L111 61 Q121 63 128 70 L139 102 Q123 113 102 113 Q82 112 66 103 Z" fill="url(#got-shirt)"/>
        <path d="M91 63 Q101 75 112 63" fill="none" stroke="#fff0ad" stroke-width="2"/>
        <path d="M102 74 L102 105 M79 79 L72 94 M123 78 L132 94" fill="none" stroke="#c58f16" stroke-width="1.5" opacity=".85"/>
        <path d="M94 82 L100 87 L94 91 M109 82 L103 87 L109 91" fill="none" stroke="#fff0ad" stroke-width="1.5"/>
        <path d="M91 109 Q102 114 114 109" fill="none" stroke="#896218" stroke-width="2"/>

        <!-- Left arm joins the shoulder and grips the first medal. -->
        <path d="M76 73 Q69 70 65 78 L56 91 Q52 97 58 101 L64 97 L75 86 Q80 82 84 80 Z" fill="url(#got-skin)"/>
        <path d="M70 77 Q67 83 62 89" fill="none" stroke="#f9dfc1" stroke-width="2"/>
        <g class="mascot-award">
          <path d="M62 91 Q65 94 67 99" fill="none" stroke="#c88658" stroke-width="3"/>
          <g transform="translate(31 84) rotate(-8 18 20)">
            <rect x="3" y="3" width="34" height="39" rx="4" fill="#77838e"/>
            <rect x="0" y="0" width="34" height="39" rx="4" fill="url(#got-silver)" stroke="#687580" stroke-width="2"/>
            <rect x="4" y="4" width="26" height="29" rx="2" fill="#f8fafc" stroke="#aab4bd" stroke-width="1"/>
            <path d="M13 10 L24 18.5 L13 27 Z" fill="#929da7"/>
            <path d="M5 5 H27" stroke="#fff" stroke-width="1.5" opacity=".9"/>
            <path d="M8 36 L13 42 L18 37 L23 42 L28 36" fill="#c0c8ce" stroke="#7c8791" stroke-width="1"/>
            <text x="17" y="32" fill="#65717b" stroke="none" font-size="4.2" font-weight="700" text-anchor="middle" font-family="Arial,sans-serif">SILVER</text>
          </g>
          <!-- Fingers visibly curl over the award edge. -->
          <path d="M58 96 Q64 92 69 98 M57 100 Q63 97 68 102 M59 104 Q64 102 68 106" fill="none" stroke="#efbd91" stroke-width="2.2"/>
        </g>

        <!-- Neck -->
        <path d="M91 54 L114 54 L112 68 Q102 75 92 67 Z" fill="url(#got-skin)"/>

        <!-- Head, with ears and a friendly forward-facing expression. -->
        <g class="mascot-head">
          <path d="M78 32 Q80 18 100 17 Q122 17 128 34 L126 55 Q123 70 104 73 Q84 71 78 57 Z" fill="url(#got-skin)"/>
          <path d="M78 42 Q69 39 70 48 Q71 56 80 55 M126 41 Q135 39 134 48 Q133 56 125 55" fill="url(#got-skin)"/>
          <path d="M74 47 Q78 44 80 49 M130 47 Q127 44 125 49" fill="none" stroke="#b87855" stroke-width="1.5"/>

          <!-- Ginger mohawk: one bold silhouette with separate combed locks. -->
          <path d="M79 34 L78 21 L86 23 L91 8 L99 20 L106 4 L113 20 L121 11 L124 28 L130 35 Q116 29 104 32 Q91 29 79 37 Z" fill="url(#got-ginger)"/>
          <path d="M82 26 L88 31 L94 17 L101 29 L107 13 L113 29 L121 19" fill="none" stroke="#f5b36f" stroke-width="2"/>
          <path d="M81 36 Q88 30 95 33 M111 32 Q119 29 126 36" fill="none" stroke="#843719" stroke-width="2"/>

          <!-- Brows and eyes; pupils glance toward the viewer. -->
          <path d="M85 41 Q91 37 97 41 M109 40 Q116 37 121 42" fill="none" stroke="#603b2d" stroke-width="2.4"/>
          <ellipse cx="92" cy="47" rx="4" ry="4.8" fill="#fff" stroke="#754b35" stroke-width=".8"/>
          <ellipse cx="115" cy="47" rx="4" ry="4.8" fill="#fff" stroke="#754b35" stroke-width=".8"/>
          <g class="pupil" fill="#352820" stroke="none"><ellipse cx="93" cy="48" rx="1.8" ry="2.7"/><ellipse cx="116" cy="48" rx="1.8" ry="2.7"/></g>
          <circle cx="93.5" cy="47" r=".75" fill="#fff" stroke="none"/><circle cx="116.5" cy="47" r=".75" fill="#fff" stroke="none"/>
          <path d="M103 48 Q100 56 105 57 Q108 57 109 54" fill="none" stroke="#b97856" stroke-width="1.8"/>
          <ellipse cx="84" cy="56" rx="4" ry="2" fill="#e99683" opacity=".34" stroke="none"/>
          <ellipse cx="123" cy="56" rx="4" ry="2" fill="#e99683" opacity=".34" stroke="none"/>

          <!-- Beard frames, rather than covers, the moving mouth. -->
          <path d="M79 52 Q84 53 89 56 Q95 60 102 59 Q109 61 116 56 Q122 53 127 51 L125 64 Q121 73 111 77 L104 83 L97 77 Q86 74 81 65 Z" fill="url(#got-ginger)"/>
          <path d="M82 56 Q89 60 95 59 M111 59 Q118 59 124 55" fill="none" stroke="#f0a25a" stroke-width="2"/>
          <path d="M84 64 Q90 67 95 65 M114 66 Q119 65 122 62 M91 71 Q96 73 99 72 M109 72 Q114 70 117 68" fill="none" stroke="#8f3e19" stroke-width="1.5" opacity=".9"/>
          <path d="M95 60 Q103 63 112 60 L111 67 Q104 71 97 67 Z" fill="#71382d" stroke="none"/>
          <path class="mouth-open" d="M99 62 Q104 64 109 62 L108 66 Q104 69 100 66 Z" fill="#4c2020" stroke="none"/>
          <path d="M99 62 Q104 64 109 62" fill="none" stroke="#fff1dc" stroke-width="1.1"/>
        </g>

        <!-- Waving arm is attached to shoulder; hand is a clear open wave. -->
        <path d="M127 72 Q134 67 139 75 L145 85" fill="none" stroke="#d7a31c" stroke-width="13"/>
        <g class="mascot-wave">
          <path d="M140 85 Q146 80 149 73 L154 61" fill="none" stroke="url(#got-skin)" stroke-width="9"/>
          <path d="M152 64 Q149 56 152 50 Q154 47 156 51 L158 60 Q160 52 164 51 Q167 51 165 56 L162 65 Q168 59 171 62 Q173 64 169 68 L164 74 Q159 79 152 75 L147 71" fill="url(#got-skin)"/>
          <path d="M154 53 L156 61 M163 54 L160 63 M169 63 L164 68" fill="none" stroke="#bd805b" stroke-width="1.2"/>
        </g>

        <!-- Second award held against the right hip: ribbon/strap connects it to the hand. -->
        <path d="M129 91 Q139 94 148 101" fill="none" stroke="#d6a11c" stroke-width="5"/>
        <g transform="translate(137 98) rotate(7 17 20)">
          <path d="M7 0 L17 8 L27 0 L24 12 L10 12 Z" fill="#c84545" stroke="#843737" stroke-width="1"/>
          <rect x="2" y="10" width="31" height="35" rx="4" fill="#77838e"/>
          <rect x="0" y="8" width="31" height="35" rx="4" fill="url(#got-silver)" stroke="#687580" stroke-width="2"/>
          <rect x="4" y="12" width="23" height="25" rx="2" fill="#f8fafc" stroke="#aab4bd" stroke-width="1"/>
          <path d="M11 17 L21 24.5 L11 32 Z" fill="#929da7"/>
          <path d="M5 13 H24" stroke="#fff" stroke-width="1.4" opacity=".9"/>
          <path d="M7 40 L11 45 L16 41 L21 45 L26 40" fill="#c0c8ce" stroke="#7c8791" stroke-width="1"/>
          <text x="15.5" y="36" fill="#65717b" stroke="none" font-size="4" font-weight="700" text-anchor="middle" font-family="Arial,sans-serif">SILVER</text>
        </g>
      </g>
    </svg>`;

  document.body.appendChild(mascot);
})();

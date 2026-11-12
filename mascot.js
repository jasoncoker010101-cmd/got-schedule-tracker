(() => {
  if (document.querySelector('.runner-mascot')) return;

  const style = document.createElement('style');
  style.textContent = `
    .runner-mascot {
      --mascot-gold: #e7b727;
      --mascot-gold-deep: #b97920;
      --mascot-ginger: #d7792d;
      --mascot-ginger-deep: #8b3d1a;
      --mascot-skin: #f5d3a8;
      --mascot-skin-deep: #d99563;
      --mascot-shirt: #f7d45d;
      --mascot-shirt-deep: #d39d1d;
      --mascot-jacket: #2d3743;
      position: fixed;
      left: 0;
      bottom: max(12px, env(safe-area-inset-bottom));
      width: 200px;
      height: 150px;
      z-index: 1000;
      pointer-events: none;
      animation: mascot-cross 18s linear infinite;
      filter: drop-shadow(0 7px 12px rgba(15,21,25,0.18));
      will-change: transform;
    }
    .runner-mascot svg {
      width: 100%;
      height: 100%;
      display: block;
      overflow: visible;
    }
    .runner-mascot .mascot-body {
      transform-box: fill-box;
      transform-origin: center bottom;
      animation: mascot-bob 0.38s ease-in-out infinite alternate;
    }
    .runner-mascot .mascot-head {
      transform-box: fill-box;
      transform-origin: 50% 70%;
      animation: mascot-head 1.2s ease-in-out infinite alternate;
    }
    .runner-mascot .mascot-wave {
      transform-box: fill-box;
      transform-origin: 74% 42%;
      animation: mascot-wave 0.42s ease-in-out infinite alternate;
    }
    .runner-mascot .mascot-left-leg {
      transform-box: fill-box;
      transform-origin: 50% 8%;
      animation: mascot-left-leg 0.24s ease-in-out infinite alternate;
    }
    .runner-mascot .mascot-right-leg {
      transform-box: fill-box;
      transform-origin: 50% 8%;
      animation: mascot-right-leg 0.24s ease-in-out infinite alternate;
    }
    .runner-mascot .mascot-award {
      transform-box: fill-box;
      transform-origin: center;
      animation: mascot-award 0.35s ease-in-out infinite alternate;
    }
    .runner-mascot .eye {
      animation: mascot-blink 5s ease-in-out infinite;
      transform-origin: center center;
    }
    .runner-mascot .mouth {
      animation: mascot-mouth 0.45s ease-in-out infinite alternate;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes mascot-cross {
      from { transform: translateX(-230px); }
      to { transform: translateX(calc(100vw + 250px)); }
    }
    @keyframes mascot-bob {
      from { transform: translateY(0); }
      to { transform: translateY(-4px); }
    }
    @keyframes mascot-head {
      from { transform: rotate(-2deg); }
      to { transform: rotate(2deg); }
    }
    @keyframes mascot-wave {
      from { transform: rotate(-18deg); }
      to { transform: rotate(18deg); }
    }
    @keyframes mascot-left-leg {
      from { transform: rotate(18deg); }
      to { transform: rotate(-18deg); }
    }
    @keyframes mascot-right-leg {
      from { transform: rotate(-18deg); }
      to { transform: rotate(18deg); }
    }
    @keyframes mascot-award {
      from { transform: rotate(-4deg); }
      to { transform: rotate(4deg); }
    }
    @keyframes mascot-blink {
      0%, 44%, 48%, 100% { transform: scaleY(1); }
      46% { transform: scaleY(0.1); }
    }
    @keyframes mascot-mouth {
      from { transform: scaleY(0.6); }
      to { transform: scaleY(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .runner-mascot { animation: none; left: auto; right: 18px; }
      .runner-mascot .mascot-body,
      .runner-mascot .mascot-head,
      .runner-mascot .mascot-wave,
      .runner-mascot .mascot-left-leg,
      .runner-mascot .mascot-right-leg,
      .runner-mascot .mascot-award,
      .runner-mascot .eye,
      .runner-mascot .mouth { animation: none !important; }
    }
  `;
  document.head.appendChild(style);

  const mascot = document.createElement('div');
  mascot.className = 'runner-mascot';
  mascot.setAttribute('aria-hidden', 'true');
  mascot.innerHTML = `
    <svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <defs>
        <linearGradient id="m-shirt" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#ffe47a"/>
          <stop offset="1" stop-color="#d59c18"/>
        </linearGradient>
        <linearGradient id="m-skin" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f6d7ad"/>
          <stop offset="1" stop-color="#d98f5d"/>
        </linearGradient>
        <linearGradient id="m-ginger" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#efb165"/>
          <stop offset="0.45" stop-color="#d7772f"/>
          <stop offset="1" stop-color="#8a3c19"/>
        </linearGradient>
        <linearGradient id="m-silver" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.52" stop-color="#dfe7ee"/>
          <stop offset="1" stop-color="#8e9aa5"/>
        </linearGradient>
      </defs>

      <g class="mascot-body" stroke="#2f241f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="110" cy="141" rx="42" ry="5" fill="#1a2129" opacity="0.14"/>

        <!-- left leg -->
        <g class="mascot-left-leg">
          <path d="M84 107 L90 116 L82 130 L66 133 L64 141 L86 142 L100 121 L100 107 Z" fill="#355264"/>
          <path d="M68 138 L90 140" stroke="#dfeaf0" stroke-width="1.8"/>
        </g>

        <!-- right leg -->
        <g class="mascot-right-leg">
          <path d="M111 107 L119 116 L131 128 L146 130 L149 138 L124 141 L106 122 L106 107 Z" fill="#355264"/>
          <path d="M128 139 L146 139" stroke="#dfeaf0" stroke-width="1.8"/>
        </g>

        <!-- body -->
        <path d="M73 67 Q85 59 99 60 L119 60 Q134 61 145 70 L153 100 Q141 115 109 118 Q84 117 69 105 Z" fill="url(#m-shirt)"/>
        <path d="M86 69 Q98 77 111 69" fill="none" stroke="#f8eaab" stroke-width="2"/>
        <path d="M84 82 Q102 90 121 82" fill="none" stroke="#d39f17" stroke-width="2"/>
        <path d="M98 68 L103 68 L103 112 L98 112 Z" fill="#d6a319" opacity="0.85"/>

        <!-- left arm attached to body -->
        <path d="M74 72 Q66 76 60 88 L54 95 Q50 101 56 104 L66 101 L81 86 Z" fill="url(#m-skin)"/>
        <path d="M58 98 Q63 96 69 101" fill="none" stroke="#f3cf9d" stroke-width="2"/>

        <!-- right arm attached to body -->
        <path d="M144 74 Q152 75 159 86 L166 95 Q170 100 164 104 L154 101 L139 86 Z" fill="url(#m-skin)"/>
        <path d="M159 98 Q153 97 148 101" fill="none" stroke="#f3cf9d" stroke-width="2"/>

        <!-- left award/prop -->
        <g class="mascot-award" transform="translate(32 79) rotate(-10)">
          <rect x="2" y="2" width="34" height="39" rx="5" fill="url(#m-silver)" stroke="#6d7a85" stroke-width="2"/>
          <rect x="6" y="6" width="26" height="29" rx="3" fill="#f7fbff" stroke="#aebbc4" stroke-width="1.2"/>
          <path d="M14 13 L25 19.5 L14 26 Z" fill="#95a0ab"/>
          <text x="19" y="34" fill="#5a6975" font-size="4.2" font-weight="700" text-anchor="middle" font-family="Arial,sans-serif">SILVER</text>
        </g>

        <!-- right award/prop -->
        <g class="mascot-award" transform="translate(145 81) rotate(12)">
          <rect x="2" y="2" width="34" height="39" rx="5" fill="url(#m-silver)" stroke="#6d7a85" stroke-width="2"/>
          <rect x="6" y="6" width="26" height="29" rx="3" fill="#f7fbff" stroke="#aebbc4" stroke-width="1.2"/>
          <path d="M14 13 L25 19.5 L14 26 Z" fill="#95a0ab"/>
          <text x="19" y="34" fill="#5a6975" font-size="4.2" font-weight="700" text-anchor="middle" font-family="Arial,sans-serif">SILVER</text>
        </g>

        <!-- neck -->
        <path d="M94 52 L122 52 L118 66 L100 68 Z" fill="url(#m-skin)"/>

        <g class="mascot-head">
          <path d="M82 29 Q96 13 114 15 Q130 17 139 33 L136 63 Q129 78 109 83 Q88 81 80 66 Z" fill="url(#m-skin)"/>

          <!-- mohawk -->
          <path d="M81 32 L87 18 L94 22 L99 8 L106 20 L113 10 L121 24 L127 31 L118 31 L108 26 L101 36 L92 31 Z" fill="url(#m-ginger)"/>
          <path d="M86 25 L94 29 L101 16 L109 28 L118 19" fill="none" stroke="#f4c287" stroke-width="2"/>

          <!-- eyes -->
          <path d="M90 40 Q95 36 100 41 M116 40 Q120 36 125 41" fill="none" stroke="#643e2b" stroke-width="2.4"/>
          <g class="eye">
            <ellipse cx="95" cy="47" rx="4.2" ry="5" fill="#fff" stroke="#6b442e" stroke-width="0.8"/>
            <ellipse cx="120" cy="47" rx="4.2" ry="5" fill="#fff" stroke="#6b442e" stroke-width="0.8"/>
            <circle cx="95.8" cy="47" r="1.8" fill="#2b201d"/>
            <circle cx="120.8" cy="47" r="1.8" fill="#2b201d"/>
          </g>

          <!-- nose and mouth -->
          <path d="M103 49 Q107 56 111 49" fill="none" stroke="#8b5a3d" stroke-width="2"/>
          <path class="mouth" d="M97 59 Q106 67 115 59 L112 65 Q106 69 101 64 Z" fill="#5d2b2f"/>
          <path d="M94 57 Q106 60 117 57" fill="none" stroke="#e7a57a" stroke-width="1.6" opacity="0.7"/>

          <!-- beard -->
          <path d="M84 56 Q91 63 99 64 Q107 66 115 63 Q122 62 129 56 L127 76 Q118 86 108 88 Q98 89 88 86 Q83 81 80 74 Z" fill="url(#m-ginger)"/>
          <path d="M88 60 Q97 68 106 66 Q115 68 124 59" fill="none" stroke="#f1b86d" stroke-width="2"/>
          <path d="M89 71 Q98 76 106 75 Q114 76 123 70" fill="none" stroke="#8b3d1a" stroke-width="2"/>
        </g>

        <!-- waving arm -->
        <g class="mascot-wave">
          <path d="M145 72 Q156 67 167 72 L172 86 Q177 95 169 101 L156 96 Q147 88 144 78 Z" fill="url(#m-skin)"/>
          <path d="M168 96 Q176 90 181 93 Q183 96 179 100 L170 108 Q166 111 162 108 Q159 104 159 99 Z" fill="url(#m-skin)"/>
          <path d="M168 92 Q162 88 158 91" fill="none" stroke="#d8a171" stroke-width="2"/>
          <path d="M176 95 Q179 90 184 90" fill="none" stroke="#d8a171" stroke-width="2"/>
        </g>
      </g>
    </svg>
  `;

  document.body.appendChild(mascot);
})();

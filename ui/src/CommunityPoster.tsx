// Original vector fallback, also used while the local WebGL module loads.
export function CommunityPoster() {
  return (
    <svg className="community-poster" viewBox="0 0 640 520" aria-hidden="true">
      <defs>
        <linearGradient id="land" x2="0" y2="1">
          <stop stopColor="#c4d3b8" />
          <stop offset="1" stopColor="#a6bea0" />
        </linearGradient>
      </defs>
      <ellipse cx="320" cy="405" rx="245" ry="49" fill="#285e580b" />
      <ellipse cx="320" cy="333" rx="245" ry="94" fill="#d9dfc5" />
      <ellipse cx="320" cy="316" rx="245" ry="94" fill="url(#land)" />
      <ellipse
        cx="320"
        cy="310"
        rx="148"
        ry="55"
        fill="none"
        stroke="#ece9d7"
        strokeWidth="20"
      />
      {[
        [145, 255],
        [490, 252],
        [230, 211],
      ].map(([x, y], i) => (
        <g key={i}>
          <path
            d={`M${x} ${y + 53}v-90`}
            stroke="#806b50"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <ellipse
            cx={x}
            cy={y - 33}
            rx="35"
            ry="46"
            fill={i % 2 ? "#8ca77a" : "#64866a"}
          />
        </g>
      ))}
      <path
        d="M281 294l26-33 39 10 24 31"
        fill="none"
        stroke="#bb8a68"
        strokeWidth="13"
        strokeLinecap="round"
      />
      {[
        [250, 313, "#285e58"],
        [324, 285, "#8caa96"],
        [397, 315, "#667d86"],
        [327, 355, "#a1ad8a"],
      ].map(([x, y, color], i) => (
        <g key={i}>
          <path
            d={`M${x} ${Number(y) + 9}v30m-6 0v23m13-23v23`}
            stroke={String(color)}
            strokeWidth="15"
            strokeLinecap="round"
          />
          <circle cx={Number(x)} cy={Number(y) - 13} r="13" fill="#c09673" />
          <path
            d={`M${Number(x) - 8} ${Number(y) + 9}l-31 9m46-9l31 9`}
            stroke="#c09673"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </g>
      ))}
      <path d="M318 312v-56" stroke="#806b50" strokeWidth="6" />
      <ellipse cx="318" cy="249" rx="25" ry="31" fill="#64866a" />
    </svg>
  );
}

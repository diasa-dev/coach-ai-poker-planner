// Uplinea — inline icon set. Two collections:
//
//  • Icon          → utility icons used in operational chrome (sidebar, buttons,
//                    timeline, attention rows). Stroke 1.75, navy/current colour.
//  • BrandIcon     → proprietary support icons from the brand guide
//                    (Foco / Plano / Disciplina / Performance / Review /
//                    Accountability). Used in section headers, empty states,
//                    onboarding, brand pages — never for dense UI rows.
//
// Both follow the same construction language: 1.75 stroke, round joins, navy
// outline + a single teal accent in the focal area. They share a 48x48 grid for
// brand icons and 24x24 for utility icons.

const _utilSvg = (d) => (props = {}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={props.sw || 1.75} strokeLinecap="round" strokeLinejoin="round"
       width={props.size || 18} height={props.size || 18}
       style={props.style} className={props.className}>
    {d}
  </svg>
);

const Icon = {
  Sun:        _utilSvg(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></>),
  Calendar:   _utilSvg(<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>),
  Target:     _utilSvg(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></>),
  Spade:      _utilSvg(<path d="M12 3c2 4 6 6 6 10.5 0 3.6-3.5 5-5.5 3.5.5 1.5 2 3 3.5 4h-8c1.5-1 3-2.5 3.5-4-2 1.5-5.5.1-5.5-3.5C6 9 10 7 12 3z"/>),
  Book:       _utilSvg(<><path d="M2 4a2 2 0 0 1 2-2h6v18H4a2 2 0 0 1-2-2z"/><path d="M22 4a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z"/></>),
  Message:    _utilSvg(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h6"/></>),
  Sparkles:   _utilSvg(<><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-4.9 3.6 1.9-5.8L4 8.8h6.1z"/></>),
  Settings:   _utilSvg(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>),
  Play:       _utilSvg(<path d="M5 3l14 9-14 9V3z"/>),
  Stop:       _utilSvg(<rect x="6" y="6" width="12" height="12" rx="2"/>),
  Plus:       _utilSvg(<path d="M12 5v14M5 12h14"/>),
  Check:      _utilSvg(<path d="M5 12l5 5 9-11"/>),
  X:          _utilSvg(<path d="M18 6L6 18M6 6l12 12"/>),
  Arrow:      _utilSvg(<path d="M5 12h14M13 5l7 7-7 7"/>),
  ArrowDown:  _utilSvg(<path d="M12 5v14M5 13l7 7 7-7"/>),
  More:       _utilSvg(<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>),
  Bell:       _utilSvg(<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>),
  Moon:       _utilSvg(<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>),
  Search:     _utilSvg(<><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></>),
  Edit:       _utilSvg(<><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></>),
  Trash:      _utilSvg(<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></>),
  Clock:      _utilSvg(<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>),
  Hand:       _utilSvg(<><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 11V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7 7 7 0 0 1-7-7v-2a1.5 1.5 0 0 1 3 0v1"/></>),
  Note:       _utilSvg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>),
  Pulse:      _utilSvg(<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>),
  Users:      _utilSvg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>),
  Trend:      _utilSvg(<><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>),
  Shield:     _utilSvg(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>),
  Battery:    _utilSvg(<><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></>),
  Brain:      _utilSvg(<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/>),
  Flag:       _utilSvg(<><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></>),
  Coffee:     _utilSvg(<><path d="M18 8h1a3 3 0 0 1 0 6h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><path d="M6 1v3M10 1v3M14 1v3"/></>),
  Run:        _utilSvg(<><circle cx="13" cy="4" r="2"/><path d="M4 22l4-9 4 4 1-5 5 4M14 13l-3 3"/></>),
  Lock:       _utilSvg(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  Dot:        _utilSvg(<circle cx="12" cy="12" r="4" fill="currentColor"/>),
  Question:   _utilSvg(<><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.8.8-2 1.2-2 2.5"/><circle cx="12" cy="17" r=".7" fill="currentColor"/></>),
  Pause:      _utilSvg(<><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></>),
  Refresh:    _utilSvg(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
  Logo:       (props = {}) => (
    <svg viewBox="0 0 200 200" fill="none" width={props.size || 20} height={props.size || 20} style={props.style}>
      <rect x="14" y="120" width="32" height="68" rx="16" fill={props.colour || '#0B1D3D'}/>
      <rect x="58" y="78" width="32" height="110" rx="16" fill={props.colour || '#1D4EDB'}/>
      <path d="M118 28 a16 16 0 0 1 32 0 V 124 L 134 144 L 118 124 Z" fill={props.colour || '#06B6C4'}/>
      <path d="M 134 96 C 134 108, 116 116, 108 130 C 100 144, 102 158, 114 162 C 124 165, 132 160, 134 152 C 134 158, 132 168, 124 174 L 144 174 C 136 168, 134 158, 134 152 C 136 160, 144 165, 154 162 C 166 158, 168 144, 160 130 C 152 116, 134 108, 134 96 Z" fill={props.colour || '#0B1D3D'}/>
    </svg>
  ),
};

// ---------- BRAND SUPPORT ICONS ---------------------------------------------
// Mirror /assets/icons/*.svg. Inline so React components can colour them.
// Default: navy outline + teal accent. Pass `mono` to render single-tone.

const _brandWrap = (children) => ({ size = 28, mono = false, accent = '#06B6C4', style, className } = {}) => (
  <svg viewBox="0 0 48 48" width={size} height={size} fill="none" style={style} className={className}
       data-mono={mono ? '1' : undefined}>
    {children({ navy: 'currentColor', accent: mono ? 'currentColor' : accent })}
  </svg>
);

const BrandIcon = {
  Foco: _brandWrap(({ navy, accent }) => (
    <g stroke={navy} strokeWidth="1.75" strokeLinecap="round">
      <circle cx="24" cy="24" r="14"/>
      <circle cx="24" cy="24" r="7"/>
      <circle cx="24" cy="24" r="2.4" fill={accent} stroke="none"/>
      <line x1="24" y1="4" x2="24" y2="11"/>
      <line x1="24" y1="37" x2="24" y2="44"/>
      <line x1="4"  y1="24" x2="11" y2="24"/>
      <line x1="37" y1="24" x2="44" y2="24"/>
    </g>
  )),
  Plano: _brandWrap(({ navy, accent }) => (
    <g stroke={navy} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <rect x="9" y="8" width="30" height="34" rx="3"/>
      <rect x="17" y="4" width="14" height="8" rx="2" fill="#fff"/>
      <rect x="14" y="18" width="6" height="6" rx="1.5"/>
      <path d="M15.4 21 L17 22.4 L19 19.6" stroke={accent}/>
      <line x1="22" y1="21" x2="34" y2="21"/>
      <rect x="14" y="29" width="6" height="6" rx="1.5"/>
      <path d="M15.4 32 L17 33.4 L19 30.6"/>
      <line x1="22" y1="32" x2="32" y2="32"/>
    </g>
  )),
  Disciplina: _brandWrap(({ navy, accent }) => (
    <g stroke={navy} strokeWidth="1.75" strokeLinecap="round" fill="none">
      <rect x="7" y="10" width="34" height="32" rx="3"/>
      <line x1="7" y1="18" x2="41" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="14"/>
      <line x1="33" y1="6" x2="33" y2="14"/>
      <path d="M16 30 L22 35 L33 23" stroke={accent} strokeWidth="2.25" strokeLinejoin="round"/>
    </g>
  )),
  Performance: _brandWrap(({ navy, accent }) => (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="42" x2="42" y2="42" stroke={navy} strokeWidth="1.75"/>
      <line x1="6" y1="42" x2="6"  y2="6"  stroke={navy} strokeWidth="1.75"/>
      <path d="M9 34 C 14 32, 18 30, 22 26 S 30 16, 38 10" stroke="#1D4EDB" strokeWidth="2.25"/>
      <polyline points="32,8 38,10 36,16" stroke="#1D4EDB" strokeWidth="2.25"/>
      <circle cx="22" cy="26" r="2.4" fill={accent}/>
    </g>
  )),
  Review: _brandWrap(({ navy, accent }) => (
    <g stroke={navy} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M8 10 h32 a3 3 0 0 1 3 3 v18 a3 3 0 0 1 -3 3 h-12 l-7 6 v-6 h-13 a3 3 0 0 1 -3 -3 v-18 a3 3 0 0 1 3 -3 z"/>
      <line x1="14" y1="19" x2="34" y2="19"/>
      <line x1="14" y1="25" x2="28" y2="25" stroke={accent}/>
    </g>
  )),
  Accountability: _brandWrap(({ navy, accent }) => (
    <g stroke={navy} strokeWidth="1.75" strokeLinecap="round" fill="none">
      <circle cx="18" cy="16" r="5"/>
      <path d="M8 38 c0 -6 4 -10 10 -10 s10 4 10 10"/>
      <circle cx="34" cy="18" r="4"/>
      <path d="M26 38 c0 -5 3.5 -8 8 -8 s8 3 8 8"/>
      <circle cx="34" cy="18" r="1.5" fill={accent} stroke="none"/>
    </g>
  )),
};

window.Icon = Icon;
window.BrandIcon = BrandIcon;

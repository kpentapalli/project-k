export const HERO = {
  knight: {
    name: 'Knight',
    title: 'IRON KNIGHT',
    rank: 'Champion',
    cloth:  '#c2c3c7',
    cloth2: '#fff7e2',
    plume:  '#ff004d',
    trim:   '#ffa300',
    deep:   '#29366f',
    weapon: 'SWORD · SHIELD',
  },
  queen: {
    name: 'Queen',
    title: 'HIGH QUEEN',
    rank: 'Sovereign',
    cloth:  '#7b2cbf',
    cloth2: '#ffe66d',
    plume:  '#ff004d',
    trim:   '#ffe66d',
    deep:   '#5f0f40',
    weapon: 'RAPIER · ORB',
  },
};

export function KnightSprite({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="15" width="10" height="1" fill="#000" opacity="0.5"/>
      <rect x="5" y="13" width="2" height="2" fill="#c2c3c7"/>
      <rect x="9" y="13" width="2" height="2" fill="#c2c3c7"/>
      <rect x="4" y="10" width="8" height="3" fill="#29366f"/>
      <rect x="4" y="12" width="8" height="1" fill="#ffa300"/>
      <rect x="4" y="7" width="8" height="3" fill="#c2c3c7"/>
      <rect x="4" y="7" width="8" height="1" fill="#fff7e2"/>
      <rect x="7" y="8" width="2" height="2" fill="#ff004d"/>
      <rect x="3" y="7" width="1" height="2" fill="#fff7e2"/>
      <rect x="12" y="7" width="1" height="2" fill="#fff7e2"/>
      <rect x="2" y="9" width="2" height="3" fill="#c2c3c7"/>
      <rect x="12" y="9" width="2" height="3" fill="#c2c3c7"/>
      <rect x="0" y="8" width="2" height="5" fill="#29366f"/>
      <rect x="0" y="10" width="2" height="1" fill="#ffa300"/>
      <rect x="14" y="3" width="1" height="8" fill="#fff7e2"/>
      <rect x="13" y="11" width="3" height="1" fill="#ffa300"/>
      <rect x="6" y="4" width="4" height="3" fill="#f4a261"/>
      <rect x="7" y="5" width="1" height="1" fill="#1d2b53"/>
      <rect x="9" y="5" width="1" height="1" fill="#1d2b53"/>
      <rect x="5" y="2" width="6" height="2" fill="#c2c3c7"/>
      <rect x="5" y="2" width="6" height="1" fill="#fff7e2"/>
      <rect x="7" y="0" width="2" height="2" fill="#ff004d"/>
    </svg>
  );
}

export function QueenSprite({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="15" width="12" height="1" fill="#000" opacity="0.5"/>
      <rect x="3" y="11" width="10" height="4" fill="#7b2cbf"/>
      <rect x="3" y="14" width="10" height="1" fill="#5f0f40"/>
      <rect x="3" y="11" width="10" height="1" fill="#ffe66d"/>
      <rect x="5" y="8" width="6" height="3" fill="#5f0f40"/>
      <rect x="5" y="8" width="6" height="1" fill="#ffe66d"/>
      <rect x="7" y="9" width="2" height="2" fill="#ffe66d"/>
      <rect x="4" y="7" width="1" height="2" fill="#7b2cbf"/>
      <rect x="11" y="7" width="1" height="2" fill="#7b2cbf"/>
      <rect x="3" y="8" width="1" height="3" fill="#7b2cbf"/>
      <rect x="12" y="8" width="1" height="3" fill="#7b2cbf"/>
      <rect x="4" y="9" width="1" height="3" fill="#f4a261"/>
      <rect x="11" y="9" width="1" height="3" fill="#f4a261"/>
      <rect x="13" y="2" width="1" height="9" fill="#fff7e2"/>
      <rect x="12" y="11" width="3" height="1" fill="#ffe66d"/>
      <rect x="2" y="10" width="2" height="2" fill="#ffe66d"/>
      <rect x="6" y="4" width="4" height="3" fill="#f4a261"/>
      <rect x="5" y="5" width="1" height="3" fill="#5f0f40"/>
      <rect x="10" y="5" width="1" height="3" fill="#5f0f40"/>
      <rect x="7" y="5" width="1" height="1" fill="#1d2b53"/>
      <rect x="9" y="5" width="1" height="1" fill="#1d2b53"/>
      <rect x="7" y="6" width="2" height="1" fill="#ff004d"/>
      <rect x="5" y="3" width="6" height="1" fill="#ffe66d"/>
      <rect x="5" y="2" width="1" height="1" fill="#ffe66d"/>
      <rect x="7" y="1" width="1" height="2" fill="#ffe66d"/>
      <rect x="9" y="2" width="1" height="1" fill="#ffe66d"/>
      <rect x="10" y="2" width="1" height="1" fill="#ffe66d"/>
      <rect x="8" y="0" width="1" height="1" fill="#ff004d"/>
    </svg>
  );
}

export function Sprite({ hero, size = 64 }) {
  return hero === 'knight' ? <KnightSprite size={size} /> : <QueenSprite size={size} />;
}

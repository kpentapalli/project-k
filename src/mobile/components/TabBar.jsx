const TABS = [
  { id: 'home',     label: 'TODAY',    icon: '◆' },
  { id: 'workout',  label: 'TRAIN',    icon: '⚔' },
  { id: 'progress', label: 'PROGRESS', icon: '▲' },
  { id: 'profile',  label: 'HERO',     icon: '★' },
];

export default function TabBar({ active, navigate }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 88,
      paddingBottom: 24,
      background: 'rgba(8,8,9,0.92)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderTop: '1px solid var(--pk-border)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      paddingTop: 10,
      zIndex: 100,
    }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => navigate(t.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: t.id === active ? 'var(--pk-acc)' : 'var(--pk-muted)',
            minWidth: 64,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'color var(--pk-dur-fast)',
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
          <span style={{
            fontFamily: 'var(--pk-font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

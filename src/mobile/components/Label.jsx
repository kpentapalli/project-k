export default function Label({ children, color, style = {} }) {
  return (
    <span style={{
      fontFamily: 'var(--pk-font-mono)',
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: color ?? 'var(--pk-muted)',
      ...style,
    }}>
      {children}
    </span>
  );
}

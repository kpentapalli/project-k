import Label from './Label';

export default function Stat({ v, l, acc }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: 'var(--pk-font-display)',
        fontSize: 22,
        fontWeight: 800,
        lineHeight: 1,
        color: acc ? 'var(--pk-acc)' : 'var(--pk-text)',
        letterSpacing: '-0.01em',
      }}>{v}</div>
      <Label style={{ marginTop: 3, display: 'block' }}>{l}</Label>
    </div>
  );
}

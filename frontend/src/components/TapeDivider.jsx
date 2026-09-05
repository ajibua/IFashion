export default function TapeDivider({ label }) {
  // Generates tick marks like a tailor's measuring tape, with a centered label.
  const ticks = Array.from({ length: 60 });

  return (
    <div className="tape-divider" role="separator" aria-label={label || 'section divider'}>
      <div className="tape-divider__ticks" aria-hidden="true">
        {ticks.map((_, i) => (
          <span
            key={i}
            className={
              i % 10 === 0
                ? 'tape-divider__tick tape-divider__tick--major'
                : i % 5 === 0
                ? 'tape-divider__tick tape-divider__tick--mid'
                : 'tape-divider__tick'
            }
          />
        ))}
      </div>
      {label && (
        <div className="tape-divider__label-wrap">
          <span className="tape-divider__label">{label}</span>
        </div>
      )}
    </div>
  );
}

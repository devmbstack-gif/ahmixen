/** Lightweight lazy-load placeholder — avoids layout jump without heavy JS. */
export function SectionPlaceholder({
  minHeight = '16rem',
  label = 'Loading section',
}: {
  minHeight?: string;
  label?: string;
}) {
  return (
    <div
      className="section-y page-x"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="section-placeholder mx-auto max-w-5xl"
        style={{ ['--placeholder-min' as string]: minHeight }}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

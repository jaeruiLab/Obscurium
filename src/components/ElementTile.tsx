import { CATEGORY_GLYPH, CATEGORY_LABEL, el } from '../lib/elements';

/** Full-information periodic-table tile, colored by category. Only shown after an answer. */
export function ElementTile({ z, size = 'lg', glyph = false }: { z: number; size?: 'lg' | 'md' | 'sm'; glyph?: boolean }) {
  const e = el(z);
  return (
    <div className={`etile etile-${size} cat-${e.category}`} role="img" aria-label={`${e.name}, ${e.symbol}, atomic number ${e.z}, ${CATEGORY_LABEL[e.category]}`}>
      <span className="etile-z">{e.z}</span>
      {glyph && <span className="etile-glyph" aria-hidden="true">{CATEGORY_GLYPH[e.category]}</span>}
      <span className="etile-sym">{e.symbol}</span>
      {size !== 'sm' && <span className="etile-name">{e.name}</span>}
      {size === 'lg' && <span className="etile-mass">{Number.isInteger(e.mass) ? e.mass : e.mass.toFixed(e.mass < 100 ? 3 : 2)}</span>}
    </div>
  );
}

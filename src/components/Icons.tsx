/** 12×12 pixel icons drawn with rects so they stay crisp at any size. */
type Rect = [number, number, number, number];

const ICONS: Record<string, Rect[]> = {
  menu: [[1, 2, 10, 2], [1, 5, 10, 2], [1, 8, 10, 2]],
  soundOn: [[1, 4, 2, 4], [3, 3, 1, 6], [4, 2, 1, 8], [5, 1, 1, 10], [7, 4, 1, 4], [9, 2, 1, 2], [10, 4, 1, 4], [9, 8, 1, 2]],
  soundOff: [[1, 4, 2, 4], [3, 3, 1, 6], [4, 2, 1, 8], [5, 1, 1, 10], [7, 4, 1, 1], [8, 5, 1, 1], [9, 6, 1, 1], [10, 7, 1, 1], [10, 4, 1, 1], [9, 5, 1, 1], [8, 6, 1, 1], [7, 7, 1, 1]],
  gear: [[5, 0, 2, 2], [5, 10, 2, 2], [0, 5, 2, 2], [10, 5, 2, 2], [2, 2, 2, 2], [8, 2, 2, 2], [2, 8, 2, 2], [8, 8, 2, 2], [3, 3, 6, 1], [3, 8, 6, 1], [3, 4, 1, 4], [8, 4, 1, 4], [4, 4, 1, 1], [7, 4, 1, 1], [4, 7, 1, 1], [7, 7, 1, 1]],
  hardhat: [[4, 2, 4, 1], [3, 3, 6, 1], [2, 4, 8, 3], [5, 3, 2, 4], [0, 7, 12, 2], [1, 9, 10, 1]],
};

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 12 12" width="14" height="14" shapeRendering="crispEdges" aria-hidden="true" fill="currentColor">
      {ICONS[name].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  );
}

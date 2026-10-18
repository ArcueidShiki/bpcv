import { useEffect, useRef } from 'react';

/** A canvas painted by `draw`. Repaints after every render of its parent (so
 *  slider and language changes show up) and whenever its width changes. */
export function Plot({ draw, height, label }: {
  draw: (cv: HTMLCanvasElement) => void; height: number; label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const latest = useRef(draw);
  latest.current = draw;

  useEffect(() => {
    if (ref.current) draw(ref.current);
  });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    let width = cv.clientWidth;
    const ro = new ResizeObserver(() => {
      if (cv.clientWidth === width) return;
      width = cv.clientWidth;
      latest.current(cv);
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);

  return <canvas ref={ref} className="m-plot" style={{ height }} role="img" aria-label={label} />;
}

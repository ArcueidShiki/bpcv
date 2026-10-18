import { useEffect, useRef } from 'react';

/** Calls `draw(canvas)` whenever `deps` change and whenever the canvas is
 *  resized (so the 390px and 1280px layouts both draw at their real width). */
export function useCanvas(draw: (cv: HTMLCanvasElement) => void, deps: readonly unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const cv = ref.current;
    if (cv) drawRef.current(cv);
  }, deps);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || typeof ResizeObserver === 'undefined') return;
    let w = cv.clientWidth;
    const ro = new ResizeObserver(() => {
      if (cv.clientWidth === w) return;
      w = cv.clientWidth;
      drawRef.current(cv);
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);

  return ref;
}

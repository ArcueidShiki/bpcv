import { useEffect, useRef } from 'react';
import { useLang } from '../../shared/i18n';
import { localizeCanvas } from './canvasLang';

/** Mount an engine-drawn canvas: draws whenever `draw` changes (include `lang`
 *  in its deps), redraws on resize, and localises the engine's labels. */
export function useCanvas(draw: (cv: HTMLCanvasElement) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { lang } = useLang();
  const langRef = useRef(lang);
  langRef.current = lang;
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    localizeCanvas(cv, () => langRef.current);
    const ro = new ResizeObserver(() => drawRef.current(cv));
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (ref.current) draw(ref.current);
  }, [draw, lang]);

  return ref;
}

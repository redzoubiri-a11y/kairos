import { useRef, useState, useCallback, useEffect, useMemo } from 'react';

const LOOP_MULTIPLIER = 50; // assez grand pour que l'utilisateur n'atteigne jamais les bords

export default function usePromoCarousel(slidesCount, intervalMs = 4500) {
  const listRef = useRef(null);
  const pausedRef = useRef(false);

  // Index de départ : au milieu de la data multipliée, aligné sur le slide 0
  const startIndex = useMemo(() => {
    if (slidesCount <= 1) return 0;
    const middleLoop = Math.floor(LOOP_MULTIPLIER / 2);
    return middleLoop * slidesCount;
  }, [slidesCount]);

  const [rawIndex, setRawIndex] = useState(startIndex);
  const activeIndex = slidesCount > 0 ? rawIndex % slidesCount : 0;

  const goToIndex = useCallback((index) => {
    listRef.current?.scrollToIndex({ index, animated: true });
    setRawIndex(index);
  }, []);

  useEffect(() => {
    if (slidesCount <= 1) return;

    const timer = setInterval(() => {
      if (pausedRef.current) return;
      setRawIndex((prev) => {
        const next = prev + 1; // toujours vers l'avant, jamais de retour
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [slidesCount, intervalMs]);

  const onManualScroll = useCallback((rawIdx) => {
    setRawIndex(rawIdx);
    pausedRef.current = true;
    setTimeout(() => {
      pausedRef.current = false;
    }, 6000);
  }, []);

  return { listRef, startIndex, activeIndex, goToIndex, onManualScroll };
}

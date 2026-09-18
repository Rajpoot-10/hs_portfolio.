import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Progressive enhancement: content is visible before, after, and without animation. */
export function useEntranceMotion(route: string) {
  useEffect(() => {
    const root = document.querySelector('main');
    if (!root || typeof window.IntersectionObserver !== 'function' || !Element.prototype.animate) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet<Element>();
    const active = new Map<Element, Animation>();
    const cancelAll = () => { active.forEach(animation => animation.cancel()); active.clear(); };
    const collect = (node: Element) => [
      ...(node.matches('[data-reveal]') ? [node] : []),
      ...node.querySelectorAll<HTMLElement>('[data-reveal]'),
    ];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        if (seen.has(element)) continue;
        seen.add(element);
        element.dataset.motionState = 'entered';
        if (preference.matches || document.hidden || element.contains(document.activeElement)) continue;
        const animation = element.animate([
          { opacity: 0.35, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], {
          duration: 620,
          delay: Math.min(120, Math.max(0, Number(element.dataset.revealDelay) || 0)),
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'none',
        });
        active.set(element, animation);
        animation.onfinish = () => active.delete(element);
      }
    }, { threshold: 0.04, rootMargin: '0px 0px -12px 0px' });
    const observe = (node: Element) => collect(node).forEach(element => {
      if (!seen.has(element)) observer.observe(element);
    });
    observe(root);
    // Project filtering mounts new cards. Observe only added nodes, not every render.
    const mutations = new MutationObserver(records => {
      for (const record of records) {
        record.removedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          collect(node).forEach(element => {
            observer.unobserve(element);
            active.get(element)?.cancel();
            active.delete(element);
          });
        });
        record.addedNodes.forEach(node => { if (node instanceof Element) observe(node); });
      }
    });
    mutations.observe(root, { childList: true, subtree: true });
    const onPreference = () => { if (preference.matches) cancelAll(); };
    const onVisibility = () => { if (document.hidden) cancelAll(); };
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest('[data-reveal]');
      if (element) { active.get(element)?.cancel(); active.delete(element); }
    };
    preference.addEventListener('change', onPreference);
    document.addEventListener('visibilitychange', onVisibility);
    root.addEventListener('focusin', onFocus);
    return () => {
      observer.disconnect(); mutations.disconnect(); cancelAll();
      preference.removeEventListener('change', onPreference);
      document.removeEventListener('visibilitychange', onVisibility);
      root.removeEventListener('focusin', onFocus);
    };
  }, [route]);
}

/** One scheduled update per pointer event frame; no render loop or React state updates. */
export function usePointerTilt<T extends HTMLElement>(ref: RefObject<T | null>, enabled = true) {
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const preference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let detach = () => { };
    const configure = () => {
      detach();
      if (!preference.matches) return;
      element.dataset.tilt = 'enabled';
      let frame = 0;
      let bounds: DOMRect | null = null;
      let x = 0;
      let y = 0;
      const reset = () => {
        cancelAnimationFrame(frame); frame = 0; bounds = null;
        element.style.removeProperty('--tilt-x');
        element.style.removeProperty('--tilt-y');
      };
      const enter = (event: PointerEvent) => {
        if (event.pointerType === 'mouse') bounds = element.getBoundingClientRect();
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || document.hidden) return;
        bounds ??= element.getBoundingClientRect();
        x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
        y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
        if (frame) return;
        frame = requestAnimationFrame(() => {
          element.style.setProperty('--tilt-x', `${(-y * 3).toFixed(2)}deg`);
          element.style.setProperty('--tilt-y', `${(x * 3).toFixed(2)}deg`);
          frame = 0;
        });
      };
      element.addEventListener('pointerenter', enter);
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerleave', reset);
      element.addEventListener('pointercancel', reset);
      window.addEventListener('resize', reset);
      document.addEventListener('visibilitychange', reset);
      detach = () => {
        reset(); delete element.dataset.tilt;
        element.removeEventListener('pointerenter', enter);
        element.removeEventListener('pointermove', move);
        element.removeEventListener('pointerleave', reset);
        element.removeEventListener('pointercancel', reset);
        window.removeEventListener('resize', reset);
        document.removeEventListener('visibilitychange', reset);
      };
    };
    configure();
    preference.addEventListener('change', configure);
    return () => { detach(); preference.removeEventListener('change', configure); };
  }, [ref, enabled]);
}

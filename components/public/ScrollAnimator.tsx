"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Adds .js-ready to <body> (enables CSS animations) and then uses
 * IntersectionObserver to add .in-view when elements scroll into view.
 *
 * By gating animations on .js-ready, SSR content is never invisible on
 * initial load or browser back-navigation.
 */
export function ScrollAnimator() {
  const pathname = usePathname();

  useEffect(() => {
    // Mark body as JS-ready so CSS animations kick in
    document.body.classList.add("js-ready");

    const els = document.querySelectorAll<HTMLElement>(".scroll-animate");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );

    els.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      // Remove js-ready on unmount so back-navigation starts clean
      document.body.classList.remove("js-ready");
    };
  }, [pathname]);

  return null;
}

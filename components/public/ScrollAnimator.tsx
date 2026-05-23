"use client";

import { useEffect } from "react";

/** Adds .in-view class to .scroll-animate elements as they enter the viewport */
export function ScrollAnimator() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".scroll-animate");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}

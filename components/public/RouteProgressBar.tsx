"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Complete the progress when pathname or searchParams change (navigation finishes)
    setProgress(100);
    const timer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external links
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) {
        return;
      }
      
      // Ignore hashes, new tabs, and downloads
      if (href.startsWith("#") || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      // Ignore clicks with modifier keys (Command/Control/Shift clicks)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      // Check if it's pointing to the same page + hash
      try {
        const targetUrl = new URL(href, window.location.origin);
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search &&
          targetUrl.hash
        ) {
          return;
        }
      } catch (err) {
        // Fallback for invalid URLs
        return;
      }

      // Start the progress animation
      setVisible(true);
      setProgress(10);

      clearInterval(interval);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          // Slow down the progress speed as it gets higher
          const step = prev < 50 ? Math.random() * 15 : Math.random() * 5;
          return prev + step;
        });
      }, 120);
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1.5 z-[9999] transition-all duration-300 pointer-events-none"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #3b82f6, #8b6914, #1d4ed8)",
        boxShadow: "0 0 10px rgba(59, 130, 246, 0.7)",
      }}
    />
  );
}

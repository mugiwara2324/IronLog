import { useEffect } from "react";

interface ScrollStyles {
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  bodyOverflow: string;
  bodyPaddingRight: string;
  rootOverflow: string;
  scrollY: number;
}

let lockCount = 0;
let originalStyles: ScrollStyles | null = null;

/** Locks page scrolling while one or more modal dialogs are open. */
export default function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof window === "undefined") return;

    if (lockCount === 0) {
      const body = document.body;
      const root = document.documentElement;
      const scrollY = window.scrollY;

      originalStyles = {
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyLeft: body.style.left,
        bodyRight: body.style.right,
        bodyWidth: body.style.width,
        bodyOverflow: body.style.overflow,
        bodyPaddingRight: body.style.paddingRight,
        rootOverflow: root.style.overflow,
        scrollY,
      };

      const scrollbarWidth = window.innerWidth - root.clientWidth;
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      root.style.overflow = "hidden";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount > 0 || !originalStyles) return;

      const body = document.body;
      const root = document.documentElement;
      const styles = originalStyles;
      originalStyles = null;

      body.style.position = styles.bodyPosition;
      body.style.top = styles.bodyTop;
      body.style.left = styles.bodyLeft;
      body.style.right = styles.bodyRight;
      body.style.width = styles.bodyWidth;
      body.style.overflow = styles.bodyOverflow;
      body.style.paddingRight = styles.bodyPaddingRight;
      root.style.overflow = styles.rootOverflow;
      window.scrollTo(0, styles.scrollY);
    };
  }, [locked]);
}

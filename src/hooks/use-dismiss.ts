import { useEffect } from "react";

interface UseDismissProps {
  onDismiss: () => void;
  elementRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export function useDismiss({
  onDismiss,
  elementRef,
  className,
}: UseDismissProps) {
  useEffect(() => {
    const handleScroll = () => onDismiss();

    const handleDismiss = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Check if interaction is outside either by className or ref
      const isOutside = className
        ? !target.closest(`.${className}`)
        : elementRef?.current && !elementRef.current.contains(target);

      if (isOutside) {
        onDismiss();
      }
    };

    // Add both mouse and touch events
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleDismiss);
    document.addEventListener("touchend", handleDismiss); // Add touch support

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleDismiss);
      document.removeEventListener("touchend", handleDismiss);
    };
  }, [onDismiss, elementRef, className]);
}

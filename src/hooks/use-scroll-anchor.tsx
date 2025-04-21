import { useEffect, useRef } from "react";

type ScrollAnchorProps = {
  ref: React.RefObject<HTMLDivElement>;
  dependencies?: unknown[];
  behavior?: ScrollBehavior;
};

export function useScrollAnchor({
  ref,
  dependencies = [],
  behavior = "smooth",
}: ScrollAnchorProps) {
  const prevLengthRef = useRef(0);

  // Only scroll when the array length changes
  useEffect(() => {
    if (Array.isArray(dependencies[0])) {
      const currentLength = dependencies[0].length;
      if (currentLength > prevLengthRef.current) {
        ref.current?.scrollIntoView({ behavior });
      }
      prevLengthRef.current = currentLength;
    }
  }, [dependencies, behavior, ref]);
}

import { useEffect, useRef } from "react";

type ScrollAnchorProps = {
  dependencies?: unknown[];
  behavior?: ScrollBehavior;
};

export function ScrollAnchor({ dependencies = [] }: ScrollAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [dependencies]);

  return <div ref={ref} />;
}

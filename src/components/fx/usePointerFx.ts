import { useEffect, useState } from "react";
import { canAnimate, hasFinePointer } from "@/lib/motion/env";

/** True once hydrated on a device where pointer effects should run (fine pointer, motion allowed). */
export function usePointerFx(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(canAnimate() && hasFinePointer()), []);
  return on;
}

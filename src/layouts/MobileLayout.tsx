import type { ReactNode } from "react";

import BottomNavigation from "../components/layout/BottomNavigation";

interface Props {
  children: ReactNode;
}

export default function MobileLayout({ children }: Props) {
  return (
    <div
      className="
      min-h-screen
      bg-neutral-950
      text-white
      pb-24
    "
    >
      <main className="p-5">{children}</main>

      <BottomNavigation />
    </div>
  );
}

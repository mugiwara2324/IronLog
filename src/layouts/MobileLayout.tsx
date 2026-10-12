import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import BottomNavigation from "../components/layout/BottomNavigation";

interface Props {
  children: ReactNode;
}

export default function MobileLayout({ children }: Props) {
  const { pathname } = useLocation();
  const isAuthPage = ["/login", "/register", "/reset-password"].includes(pathname);

  return (
    <div className="app-shell">
      <main className={`app-content${isAuthPage ? " auth-content" : ""}`}>{children}</main>

      {!isAuthPage && <BottomNavigation />}
    </div>
  );
}

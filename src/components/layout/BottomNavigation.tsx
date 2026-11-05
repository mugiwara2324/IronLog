import { useEffect, useState } from "react";
import { Dumbbell, Home, TrendingUp, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { name: "Accueil", path: "/", icon: Home },
  { name: "Séances", path: "/workouts", icon: Dumbbell },
  { name: "Progression", path: "/progress", icon: TrendingUp },
  { name: "Profil", path: "/profile", icon: User },
];

export default function BottomNavigation() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    let previousY = Math.max(0, window.scrollY);
    let direction = 0;
    let accumulatedMovement = 0;
    let animationFrame = 0;

    const updateNavigation = () => {
      animationFrame = 0;
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - previousY;

      if (currentY <= 24) {
        setIsCompact(false);
        direction = 0;
        accumulatedMovement = 0;
      } else if (delta !== 0) {
        const nextDirection = Math.sign(delta);
        if (nextDirection !== direction) {
          direction = nextDirection;
          accumulatedMovement = delta;
        } else {
          accumulatedMovement += delta;
        }

        if (accumulatedMovement >= 20) {
          setIsCompact(true);
          accumulatedMovement = 0;
        } else if (accumulatedMovement <= -20) {
          setIsCompact(false);
          accumulatedMovement = 0;
        }
      }

      previousY = currentY;
    };

    const handleScroll = () => {
      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(updateNavigation);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame !== 0) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <nav
      className={`bottom-navigation${isCompact ? " is-compact" : ""}`}
      aria-label="Navigation principale"
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            aria-label={item.name}
            className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
          >
            <Icon size={21} strokeWidth={2} aria-hidden="true" />
          </NavLink>
        );
      })}
    </nav>
  );
}

import { Dumbbell, Home, TrendingUp, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { name: "Accueil", path: "/", icon: Home },
  { name: "Séances", path: "/workouts", icon: Dumbbell },
  { name: "Progression", path: "/progress", icon: TrendingUp },
  { name: "Profil", path: "/profile", icon: User },
];

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Navigation principale">
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
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

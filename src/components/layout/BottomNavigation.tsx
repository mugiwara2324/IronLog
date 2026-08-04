import { Home, Dumbbell, TrendingUp, User } from "lucide-react";

import { NavLink } from "react-router-dom";

const items = [
  {
    name: "Accueil",
    path: "/",
    icon: Home,
  },
  {
    name: "Séances",
    path: "/workouts",
    icon: Dumbbell,
  },
  {
    name: "Progression",
    path: "/progress",
    icon: TrendingUp,
  },
  {
    name: "Profil",
    path: "/profile",
    icon: User,
  },
];

export default function BottomNavigation() {
  return (
    <nav
      className="
fixed
bottom-0
left-0
right-0
h-20
bg-neutral-900
border-t
border-neutral-800
flex
justify-around
items-center
"
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `
flex
flex-col
items-center
text-xs
gap-1
${isActive ? "text-white" : "text-neutral-500"}
`
            }
          >
            <Icon size={22} />

            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

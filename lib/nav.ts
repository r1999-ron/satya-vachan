import { BookOpen, Home, Mic2 } from "lucide-react";

export const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Mic2 },
  { href: "/learned", label: "Saved Words", icon: BookOpen },
] as const;

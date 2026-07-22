import { BookOpen, Home, Mic2, Puzzle, RotateCcw } from "lucide-react";

export const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/play", label: "Play", icon: Puzzle },
  { href: "/practice", label: "Practice", icon: Mic2 },
  { href: "/review", label: "Revise", icon: RotateCcw },
  { href: "/learned", label: "Saved", icon: BookOpen },
] as const;

import {
  Rocket,
  Trophy,
  ShieldCheck,
  Car,
  Vault,
  Drama,
  Headphones,
  Megaphone,
  Wrench,
  Sparkles,
  Flame,
  Users,
} from 'lucide-react';

export const ICON_MAP = {
  rocket: Rocket,
  trophy: Trophy,
  shield: ShieldCheck,
  car: Car,
  vault: Vault,
  masks: Drama,
  headset: Headphones,
  megaphone: Megaphone,
  wrench: Wrench,
  sparkles: Sparkles,
  flame: Flame,
  users: Users,
};

export function DynamicIcon({ name, className = 'w-6 h-6' }) {
  const Icon = ICON_MAP[name] || Rocket;
  return <Icon className={className} />;
}

export const ACCENT_STYLES = {
  copper: {
    badge: 'bg-nl-red text-white',
    text: 'text-nl-red',
    border: 'border-nl-red',
    softBg: 'bg-nl-red/10 text-nl-red border-nl-red/20',
  },
  amber: {
    badge: 'bg-amber-500 text-white',
    text: 'text-amber-400',
    border: 'border-amber-500',
    softBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  emerald: {
    badge: 'bg-emerald-500 text-white',
    text: 'text-emerald-400',
    border: 'border-emerald-500',
    softBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  blue: {
    badge: 'bg-blue-500 text-white',
    text: 'text-blue-400',
    border: 'border-blue-500',
    softBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  purple: {
    badge: 'bg-purple-500 text-white',
    text: 'text-purple-400',
    border: 'border-purple-500',
    softBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
};

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiMapPin,
  FiClock,
  FiAlertCircle,
  FiMessageSquare,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiHeart,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const menuItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: FiHome },
  {
    href: "/dashboard/infrastructures",
    label: "Infrastructures",
    icon: FiMapPin,
  },
  { href: "/dashboard/favoris", label: "Favoris", icon: FiHeart },
  { href: "/dashboard/propositions", label: "Propositions", icon: FiClock },
  {
    href: "/dashboard/signalements",
    label: "Signalements",
    icon: FiAlertCircle,
  },
  { href: "/dashboard/avis", label: "Avis", icon: FiMessageSquare },
  { href: "/dashboard/utilisateurs", label: "Utilisateurs", icon: FiUsers },
  { href: "/dashboard/statistiques", label: "Statistiques", icon: FiBarChart2 },
];

// Items de menu conditionnels selon le rôle
const getRoleSpecificMenuItems = (userRole: string) => {
  const items = [];

  // Super Admin et Admin peuvent voir la gestion des profils
  if (userRole === "super_admin" || userRole === "admin") {
    items.push({
      href: "/dashboard/profils",
      label: "Gestion des Profils",
      icon: FiUsers,
    });
  }

  // Tous peuvent voir leur profil personnel
  items.push({ href: "/dashboard/profil", label: "Mon Profil", icon: FiUser });

  return items;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="hidden md:flex w-64 bg-[#004B70] dark:bg-[#002f48] border-r border-transparent dark:border-slate-800 text-white flex-col h-screen shadow-xl z-20 transition-colors">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex-shrink-0 bg-white/10 rounded-xl p-1 shadow-inner">
            <Image
              src="/images/logo1.png"
              alt="KutonouTché Logo"
              fill
              className="object-contain drop-shadow-sm p-1"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">KutonouTché</h1>
            <p className="text-xs text-[#96D0EE] font-medium mt-0.5 uppercase tracking-wider">
              Dashboard
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 md:p-4 space-y-1 md:space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems
          .filter((item) => {
            // Masquer "Tableau de bord", "Statistiques" et "Utilisateurs" pour les agents communaux
            if (user?.role === "agent_communal") {
              return (
                item.href !== "/dashboard" &&
                item.href !== "/dashboard/statistiques" &&
                item.href !== "/dashboard/utilisateurs"
              );
            }
            return true;
          })
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium relative group ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#96D0EE] rounded-r-full shadow-[0_0_8px_#96D0EE]"></div>
                )}
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-[#96D0EE]" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

        {/* Séparateur */}
        {user && (user.role === "super_admin" || user.role === "admin") && (
          <div className="border-t border-gray-700 my-2"></div>
        )}

        {/* Items spécifiques au rôle */}
        {user &&
          getRoleSpecificMenuItems(user.role).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium relative group ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#96D0EE] rounded-r-full shadow-[0_0_8px_#96D0EE]"></div>
                )}
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-[#96D0EE]" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="px-2 py-2 mb-3">
          <div className="font-semibold text-white truncate text-sm">
            {user?.prenom} {user?.nom}
          </div>
          <div className="text-xs text-white/60 truncate mt-0.5">{user?.email}</div>
          <div className="mt-2 flex">
            <span className="px-2 py-0.5 bg-[#96D0EE]/20 border border-[#96D0EE]/30 text-[#96D0EE] rounded-md text-[10px] font-bold uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm font-medium"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiMapPin,
  FiClock,
  FiAlertCircle,
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
  { href: "/dashboard/utilisateurs", label: "Utilisateurs", icon: FiUsers },
  { href: "/dashboard/statistiques", label: "Statistiques", icon: FiBarChart2 },
];

// Items de menu conditionnels selon le rôle
const getRoleSpecificMenuItems = (userRole: string) => {
  const items = [];
  
  // Super Admin et Admin peuvent voir la gestion des profils
  if (userRole === 'super_admin' || userRole === 'admin') {
    items.push({ href: "/dashboard/profils", label: "Gestion des Profils", icon: FiUsers });
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
    <div className="hidden md:flex w-64 bg-[#004B70]/100 text-white flex-col h-screen">
      <div className="p-4 md:p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
            <Image
              src="/images/logo1.png"
              alt="CotoNav Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold">CotoNav</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1">Tableau de bord</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 md:p-4 space-y-1 md:space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems
          .filter((item) => {
            // Masquer "Tableau de bord" et "Statistiques" pour les agents communaux
            if (user?.role === 'agent_communal') {
              return item.href !== '/dashboard' && item.href !== '/dashboard/statistiques';
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
                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                  isActive
                    ? "bg-[#96D0EE]/100 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        
        {/* Séparateur */}
        {user && (user.role === 'super_admin' || user.role === 'admin') && (
          <div className="border-t border-gray-700 my-2"></div>
        )}
        
        {/* Items spécifiques au rôle */}
        {user && getRoleSpecificMenuItems(user.role).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                isActive
                  ? "bg-[#96D0EE]/100 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 md:p-4 border-t border-gray-800">
        <div className="px-2 md:px-4 py-2 text-xs md:text-sm text-gray-400 mb-2">
          <div className="font-medium text-white truncate">
            {user?.prenom} {user?.nom}
          </div>
          <div className="text-xs truncate">{user?.email}</div>
          <div className="text-xs mt-1">
            <span className="px-2 py-1 bg-[#96D0EE]/100 rounded text-white">
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm md:text-base"
        >
          <FiLogOut className="w-4 h-4 md:w-5 md:h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

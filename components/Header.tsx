"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getDb } from "@/lib/firebase/client";
import { getAllowedNotificationTypes } from "@/lib/notifications/roleFilter";
import { AppNotification } from "@/lib/notifications/types";
import {
  Timestamp,
  arrayUnion,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiSearch,
  FiLogOut,
  FiUser,
  FiChevronDown,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { useTheme } from "@/contexts/ThemeContext";

interface SearchResult {
  id: string;
  type: "infrastructure" | "utilisateur" | "signalement" | "proposition";
  title: string;
  subtitle?: string;
  href: string;
}

export default function Header() {
  const { user, logout, token, firebaseAuthenticated } = useAuth();
  const router = useRouter();
  const { toggleTheme, isDark } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifError, setNotifError] = useState<string>("");
  const [retryingAuth, setRetryingAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Administrateur",
      admin: "Administrateur",
      agent_communal: "Agent Communal",
      citoyen: "Citoyen",
    };
    return labels[role] || role;
  };

  const allowedTypes = useMemo(() => {
    return getAllowedNotificationTypes(user?.role || "");
  }, [user?.role]);

  const unreadCount = useMemo(() => {
    if (!user?.id) return 0;
    return notifications.filter((n) => !(n.readBy || []).includes(user.id))
      .length;
  }, [notifications, user?.id]);

  // Vérifier et réessayer l'authentification Firebase si nécessaire
  useEffect(() => {
    if (!user?.id || !token || firebaseAuthenticated) return;

    const checkAndRetryAuth = async () => {
      try {
        const { getAuthInstance } = require("@/lib/firebase/client");
        const auth = getAuthInstance();

        // Si l'utilisateur n'est pas authentifié avec Firebase mais qu'on a un token JWT
        if (!auth.currentUser && !retryingAuth) {
          console.log("🔄 Tentative de réauthentification Firebase...");
          setRetryingAuth(true);

          try {
            const axios = require("axios");
            const API_URL =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

            const tokenResponse = await axios.get(
              `${API_URL}/auth/firebase-token`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            if (tokenResponse.data.firebaseToken) {
              const {
                authenticateWithFirebase,
              } = require("@/lib/firebase/client");
              await authenticateWithFirebase(tokenResponse.data.firebaseToken);
              console.log("✅ Réauthentification Firebase réussie");
              setNotifError("");
            }
          } catch (retryError) {
            console.error(
              "❌ Erreur lors de la réauthentification Firebase:",
              retryError,
            );
          } finally {
            setRetryingAuth(false);
          }
        }
      } catch (error) {
        console.error("Erreur vérification Firebase Auth:", error);
        setRetryingAuth(false);
      }
    };

    checkAndRetryAuth();
  }, [user?.id, token, firebaseAuthenticated, retryingAuth]);

  // Désactiver temporairement les notifications Firebase pour éviter les erreurs
  // TODO: Configurer Supabase pour les notifications ou corriger la configuration Firebase
  useEffect(() => {
    setNotifications([]);
    setNotifError("");
    return () => {};
  }, [user?.id, allowedTypes.length]);

  const markAsRead = async (notifId: string) => {
    console.log("🔔 Notifications désactivées - markAsRead non fonctionnel");
    // TODO: Implémenter avec Supabase
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      proposition: "Nouvelle proposition d'infrastructure",
      signalement: "Nouveau signalement",
      favori: "Nouveau favori",
      utilisateur: "Nouvel utilisateur",
    };
    return labels[type] || type;
  };

  // Fonction de recherche globale
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const results: SearchResult[] = [];
      const searchLower = query.toLowerCase();

      // Recherche dans les pages/sections du dashboard
      const pages = [
        {
          title: "Tableau de bord",
          keywords: ["accueil", "dashboard", "statistiques"],
          href: "/dashboard",
        },
        {
          title: "Infrastructures",
          keywords: ["infrastructure", "lieu", "carte", "map"],
          href: "/dashboard/infrastructures",
        },
        {
          title: "Utilisateurs",
          keywords: ["utilisateur", "user", "compte", "profil"],
          href: "/dashboard/utilisateurs",
        },
        {
          title: "Signalements",
          keywords: ["signalement", "problème", "rapport", "incident"],
          href: "/dashboard/signalements",
        },
        {
          title: "Propositions",
          keywords: ["proposition", "suggestion", "idée"],
          href: "/dashboard/propositions",
        },
        {
          title: "Contributions",
          keywords: ["contribution", "ajout", "nouveau"],
          href: "/dashboard/contributions",
        },
        {
          title: "Récompenses",
          keywords: ["récompense", "reward", "point", "badge"],
          href: "/dashboard/recompenses",
        },
        {
          title: "Mon Profil",
          keywords: ["profil", "compte", "paramètres"],
          href: "/dashboard/profil",
        },
      ];

      pages.forEach((page) => {
        const matchTitle = page.title.toLowerCase().includes(searchLower);
        const matchKeywords = page.keywords.some((k) =>
          k.includes(searchLower),
        );

        if (matchTitle || matchKeywords) {
          results.push({
            id: page.href,
            type: "infrastructure",
            title: page.title,
            subtitle: "Section du dashboard",
            href: page.href,
          });
        }
      });

      // Recherche dans les catégories d'infrastructures
      const categories = [
        "Toilettes publiques",
        "Aires de jeux",
        "Terrains de sport",
        "Centres de santé",
        "Écoles",
        "Commissariats",
        "Espaces verts",
        "Centres culturels",
        "Marchés",
        "Mairies",
      ];

      categories.forEach((cat) => {
        if (cat.toLowerCase().includes(searchLower)) {
          results.push({
            id: `cat-${cat}`,
            type: "infrastructure",
            title: cat,
            subtitle: "Catégorie d'infrastructure",
            href: `/dashboard/infrastructures?category=${encodeURIComponent(cat)}`,
          });
        }
      });

      setSearchResults(results.slice(0, 8));
    } catch (error) {
      console.error("Erreur de recherche:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.href);
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "infrastructure":
        return "🏢";
      case "utilisateur":
        return "👤";
      case "signalement":
        return "⚠️";
      case "proposition":
        return "💡";
      default:
        return "📄";
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 px-4 md:px-6 py-4 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Recherche - masquée sur mobile */}
        <div className="hidden md:flex flex-1 max-w-xl relative">
          <div className="relative w-full">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans le dashboard..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() =>
                searchResults.length > 0 && setShowSearchResults(true)
              }
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#96D0EE]/50 focus:border-[#96D0EE] transition-all duration-200 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
            />

            {/* Résultats de recherche */}
            {showSearchResults && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSearchResults(false)}
                ></div>
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40 border border-gray-100 dark:border-slate-700 z-20 max-h-96 overflow-auto">
                  {isSearching ? (
                    <div className="px-4 py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                        Recherche en cours...
                      </p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                      Aucun résultat trouvé pour "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border-b border-gray-100 dark:border-slate-800 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {getResultIcon(result.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                  {result.subtitle}
                                </div>
                              )}
                            </div>
                            <FiSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Bouton recherche mobile */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Rechercher"
          >
            <FiSearch className="w-5 h-5" />
          </button>

          {/* ── Toggle Jour / Nuit (accessibilité non-voyants) ─────────────── */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Passer en mode jour' : 'Passer en mode nuit'}
            aria-pressed={isDark}
            title={isDark ? 'Mode Jour' : 'Mode Nuit'}
            className="relative p-2.5 rounded-xl transition-all duration-300 group
              text-gray-500 hover:text-[#004B70] hover:bg-[#96D0EE]/10
              dark:text-slate-400 dark:hover:text-[#96D0EE] dark:hover:bg-white/5
              focus:outline-none focus:ring-2 focus:ring-[#96D0EE] focus:ring-offset-1"
          >
            <span className="sr-only">
              {isDark ? 'Activer le mode jour' : 'Activer le mode nuit'}
            </span>
            <span
              className="block transition-all duration-500 ease-in-out"
              style={{ transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(30deg) scale(1)' }}
            >
              {isDark ? (
                <FiSun className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" aria-hidden="true" />
              ) : (
                <FiMoon className="w-5 h-5" aria-hidden="true" />
              )}
            </span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotif((v) => !v)}
              className="relative p-2.5 text-gray-500 hover:text-[#004B70] hover:bg-[#96D0EE]/10 rounded-xl transition-colors"
              title="Notifications"
            >
              <FiBell className="w-5 h-5 md:w-5 md:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] leading-[18px] rounded-full text-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotif(false)}
                ></div>
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/40 border border-gray-100 dark:border-slate-700 z-20 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Notifications
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      {unreadCount} non lue(s)
                    </div>
                  </div>

                  {notifError && (
                    <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/40">
                      {notifError}
                    </div>
                  )}

                  <div className="max-h-[420px] overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        Aucune notification pour le moment.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {notifications.map((n) => {
                          const isUnread = user?.id
                            ? !(n.readBy || []).includes(user.id)
                            : false;
                          const created = (n.createdAt as any)?.toDate?.()
                            ? (n.createdAt as any).toDate()
                            : null;
                          return (
                            <div
                              key={n.id}
                              className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/80 ${isUnread ? "bg-primary-50/40 dark:bg-sky-950/20" : ""}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
                                    {typeLabel(n.type)}
                                  </div>
                                  <div
                                    className={`text-sm ${isUnread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-800 dark:text-slate-200"}`}
                                  >
                                    {n.title}
                                  </div>
                                  {n.message ? (
                                    <div className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">
                                      {n.message}
                                    </div>
                                  ) : null}
                                  {created ? (
                                    <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                                      {created.toLocaleString("fr-FR")}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-2">
                                  {n.href ? (
                                    <Link
                                      href={n.href}
                                      onClick={async () => {
                                        await markAsRead(n.id);
                                        setShowNotif(false);
                                      }}
                                      className="text-xs text-primary-700 hover:text-primary-900 whitespace-nowrap"
                                    >
                                      Ouvrir
                                    </Link>
                                  ) : null}
                                  {isUnread ? (
                                    <button
                                      onClick={() => markAsRead(n.id)}
                                      className="text-xs text-gray-600 hover:text-gray-900 whitespace-nowrap"
                                      title="Marquer comme lu"
                                    >
                                      Lu
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Menu utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 md:gap-3 p-1.5 pr-3 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent hover:border-gray-100 dark:hover:border-slate-700 rounded-xl transition-all"
            >
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  {user?.prenom} {user?.nom}
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {getRoleLabel(user?.role || "")}
                </div>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-[#96D0EE]/60 dark:border-[#004B70] bg-[#004B70] flex items-center justify-center text-white font-medium text-sm md:text-base shadow-sm flex-shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user?.prenom || ""} ${user?.nom || ""}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {user?.prenom?.charAt(0)}
                    {user?.nom?.charAt(0)}
                  </span>
                )}
              </div>
              <FiChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? "rotate-180" : ""}`}
              />
            </button>

            {/* Menu déroulant */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                ></div>
                <div className="absolute right-0 mt-3 w-48 md:w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/40 border border-gray-100 dark:border-slate-700 z-20 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#96D0EE]/50 bg-[#004B70] flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={`${user?.prenom || ""} ${user?.nom || ""}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {user?.prenom?.charAt(0)}
                          {user?.nom?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                        {user?.prenom} {user?.nom}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {user?.email}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-[#004B70] dark:text-[#96D0EE] mt-0.5">
                        {getRoleLabel(user?.role || "")}
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        router.push("/dashboard/profil");
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-[#004B70] dark:hover:text-[#96D0EE] transition-colors"
                    >
                      <FiUser className="w-4 h-4" />
                      Mon Profil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de recherche mobile */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileSearch(false)}
          ></div>
          <div className="absolute inset-x-0 top-0 bg-white dark:bg-slate-900 p-4 shadow-xl border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => {
                  setShowMobileSearch(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                ← Retour
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recherche</h3>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher dans l'application..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:border-transparent placeholder-gray-400 dark:placeholder-slate-500 text-sm"
              />
            </div>

            {/* Résultats de recherche mobile */}
            <div className="mt-4 max-h-[calc(100vh-200px)] overflow-auto">
              {isSearching ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                    Recherche en cours...
                  </p>
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                  Tapez au moins 2 caractères pour rechercher
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                  Aucun résultat trouvé pour "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        handleSelectResult(result);
                        setShowMobileSearch(false);
                      }}
                      className="w-full px-4 py-3 text-left bg-white dark:bg-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getResultIcon(result.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

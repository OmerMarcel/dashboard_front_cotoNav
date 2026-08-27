"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { FiMail, FiLock, FiLogIn, FiUser, FiSun, FiMoon } from "react-icons/fi";
import Image from "next/image";

type Role = "super_admin" | "admin" | "agent_communal";

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Administrateur",
  admin: "Administrateur",
  agent_communal: "Agent Communal",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password, role);
      const target =
        role === "agent_communal" ? "/dashboard/infrastructures" : "/dashboard";
      router.push(target);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 relative overflow-hidden px-4 transition-colors duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-light/20 dark:bg-sky-500/10 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-brand-dark/10 dark:bg-sky-900/20 blur-3xl"></div>
      </div>

      {/* Bouton de basculement de thème (Jour / Nuit) en haut à droite */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            isDark
              ? "Activer le mode jour (thème clair)"
              : "Activer le mode nuit (thème sombre)"
          }
          aria-pressed={isDark}
          title={
            isDark
              ? "Mode Nuit activé – Passer en mode Jour"
              : "Mode Jour activé – Passer en mode Nuit"
          }
          className="relative inline-flex items-center gap-2 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-gray-700 dark:text-amber-300 shadow-md shadow-slate-900/5 dark:shadow-black/20 border border-gray-200/80 dark:border-slate-700/80 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#96D0EE]"
        >
          {isDark ? (
            <>
              <FiSun className="w-5 h-5 text-amber-400 animate-spin-slow" />
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                Mode Jour
              </span>
            </>
          ) : (
            <>
              <FiMoon className="w-5 h-5 text-slate-700" />
              <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
                Mode Nuit
              </span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-md w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-brand-dark/5 dark:shadow-black/40 border border-white/60 dark:border-slate-700/60 p-8 z-10 animate-fade-in relative transition-colors duration-300">
        <div className="text-center mb-8">
          {/* Logo de l'application */}
          <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-brand-dark/20 dark:shadow-black/30 border border-brand-light/30 dark:border-slate-700 overflow-hidden p-1.5 transition-colors">
            <Image
              src="/images/logo1.png"
              alt="Logo KutonouTché"
              width={72}
              height={72}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            KutonouTché
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
            Géolocalisation des Infrastructures Publiques
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50/90 dark:bg-red-950/60 backdrop-blur-sm border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-300 px-4 py-3 rounded-2xl text-sm font-medium animate-slide-up">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200"
            >
              Rôle d'accès
            </label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 z-10 pointer-events-none w-5 h-5" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                required
                className="input-field pl-11 pr-10 cursor-pointer appearance-none"
              >
                <option value="super_admin">{ROLE_LABELS.super_admin}</option>
                <option value="admin">{ROLE_LABELS.admin}</option>
                <option value="agent_communal">
                  {ROLE_LABELS.agent_communal}
                </option>
              </select>
              <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                <svg
                  className="w-4 h-4 text-gray-400 dark:text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200"
            >
              Adresse email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field pl-11"
                placeholder="prenom.nom@exemple.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 flex justify-between"
            >
              Mot de passe
            </label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field pl-11"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base font-semibold shadow-md shadow-brand-dark/20"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiLogIn className="w-5 h-5" />
                  Se connecter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

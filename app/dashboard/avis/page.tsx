"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiCheckCircle,
  FiMessageSquare,
  FiRefreshCw,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import LogoLoader from "@/components/LogoLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface AvisUser {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  avatar?: string | null;
}

interface AvisInfra {
  id?: string;
  nom?: string;
  name?: string;
  type?: string;
}

interface AvisItem {
  id: string;
  note: number;
  commentaire?: string | null;
  approuve?: boolean;
  createdAt?: string;
  created_at?: string;
  utilisateur?: AvisUser;
  infrastructure?: AvisInfra;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatUser = (user?: AvisUser) => {
  if (!user) return "Utilisateur";
  const parts = [user.prenom, user.nom].filter(Boolean);
  return parts.length ? parts.join(" ") : user.email || "Utilisateur";
};

const formatInfra = (infra?: AvisInfra) => {
  if (!infra) return "-";
  return infra.nom || infra.name || "-";
};

export default function AvisDashboardPage() {
  const [avis, setAvis] = useState<AvisItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }, []);

  const fetchAvis = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };
      if (filter !== "all") {
        params.approuve = filter === "approved" ? "true" : "false";
      }

      const response = await axios.get(`${API_URL}/avis`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const responseAvis =
        response.data?.data || response.data?.avis || response.data || [];
      setAvis(responseAvis);

      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      } else {
        setPagination({
          page,
          limit,
          total: responseAvis.length,
          pages: 1,
        });
      }
    } catch (error) {
      if (!silent) {
        console.error("Erreur lors du chargement des avis:", error);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const handleModeration = async (avisId: string, approuve: boolean) => {
    try {
      setActionId(avisId);
      await axios.patch(
        `${API_URL}/avis/${avisId}`,
        { approuve },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      await fetchAvis(true);
    } catch (error) {
      console.error("Erreur lors de la moderation:", error);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (avisId: string) => {
    try {
      setActionId(avisId);
      await axios.delete(`${API_URL}/avis/${avisId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      await fetchAvis(true);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setActionId(null);
    }
  };

  const totalPages = pagination?.pages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Avis</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Modération et suivi des commentaires utilisateurs
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchAvis()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
        >
          <FiRefreshCw />
          Actualiser
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Tous" },
          { key: "approved", label: "Approuvés" },
          { key: "pending", label: "En attente" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setFilter(item.key as "all" | "approved" | "pending");
              setPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === item.key
                ? "bg-[#004B70] text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LogoLoader size="lg" text="Chargement des avis..." />
          </div>
        ) : avis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-slate-400">
            <FiMessageSquare className="h-10 w-10 mb-3" />
            Aucun avis pour ce filtre.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700/70">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Infrastructure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Commentaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800/40 divide-y divide-gray-100 dark:divide-slate-700/50">
                {avis.map((item) => {
                  const createdAt = item.created_at || item.createdAt;
                  const isApproved = item.approuve !== false;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {formatDate(createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                        {formatInfra(item.infrastructure)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {formatUser(item.utilisateur)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {item.note}/5
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 max-w-md">
                        {item.commentaire?.trim() || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isApproved
                              ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                              : "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300"
                          }`}
                        >
                          {isApproved ? "Approuvé" : "En attente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="inline-flex items-center gap-2">
                          {isApproved ? (
                            <button
                              type="button"
                              onClick={() => handleModeration(item.id, false)}
                              disabled={actionId === item.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800/60 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition"
                            >
                              <FiXCircle />
                              Rejeter
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleModeration(item.id, true)}
                              disabled={actionId === item.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 dark:border-green-800/60 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 disabled:opacity-50 transition"
                            >
                              <FiCheckCircle />
                              Approuver
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={actionId === item.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
                          >
                            <FiTrash2 />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 shadow-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 shadow-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

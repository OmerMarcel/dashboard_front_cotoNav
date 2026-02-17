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
          <h1 className="text-3xl font-bold text-gray-900">Avis</h1>
          <p className="text-gray-600 mt-1">
            Moderation et suivi des commentaires utilisateurs
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchAvis()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <FiRefreshCw />
          Actualiser
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Tous" },
          { key: "approved", label: "Approuves" },
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
                ? "bg-[#004B70] text-white"
                : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : avis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <FiMessageSquare className="h-10 w-10 mb-3" />
            Aucun avis pour ce filtre.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Infrastructure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commentaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {avis.map((item) => {
                  const createdAt = item.created_at || item.createdAt;
                  const isApproved = item.approuve !== false;
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatInfra(item.infrastructure)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatUser(item.utilisateur)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.note}/5
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                        {item.commentaire?.trim() || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isApproved
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {isApproved ? "Approuve" : "En attente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="inline-flex items-center gap-2">
                          {isApproved ? (
                            <button
                              type="button"
                              onClick={() => handleModeration(item.id, false)}
                              disabled={actionId === item.id}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <FiXCircle />
                              Rejeter
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleModeration(item.id, true)}
                              disabled={actionId === item.id}
                              className="inline-flex items-center gap-1 rounded-md border border-green-200 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              <FiCheckCircle />
                              Approuver
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={actionId === item.id}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
          >
            Precedent
          </button>
          <span className="text-sm text-gray-500">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

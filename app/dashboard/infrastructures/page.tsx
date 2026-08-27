"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiMapPin,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiEye,
} from "react-icons/fi";
import Link from "next/link";
import LogoLoader from "@/components/LogoLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Infrastructure {
  _id?: string;
  id?: string;
  nom: string;
  type: string;
  localisation: {
    adresse: string;
    quartier: string;
  };
  etat: string;
  valide: boolean;
  noteMoyenne?: number;
  note_moyenne?: number;
  nombreAvis?: number;
  nombre_avis?: number;
}

export default function InfrastructuresPage() {
  const [infrastructures, setInfrastructures] = useState<Infrastructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    quartier: "",
    valide: "",
    etat: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInfrastructures();
  }, [page, filters]);

  // Écouter les événements de création d'infrastructure depuis les propositions
  useEffect(() => {
    const handleInfrastructureCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const infrastructureId = customEvent.detail?.infrastructureId;

      console.log(
        "🔄 Nouvelle infrastructure créée, rafraîchissement de la liste...",
        infrastructureId,
      );

      // Rafraîchir la liste des infrastructures quand une nouvelle est créée
      fetchInfrastructures();

      // Si on est sur la première page, on reste, sinon on pourrait revenir à la page 1
      // pour voir la nouvelle infrastructure
      if (page !== 1) {
        setPage(1);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        "infrastructureCreated",
        handleInfrastructureCreated as EventListener,
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "infrastructureCreated",
          handleInfrastructureCreated as EventListener,
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchInfrastructures = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (filters.type) params.append("type", filters.type);
      if (filters.quartier) params.append("quartier", filters.quartier);
      if (filters.valide) params.append("valide", filters.valide);
      if (filters.etat) params.append("etat", filters.etat);

      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/infrastructures?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInfrastructures(response.data.infrastructures);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/infrastructures/${id}/valider`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      fetchInfrastructures();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cette infrastructure ? Cette action est irréversible et supprimera l'infrastructure de la base de données.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/infrastructures/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Rafraîchir la liste et les favoris
      await fetchInfrastructures();
    } catch (error: any) {
      console.error("Erreur:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la suppression de l'infrastructure",
      );
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      toilettes_publiques: "Toilettes publiques",
      parc_jeux: "Parc de jeux",
      centre_sante: "Centre de santé",
      installation_sportive: "Installation sportive",
      espace_divertissement: "Espace de divertissement",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  const getEtatColor = (etat: string) => {
    const colors: Record<string, string> = {
      excellent: "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300",
      bon: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300",
      moyen: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300",
      degrade: "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300",
      ferme: "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300",
    };
    return colors[etat] || "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LogoLoader size="lg" text="Chargement des infrastructures..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Infrastructures</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Gérer les infrastructures publiques
          </p>
        </div>
        <Link
          href="/dashboard/infrastructures/nouveau"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 font-medium text-sm"
        >
          + Ajouter
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96D0EE]"
        >
          <option value="">Tous les types</option>
          <option value="toilettes_publiques">Toilettes publiques</option>
          <option value="parc_jeux">Parc de jeux</option>
          <option value="centre_sante">Centre de santé</option>
          <option value="installation_sportive">Installation sportive</option>
          <option value="espace_divertissement">
            Espace de divertissement
          </option>
        </select>

        <input
          type="text"
          placeholder="Quartier"
          value={filters.quartier}
          onChange={(e) => setFilters({ ...filters, quartier: e.target.value })}
          className="border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96D0EE]"
        />

        <select
          value={filters.valide}
          onChange={(e) => setFilters({ ...filters, valide: e.target.value })}
          className="border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96D0EE]"
        >
          <option value="">Tous</option>
          <option value="true">Validées</option>
          <option value="false">En attente</option>
        </select>

        <select
          value={filters.etat}
          onChange={(e) => setFilters({ ...filters, etat: e.target.value })}
          className="border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96D0EE]"
        >
          <option value="">Tous les états</option>
          <option value="excellent">Excellent</option>
          <option value="bon">Bon</option>
          <option value="moyen">Moyen</option>
          <option value="degrade">Dégradé</option>
          <option value="ferme">Fermé</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700/70">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Quartier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  État
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Note
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
              {infrastructures.map((infra) => {
                const infraId = infra.id || infra._id || "";
                if (!infraId) return null;
                return (
                  <tr key={infraId} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {infra.nom}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">
                        {infra.localisation.adresse}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      {getTypeLabel(infra.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      {infra.localisation.quartier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getEtatColor(infra.etat)}`}
                      >
                        {infra.etat}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      {((infra.noteMoyenne ?? infra.note_moyenne) || 0).toFixed(
                        1,
                      )}
                      /5 ({(infra.nombreAvis ?? infra.nombre_avis) || 0} avis)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {infra.valide ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300">
                          Validée
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* Bouton Voir les détails */}
                        <Link
                          href={`/dashboard/infrastructures/${infraId}/edit?view=1`}
                          className="p-2 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                          title="Voir les détails"
                        >
                          <FiEye className="w-5 h-5" />
                        </Link>

                        {/* Bouton Modifier */}
                        <Link
                          href={`/dashboard/infrastructures/${infraId}/edit`}
                          className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Modifier l'infrastructure"
                        >
                          <FiEdit className="w-5 h-5" />
                        </Link>

                        {/* Bouton Valider (seulement si non validé) */}
                        {!infra.valide && (
                          <button
                            onClick={() => handleValidate(infraId)}
                            className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors"
                            title="Valider l'infrastructure"
                          >
                            <FiCheck className="w-5 h-5" />
                          </button>
                        )}

                        {/* Bouton Supprimer */}
                        <button
                          onClick={() => handleDelete(infraId)}
                          className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Supprimer l'infrastructure"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-slate-800/80 px-6 py-3 flex items-center justify-between border-t border-gray-100 dark:border-slate-700/70">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 transition"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-700 dark:text-slate-300">
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 transition"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { FiMapPin, FiHeart, FiTrash2, FiArrowLeft } from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Infrastructure {
  _id?: string;
  id?: string;
  nom: string;
  type: string;
  localisation?: {
    adresse?: string;
    quartier?: string;
  };
  etat?: string;
  photos?: Array<{ url: string }>;
  description?: string;
  noteMoyenne?: number;
  note_moyenne?: number;
  nombreAvis?: number;
  nombre_avis?: number;
  addedBy?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    fullName: string;
  };
  addedAt?: string;
}

export default function FavorisPage() {
  const [favorites, setFavorites] = useState<Infrastructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFavorites();

    // Mise à jour en temps réel toutes les 3 secondes pour voir les nouveaux favoris ajoutés depuis l'app mobile
    const interval = setInterval(() => {
      fetchFavorites();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchFavorites = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté pour voir vos favoris.");
        setLoading(false);
        return;
      }

      console.log("📥 Récupération des favoris depuis le backend...");
      const response = await axios.get(`${API_URL}/infrastructures/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const favoritesData = response.data || [];
      console.log(`✅ ${favoritesData.length} favori(s) récupéré(s)`);

      // Log pour le débogage
      if (favoritesData.length > 0) {
        console.log("📋 Exemple de favori:", favoritesData[0]);
      }

      // Normaliser les IDs pour éviter les doublons
      const normalizedFavorites = favoritesData.map(
        (infra: Infrastructure) => ({
          ...infra,
          id: infra.id || infra._id,
          _id: infra._id || infra.id,
        })
      );

      // Supprimer les doublons basés sur l'ID
      const uniqueFavorites = normalizedFavorites.filter(
        (infra: Infrastructure, index: number, self: Infrastructure[]) => {
          const infraId = infra.id || infra._id;
          return (
            index ===
            self.findIndex((i: Infrastructure) => (i.id || i._id) === infraId)
          );
        }
      );

      setFavorites(uniqueFavorites);
    } catch (err: any) {
      console.error("❌ Erreur lors du chargement des favoris:", err);

      // Message d'erreur plus précis selon la réponse backend
      const status = err?.response?.status;
      const backendMessage: string | undefined =
        err?.response?.data?.message || err?.response?.data?.error;

      if (status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
      } else if (status === 403) {
        setError(
          backendMessage ||
            "Accès refusé. Votre compte n'a pas les permissions nécessaires pour voir ces favoris.",
        );
      } else if (status === 500) {
        setError(
          backendMessage ||
            "Erreur serveur lors de la récupération des favoris. Vérifiez les logs backend.",
        );
      } else if (backendMessage) {
        setError(backendMessage);
      } else {
        setError("Impossible de charger vos favoris pour le moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id?: string) => {
    if (!id) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.delete(`${API_URL}/infrastructures/${id}/favorite`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFavorites((prev) =>
        prev.filter((infra) => (infra.id || infra._id) !== id)
      );
    } catch (err) {
      console.error(err);
      setError("Impossible de retirer ce favori.");
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

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FiHeart className="text-red-500 fill-current" />
            Favoris des utilisateurs
          </h1>
          <p className="text-gray-600 mt-1">
            Retrouvez ici toutes les infrastructures ajoutées en favoris par
            tous les utilisateurs (application mobile et dashboard).
            <span className="text-xs text-gray-500 block mt-1">
              ⚡ Mise à jour automatique toutes les 3 secondes • Total: {favorites.length} favori(s)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchFavorites();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Rafraîchir la liste"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Rafraîchir
          </button>
          <Link
            href="/dashboard/infrastructures"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiArrowLeft />
            Retour aux infrastructures
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center space-y-4">
          <FiHeart className="w-12 h-12 text-red-300 mx-auto" />
          <div className="text-xl font-semibold text-gray-900">
            Aucun favori pour l'instant
          </div>
          <p className="text-gray-500">
            Aucun utilisateur n'a encore ajouté d'infrastructure en favori
            depuis l'application mobile.
          </p>
          <Link
            href="/dashboard/infrastructures"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Parcourir les infrastructures
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((infra) => {
            const infraId = infra.id || infra._id || "";
            if (!infraId) return null;

            return (
              <div
                key={infraId}
                className="bg-white rounded-lg shadow p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs uppercase text-gray-400">
                      {getTypeLabel(infra.type)}
                    </p>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {infra.nom}
                    </h2>
                    {infra.addedBy && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ajouté par:{" "}
                        <span className="font-medium">
                          {infra.addedBy.fullName}
                        </span>
                        {infra.addedAt && (
                          <span className="ml-2">
                            •{" "}
                            {new Date(infra.addedAt).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(infraId)}
                    className="text-red-500 hover:text-red-600 ml-2"
                    title="Retirer des favoris"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 flex items-start gap-2">
                  <FiMapPin className="w-4 h-4 text-primary-500 mt-0.5" />
                  <span>
                    {infra.localisation?.adresse || "Adresse non renseignée"}
                    {infra.localisation?.quartier
                      ? `, ${infra.localisation.quartier}`
                      : ""}
                  </span>
                </p>

                {infra.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {infra.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{infra.etat || "État inconnu"}</span>
                  <span>
                    {((infra.noteMoyenne ?? infra.note_moyenne) || 0).toFixed(
                      1
                    )}
                    /5
                    {` · ${(infra.nombreAvis ?? infra.nombre_avis) || 0} avis`}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href={`/dashboard/infrastructures/${infraId}`}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Voir la fiche
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(infraId)}
                    className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
                  >
                    <FiTrash2 />
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

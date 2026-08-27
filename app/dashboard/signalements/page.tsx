"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FiAlertCircle, FiCheck, FiX, FiEye } from "react-icons/fi";
import LogoLoader from "@/components/LogoLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Signalement {
  _id: string;
  type: string;
  description: string;
  statut: string;
  infrastructure: {
    nom: string;
    type: string;
  };
  signalePar?: {
    nom?: string;
    prenom?: string;
    email?: string;
  };
  traitePar?: { nom?: string; prenom?: string };
  photos?: (string | { url?: string })[];
  createdAt: string;
  updatedAt?: string;
  traiteLe?: string;
  commentaireTraitement?: string;
}

export default function SignalementsPage() {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedSignalement, setSelectedSignalement] =
    useState<Signalement | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSignalements();
  }, [filter]);

  const fetchSignalements = async () => {
    try {
      const params = filter ? `?statut=${filter}` : "";
      const response = await axios.get(`${API_URL}/signalements${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const raw = response.data.signalements || [];

      // Normaliser les données : signalePar, _id, photos, dates
      const mapped: Signalement[] = raw.map((s: any) => ({
        ...s,
        _id: s.id || s._id,
        signalePar: s.signalePar || s.signale_par || undefined,
        traitePar: s.traitePar || s.traite_par || undefined,
        photos: s.photos || [],
        createdAt: s.created_at || s.createdAt,
        updatedAt: s.updated_at || s.updatedAt,
        traiteLe: s.traite_le,
        commentaireTraitement: s.commentaire_traitement,
      }));

      setSignalements(mapped);
    } catch (error: any) {
      console.error("Erreur lors du chargement des signalements:", error);
      if (error.response?.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, statut: string) => {
    try {
      // Normaliser l'ID : utiliser id si c'est un _id (Supabase retourne id, pas _id)
      const signalementId = id.includes("_id") ? id : id;

      const response = await axios.patch(
        `${API_URL}/signalements/${signalementId}`,
        { statut },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      // Message de confirmation selon le statut
      const messages: Record<string, string> = {
        en_cours:
          "Signalement mis en cours de traitement. Notification envoyée aux utilisateurs.",
        resolu: "Signalement résolu. Notification envoyée aux utilisateurs.",
        rejete: "Signalement rejeté. Notification envoyée aux utilisateurs.",
      };

      if (messages[statut]) {
        alert(messages[statut]);
      }

      // Rafraîchir la liste
      await fetchSignalements();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Erreur lors de la mise à jour du signalement";

      if (error.response?.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/login";
      } else if (error.response?.status === 404) {
        alert("Signalement non trouvé");
      } else {
        alert(`Erreur: ${errorMessage}`);
      }
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      equipement_degrade: "Équipement dégradé",
      fermeture_temporaire: "Fermeture temporaire",
      information_incorrecte: "Information incorrecte",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LogoLoader size="lg" text="Chargement des signalements..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Signalements</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">
          Gérer les signalements des utilisateurs
        </p>
      </div>

      {/* Filtre */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96D0EE]"
        >
          <option value="">Tous les statuts</option>
          <option value="nouveau">Nouveaux</option>
          <option value="en_cours">En cours</option>
          <option value="resolu">Résolus</option>
          <option value="rejete">Rejetés</option>
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {signalements.map((signalement) => (
          <div key={signalement._id} className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <FiAlertCircle className="text-red-500 flex-shrink-0" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {signalement.infrastructure.nom}
                  </h3>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300">
                    {getTypeLabel(signalement.type)}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      signalement.statut === "nouveau"
                        ? "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300"
                        : signalement.statut === "en_cours"
                          ? "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300"
                          : signalement.statut === "resolu"
                            ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300"
                    }`}
                  >
                    {signalement.statut === "nouveau"
                      ? "Nouveau"
                      : signalement.statut === "en_cours"
                        ? "En cours"
                        : signalement.statut === "resolu"
                          ? "Résolu"
                          : "Rejeté"}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                  {signalement.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {signalement.signalePar ? (
                    <>
                      Signalé par {signalement.signalePar.prenom ?? ""}{" "}
                      {signalement.signalePar.nom ?? ""}
                    </>
                  ) : (
                    "Signalé par un utilisateur"
                  )}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                  {new Date(
                    signalement.createdAt || (signalement as any).created_at,
                  ).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedSignalement(signalement);
                    setImageModalUrl(null);
                  }}
                  className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  title="Voir les détails"
                >
                  <FiEye className="w-5 h-5" />
                </button>
                {signalement.statut === "nouveau" && (
                  <>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          signalement._id || (signalement as any).id,
                          "en_cours",
                        )
                      }
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
                    >
                      En cours
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          signalement._id || (signalement as any).id,
                          "resolu",
                        )
                      }
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 text-sm font-medium transition shadow-sm"
                    >
                      <FiCheck /> Résolu
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          signalement._id || (signalement as any).id,
                          "rejete",
                        )
                      }
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 text-sm font-medium transition shadow-sm"
                    >
                      <FiX /> Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Détails du signalement */}
      {selectedSignalement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setSelectedSignalement(null);
            setImageModalUrl(null);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Détails du signalement
              </h2>
              <button
                onClick={() => {
                  setSelectedSignalement(null);
                  setImageModalUrl(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-500 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Infra */}
              <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/60">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Infrastructure
                </span>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">
                  {selectedSignalement.infrastructure?.nom}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  {selectedSignalement.infrastructure?.type || "—"}
                </p>
              </div>
              {/* Type & Statut */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/60">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </span>
                  <p className="text-gray-900 dark:text-slate-100 font-medium mt-1">
                    {getTypeLabel(selectedSignalement.type)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/60">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Statut
                  </span>
                  <p className="text-gray-900 dark:text-slate-100 font-medium mt-1">
                    {selectedSignalement.statut === "nouveau"
                      ? "Nouveau"
                      : selectedSignalement.statut === "en_cours"
                        ? "En cours"
                        : selectedSignalement.statut === "resolu"
                          ? "Résolu"
                          : "Rejeté"}
                  </p>
                </div>
              </div>
              {/* Description */}
              <div>
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Description
                </span>
                <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap text-sm mt-1 bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/60">
                  {selectedSignalement.description}
                </p>
              </div>
              {/* Signalé par */}
              <div>
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Signalé par
                </span>
                <p className="text-gray-900 dark:text-slate-100 mt-1">
                  {selectedSignalement.signalePar
                    ? [
                        selectedSignalement.signalePar.prenom,
                        selectedSignalement.signalePar.nom,
                      ]
                        .filter(Boolean)
                        .join(" ") ||
                      selectedSignalement.signalePar.email ||
                      "—"
                    : "—"}
                </p>
                {selectedSignalement.signalePar?.email && (
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {selectedSignalement.signalePar.email}
                  </p>
                )}
              </div>
              {/* Date et heure du signalement */}
              <div>
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Date et heure du signalement
                </span>
                <p className="text-gray-900 dark:text-slate-100 mt-1 text-sm">
                  {new Date(
                    selectedSignalement.createdAt ||
                      (selectedSignalement as any).created_at,
                  ).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              {/* Traité le + commentaire (si traité) */}
              {(selectedSignalement.traiteLe ||
                selectedSignalement.commentaireTraitement) && (
                <div className="space-y-2">
                  {selectedSignalement.traiteLe && (
                    <div>
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Traité le
                      </span>
                      <p className="text-gray-900 dark:text-slate-100 text-sm mt-1">
                        {new Date(selectedSignalement.traiteLe).toLocaleString(
                          "fr-FR",
                          { dateStyle: "medium", timeStyle: "short" },
                        )}
                      </p>
                    </div>
                  )}
                  {selectedSignalement.commentaireTraitement && (
                    <div>
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Commentaire de traitement
                      </span>
                      <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap text-sm mt-1 bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/60">
                        {selectedSignalement.commentaireTraitement}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {/* Photos du signalement */}
              <div>
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Photos du signalement
                </span>
                {(() => {
                  const raw = selectedSignalement.photos || [];
                  const urls: string[] = (Array.isArray(raw) ? raw : [])
                    .map((p: any) => (typeof p === "string" ? p : p?.url))
                    .filter(Boolean);
                  if (urls.length === 0) {
                    return (
                      <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Aucune photo</p>
                    );
                  }
                  return (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {urls.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImageModalUrl(url)}
                          className="block rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 aspect-square"
                          aria-label={`Ouvrir la photo ${i + 1}`}
                        >
                          <img
                            src={url}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {imageModalUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-3 -right-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-full shadow-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-700"
              aria-label="Fermer l'image"
            >
              <FiX className="w-5 h-5" />
            </button>
            <img
              src={imageModalUrl}
              alt="Photo agrandie"
              className="w-full max-h-[85vh] object-contain rounded-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}

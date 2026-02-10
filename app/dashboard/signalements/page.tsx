"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FiAlertCircle, FiCheck, FiX, FiEye } from "react-icons/fi";

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
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Signalements</h1>
        <p className="text-gray-600 mt-1">
          Gérer les signalements des utilisateurs
        </p>
      </div>

      {/* Filtre */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
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
          <div key={signalement._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FiAlertCircle className="text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {signalement.infrastructure.nom}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    {getTypeLabel(signalement.type)}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      signalement.statut === "nouveau"
                        ? "bg-red-100 text-red-800"
                        : signalement.statut === "en_cours"
                          ? "bg-yellow-100 text-yellow-800"
                          : signalement.statut === "resolu"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
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
                <p className="text-sm text-gray-700 mb-2">
                  {signalement.description}
                </p>
                <p className="text-sm text-gray-500">
                  {signalement.signalePar ? (
                    <>
                      Signalé par {signalement.signalePar.prenom ?? ""}{" "}
                      {signalement.signalePar.nom ?? ""}
                    </>
                  ) : (
                    "Signalé par un utilisateur"
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-2">
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
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
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
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
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
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setSelectedSignalement(null);
            setImageModalUrl(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Détails du signalement
              </h2>
              <button
                onClick={() => {
                  setSelectedSignalement(null);
                  setImageModalUrl(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Infra */}
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Infrastructure
                </span>
                <p className="font-medium text-gray-900">
                  {selectedSignalement.infrastructure?.nom}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedSignalement.infrastructure?.type || "—"}
                </p>
              </div>
              {/* Type & Statut */}
              <div className="flex gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Type
                  </span>
                  <p className="text-gray-900">
                    {getTypeLabel(selectedSignalement.type)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </span>
                  <p className="text-gray-900">
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
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Description
                </span>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedSignalement.description}
                </p>
              </div>
              {/* Signalé par */}
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Signalé par
                </span>
                <p className="text-gray-900">
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
                  <p className="text-sm text-gray-500">
                    {selectedSignalement.signalePar.email}
                  </p>
                )}
              </div>
              {/* Date et heure du signalement */}
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Date et heure du signalement
                </span>
                <p className="text-gray-900">
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
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        Traité le
                      </span>
                      <p className="text-gray-900">
                        {new Date(selectedSignalement.traiteLe).toLocaleString(
                          "fr-FR",
                          { dateStyle: "medium", timeStyle: "short" },
                        )}
                      </p>
                    </div>
                  )}
                  {selectedSignalement.commentaireTraitement && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        Commentaire de traitement
                      </span>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedSignalement.commentaireTraitement}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {/* Photos du signalement */}
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Photos du signalement
                </span>
                {(() => {
                  const raw = selectedSignalement.photos || [];
                  const urls: string[] = (Array.isArray(raw) ? raw : [])
                    .map((p: any) => (typeof p === "string" ? p : p?.url))
                    .filter(Boolean);
                  if (urls.length === 0) {
                    return (
                      <p className="text-gray-500 text-sm mt-1">Aucune photo</p>
                    );
                  }
                  return (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {urls.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImageModalUrl(url)}
                          className="block rounded-lg overflow-hidden border border-gray-200 aspect-square"
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
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full shadow p-2 hover:bg-gray-100"
              aria-label="Fermer l'image"
            >
              <FiX className="w-5 h-5" />
            </button>
            <img
              src={imageModalUrl}
              alt="Photo agrandie"
              className="w-full max-h-[85vh] object-contain rounded-lg bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}

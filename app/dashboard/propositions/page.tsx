"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import LogoLoader from "@/components/LogoLoader";
import {
  FiClock,
  FiCheck,
  FiX,
  FiEye,
  FiMapPin,
  FiXCircle,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface PropositionUser {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
}

interface PropositionLocalisation {
  adresse?: string;
  quartier?: string;
  commune?: string;
  coordinates?: [number, number];
}

interface PropositionContact {
  telephone?: string;
  website?: string;
}

interface Proposition {
  id: string;
  nom: string;
  type: string;
  localisation?: PropositionLocalisation;
  statut: string;
  propose_par?: PropositionUser;
  description?: string;
  photos?: string[];
  images?: string[];
  contact?: PropositionContact;
  horaires?: Record<string, string>;
  openingHours?: Record<string, string>;
  equipements?: string[];
  equipments?: string[];
  createdAt?: string;
  created_at?: string;
}

interface CreatedInfrastructure {
  id?: string;
  _id?: string;
  nom?: string;
  localisation?: {
    adresse?: string;
    quartier?: string;
  };
  type?: string;
}

export default function PropositionsPage() {
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProposition, setSelectedProposition] =
    useState<Proposition | null>(null);
  const [processingAction, setProcessingAction] = useState<{
    id: string;
    type: "approve" | "reject";
  } | null>(null);
  const [recentInfrastructure, setRecentInfrastructure] =
    useState<CreatedInfrastructure | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPropositions();
  }, [filter]);

  const fetchPropositions = async () => {
    try {
      const params = filter ? `?statut=${filter}` : "";
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/propositions${params}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      setPropositions(response.data.data ?? []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      setProcessingAction({ id, type: "approve" });
      const response = await axios.post(
        `${API_URL}/propositions/${id}/approuver`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );
      const infrastructure: CreatedInfrastructure | undefined =
        response.data?.infrastructure;

      // Mettre à jour immédiatement le statut dans la liste
      setPropositions((prev) =>
        prev.map((prop) =>
          prop.id === id ? { ...prop, statut: "approuve" } : prop,
        ),
      );

      // Mettre à jour aussi la proposition sélectionnée dans la modal si c'est celle-ci
      if (selectedProposition?.id === id) {
        setSelectedProposition({ ...selectedProposition, statut: "approuve" });
      }

      if (infrastructure) {
        setRecentInfrastructure(infrastructure);
      }

      // Rafraîchir la liste depuis le serveur
      await fetchPropositions();

      // Déclencher un événement pour rafraîchir la page infrastructures si elle est ouverte
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("infrastructureCreated", {
            detail: {
              infrastructureId: infrastructure?.id || infrastructure?._id,
            },
          }),
        );
      }

      // Fermer la modal après un court délai pour montrer le succès
      if (selectedProposition?.id === id) {
        setTimeout(() => {
          closeDetails();
        }, 1500);
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de l'approbation:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Erreur lors de l'approbation de la proposition. Veuillez réessayer.";
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (id: string) => {
    const commentaire = prompt("Raison du rejet (optionnel):");
    try {
      const token = localStorage.getItem("token");
      setProcessingAction({ id, type: "reject" });
      await axios.post(
        `${API_URL}/propositions/${id}/rejeter`,
        {
          commentaire,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );
      setPropositions((prev) =>
        prev.map((prop) =>
          prop.id === id
            ? {
                ...prop,
                statut: "rejete",
                commentaire_moderation: commentaire ?? "",
              }
            : prop,
        ),
      );
      fetchPropositions();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setProcessingAction(null);
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

  const openDetails = (proposition: Proposition) => {
    setSelectedProposition(proposition);
    setDetailModalOpen(true);
  };

  const closeDetails = () => {
    setDetailModalOpen(false);
    setSelectedProposition(null);
    setImageModalUrl(null);
  };

  const formatCoordinate = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "—";
    }
    return value.toFixed(6);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LogoLoader size="lg" text="Chargement des propositions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recentInfrastructure && (
        <div className="bg-green-50 dark:bg-green-950/40 border-2 border-green-300 dark:border-green-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <FiCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-green-800 dark:text-green-300 font-semibold text-lg">
                  ✅ Proposition approuvée avec succès
                </p>
                <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                  L'infrastructure{" "}
                  <strong>
                    {recentInfrastructure.nom || "Une infrastructure"}
                  </strong>{" "}
                  a été automatiquement ajoutée à la liste des infrastructures
                  et est maintenant visible par tous les utilisateurs.
                </p>
              </div>
            </div>
            <button
              onClick={() => setRecentInfrastructure(null)}
              className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40"
              aria-label="Fermer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/infrastructures"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-green-700 dark:text-green-300 text-sm font-medium rounded-xl border border-green-300 dark:border-green-800 hover:bg-green-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FiEye />
              Toutes les infrastructures
            </Link>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Propositions</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">
          Modérer les propositions d'infrastructures
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
          <option value="en_attente">En attente</option>
          <option value="approuve">Approuvées</option>
          <option value="rejete">Rejetées</option>
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {propositions.map((prop) => (
          <div key={prop.id} className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {prop.nom}
                  </h3>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300">
                    {getTypeLabel(prop.type)}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      prop.statut === "en_attente"
                        ? "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300"
                        : prop.statut === "approuve"
                          ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {prop.statut === "en_attente"
                      ? "En attente"
                      : prop.statut === "approuve"
                        ? "Approuvée"
                        : "Rejetée"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-2 flex items-center">
                  <FiClock className="inline mr-1 text-primary-500" />
                  {prop.localisation?.adresse ?? "Adresse inconnue"}
                  {prop.localisation?.quartier
                    ? `, ${prop.localisation?.quartier}`
                    : ""}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {(() => {
                    const proposer = prop.propose_par;
                    const nameParts =
                      proposer != null
                        ? [proposer.prenom, proposer.nom].filter(
                            (value): value is string => {
                              if (typeof value !== "string") return false;
                              return value.trim().length > 0;
                            },
                          )
                        : [];
                    const displayName =
                      nameParts.length > 0
                        ? nameParts.join(" ")
                        : "Utilisateur inconnu";
                    const email = proposer?.email ?? "Email inconnu";
                    return `Proposé par ${displayName} (${email})`;
                  })()}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                  {(() => {
                    const createdOn = prop.createdAt || prop.created_at;
                    if (!createdOn) {
                      return "Date inconnue";
                    }
                    const date = new Date(createdOn);
                    return isNaN(date.getTime())
                      ? "Date inconnue"
                      : date.toLocaleDateString("fr-FR");
                  })()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openDetails(prop)}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <FiEye /> Voir les détails
                </button>
                {prop.statut === "en_attente" ? (
                  <>
                    <button
                      onClick={() => handleApprove(prop.id)}
                      disabled={processingAction?.id === prop.id}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-60 flex items-center gap-2 text-sm font-medium shadow-sm transition"
                    >
                      <FiCheck />
                      {processingAction?.id === prop.id &&
                      processingAction.type === "approve"
                        ? "Approbation..."
                        : "Approuver"}
                    </button>
                    <button
                      onClick={() => handleReject(prop.id)}
                      disabled={processingAction?.id === prop.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-60 flex items-center gap-2 text-sm font-medium shadow-sm transition"
                    >
                      <FiX />
                      {processingAction?.id === prop.id &&
                      processingAction.type === "reject"
                        ? "Rejet..."
                        : "Rejeter"}
                    </button>
                  </>
                ) : prop.statut === "approuve" ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-xl flex items-center gap-2 cursor-default text-sm font-medium"
                  >
                    <FiCheck /> Déjà approuvée
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded-xl flex items-center gap-2 cursor-default text-sm font-medium"
                  >
                    <FiX /> Rejetée
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {detailModalOpen && selectedProposition && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-gray-100 dark:border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedProposition.nom}
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                  {getTypeLabel(selectedProposition.type)} • Statut :{" "}
                  <span className="font-semibold text-gray-700 dark:text-slate-200">
                    {selectedProposition.statut}
                  </span>
                </p>
              </div>
              <button
                onClick={closeDetails}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                aria-label="Fermer"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                Description
              </h3>
              <p className="text-gray-600 dark:text-slate-300 whitespace-pre-line text-sm">
                {selectedProposition.description ||
                  "Aucune description fournie."}
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Localisation
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
                  <FiMapPin className="text-primary-500 flex-shrink-0" />
                  {selectedProposition.localisation?.adresse ||
                    "Adresse inconnue"}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Quartier : {selectedProposition.localisation?.quartier || "—"}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Commune : {selectedProposition.localisation?.commune || "—"}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Coordonnées : lat{" "}
                  {formatCoordinate(
                    selectedProposition.localisation?.coordinates?.[1],
                  )}{" "}
                  / long{" "}
                  {formatCoordinate(
                    selectedProposition.localisation?.coordinates?.[0],
                  )}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Contact
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Téléphone :{" "}
                  {selectedProposition.contact?.telephone || "Non fourni"}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Site web :{" "}
                  {selectedProposition.contact?.website ? (
                    <a
                      href={selectedProposition.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {selectedProposition.contact.website}
                    </a>
                  ) : (
                    "Non fourni"
                  )}
                </p>
              </div>
            </section>

            {(() => {
              const schedule = (selectedProposition.horaires ||
                selectedProposition.openingHours) as
                | Record<string, string>
                | undefined;
              if (!schedule || Object.keys(schedule).length === 0) {
                return null;
              }
              const entries = Object.entries(schedule).filter(
                ([, value]) =>
                  typeof value === "string" && value.trim().length > 0,
              );
              if (entries.length === 0) {
                return null;
              }
              return (
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                    Horaires d'ouverture
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {entries.map(([day, hours]) => (
                      <div
                        key={day}
                        className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/60 rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-slate-200 border border-gray-100 dark:border-slate-700/50"
                      >
                        <span className="font-medium">
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </span>
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {(() => {
              const equipments =
                selectedProposition.equipements ||
                selectedProposition.equipments;
              if (!equipments || equipments.length === 0) {
                return null;
              }
              const filteredEquipments = equipments.filter(
                (equipment) =>
                  typeof equipment === "string" && equipment.trim().length > 0,
              );
              if (filteredEquipments.length === 0) {
                return null;
              }
              return (
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                    Équipements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredEquipments.map((equipment) => (
                      <span
                        key={equipment}
                        className="px-3 py-1 text-sm rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-medium"
                      >
                        {equipment}
                      </span>
                    ))}
                  </div>
                </section>
              );
            })()}

            {(() => {
              // Normaliser : photos / images, string ou { url }
              const raw =
                selectedProposition.photos || selectedProposition.images || [];
              const urls = (Array.isArray(raw) ? raw : [])
                .map((p) =>
                  typeof p === "string"
                    ? p
                    : p && (p as { url?: string }).url
                      ? (p as { url: string }).url
                      : null,
                )
                .filter((u): u is string => Boolean(u));

              if (urls.length === 0) {
                return (
                  <section className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                      Photos
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Aucune photo jointe à cette proposition.
                    </p>
                  </section>
                );
              }

              const placeholderSvg =
                "data:image/svg+xml," +
                encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#1e293b" width="200" height="200"/><text x="100" y="105" text-anchor="middle" fill="#64748b" font-size="14" font-family="sans-serif">Image indisponible</text></svg>',
                );

              return (
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                    Photos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {urls.map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() => setImageModalUrl(url)}
                        className="block relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:ring-2 hover:ring-blue-300 transition-shadow"
                        aria-label={`Ouvrir la photo ${index + 1}`}
                      >
                        <img
                          src={url}
                          alt={`Photo ${index + 1} — ${selectedProposition.nom}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = placeholderSvg;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </section>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
              {selectedProposition.statut === "en_attente" ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleApprove(selectedProposition.id)}
                    disabled={processingAction?.id === selectedProposition.id}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-60 flex items-center gap-2 text-sm font-medium shadow-sm transition"
                  >
                    <FiCheck />
                    {processingAction?.id === selectedProposition.id &&
                    processingAction.type === "approve"
                      ? "Approbation..."
                      : "Approuver"}
                  </button>
                  <button
                    onClick={() => handleReject(selectedProposition.id)}
                    disabled={processingAction?.id === selectedProposition.id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-60 flex items-center gap-2 text-sm font-medium shadow-sm transition"
                  >
                    <FiX />
                    {processingAction?.id === selectedProposition.id &&
                    processingAction.type === "reject"
                      ? "Rejet..."
                      : "Rejeter"}
                  </button>
                </div>
              ) : selectedProposition.statut === "approuve" ? (
                <div className="flex items-center gap-3">
                  <button
                    disabled
                    className="px-4 py-2 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-xl flex items-center gap-2 cursor-default text-sm font-medium"
                  >
                    <FiCheck /> Déjà approuvée
                  </button>
                  <button
                    onClick={closeDetails}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-medium transition"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-xl flex items-center gap-2 cursor-default text-sm font-medium"
                  >
                    <FiX /> Rejetée
                  </button>
                  <button
                    onClick={closeDetails}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-medium transition"
                  >
                    Fermer
                  </button>
                </div>
              )}
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

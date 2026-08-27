"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
} from "react-icons/fi";
import Link from "next/link";
import LogoLoader from "@/components/LogoLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Infrastructure {
  id?: string;
  _id?: string;
  nom: string;
  type: string;
  description?: string;
  localisation?: {
    type?: string;
    coordinates?: number[];
    adresse?: string;
    quartier?: string;
    commune?: string;
  };
  contact?: {
    telephone?: string;
    email?: string;
  };
  etat: string;
  niveau_frequentation?: string;
  niveauFrequentation?: string;
  accessibilite?: {
    pmr: boolean;
    enfants: boolean;
  };
  equipements?: string[];
  horaires?: {
    [key: string]: {
      ouvert: boolean;
      debut: string;
      fin: string;
    };
  };
  photos?: Array<{ url: string; uploadedAt?: string }>;
  note_moyenne?: number;
  noteMoyenne?: number;
  nombre_avis?: number;
  nombreAvis?: number;
  valide?: boolean;
  cree_par?: any;
  valide_par?: any;
}

const joursLabels: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

const normalizeHoraires = (
  horaires?: Infrastructure["horaires"],
): NonNullable<Infrastructure["horaires"]> => {
  const normalized = {} as NonNullable<Infrastructure["horaires"]>;
  Object.keys(joursLabels).forEach((jour) => {
    const h = horaires?.[jour];
    normalized[jour] = {
      ouvert: Boolean(h?.ouvert),
      debut: h?.debut ?? "",
      fin: h?.fin ?? "",
    };
  });
  return normalized;
};

export default function InfrastructureDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [infrastructure, setInfrastructure] = useState<Infrastructure | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (id) {
      fetchInfrastructure();
    }
  }, [id]);

  const fetchInfrastructure = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/infrastructures/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data as Infrastructure;
      setInfrastructure({
        ...data,
        horaires: normalizeHoraires(data.horaires),
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors du chargement de l'infrastructure",
      );
    } finally {
      setLoading(false);
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
      excellent: "bg-green-100 text-green-800",
      bon: "bg-blue-100 text-blue-800",
      moyen: "bg-yellow-100 text-yellow-800",
      degrade: "bg-orange-100 text-orange-800",
      ferme: "bg-red-100 text-red-800",
    };
    return colors[etat] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LogoLoader size="xl" text="Chargement de l'infrastructure..." />
      </div>
    );
  }

  if (error || !infrastructure) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/infrastructures"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="w-5 h-5" />
          Retour
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || "Infrastructure non trouvée"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/infrastructures"
            className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {infrastructure.nom}
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              {getTypeLabel(infrastructure.type)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {infrastructure.description && (
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                Description
              </h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">{infrastructure.description}</p>
            </div>
          )}

          {/* Photos */}
          {infrastructure.photos && infrastructure.photos.length > 0 && (
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                Photos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {infrastructure.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Horaires */}
          {infrastructure.horaires && (
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiClock className="w-5 h-5 text-primary-500" />
                Horaires d'ouverture
              </h2>
              <div className="space-y-2">
                {Object.entries(infrastructure.horaires).map(
                  ([jour, horaire]) => (
                    <div
                      key={jour}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700/50 last:border-0 transition"
                    >
                      <span className="font-medium text-gray-700 dark:text-slate-200 text-sm">
                        {joursLabels[jour] || jour}
                      </span>
                      {horaire.ouvert ? (
                        <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                          {horaire.debut} - {horaire.fin}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1 rounded-full">
                          Fermé
                        </span>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Équipements */}
          {infrastructure.equipements &&
            infrastructure.equipements.length > 0 && (
              <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Équipements
                </h2>
                <div className="flex flex-wrap gap-2">
                  {infrastructure.equipements.map((equipement, index) => (
                    <span
                      key={index}
                      className="px-3.5 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/40 rounded-full text-xs font-semibold"
                    >
                      {equipement}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations principales */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
              Informations
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  État
                </label>
                <div className="mt-1">
                  <span
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${getEtatColor(infrastructure.etat)}`}
                  >
                    {infrastructure.etat}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Niveau de fréquentation
                </label>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {infrastructure.niveau_frequentation ||
                    infrastructure.niveauFrequentation ||
                    "Non renseigné"}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Note moyenne
                </label>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {(
                    (infrastructure.note_moyenne ??
                      infrastructure.noteMoyenne) ||
                    0
                  ).toFixed(1)}
                  /5
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-normal">
                    {` (${(infrastructure.nombre_avis ?? infrastructure.nombreAvis) || 0} avis)`}
                  </span>
                </p>
              </div>

              {infrastructure.valide !== undefined && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Statut
                  </label>
                  <div className="mt-1">
                    {infrastructure.valide ? (
                      <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/40">
                        Validée
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/40">
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Localisation */}
          {infrastructure.localisation && (
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiMapPin className="w-5 h-5 text-primary-500" />
                Localisation
              </h2>
              <div className="space-y-3">
                {infrastructure.localisation.adresse && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Adresse
                    </label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {infrastructure.localisation.adresse}
                    </p>
                  </div>
                )}
                {infrastructure.localisation.quartier && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Quartier
                    </label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {infrastructure.localisation.quartier}
                    </p>
                  </div>
                )}
                {infrastructure.localisation.commune && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Commune
                    </label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {infrastructure.localisation.commune}
                    </p>
                  </div>
                )}
                {infrastructure.localisation.coordinates &&
                  infrastructure.localisation.coordinates.length >= 2 && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Coordonnées GPS
                      </label>
                      <p className="mt-1 text-xs font-mono text-gray-700 dark:text-slate-300">
                        {infrastructure.localisation.coordinates[1]?.toFixed(6)}
                        ,{" "}
                        {infrastructure.localisation.coordinates[0]?.toFixed(6)}
                      </p>
                    </div>
                  )}
                {!infrastructure.localisation.adresse &&
                  !infrastructure.localisation.quartier &&
                  !infrastructure.localisation.commune &&
                  !infrastructure.localisation.coordinates && (
                    <p className="text-gray-500 dark:text-slate-400 text-sm italic">
                      Aucune information de localisation disponible
                    </p>
                  )}
              </div>
            </div>
          )}

          {/* Contact */}
          {infrastructure.contact &&
            (infrastructure.contact.telephone ||
              infrastructure.contact.email) && (
              <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Contact
                </h2>
                <div className="space-y-3">
                  {infrastructure.contact.telephone && (
                    <div className="flex items-center gap-2.5">
                      <FiPhone className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                      <a
                        href={`tel:${infrastructure.contact.telephone}`}
                        className="text-sm font-semibold text-primary-600 dark:text-[#96D0EE] hover:underline"
                      >
                        {infrastructure.contact.telephone}
                      </a>
                    </div>
                  )}
                  {infrastructure.contact.email && (
                    <div className="flex items-center gap-2.5">
                      <FiMail className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                      <a
                        href={`mailto:${infrastructure.contact.email}`}
                        className="text-sm font-semibold text-primary-600 dark:text-[#96D0EE] hover:underline"
                      >
                        {infrastructure.contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Accessibilité */}
          {infrastructure.accessibilite && (
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                Accessibilité
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${infrastructure.accessibilite.pmr ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-gray-300 dark:bg-slate-600"}`}
                  ></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Accessible PMR</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${infrastructure.accessibilite.enfants ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-gray-300 dark:bg-slate-600"}`}
                  ></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Adapté aux enfants</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

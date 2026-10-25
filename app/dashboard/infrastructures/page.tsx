"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FiMapPin,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiEye,
  FiSearch,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
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
    adresse?: string;
    quartier?: string;
    commune?: string;
    coordinates?: [number, number];
  };
  etat: string;
  valide: boolean;
  noteMoyenne?: number;
  note_moyenne?: number;
  nombreAvis?: number;
  nombre_avis?: number;
  created_at?: string;
}

// 10 Catégories principales alignées avec l'application mobile Flutter (AppConstants.infrastructureServices)
interface ServiceCategory {
  id: string;
  label: string;
  icon: string;
  types: string[];
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "admin",
    label: "Administratif",
    icon: "🏛️",
    types: [
      "mairie",
      "prefecture",
      "bureau_de_poste",
      "centre_des_impots",
      "pole_emploi",
    ],
  },
  {
    id: "sante",
    label: "Santé",
    icon: "🏥",
    types: [
      "hopital",
      "clinique",
      "pharmacie",
      "cabinet_medical",
      "dentiste",
      "centre_sante",
      "hopital_d_urgence",
      "centre_de_secours",
    ],
  },
  {
    id: "education",
    label: "Éducation",
    icon: "🎓",
    types: [
      "universite",
      "lycee",
      "college",
      "ecole_primaire",
      "bibliotheque",
      "centre_formation",
    ],
  },
  {
    id: "commercial",
    label: "Commerce & Finance",
    icon: "🛒",
    types: [
      "supermarche",
      "centre_commercial",
      "marche",
      "banque",
      "restaurant",
    ],
  },
  {
    id: "transport",
    label: "Transport",
    icon: "🚌",
    types: [
      "gare",
      "aeroport",
      "arret_de_bus",
      "station_de_taxi",
    ],
  },
  {
    id: "culture_sport",
    label: "Culture & Sport",
    icon: "🎭",
    types: [
      "espace_divertissement",
      "musee",
      "theatre",
      "cinema",
      "parc",
      "parc_jeux",
      "installation_sportive",
      "salle_de_sport",
    ],
  },
  {
    id: "securite",
    label: "Urgence & Sécurité",
    icon: "🚨",
    types: [
      "commissariat",
      "caserne_de_pompiers",
      "caserne_pompiers",
      "centre_de_secours",
      "hopital_d_urgence",
    ],
  },
  {
    id: "public_energie",
    label: "Services Publics",
    icon: "⚡",
    types: [
      "eau_et_assainissement",
      "eau_assainissement",
      "centrale_electrique",
      "gestion_des_dechets_et_salubrite_urbaine",
      "station_service",
      "parking_public",
      "toilettes_publiques",
    ],
  },
  {
    id: "social",
    label: "Social & Communautaire",
    icon: "🤝",
    types: [
      "centre_social",
      "creche",
      "centre_de_loisirs",
      "association_caritative",
    ],
  },
  {
    id: "religion",
    label: "Culte & Religion",
    icon: "🕊️",
    types: [
      "eglise",
      "mosquee",
      "temple",
    ],
  },
];

// Dictionnaire exhaustif des labels lisibles en français pour chaque type d'infrastructure
const ALL_TYPES: Record<string, string> = {
  // Services Administratifs
  mairie: "Mairie",
  prefecture: "Préfecture",
  bureau_de_poste: "Bureau de poste",
  centre_des_impots: "Centre des impôts",
  pole_emploi: "Pôle emploi",

  // Services de Santé
  hopital: "Hôpital",
  clinique: "Clinique",
  pharmacie: "Pharmacie",
  centre_sante: "Centre de santé",
  cabinet_medical: "Cabinet médical",
  dentiste: "Dentiste",
  hopital_d_urgence: "Hôpital d'urgence",
  centre_de_secours: "Centre de secours",

  // Services Éducatifs
  ecole_primaire: "École primaire",
  college: "Collège",
  lycee: "Lycée",
  universite: "Université",
  bibliotheque: "Bibliothèque",
  centre_formation: "Centre de formation",

  // Culture & Sport
  musee: "Musée",
  theatre: "Théâtre",
  cinema: "Cinéma",
  parc: "Parc",
  parc_jeux: "Parc / Aire de jeux",
  salle_de_sport: "Salle de sport",
  installation_sportive: "Installation sportive",
  espace_divertissement: "Espace divertissement",

  // Services Commerciaux
  supermarche: "Supermarché",
  centre_commercial: "Centre commercial",
  marche: "Marché",
  banque: "Banque",
  restaurant: "Restaurant",

  // Services de Transport
  gare: "Gare",
  aeroport: "Aéroport",
  arret_de_bus: "Arrêt de bus",
  station_de_taxi: "Station de taxi",

  // Urgence et Sécurité
  commissariat: "Commissariat",
  caserne_de_pompiers: "Caserne de pompiers",
  caserne_pompiers: "Caserne de pompiers",

  // Services Publics et Infrastructure
  eau_et_assainissement: "Eau et assainissement",
  eau_assainissement: "Eau et assainissement",
  centrale_electrique: "Centrale électrique",
  gestion_des_dechets_et_salubrite_urbaine: "Gestion des déchets & salubrité",
  station_service: "Station-service",
  parking_public: "Parking public",
  toilettes_publiques: "Toilettes publiques",

  // Services Sociaux
  centre_social: "Centre social",
  creche: "Crèche",
  centre_de_loisirs: "Centre de loisirs",
  association_caritative: "Association caritative",

  // Services Religieux
  eglise: "Église",
  mosquee: "Mosquée",
  temple: "Temple",

  // Autres
  autre: "Autre",
};

export default function InfrastructuresPage() {
  const [allInfrastructures, setAllInfrastructures] = useState<Infrastructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtres
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState("");
  const [filterQuartier, setFilterQuartier] = useState("");
  const [filterValide, setFilterValide] = useState("");
  const [filterEtat, setFilterEtat] = useState("");

  // Pagination & Affichage (50 infrastructures par page)
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);

  useEffect(() => {
    fetchAllInfrastructures();
  }, []);

  useEffect(() => {
    const handler = () => fetchAllInfrastructures();
    if (typeof window !== "undefined") {
      window.addEventListener("infrastructureCreated", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("infrastructureCreated", handler);
      }
    };
  }, []);

  const fetchAllInfrastructures = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const token = localStorage.getItem("token");
      // Récupération complète sans limitation arbitraire
      const response = await axios.get(`${API_URL}/infrastructures?limit=all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = response.data.infrastructures || response.data.data || [];
      setAllInfrastructures(data);
    } catch (error) {
      console.error("Erreur chargement infrastructures:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calcul du nombre d'infrastructures par catégorie
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allInfrastructures.length };
    SERVICE_CATEGORIES.forEach((cat) => {
      counts[cat.id] = allInfrastructures.filter((infra) =>
        cat.types.includes(infra.type)
      ).length;
    });
    return counts;
  }, [allInfrastructures]);

  // Types disponibles selon la catégorie sélectionnée
  const availableTypesForCategory = useMemo(() => {
    if (selectedCategory === "all") {
      return Object.keys(ALL_TYPES);
    }
    const cat = SERVICE_CATEGORIES.find((c) => c.id === selectedCategory);
    return cat ? cat.types : Object.keys(ALL_TYPES);
  }, [selectedCategory]);

  // Filtrage combiné haute performance côté client
  const filteredInfrastructures = useMemo(() => {
    return allInfrastructures.filter((infra) => {
      // 1. Recherche texte (nom, adresse, quartier, commune, type ou label lisible)
      if (searchText.trim()) {
        const query = searchText.toLowerCase().trim();
        const typeLabel = (ALL_TYPES[infra.type] || infra.type || "").toLowerCase();
        const nameMatch = infra.nom?.toLowerCase().includes(query);
        const addressMatch = infra.localisation?.adresse?.toLowerCase().includes(query);
        const quartierMatch = infra.localisation?.quartier?.toLowerCase().includes(query);
        const communeMatch = infra.localisation?.commune?.toLowerCase().includes(query);
        const typeMatch = infra.type?.toLowerCase().includes(query) || typeLabel.includes(query);

        if (!nameMatch && !addressMatch && !quartierMatch && !communeMatch && !typeMatch) {
          return false;
        }
      }

      // 2. Filtre par Catégorie principale
      if (selectedCategory !== "all") {
        const cat = SERVICE_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat && !cat.types.includes(infra.type)) {
          return false;
        }
      }

      // 3. Filtre par Type spécifique
      if (filterType && infra.type !== filterType) {
        return false;
      }

      // 4. Filtre par Quartier ou Commune
      if (filterQuartier.trim()) {
        const q = filterQuartier.toLowerCase().trim();
        const inQuartier = infra.localisation?.quartier?.toLowerCase().includes(q);
        const inCommune = infra.localisation?.commune?.toLowerCase().includes(q);
        if (!inQuartier && !inCommune) {
          return false;
        }
      }

      // 5. Filtre par Statut (Validé / En attente)
      if (filterValide !== "") {
        const isValide = filterValide === "true";
        if (infra.valide !== isValide) {
          return false;
        }
      }

      // 6. Filtre par État
      if (filterEtat && infra.etat !== filterEtat) {
        return false;
      }

      return true;
    });
  }, [allInfrastructures, searchText, selectedCategory, filterType, filterQuartier, filterValide, filterEtat]);

  // Pagination dynamique
  const totalFiltered = filteredInfrastructures.length;
  const effectivePerPage = itemsPerPage === -1 ? (totalFiltered || 1) : itemsPerPage;
  const totalPages = Math.ceil(totalFiltered / effectivePerPage) || 1;
  const paginatedItems = useMemo(() => {
    if (itemsPerPage === -1) return filteredInfrastructures;
    const start = (page - 1) * itemsPerPage;
    return filteredInfrastructures.slice(start, start + itemsPerPage);
  }, [filteredInfrastructures, page, itemsPerPage]);

  const goToPage = (newPage: number) => {
    const target = Math.max(1, Math.min(totalPages, newPage));
    setPage(target);
    if (typeof window !== "undefined") {
      const elem = document.getElementById("infrastructures-table-container");
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Statistiques
  const statsTotal = allInfrastructures.length;
  const statsValide = allInfrastructures.filter((i) => i.valide).length;
  const statsEnAttente = allInfrastructures.filter((i) => !i.valide).length;
  const statsExcellent = allInfrastructures.filter((i) => i.etat === "excellent").length;

  const resetFilters = () => {
    setSearchText("");
    setSelectedCategory("all");
    setFilterType("");
    setFilterQuartier("");
    setFilterValide("");
    setFilterEtat("");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchText) ||
    selectedCategory !== "all" ||
    Boolean(filterType) ||
    Boolean(filterQuartier) ||
    filterValide !== "" ||
    Boolean(filterEtat);

  const handleValidate = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/infrastructures/${id}/valider`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      fetchAllInfrastructures();
    } catch (error) {
      console.error("Erreur validation:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette infrastructure ? Action irréversible.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/infrastructures/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchAllInfrastructures();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const getTypeLabel = (type: string) => ALL_TYPES[type] || type?.replace(/_/g, " ") || "Non spécifié";

  const getEtatColor = (etat: string) => {
    const colors: Record<string, string> = {
      excellent: "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/40",
      bon: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
      moyen: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/40",
      degrade: "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/40",
      ferme: "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/40",
    };
    return colors[etat] || "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LogoLoader size="lg" text="Chargement de toutes les infrastructures..." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Infrastructures
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
              {statsTotal}
            </span>
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
            Toutes les infrastructures géographiques de la base de données et de l&apos;application mobile
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => fetchAllInfrastructures(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Actualiser les données"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/dashboard/infrastructures/nouveau"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 font-medium text-sm hover:shadow"
          >
            + Ajouter une infrastructure
          </Link>
        </div>
      </div>

      {/* Cartes de statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total en base",
            value: statsTotal,
            sub: "Infrastructures enregistrées",
            color: "text-gray-900 dark:text-white",
            bg: "bg-white dark:bg-slate-800/90",
          },
          {
            label: "Validées (publiques)",
            value: statsValide,
            sub: "Visibles sur mobile",
            color: "text-green-700 dark:text-green-400",
            bg: "bg-green-50/70 dark:bg-green-950/30",
          },
          {
            label: "En attente de validation",
            value: statsEnAttente,
            sub: "À vérifier",
            color: "text-yellow-700 dark:text-yellow-400",
            bg: "bg-yellow-50/70 dark:bg-yellow-950/30",
          },
          {
            label: "Excellent état",
            value: statsExcellent,
            sub: "Notées en bon état",
            color: "text-blue-700 dark:text-blue-400",
            bg: "bg-blue-50/70 dark:bg-blue-950/30",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-2xl border border-gray-100 dark:border-slate-700/70 px-4 py-3.5 shadow-sm transition hover:shadow-md`}
          >
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Barre de navigation des 10 Catégories principales (comme l'application mobile) */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-100 dark:border-slate-700/70 p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Filtrer par catégorie principale
          </span>
          {selectedCategory !== "all" && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setFilterType("");
                setPage(1);
              }}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Afficher toutes les catégories
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => {
              setSelectedCategory("all");
              setFilterType("");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedCategory === "all"
                ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                : "bg-gray-50 dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <span>🌐</span>
            <span>Toutes</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === "all"
                  ? "bg-white/20 text-white"
                  : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300"
              }`}
            >
              {categoryCounts.all || 0}
            </span>
          </button>

          {SERVICE_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(isSelected ? "all" : cat.id);
                  setFilterType("");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                    : "bg-gray-50 dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barre de recherche rapide et filtres avancés */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-4 space-y-3">
        {/* Champ de recherche instantanée */}
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Recherche rapide instantanée : nom, quartier, adresse, type, service..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-900 transition"
          />
          {searchText && (
            <button
              onClick={() => {
                setSearchText("");
                setPage(1);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              title="Effacer"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ligne des filtres détaillés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Sélection Type / Sous-service */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              Sous-type de service
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">
                {selectedCategory !== "all" ? "Tous les types de cette catégorie" : "Tous les types"}
              </option>
              {selectedCategory === "all" ? (
                SERVICE_CATEGORIES.map((cat) => (
                  <optgroup key={cat.id} label={`${cat.icon} ${cat.label}`}>
                    {cat.types.map((typeKey) => (
                      <option key={typeKey} value={typeKey}>
                        {ALL_TYPES[typeKey] || typeKey}
                      </option>
                    ))}
                  </optgroup>
                ))
              ) : (
                availableTypesForCategory.map((typeKey) => (
                  <option key={typeKey} value={typeKey}>
                    {ALL_TYPES[typeKey] || typeKey}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Filtre Quartier / Commune */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              Quartier ou Commune
            </label>
            <input
              type="text"
              placeholder="Ex: Cadjèhoun, Akpakpa, Dantokpa..."
              value={filterQuartier}
              onChange={(e) => {
                setFilterQuartier(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filtre Statut de validation */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              Statut
            </label>
            <select
              value={filterValide}
              onChange={(e) => {
                setFilterValide(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les statuts</option>
              <option value="true">✅ Validées (visibles mobile)</option>
              <option value="false">⏳ En attente de validation</option>
            </select>
          </div>

          {/* Filtre État de l'infrastructure */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              État
            </label>
            <select
              value={filterEtat}
              onChange={(e) => {
                setFilterEtat(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les états</option>
              <option value="excellent">Excellent</option>
              <option value="bon">Bon</option>
              <option value="moyen">Moyen</option>
              <option value="degrade">Dégradé</option>
              <option value="ferme">Fermé</option>
            </select>
          </div>
        </div>

        {/* Ligne d'information résultats et réinitialisation */}
        <div className="flex flex-wrap items-center justify-between pt-1 border-t border-gray-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <span>
              Affichage de{" "}
              <strong className="text-gray-900 dark:text-white font-semibold">
                {totalFiltered}
              </strong>{" "}
              sur <strong className="text-gray-900 dark:text-white font-semibold">{statsTotal}</strong> infrastructure(s)
            </span>
            {hasActiveFilters && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-medium">
                <FiFilter className="w-3 h-3" /> Filtres actifs
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sélecteur du nombre d'éléments par page */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <span>Par page :</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-gray-800 dark:text-slate-200 focus:outline-none"
              >
                <option value={50}>50 par page (par défaut)</option>
                <option value={100}>100 par page</option>
                <option value={-1}>Tout afficher ({totalFiltered})</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 font-medium transition"
              >
                <FiX className="w-3 h-3" /> Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tableau des infrastructures */}
      <div
        id="infrastructures-table-container"
        className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 overflow-hidden scroll-mt-6"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Nom & Adresse
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Type de service
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Quartier / Commune
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  État
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800/90 divide-y divide-gray-100 dark:divide-slate-700/50">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                    <FiFilter className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-base font-medium text-gray-600 dark:text-slate-300">
                      Aucune infrastructure trouvée
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      Essayez d&apos;ajuster vos critères de recherche ou de réinitialiser les filtres.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 px-3 py-1.5 text-xs bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-lg hover:underline font-medium"
                      >
                        Effacer tous les filtres
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((infra) => {
                  const infraId = infra.id || infra._id || "";
                  if (!infraId) return null;
                  return (
                    <tr
                      key={infraId}
                      className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div
                          className="text-sm font-semibold text-gray-900 dark:text-slate-100 max-w-sm truncate"
                          title={infra.nom}
                        >
                          {infra.nom}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 max-w-sm truncate flex items-center gap-1 mt-0.5">
                          <FiMapPin className="w-3 h-3 flex-shrink-0 text-gray-400" />
                          <span>{infra.localisation?.adresse || "Adresse non renseignée"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200">
                          {getTypeLabel(infra.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        <span className="font-medium text-gray-800 dark:text-slate-200">
                          {infra.localisation?.quartier || "—"}
                        </span>
                        {infra.localisation?.commune &&
                          infra.localisation.commune !== infra.localisation.quartier && (
                            <span className="text-xs text-gray-400 dark:text-slate-500 ml-1.5">
                              ({infra.localisation.commune})
                            </span>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getEtatColor(
                            infra.etat
                          )}`}
                        >
                          {infra.etat ? infra.etat.charAt(0).toUpperCase() + infra.etat.slice(1) : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                        <span className="font-semibold">
                          {((infra.noteMoyenne ?? infra.note_moyenne) || 0).toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400 ml-0.5">/5</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500 ml-1.5">
                          ({(infra.nombreAvis ?? infra.nombre_avis) || 0} avis)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {infra.valide ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                            Validée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400"></span>
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            href={`/dashboard/infrastructures/${infraId}/edit?view=1`}
                            className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                            title="Voir les détails"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/infrastructures/${infraId}/edit`}
                            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          {!infra.valide && (
                            <button
                              onClick={() => handleValidate(infraId)}
                              className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors"
                              title="Valider l'infrastructure"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(infraId)}
                            className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barre de pagination 50 par page avec navigation complète */}
        {totalPages > 1 && itemsPerPage !== -1 && (
          <div className="bg-gray-50/80 dark:bg-slate-800/90 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-slate-700/70">
            {/* Informations de tranche */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
              <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-primary-500 mr-1"></span>
              <span>
                Infrastructures{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {(page - 1) * itemsPerPage + 1}
                </strong>{" "}
                à{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {Math.min(page * itemsPerPage, totalFiltered)}
                </strong>{" "}
                sur{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {totalFiltered}
                </strong>
              </span>
              <span className="text-gray-300 dark:text-slate-600 mx-1">|</span>
              <span className="font-medium text-primary-600 dark:text-primary-400">
                Page {page} sur {totalPages}
              </span>
            </div>

            {/* Boutons de pagination numérotés */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* Bouton Première page */}
              <button
                onClick={() => goToPage(1)}
                disabled={page === 1}
                className="p-2 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Première page"
              >
                <FiChevronsLeft className="w-4 h-4" />
              </button>

              {/* Bouton Précédent */}
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1"
                title="Page précédente"
              >
                <FiChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Précédent</span>
              </button>

              {/* Numéros de pages directes */}
              {getPageNumbers().map((pNum, idx) => {
                if (pNum === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1 text-xs text-gray-400 dark:text-slate-500 font-bold"
                    >
                      ...
                    </span>
                  );
                }
                const isCurrent = page === pNum;
                return (
                  <button
                    key={`page-${pNum}`}
                    onClick={() => goToPage(Number(pNum))}
                    className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-semibold transition-all border ${
                      isCurrent
                        ? "bg-primary-600 text-white border-primary-600 shadow-sm ring-2 ring-primary-300 dark:ring-primary-900"
                        : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              {/* Bouton Suivant */}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1"
                title="Page suivante"
              >
                <span className="hidden sm:inline">Suivant</span>
                <FiChevronRight className="w-4 h-4" />
              </button>

              {/* Bouton Dernière page */}
              <button
                onClick={() => goToPage(totalPages)}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Dernière page"
              >
                <FiChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

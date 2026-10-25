"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { FiArrowLeft, FiSave, FiMapPin, FiImage, FiX, FiCheck } from "react-icons/fi";
import Link from "next/link";
import LogoLoader from "@/components/LogoLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function EditInfrastructurePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const isReadOnly = searchParams.get("view") === "1";
  const fieldDisabled = isReadOnly;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const defaultHoraires = {
    lundi: { ouvert: true, debut: "08:00", fin: "18:00" },
    mardi: { ouvert: true, debut: "08:00", fin: "18:00" },
    mercredi: { ouvert: true, debut: "08:00", fin: "18:00" },
    jeudi: { ouvert: true, debut: "08:00", fin: "18:00" },
    vendredi: { ouvert: true, debut: "08:00", fin: "18:00" },
    samedi: { ouvert: true, debut: "08:00", fin: "18:00" },
    dimanche: { ouvert: false, debut: "08:00", fin: "18:00" },
  };

  const normalizeHoraires = (input?: any) => {
    const normalized = { ...defaultHoraires };
    if (!input || typeof input !== 'object') return normalized;

    const DAY_MAP_EN_TO_FR: Record<string, string> = {
      monday: 'lundi',
      tuesday: 'mardi',
      wednesday: 'mercredi',
      thursday: 'jeudi',
      friday: 'vendredi',
      saturday: 'samedi',
      sunday: 'dimanche',
    };

    Object.keys(defaultHoraires).forEach((jour) => {
      const enKey = Object.keys(DAY_MAP_EN_TO_FR).find(
        (k) => DAY_MAP_EN_TO_FR[k] === jour
      );
      const value = input[jour] || (enKey ? input[enKey] : undefined);
      if (value) {
        if (typeof value === 'object') {
          const isOuvert =
            value.ouvert !== undefined
              ? (value.ouvert === true || value.ouvert === 'true')
              : value.open !== undefined
                ? Boolean(value.open && value.open !== 'false')
                : defaultHoraires[jour as keyof typeof defaultHoraires].ouvert;

          normalized[jour as keyof typeof defaultHoraires] = {
            ...defaultHoraires[jour as keyof typeof defaultHoraires],
            ...value,
            debut: value.debut || value.open || '08:00',
            fin: value.fin || value.close || '18:00',
            ouvert: isOuvert,
          };
        } else if (typeof value === 'string') {
          const isFerme =
            value.toLowerCase().includes('fermé') ||
            value.toLowerCase().includes('ferme') ||
            value.toLowerCase().includes('closed');
          normalized[jour as keyof typeof defaultHoraires] = {
            debut: '08:00',
            fin: '18:00',
            ouvert: !isFerme,
          };
        }
      }
    });
    return normalized;
  };

  const [formData, setFormData] = useState({
    nom: "",
    type: "toilettes_publiques",
    description: "",
    adresse: "",
    quartier: "",
    commune: "Cotonou",
    latitude: "",
    longitude: "",
    telephone: "",
    email: "",
    etat: "bon",
    niveauFrequentation: "moyen",
    pmr: false,
    enfants: false,
    equipements: [] as string[],
    horaires: normalizeHoraires(),
  });

  const [equipementInput, setEquipementInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<
    Array<{ url: string; uploadedAt?: string }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const infra = response.data?.data ?? response.data?.infrastructure ?? response.data;
      const localisation = infra.localisation || {};
      const coordinates = localisation.coordinates || [];

      setFormData({
        nom: infra.nom || infra.name || "",
        type: infra.type || infra.category || "autre",
        description: infra.description || "",
        adresse: localisation.adresse || localisation.address || infra.address || "",
        quartier: localisation.quartier || "",
        commune: localisation.commune || "Cotonou",
        latitude: (coordinates[1] ?? infra.latitude ?? localisation.latitude ?? "")?.toString(),
        longitude: (coordinates[0] ?? infra.longitude ?? localisation.longitude ?? "")?.toString(),
        telephone: infra.contact?.telephone || "",
        email: infra.contact?.email || "",
        etat: infra.etat || "bon",
        niveauFrequentation:
          infra.niveau_frequentation || infra.niveauFrequentation || "moyen",
        pmr: infra.accessibilite?.pmr || false,
        enfants: infra.accessibilite?.enfants || false,
        equipements: infra.equipements || [],
        horaires: normalizeHoraires(infra.horaires),
      });

      if (infra.photos && infra.photos.length > 0) {
        setExistingPhotos(
          infra.photos
            .map((p: { url?: string; uploadedAt?: string } | string) =>
              typeof p === "string"
                ? { url: p }
                : p && (p as { url: string }).url
                  ? {
                      url: (p as { url: string }).url,
                      uploadedAt: (p as { uploadedAt?: string }).uploadedAt,
                    }
                  : null,
            )
            .filter(Boolean) as Array<{ url: string; uploadedAt?: string }>,
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors du chargement de l'infrastructure",
      );
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleHorairesChange = (
    jour: string,
    field: string,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      horaires: {
        ...prev.horaires,
        [jour]: {
          ...prev.horaires[jour as keyof typeof prev.horaires],
          [field]: value,
        },
      },
    }));
  };

  const addEquipement = () => {
    if (
      equipementInput.trim() &&
      !formData.equipements.includes(equipementInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        equipements: [...prev.equipements, equipementInput.trim()],
      }));
      setEquipementInput("");
    }
  };

  const removeEquipement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipements: prev.equipements.filter((_, i) => i !== index),
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Seules les images sont autorisées");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Les images ne doivent pas dépasser 5MB");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newFiles = [...selectedImages, ...validFiles].slice(0, 10);
    setSelectedImages(newFiles);

    const promises = newFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((previews) => {
      setImagePreviews(previews);
    });
  };

  const removeImage = (index: number) => {
    const newFiles = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newFiles);
    setImagePreviews(newPreviews);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (!formData.latitude || !formData.longitude) {
        throw new Error(
          "Les coordonnées GPS (latitude et longitude) sont requises",
        );
      }

      let photos = [...existingPhotos];

      // Upload des nouvelles images si présentes
      if (selectedImages.length > 0) {
        try {
          const formDataImages = new FormData();
          selectedImages.forEach((file) => {
            formDataImages.append("images", file);
          });

          const token = localStorage.getItem("token");
          const uploadResponse = await axios.post(
            `${API_URL}/infrastructures/upload-images`,
            formDataImages,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            },
          );

          photos = [...photos, ...(uploadResponse.data.photos || [])];
        } catch (uploadErr: any) {
          console.error("Erreur upload images:", uploadErr);
        }
      }

      const infrastructureData = {
        nom: formData.nom,
        type: formData.type,
        description: formData.description,
        localisation: {
          type: "Point",
          coordinates: [
            parseFloat(formData.longitude),
            parseFloat(formData.latitude),
          ],
          adresse: formData.adresse,
          quartier: formData.quartier,
          commune: formData.commune,
        },
        contact: {
          telephone: formData.telephone || undefined,
          email: formData.email || undefined,
        },
        etat: formData.etat,
        niveauFrequentation: formData.niveauFrequentation,
        accessibilite: {
          pmr: formData.pmr,
          enfants: formData.enfants,
        },
        equipements: formData.equipements,
        horaires: formData.horaires,
        photos: photos,
      };

      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/infrastructures/${id}`, infrastructureData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Émettre un événement pour rafraîchir les listes
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("infrastructureCreated"));
      }

      // Afficher le popup de succès
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erreur lors de la mise à jour de l'infrastructure",
      );
    } finally {
      setLoading(false);
    }
  };

  const jours = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ];
  const joursLabels: Record<string, string> = {
    lundi: "Lundi",
    mardi: "Mardi",
    mercredi: "Mercredi",
    jeudi: "Jeudi",
    vendredi: "Vendredi",
    samedi: "Samedi",
    dimanche: "Dimanche",
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LogoLoader size="xl" text="Chargement de l'infrastructure..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={
              isReadOnly
                ? "/dashboard/infrastructures"
                : "/dashboard/infrastructures"
            }
            className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {isReadOnly
                ? "Détails de l'infrastructure"
                : "Modifier l'Infrastructure"}
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              {isReadOnly
                ? "Consultation en lecture seule"
                : "Mettre à jour les informations de l'infrastructure"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6 md:p-8 space-y-8"
      >
        {/* Informations de base */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/70 pb-3">
            Informations de base
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Nom de l'infrastructure <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              disabled={fieldDisabled}
              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
              placeholder="Ex: Toilettes publiques - Place de l'Indépendance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Type d'infrastructure <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={fieldDisabled}
              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {/* Services Administratifs */}
              <optgroup label="Services Administratifs" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="mairie">Mairie</option>
                <option value="prefecture">Préfecture</option>
                <option value="tribunal">Tribunal</option>
                <option value="gendarmerie">Gendarmerie</option>
                <option value="police">Police</option>
              </optgroup>

              {/* Services Éducatifs */}
              <optgroup label="Services Éducatifs" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="ecole_primaire">École primaire</option>
                <option value="ecole_secondaire">École secondaire</option>
                <option value="universite">Université</option>
                <option value="centre_formation">Centre de formation</option>
                <option value="bibliotheque">Bibliothèque</option>
              </optgroup>

              {/* Services de Santé */}
              <optgroup label="Services de Santé" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="hopital">Hôpital</option>
                <option value="centre_sante">Centre de santé</option>
                <option value="clinique">Clinique</option>
                <option value="pharmacie">Pharmacie</option>
                <option value="laboratoire">Laboratoire</option>
              </optgroup>

              {/* Services Religieux */}
              <optgroup label="Services Religieux" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="eglise">Église</option>
                <option value="mosquee">Mosquée</option>
                <option value="synagogue">Synagogue</option>
                <option value="temple">Temple</option>
              </optgroup>

              {/* Installations Sportives et Récréatives */}
              <optgroup label="Installations Sportives et Récréatives" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="installation_sportive">
                  Installation sportive
                </option>
                <option value="parc_jeux">Parc de jeux</option>
                <option value="terrain_football">Terrain de football</option>
                <option value="terrain_tennis">Terrain de tennis</option>
                <option value="piscine">Piscine</option>
                <option value="gymnase">Gymnase</option>
                <option value="stade">Stade</option>
                <option value="parc_loisirs">Parc de loisirs</option>
              </optgroup>

              {/* Sanitaires et Hygiène */}
              <optgroup label="Sanitaires et Hygiène" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="toilettes_publiques">Toilettes publiques</option>
                <option value="point_eau">Point d'eau</option>
                <option value="douche_publique">Douche publique</option>
              </optgroup>

              {/* Commerces et Services */}
              <optgroup label="Commerces et Services" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="marche">Marché</option>
                <option value="supermarche">Supermarché</option>
                <option value="banque">Banque</option>
                <option value="poste">Poste</option>
                <option value="station_service">Station-service</option>
              </optgroup>

              {/* Transports */}
              <optgroup label="Transports" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="gare_routiere">Gare routière</option>
                <option value="arret_bus">Arrêt de bus</option>
                <option value="embarcadere">Embarcadère</option>
                <option value="aeroport">Aéroport</option>
              </optgroup>

              {/* Culture et Tourisme */}
              <optgroup label="Culture et Tourisme" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="musee">Musée</option>
                <option value="monument">Monument</option>
                <option value="centre_culturel">Centre culturel</option>
                <option value="site_touristique">Site touristique</option>
                <option value="plage">Plage</option>
              </optgroup>

              {/* Espaces Publics */}
              <optgroup label="Espaces Publics" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="place_publique">Place publique</option>
                <option value="jardin_public">Jardin public</option>
                <option value="espace_vert">Espace vert</option>
              </optgroup>

              {/* Autres */}
              <optgroup label="Autres" className="font-semibold text-gray-500 dark:text-slate-400">
                <option value="decharge">Décharge</option>
                <option value="cimetiere">Cimetière</option>
                <option value="espace_divertissement">
                  Espace de divertissement
                </option>
                <option value="autre">Autre</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              disabled={fieldDisabled}
              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
              placeholder="Description détaillée de l'infrastructure..."
            />
          </div>
        </div>

        {/* Localisation */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/70 pb-3">
            Localisation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Latitude <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                disabled={fieldDisabled}
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
                placeholder="6.3725"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Longitude <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                disabled={fieldDisabled}
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
                placeholder="2.3544"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Adresse complète <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              required
              disabled={fieldDisabled}
              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
              placeholder="Ex: Place de l'Indépendance, Cotonou"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Quartier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="quartier"
                value={formData.quartier}
                onChange={handleChange}
                required
                disabled={fieldDisabled}
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
                placeholder="Ex: Gbégamey"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Commune
              </label>
              <input
                type="text"
                name="commune"
                value={formData.commune}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/70 pb-3">
            Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
                placeholder="+229 XX XX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </div>

        {/* État et accessibilité */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/70 pb-3">
            État et accessibilité
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                État <span className="text-red-500">*</span>
              </label>
              <select
                name="etat"
                value={formData.etat}
                onChange={handleChange}
                required
                disabled={fieldDisabled}
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                <option value="excellent">Excellent</option>
                <option value="bon">Bon</option>
                <option value="moyen">Moyen</option>
                <option value="degrade">Dégradé</option>
                <option value="ferme">Fermé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Niveau de fréquentation
              </label>
              <select
                name="niveauFrequentation"
                value={formData.niveauFrequentation}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="pmr"
                checked={formData.pmr}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Accessible PMR (Personnes à Mobilité Réduite)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="enfants"
                checked={formData.enfants}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Adapté aux enfants</span>
            </label>
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/70 pb-3">
            Photos (optionnel)
          </h2>

          {/* Photos existantes */}
          {existingPhotos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Photos existantes
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingPhotos.map((photo, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    <img
                      src={photo.url}
                      alt={`Photo existante ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isReadOnly && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Ajouter de nouvelles photos
              </label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-medium transition"
                >
                  <FiImage className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span>Sélectionner des images</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                  Maximum 10 images, 5MB par image. Tous formats image : JPG,
                  PNG, GIF, WebP, BMP, HEIC, etc.
                </p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                      <img
                        src={preview}
                        alt={`Prévisualisation ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Équipements */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/70 pb-3">
            Équipements
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={equipementInput}
              onChange={(e) => setEquipementInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addEquipement())
              }
              disabled={fieldDisabled}
              className="flex-1 px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition text-sm"
              placeholder="Ajouter un équipement (ex: Parking, Éclairage, Eau potable)"
            />
            {!isReadOnly && (
              <button
                type="button"
                onClick={addEquipement}
                className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 font-medium text-sm transition"
              >
                Ajouter
              </button>
            )}
          </div>

          {formData.equipements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.equipements.map((equipement, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/40 rounded-full text-xs font-semibold"
                >
                  {equipement}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeEquipement(index)}
                      className="text-primary-600 dark:text-primary-400 hover:text-red-500 dark:hover:text-red-400 text-sm ml-0.5"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Horaires */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700/70 pb-3">
            Horaires d'ouverture
          </h2>

          <div className="space-y-3">
            {jours.map((jour) => {
              const jourHoraires =
                formData.horaires[jour as keyof typeof formData.horaires] ||
                defaultHoraires[jour as keyof typeof defaultHoraires];

              return (
                <div
                  key={jour}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50/70 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/60 rounded-2xl"
                >
                  <label className="flex items-center gap-2.5 min-w-[130px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={jourHoraires.ouvert}
                      onChange={(e) =>
                        handleHorairesChange(jour, "ouvert", e.target.checked)
                      }
                      disabled={fieldDisabled}
                      className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                      {joursLabels[jour]}
                    </span>
                  </label>

                  {jourHoraires.ouvert ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={jourHoraires.debut}
                        onChange={(e) =>
                          handleHorairesChange(jour, "debut", e.target.value)
                        }
                        disabled={fieldDisabled}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-[#96D0EE] disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <span className="text-gray-400 dark:text-slate-500 font-medium">à</span>
                      <input
                        type="time"
                        value={jourHoraires.fin}
                        onChange={(e) =>
                          handleHorairesChange(jour, "fin", e.target.value)
                        }
                        disabled={fieldDisabled}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-[#96D0EE] disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-slate-500 italic">Fermé</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-700/70">
          <Link
            href={
              isReadOnly
                ? "/dashboard/infrastructures"
                : "/dashboard/infrastructures"
            }
            className="px-6 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 font-medium text-sm transition text-center"
          >
            {isReadOnly ? "Retour" : "Annuler"}
          </Link>
          {!isReadOnly && (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm shadow-sm transition"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Modal Popup de confirmation de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-700 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FiCheck className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Informations enregistrées !
            </h3>

            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">
              Les modifications de l&apos;infrastructure <strong>« {formData.nom} »</strong> ont été enregistrées avec succès dans la base de données et sont désormais à jour sur votre tableau de bord et sur l&apos;application mobile.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/infrastructures")}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition shadow-sm hover:shadow"
              >
                Retourner aux infrastructures
              </button>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 px-4 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition"
              >
                Continuer à modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
);
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { FiArrowLeft, FiSave, FiMapPin, FiImage, FiX } from "react-icons/fi";
import Link from "next/link";

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
  const defaultHoraires = {
    lundi: { ouvert: true, debut: "08:00", fin: "18:00" },
    mardi: { ouvert: true, debut: "08:00", fin: "18:00" },
    mercredi: { ouvert: true, debut: "08:00", fin: "18:00" },
    jeudi: { ouvert: true, debut: "08:00", fin: "18:00" },
    vendredi: { ouvert: true, debut: "08:00", fin: "18:00" },
    samedi: { ouvert: true, debut: "08:00", fin: "18:00" },
    dimanche: { ouvert: false, debut: "08:00", fin: "18:00" },
  };

  const normalizeHoraires = (input?: Partial<typeof defaultHoraires>) => {
    const normalized = { ...defaultHoraires };
    Object.keys(defaultHoraires).forEach((jour) => {
      const value = input?.[jour as keyof typeof defaultHoraires];
      if (value) {
        normalized[jour as keyof typeof defaultHoraires] = {
          ...defaultHoraires[jour as keyof typeof defaultHoraires],
          ...value,
        };
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

      const infra = response.data?.data ?? response.data;
      const localisation = infra.localisation || {};
      const coordinates = localisation.coordinates || [];

      setFormData({
        nom: infra.nom || "",
        type: infra.type || "toilettes_publiques",
        description: infra.description || "",
        adresse: localisation.adresse || "",
        quartier: localisation.quartier || "",
        commune: localisation.commune || "Cotonou",
        latitude: coordinates[1]?.toString() || "",
        longitude: coordinates[0]?.toString() || "",
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

      router.push(`/dashboard/infrastructures/${id}`);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
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
                : `/dashboard/infrastructures/${id}`
            }
            className="text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isReadOnly
                ? "Details de l'infrastructure"
                : "Modifier l'Infrastructure"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isReadOnly
                ? "Consultation en lecture seule"
                : "Mettre à jour les informations de l'infrastructure"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 space-y-6"
      >
        {/* Informations de base */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Informations de base
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'infrastructure <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              disabled={fieldDisabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Toilettes publiques - Place de l'Indépendance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'infrastructure <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={fieldDisabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="toilettes_publiques">Toilettes publiques</option>
              <option value="parc_jeux">Parc de jeux</option>
              <option value="centre_sante">Centre de santé</option>
              <option value="installation_sportive">
                Installation sportive
              </option>
              <option value="espace_divertissement">
                Espace de divertissement
              </option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              disabled={fieldDisabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Description détaillée de l'infrastructure..."
            />
          </div>
        </div>

        {/* Localisation */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Localisation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="6.3725"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="2.3544"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse complète <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              required
              disabled={fieldDisabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Place de l'Indépendance, Cotonou"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quartier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="quartier"
                value={formData.quartier}
                onChange={handleChange}
                required
                disabled={fieldDisabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: Gbégamey"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commune
              </label>
              <input
                type="text"
                name="commune"
                value={formData.commune}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+229 XX XX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </div>

        {/* État et accessibilité */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            État et accessibilité
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                État <span className="text-red-500">*</span>
              </label>
              <select
                name="etat"
                value={formData.etat}
                onChange={handleChange}
                required
                disabled={fieldDisabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="excellent">Excellent</option>
                <option value="bon">Bon</option>
                <option value="moyen">Moyen</option>
                <option value="degrade">Dégradé</option>
                <option value="ferme">Fermé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de fréquentation
              </label>
              <select
                name="niveauFrequentation"
                value={formData.niveauFrequentation}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
              </select>
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="pmr"
                checked={formData.pmr}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Accessible PMR (Personnes à Mobilité Réduite)
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="enfants"
                checked={formData.enfants}
                onChange={handleChange}
                disabled={fieldDisabled}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Adapté aux enfants</span>
            </label>
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Photos (optionnel)
          </h2>

          {/* Photos existantes */}
          {existingPhotos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos existantes
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.url}
                      alt={`Photo existante ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <FiImage className="w-5 h-5" />
                  <span>Sélectionner des images</span>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum 10 images, 5MB par image. Tous formats image : JPG,
                  PNG, GIF, WebP, BMP, HEIC, etc.
                </p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Prévisualisation ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ajouter un équipement (ex: Parking, Éclairage, Eau potable)"
            />
            {!isReadOnly && (
              <button
                type="button"
                onClick={addEquipement}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
                  className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                >
                  {equipement}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeEquipement(index)}
                      className="text-primary-600 hover:text-primary-800"
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
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
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
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <label className="flex items-center gap-2 min-w-[120px]">
                    <input
                      type="checkbox"
                      checked={jourHoraires.ouvert}
                      onChange={(e) =>
                        handleHorairesChange(jour, "ouvert", e.target.checked)
                      }
                      disabled={fieldDisabled}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {joursLabels[jour]}
                    </span>
                  </label>

                  {jourHoraires.ouvert && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={jourHoraires.debut}
                        onChange={(e) =>
                          handleHorairesChange(jour, "debut", e.target.value)
                        }
                        disabled={fieldDisabled}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={jourHoraires.fin}
                        onChange={(e) =>
                          handleHorairesChange(jour, "fin", e.target.value)
                        }
                        disabled={fieldDisabled}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            href={
              isReadOnly
                ? "/dashboard/infrastructures"
                : `/dashboard/infrastructures/${id}`
            }
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {isReadOnly ? "Retour" : "Annuler"}
          </Link>
          {!isReadOnly && (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <FiSave />
                  Enregistrer les modifications
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

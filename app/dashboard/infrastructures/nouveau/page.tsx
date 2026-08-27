'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { FiArrowLeft, FiSave, FiMapPin, FiImage, FiX } from 'react-icons/fi'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function NouvelleInfrastructurePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nom: '',
    type: 'toilettes_publiques',
    description: '',
    adresse: '',
    quartier: '',
    commune: 'Cotonou',
    latitude: '',
    longitude: '',
    telephone: '',
    email: '',
    etat: 'bon',
    niveauFrequentation: 'moyen',
    pmr: false,
    enfants: false,
    equipements: [] as string[],
    horaires: {
      lundi: { ouvert: true, debut: '08:00', fin: '18:00' },
      mardi: { ouvert: true, debut: '08:00', fin: '18:00' },
      mercredi: { ouvert: true, debut: '08:00', fin: '18:00' },
      jeudi: { ouvert: true, debut: '08:00', fin: '18:00' },
      vendredi: { ouvert: true, debut: '08:00', fin: '18:00' },
      samedi: { ouvert: true, debut: '08:00', fin: '18:00' },
      dimanche: { ouvert: false, debut: '08:00', fin: '18:00' }
    }
  })

  const [equipementInput, setEquipementInput] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleHorairesChange = (jour: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      horaires: {
        ...prev.horaires,
        [jour]: {
          ...prev.horaires[jour as keyof typeof prev.horaires],
          [field]: value
        }
      }
    }))
  }

  const addEquipement = () => {
    if (equipementInput.trim() && !formData.equipements.includes(equipementInput.trim())) {
      setFormData(prev => ({
        ...prev,
        equipements: [...prev.equipements, equipementInput.trim()]
      }))
      setEquipementInput('')
    }
  }

  const removeEquipement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipements: prev.equipements.filter((_, i) => i !== index)
    }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Seules les images sont autorisées')
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Les images ne doivent pas dépasser 5MB')
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const newFiles = [...selectedImages, ...validFiles].slice(0, 10) // Max 10 images
    setSelectedImages(newFiles)

    // Créer les prévisualisations
    const promises = newFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(promises).then(previews => {
      setImagePreviews(previews)
    })
  }

  const removeImage = (index: number) => {
    const newFiles = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setSelectedImages(newFiles)
    setImagePreviews(newPreviews)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation des coordonnées GPS
      if (!formData.latitude || !formData.longitude) {
        throw new Error('Les coordonnées GPS (latitude et longitude) sont requises')
      }

      let photos: Array<{ url: string; uploadedAt: string }> = []

      // Upload des images si présentes
      if (selectedImages.length > 0) {
        try {
          const formDataImages = new FormData()
          selectedImages.forEach((file) => {
            formDataImages.append('images', file)
          })

          const token = localStorage.getItem('token')
          const uploadResponse = await axios.post(
            `${API_URL}/infrastructures/upload-images`,
            formDataImages,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          )

          photos = uploadResponse.data.photos || []
        } catch (uploadErr: any) {
          console.error('Erreur upload images:', uploadErr)
          // Si l'upload échoue, on continue sans images plutôt que de bloquer la création
          setError('Les images n\'ont pas pu être uploadées, mais l\'infrastructure sera créée sans images.')
        }
      }

      const infrastructureData = {
        nom: formData.nom,
        type: formData.type,
        description: formData.description,
        localisation: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
          adresse: formData.adresse,
          quartier: formData.quartier,
          commune: formData.commune
        },
        contact: {
          telephone: formData.telephone || undefined,
          email: formData.email || undefined
        },
        etat: formData.etat,
        niveauFrequentation: formData.niveauFrequentation,
        accessibilite: {
          pmr: formData.pmr,
          enfants: formData.enfants
        },
        equipements: formData.equipements,
        horaires: formData.horaires,
        photos: photos
      }

      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/infrastructures`, infrastructureData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      router.push('/dashboard/infrastructures')
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création de l\'infrastructure')
    } finally {
      setLoading(false)
    }
  }

  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
  const joursLabels: Record<string, string> = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/infrastructures"
            className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Nouvelle Infrastructure</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">Ajouter une nouvelle infrastructure publique</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-6 md:p-8 space-y-8">
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
              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
            >
              <option value="toilettes_publiques">Toilettes publiques</option>
              <option value="parc_jeux">Parc de jeux</option>
              <option value="centre_sante">Centre de santé</option>
              <option value="installation_sportive">Installation sportive</option>
              <option value="espace_divertissement">Espace de divertissement</option>
              <option value="autre">Autre</option>
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
              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition"
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
                className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Accessible PMR (Personnes à Mobilité Réduite)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="enfants"
                checked={formData.enfants}
                onChange={handleChange}
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Ajouter des photos de l'infrastructure
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
                Maximum 10 images, 5MB par image. Tous formats image : JPG, PNG, GIF, WebP, BMP, HEIC, etc.
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
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xs text-white text-xs p-1.5 truncate">
                      {selectedImages[index]?.name || `Image ${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipement())}
              className="flex-1 px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#96D0EE] focus:outline-none transition text-sm"
              placeholder="Ajouter un équipement (ex: Parking, Éclairage, Eau potable)"
            />
            <button
              type="button"
              onClick={addEquipement}
              className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 font-medium text-sm transition"
            >
              Ajouter
            </button>
          </div>

          {formData.equipements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.equipements.map((equipement, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/40 rounded-full text-xs font-semibold"
                >
                  {equipement}
                  <button
                    type="button"
                    onClick={() => removeEquipement(index)}
                    className="text-primary-600 dark:text-primary-400 hover:text-red-500 dark:hover:text-red-400 text-sm ml-0.5"
                  >
                    ×
                  </button>
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
            {jours.map((jour) => (
              <div key={jour} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50/70 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/60 rounded-2xl">
                <label className="flex items-center gap-2.5 min-w-[130px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.horaires[jour as keyof typeof formData.horaires].ouvert}
                    onChange={(e) => handleHorairesChange(jour, 'ouvert', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{joursLabels[jour]}</span>
                </label>
                
                {formData.horaires[jour as keyof typeof formData.horaires].ouvert ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={formData.horaires[jour as keyof typeof formData.horaires].debut}
                      onChange={(e) => handleHorairesChange(jour, 'debut', e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-[#96D0EE]"
                    />
                    <span className="text-gray-400 dark:text-slate-500 font-medium">à</span>
                    <input
                      type="time"
                      value={formData.horaires[jour as keyof typeof formData.horaires].fin}
                      onChange={(e) => handleHorairesChange(jour, 'fin', e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-[#96D0EE]"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-slate-500 italic">Fermé</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-700/70">
          <Link
            href="/dashboard/infrastructures"
            className="px-6 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 font-medium text-sm transition text-center"
          >
            Annuler
          </Link>
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
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}


'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiEdit2,
  FiSave, FiX, FiCamera, FiUpload, FiZoomIn,
  FiCheck, FiRefreshCw, FiMinus, FiPlus,
} from 'react-icons/fi'
import LogoLoader from '@/components/LogoLoader'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface UserProfile {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  avatar?: string
  role: string
  zone_id?: string
  zone?: { id: string; nom: string; type: string }
  created_at: string
}

interface UserStats {
  infrastructuresCrees: number
  propositionsValidees: number
  signalementsTraites: number
  avisLaissee: number
}

/* ─────────────────────────────────────────────────────────────
   Helper – crop the image on a canvas and return a Blob
───────────────────────────────────────────────────────────── */
async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const size = Math.min(pixelCrop.width, pixelCrop.height)
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  )

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.92,
    ),
  )
}

/* ─────────────────────────────────────────────────────────────
   Crop / Zoom Modal
───────────────────────────────────────────────────────────── */
function CropModal({
  src,
  onConfirm,
  onReplace,
  onCancel,
}: {
  src: string
  onConfirm: (croppedBlob: Blob, previewUrl: string) => void
  onReplace: () => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const handleCropComplete = useCallback((_: Area, pixelArea: Area) => {
    setCroppedAreaPixels(pixelArea)
  }, [])

  const handleApply = async () => {
    if (!croppedAreaPixels) return
    try {
      setApplying(true)
      const blob = await getCroppedBlob(src, croppedAreaPixels)
      const previewUrl = URL.createObjectURL(blob)
      onConfirm(blob, previewUrl)
    } catch {
      // fallback – use the raw file
      const res = await fetch(src)
      const blob = await res.blob()
      const previewUrl = URL.createObjectURL(blob)
      onConfirm(blob, previewUrl)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Cadrer la photo
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Pincez / faites glisser pour positionner — slider pour zoomer
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition"
            aria-label="Fermer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* ── Cropper area ── */}
        <div className="relative mx-5 rounded-2xl overflow-hidden bg-gray-900 flex-shrink-0" style={{ height: 300 }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            style={{
              containerStyle: { borderRadius: '1rem' },
              cropAreaStyle: {
                border: '3px solid #96D0EE',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              },
            }}
          />
        </div>

        {/* ── Zoom slider ── */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(1)))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition"
            aria-label="Dézoomer"
          >
            <FiMinus className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#004B70] dark:accent-[#96D0EE] h-1.5 rounded-full"
            aria-label="Zoom"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(1)))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition"
            aria-label="Zoomer"
          >
            <FiPlus className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 dark:text-slate-500 w-10 text-right">
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 p-5 flex-shrink-0">
          <button
            type="button"
            onClick={onReplace}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl transition text-sm font-medium"
          >
            <FiRefreshCw className="w-4 h-4" />
            Choisir une autre
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#004B70] hover:bg-[#003a5a] disabled:opacity-60 text-white rounded-xl transition text-sm font-medium shadow"
          >
            {applying ? (
              <span className="animate-pulse">Traitement…</span>
            ) : (
              <><FiCheck className="w-4 h-4" /> Utiliser ce cadrage</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function ProfilPage() {
  const { user: currentUser, token, updateUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [pendingSrc, setPendingSrc] = useState<string | null>(null)   // raw file src for cropper
  const [showCropModal, setShowCropModal] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    avatar: '',
  })

  useEffect(() => {
    if (token) fetchProfile()
  }, [token])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProfile(response.data.user)
      setStats(response.data.stats)
      setFormData({
        nom: response.data.user.nom,
        prenom: response.data.user.prenom,
        telephone: response.data.user.telephone || '',
        avatar: response.data.user.avatar || '',
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  // ── File selection → open crop modal ────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Seules les images sont autorisées.'); return }
    if (file.size > 10 * 1024 * 1024) { setError("L'image ne doit pas dépasser 10 Mo."); return }
    setError('')
    if (pendingSrc) URL.revokeObjectURL(pendingSrc)
    setPendingSrc(URL.createObjectURL(file))
    setShowCropModal(true)
    e.target.value = ''
  }

  // ── Cropper confirmed ────────────────────────────────────────
  const handleCropConfirm = useCallback((blob: Blob, previewUrl: string) => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarBlob(blob)
    setAvatarPreview(previewUrl)
    setShowCropModal(false)
    if (pendingSrc) { URL.revokeObjectURL(pendingSrc); setPendingSrc(null) }
  }, [avatarPreview, pendingSrc])

  // ── "Choose another" in cropper ─────────────────────────────
  const handleCropReplace = useCallback(() => {
    setShowCropModal(false)
    if (pendingSrc) { URL.revokeObjectURL(pendingSrc); setPendingSrc(null) }
    setTimeout(() => fileInputRef.current?.click(), 100)
  }, [pendingSrc])

  // ── Cancel crop modal ────────────────────────────────────────
  const handleCropCancel = useCallback(() => {
    setShowCropModal(false)
    if (pendingSrc) { URL.revokeObjectURL(pendingSrc); setPendingSrc(null) }
  }, [pendingSrc])

  // ── "Re-edit crop" from form ─────────────────────────────────
  const handleReCrop = () => {
    if (!avatarPreview) return
    setPendingSrc(avatarPreview)
    setShowCropModal(true)
  }

  // ── Upload cropped blob to /api/upload ───────────────────────
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarBlob) return formData.avatar || null
    try {
      setUploadingAvatar(true)
      const fd = new FormData()
      fd.append('image', avatarBlob, 'avatar.jpg')
      const res = await axios.post(`${API_URL}/upload`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      return res.data.url as string
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erreur lors de l'upload de la photo.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const avatarUrl = await uploadAvatar()
      const payload = { ...formData, ...(avatarUrl ? { avatar: avatarUrl } : {}) }
      const response = await axios.patch(`${API_URL}/profile/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProfile(response.data.user)
      if (updateUser) {
        updateUser(response.data.user)
      }
      setEditing(false)
      setAvatarBlob(null)
      setAvatarPreview(null)
      setSuccess('Profil mis à jour avec succès ✓')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Erreur lors de la mise à jour du profil')
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setAvatarBlob(null)
    setAvatarPreview(null)
    setShowCropModal(false)
    if (pendingSrc) { URL.revokeObjectURL(pendingSrc); setPendingSrc(null) }
    setFormData({
      nom: profile!.nom,
      prenom: profile!.prenom,
      telephone: profile!.telephone || '',
      avatar: profile!.avatar || '',
    })
    setError('')
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Administrateur',
      admin: 'Administrateur',
      agent_communal: 'Agent Communal',
      citoyen: 'Citoyen',
    }
    return labels[role] || role
  }

  const displayAvatar = avatarPreview || profile?.avatar || null
  const initials = (profile?.prenom?.[0] || profile?.nom?.[0] || 'U').toUpperCase()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LogoLoader size="lg" text="Chargement du profil..." />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-slate-400">Profil non trouvé</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Crop / Zoom modal ── */}
      {showCropModal && pendingSrc && (
        <CropModal
          src={pendingSrc}
          onConfirm={handleCropConfirm}
          onReplace={handleCropReplace}
          onCancel={handleCropCancel}
        />
      )}

      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-sm w-full sm:w-auto font-medium text-sm"
            >
              <FiEdit2 /> Modifier
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {/* Main card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-4 md:p-6">
          {editing ? (
            /* ─── EDIT MODE ─── */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm font-medium"
                >
                  <FiX /> Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploadingAvatar}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl transition text-sm font-medium shadow-sm"
                >
                  {uploadingAvatar
                    ? <span className="animate-pulse">Envoi en cours…</span>
                    : <><FiSave /> Enregistrer</>}
                </button>
              </div>

              {/* ── Avatar editor ── */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Photo de profil</p>

                {/* Avatar circle — click to pick */}
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Cliquer pour choisir une photo"
                >
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#96D0EE] dark:border-[#004B70] shadow-lg">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCamera className="w-7 h-7 text-white" />
                    <span className="text-white text-xs font-medium">Modifier</span>
                  </div>
                </div>

                {/* Re-crop button — if a preview is already set */}
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleReCrop}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#004B70] dark:text-[#96D0EE] hover:underline"
                  >
                    <FiZoomIn className="w-3.5 h-3.5" />
                    Recadrer à nouveau
                  </button>
                )}

                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs font-medium text-[#004B70] dark:text-[#96D0EE] hover:underline"
                >
                  <FiUpload className="w-3.5 h-3.5" />
                  {avatarBlob ? '✓ Photo sélectionnée' : 'Choisir une photo'}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-xs text-gray-400 dark:text-slate-500">JPG, PNG, WEBP — max 10 Mo</p>
              </div>

              {/* Text fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                  />
                </div>
              </div>
            </form>
          ) : (
            /* ─── VIEW MODE ─── */
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-primary-100 dark:border-primary-900/40 flex-shrink-0 shadow">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={`${profile.prenom} ${profile.nom}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">
                    {profile.prenom} {profile.nom}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-slate-400 mt-1 break-words">{profile.email}</p>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 rounded-full text-xs md:text-sm font-semibold">
                      {getRoleLabel(profile.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-slate-700/60">
                <div className="flex items-start gap-3">
                  <FiUser className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Nom complet</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{profile.prenom} {profile.nom}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiMail className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{profile.email}</p>
                  </div>
                </div>
                {profile.telephone && (
                  <div className="flex items-start gap-3">
                    <FiPhone className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Téléphone</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{profile.telephone}</p>
                    </div>
                  </div>
                )}
                {profile.zone && (
                  <div className="flex items-start gap-3">
                    <FiMapPin className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Zone assignée</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{profile.zone.nom}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{profile.zone.type}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <FiUser className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Membre depuis</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">
                      {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistiques */}
        {stats && (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'agent_communal') && (
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">Statistiques</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-800/40 rounded-2xl p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Infrastructures créées</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.infrastructuresCrees}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-800/40 rounded-2xl p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Propositions validées</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.propositionsValidees}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-100 dark:border-yellow-800/40 rounded-2xl p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Signalements traités</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.signalementsTraites}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Avis laissés</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.avisLaissee}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

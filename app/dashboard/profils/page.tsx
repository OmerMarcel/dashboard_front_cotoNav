"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiTrash2,
  FiEye,
  FiChevronRight,
  FiUsers,
  FiShield,
  FiBriefcase,
  FiX,
  FiPlus,
  FiSave,
} from "react-icons/fi";
import LogoLoader from "@/components/LogoLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface UserProfile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  avatar?: string;
  role: string;
  zone_id?: string;
  zone?: {
    id: string;
    nom: string;
    type: string;
  };
  actif: boolean;
  created_at: string;
  cree_par?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
}

interface UserDetails {
  infrastructuresCreesCount: number;
  propositionsValideesCount: number;
  signalementsTraitesCount: number;
  signalementsAssignesCount: number;
  tachesAssigneesCount: number;
}

export default function ProfilsPage() {
  const { user: currentUser, token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "agent_communal" | "all"
  >("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingZones, setLoadingZones] = useState(false);

  // Formulaire de création d'agent
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    telephone: "",
    zone_id: "",
    zone_nom: "", // Nom de zone personnalisé
  });

  useEffect(() => {
    if (!currentUser) return;

    // Seuls Super Admin et Admin peuvent accéder à cette page
    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
    fetchZones();
  }, [currentUser, selectedRole, token]);

  const fetchZones = async () => {
    try {
      setLoadingZones(true);
      const response = await axios.get(`${API_URL}/zones`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { actif: true },
      });
      setZones(response.data.zones || []);
    } catch (err: any) {
      console.error("Erreur lors du chargement des zones:", err);
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      // Super Admin peut voir tous les admins et agents
      // Admin peut voir uniquement les agents de sa zone
      let url = `${API_URL}/roles/`;
      if (selectedRole === "admin") {
        url += "admins";
      } else if (selectedRole === "agent_communal") {
        url += "agents";
      } else {
        // Récupérer tous les admins et agents
        const [adminsRes, agentsRes] = await Promise.all([
          axios.get(`${API_URL}/roles/admins`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/roles/agents`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUsers([...adminsRes.data.admins, ...agentsRes.data.agents]);
        setLoading(false);
        return;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (selectedRole === "admin") {
        setUsers(response.data.admins || []);
      } else {
        setUsers(response.data.agents || []);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors du chargement des utilisateurs",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserDetails(response.data.details);
      setShowDetailsModal(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors du chargement des détails",
      );
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer le compte de ${user.prenom} ${user.nom} ?`,
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(`Compte de ${user.prenom} ${user.nom} supprimé avec succès`);
      fetchUsers();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Administrateur",
      admin: "Administrateur",
      agent_communal: "Agent Communal",
    };
    return labels[role] || role;
  };

  const getRoleIcon = (role: string) => {
    if (role === "super_admin" || role === "admin") {
      return <FiShield className="w-5 h-5" />;
    }
    return <FiBriefcase className="w-5 h-5" />;
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Déterminer la zone : Admin et Super Admin peuvent choisir ou laisser vide
      let zoneId = null;
      if (formData.zone_id) {
        zoneId = formData.zone_id;
      } else if (formData.zone_nom && formData.zone_nom.trim()) {
        zoneId = null;
      }

      // Préparer les données à envoyer
      const agentData: any = {
        email: formData.email,
        password: formData.password,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone || undefined,
      };

      // Gérer la zone selon le rôle (admin et super_admin: mêmes options)
      if (formData.zone_id) {
        agentData.zone_id = formData.zone_id;
      } else if (formData.zone_nom && formData.zone_nom.trim()) {
        agentData.zone_nom = formData.zone_nom.trim();
      }

      const response = await axios.post(`${API_URL}/roles/agents`, agentData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(
        `Agent communal créé avec succès : ${response.data.agent.email}${formData.zone_nom ? ` (Zone: ${formData.zone_nom})` : ""}`,
      );
      setShowCreateModal(false);
      setFormData({
        email: "",
        password: "",
        nom: "",
        prenom: "",
        telephone: "",
        zone_id: "",
        zone_nom: "",
      });
      fetchUsers();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors de la création de l'agent",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LogoLoader size="lg" text="Chargement des profils..." />
      </div>
    );
  }

  // Super Admin peut voir admins et agents, Admin peut voir uniquement les agents
  const canViewAdmins = currentUser?.role === "super_admin";
  const canViewAgents =
    currentUser?.role === "super_admin" || currentUser?.role === "admin";

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Profils
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-slate-400 mt-1">
            {currentUser?.role === "super_admin"
              ? "Gérer les administrateurs et agents communaux"
              : "Gérer les agents communaux"}
          </p>
        </div>
        {canViewAgents && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-sm w-full sm:w-auto font-medium text-sm"
          >
            <FiPlus className="w-5 h-5" />
            <span>Créer un Agent</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-4">
        <div className="flex flex-wrap gap-2">
          {canViewAdmins && (
            <button
              onClick={() => setSelectedRole("admin")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedRole === "admin"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600"
              }`}
            >
              <FiShield className="inline w-4 h-4 mr-2" />
              Administrateurs
            </button>
          )}
          {canViewAgents && (
            <button
              onClick={() => setSelectedRole("agent_communal")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedRole === "agent_communal"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600"
              }`}
            >
              <FiBriefcase className="inline w-4 h-4 mr-2" />
              Agents Communaux
            </button>
          )}
          {canViewAdmins && canViewAgents && (
            <button
              onClick={() => setSelectedRole("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedRole === "all"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600"
              }`}
            >
              <FiUsers className="inline w-4 h-4 mr-2" />
              Tous
            </button>
          )}
        </div>
      </div>

      {/* Liste des utilisateurs - Mobile (cartes) */}
      <div className="md:hidden space-y-4">
        {users.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-8 text-center text-gray-500 dark:text-slate-400">
            Aucun utilisateur trouvé
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.prenom} ${user.nom}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                      {user.prenom?.[0]?.toUpperCase() ||
                        user.nom?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {user.prenom} {user.nom}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">{user.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleIcon(user.role)}
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      fetchUserDetails(user.id);
                    }}
                    className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 p-2 rounded-lg"
                    title="Voir les détails"
                  >
                    <FiEye className="w-5 h-5" />
                  </button>
                  {(currentUser?.role === "super_admin" ||
                    (currentUser?.role === "admin" &&
                      user.role === "agent_communal")) && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 p-2 rounded-lg"
                      title="Supprimer"
                      disabled={user.id === currentUser?.id}
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-slate-700/60">
                {user.telephone && (
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Téléphone:</span>{" "}
                    <span className="text-gray-900 dark:text-slate-100">{user.telephone}</span>
                  </div>
                )}
                {user.zone ? (
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Zone:</span>{" "}
                    <span className="text-gray-900 dark:text-slate-100">{user.zone.nom}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">
                      ({user.zone.type})
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-slate-500">Zone: Non assigné</div>
                )}
                <div>
                  <span
                    className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                      user.actif
                        ? "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {user.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Liste des utilisateurs - Desktop */}
      <div className="hidden md:block bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700/70">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800/40 divide-y divide-gray-100 dark:divide-slate-700/50">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
                  >
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.prenom} ${user.nom}`}
                            className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold mr-3 flex-shrink-0">
                            {user.prenom?.[0]?.toUpperCase() ||
                              user.nom?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                            {user.prenom} {user.nom}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getRoleIcon(user.role)}
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-slate-100">{user.email}</div>
                      {user.telephone && (
                        <div className="text-sm text-gray-500 dark:text-slate-400">
                          {user.telephone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.zone ? (
                        <div>
                          <div className="text-sm text-gray-900 dark:text-slate-100">
                            {user.zone.nom}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">
                            {user.zone.type}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-slate-500">
                          Non assigné
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          user.actif
                            ? "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {user.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            fetchUserDetails(user.id);
                          }}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 p-2 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition"
                          title="Voir les détails"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        {(currentUser?.role === "super_admin" ||
                          (currentUser?.role === "admin" &&
                            user.role === "agent_communal")) && (
                          <button
                            onClick={() => handleDelete(user)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                            title="Supprimer le compte"
                            disabled={user.id === currentUser?.id}
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création d'agent */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-800">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Créer un Agent Communal
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-slate-400 mt-1">
                    Remplissez les informations pour créer un nouveau compte agent
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      email: "",
                      password: "",
                      nom: "",
                      prenom: "",
                      telephone: "",
                      zone_id: "",
                      zone_nom: "",
                    });
                    setError("");
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-2"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={handleCreateAgent}
                className="space-y-4 md:space-y-6"
              >
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                      placeholder="Nom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) =>
                        setFormData({ ...formData, prenom: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                      placeholder="Prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) =>
                        setFormData({ ...formData, telephone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                      placeholder="+229..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                      placeholder="Minimum 6 caractères"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Zone{" "}
                      <span className="text-xs text-gray-500 dark:text-slate-400">(optionnel)</span>
                    </label>
                    <div className="space-y-2">
                      <select
                        value={formData.zone_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            zone_id: e.target.value,
                            zone_nom: "",
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                        disabled={loadingZones}
                      >
                        <option value="">
                          Sélectionner une zone existante (optionnel)
                        </option>
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.nom} ({zone.type})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
                        <span className="text-xs text-gray-500 dark:text-slate-400">OU</span>
                        <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
                      </div>
                      <input
                        type="text"
                        value={formData.zone_nom}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            zone_nom: e.target.value,
                            zone_id: "",
                          })
                        }
                        placeholder="Saisir une zone personnalisée (optionnel)"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#96D0EE] focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        email: "",
                        password: "",
                        nom: "",
                        prenom: "",
                        telephone: "",
                        zone_id: "",
                        zone_nom: "",
                      });
                      setError("");
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition text-sm font-medium shadow-sm"
                  >
                    <FiSave className="w-5 h-5" />
                    Créer l'Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-800">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Profil de {selectedUser.prenom} {selectedUser.nom}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-slate-400 mt-1">
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                    setUserDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-2"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Rôle</label>
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      {getRoleLabel(selectedUser.role)}
                    </p>
                  </div>
                  {selectedUser.telephone && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Téléphone</label>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{selectedUser.telephone}</p>
                    </div>
                  )}
                  {selectedUser.zone && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Zone assignée
                      </label>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{selectedUser.zone.nom}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {selectedUser.zone.type}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Membre depuis
                    </label>
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      {new Date(selectedUser.created_at).toLocaleDateString(
                        "fr-FR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  {selectedUser.cree_par && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Créé par</label>
                      <p className="font-medium text-gray-900 dark:text-slate-100">
                        {selectedUser.cree_par.prenom}{" "}
                        {selectedUser.cree_par.nom}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {selectedUser.cree_par.email}
                      </p>
                    </div>
                  )}
                </div>

                {userDetails && (
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                      Statistiques
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-800/40 rounded-2xl p-4">
                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                          Infrastructures créées
                        </p>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                          {userDetails.infrastructuresCreesCount}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-800/40 rounded-2xl p-4">
                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                          Propositions validées
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                          {userDetails.propositionsValideesCount}
                        </p>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-100 dark:border-yellow-800/40 rounded-2xl p-4">
                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                          Signalements traités
                        </p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                          {userDetails.signalementsTraitesCount}
                        </p>
                      </div>
                      {selectedUser.role === "agent_communal" && (
                        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-4">
                          <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                            Signalements assignés
                          </p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {userDetails.signalementsAssignesCount}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

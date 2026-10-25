# 💻 Architecture & Traçabilité du Dashboard Web - KutonouTché

Ce document détaille l'architecture interne du tableau de bord d'administration (**Next.js 14 App Router**, **Tailwind CSS**, **Recharts**) et la **traçabilité des actions** effectuées par les gestionnaires communaux.

---

## 📑 Sommaire
1. [Architecture Modulaire du Dashboard](#1-architecture-modulaire-du-dashboard)
2. [Workflow de Modération & Traçabilité des Décisions](#2-workflow-de-modération--traçabilité-des-décisions)
3. [Gestion des Signalements & Traçabilité Terrain](#3-gestion-des-signalements--traçabilité-terrain)
4. [Gestion des Droits (RBAC) & Sécurité](#4-gestion-des-droits-rbac--sécurité)
5. [Flux Temps Réel Web Push (FCM / VAPID)](#5-flux-temps-réel-web-push-fcm--vapid)

---

## 1. Architecture Modulaire du Dashboard

Le Dashboard est structuré selon les rôles et les domaines fonctionnels de la plateforme :

```mermaid
graph TD
    subgraph DashboardApp["💻 DASHBOARD WEB (Next.js 14 App Router)"]
        Layout["layout.tsx (Sidebar + Header + Notifications Push)"]
        
        subgraph Pages["📂 Pages Fonctionnelles"]
            P_Home["/dashboard<br/>Vue d'ensemble & KPIs 3D"]
            P_Infra["/dashboard/infrastructures<br/>Référentiel cartographique"]
            P_Prop["/dashboard/propositions<br/>Centre de Modération citoyenne"]
            P_Sign["/dashboard/signalements<br/>Gestionnaire de tickets d'anomalies"]
            P_Avis["/dashboard/avis<br/>Modération des avis & notes"]
            P_Fav["/dashboard/favoris<br/>Statistiques de popularité"]
            P_Stats["/dashboard/statistiques<br/>Analyses territoriales par zone"]
            P_Users["/dashboard/utilisateurs & profils<br/>Gestion RBAC des agents & admins"]
        end

        subgraph SharedComponents["🧩 Composants Clés"]
            Comp_Header["Header.tsx (Alertes, Sélecteur de Zone, Profil)"]
            Comp_Sidebar["Sidebar.tsx (Menu contextuel selon le rôle)"]
            Comp_Push["PushNotifications.tsx (Web Push FCM / VAPID)"]
            Comp_Charts["Chart.tsx & Chart3D.tsx (Visualisation analytique)"]
        end
    end

    Layout --> Comp_Header
    Layout --> Comp_Sidebar
    Layout --> Comp_Push
    Layout --> Pages
    P_Home --> Comp_Charts
    P_Stats --> Comp_Charts
```

---

## 2. Workflow de Modération & Traçabilité des Décisions

Toute décision prise sur une proposition citoyenne est strictement enregistrée pour garantir l'intégrité des données publiques.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👨‍💼 Administrateur Communal
    participant Dash as 💻 Dashboard (/dashboard/propositions)
    participant API as 🔧 Backend Express
    participant DB as 🐘 Supabase (PostGIS)
    participant Audit as 📝 Table audit_logs
    participant Mobile as 📱 Application Mobile

    Admin->>Dash: Ouvre la page des propositions
    Dash->>API: GET /api/propositions?statut=en_attente
    API->>DB: SELECT * FROM propositions WHERE statut = 'en_attente'
    DB-->>Dash: Liste des propositions avec photos & GPS

    Admin->>Dash: Clique sur "Examiner" (Vérifie la conformité du lieu)
    
    alt Validation du lieu
        Admin->>Dash: Clique sur "Valider et Publier"
        Dash->>API: POST /api/propositions/:id/valider
        API->>DB: UPDATE propositions SET statut = 'validee'
        API->>DB: INSERT INTO infrastructures (nom, coordinates, type, valide: true)
        API->>DB: UPDATE user_rewards SET points = points + 50
        API->>Audit: INSERT INTO audit_logs (action: 'PROPOSITION_VALIDATED', user_id: admin.id, details: {infra_id})
        API-->>Dash: 200 OK (Mise à jour immédiate du tableau)
        API-->>Mobile: Notification Push Citoyen + Nouveau marqueur sur la carte
    else Rejet de la proposition
        Admin->>Dash: Saisit le motif de rejet (ex: "Lieu déjà existant")
        Admin->>Dash: Clique sur "Confirmer le rejet"
        Dash->>API: POST /api/propositions/:id/rejeter {motif}
        API->>DB: UPDATE propositions SET statut = 'rejetee', motif_rejet = motif
        API->>Audit: INSERT INTO audit_logs (action: 'PROPOSITION_REJECTED', user_id: admin.id, details: {motif})
        API-->>Dash: 200 OK (Statut mis à jour)
        API-->>Mobile: Notification Push Citoyen avec explication
    end
```

---

## 3. Gestion des Signalements & Traçabilité Terrain

Suivi en temps réel des incidents signalés par les citoyens sur les équipements communaux :

```mermaid
stateDiagram-v2
    [*] --> Recu: 📱 Signalement envoyé par le citoyen
    
    state Recu {
        [*] --> NotificationAdmin: Web Push reçu dans le Dashboard
        NotificationAdmin --> ListeAttente: Affiché dans /dashboard/signalements
    }

    Recu --> PrisEnCharge: 👨‍💼 Admin assigne un Agent communal
    
    state PrisEnCharge {
        [*] --> AuditPriseEnCharge: Log d'audit créé (SIGNALEMENT_ASSIGNED)
        AuditPriseEnCharge --> MissionTerrain: Agent envoyé sur le terrain
    }

    PrisEnCharge --> Resolu: 🛠️ Réparation validée par l'agent
    
    state Resolu {
        [*] --> AuditCloture: Log d'audit créé (SIGNALEMENT_RESOLVED)
        AuditCloture --> NotifCitoyen: Citoyen notifié (+20 points)
        AuditCloture --> UpdateStats: Actualisation du taux de résolution
    }

    PrisEnCharge --> Rejete: ❌ Signalement non recevable
    Resolu --> [*]
    Rejete --> [*]
```

---

## 4. Gestion des Droits (RBAC) & Sécurité

La sécurité du Dashboard repose sur un contrôle d'accès basé sur les rôles (RBAC) vérifié à chaque requête :

| Rôle | Périmètre d'action | Menus visibles | Logs d'audit consultables |
| :--- | :--- | :--- | :--- |
| **Super Admin** | National / Tout Cotonou | Tous les menus (Infras, Propositions, Signalements, Utilisateurs, Statistiques, Audit) | **Tous les logs du système** |
| **Admin Communal** | Arrondissement / Zone assignée | Infras, Propositions et Signalements de sa zone | **Logs de sa zone uniquement** |
| **Agent de Modération** | Traitement des tickets assignés | Signalements et consultation des fiches | **Ses propres actions uniquement** |

---

## 5. Flux Temps Réel Web Push (FCM / VAPID)

Comment le tableau de bord reçoit les alertes instantanées sans nécessiter de rafraîchissement manuel de page :

```mermaid
flowchart LR
    Citoyen["👤 Citoyen sur Mobile<br/>(Signale un problème)"] -->|POST /api/signalements| Backend["🔧 Backend API"]
    Backend -->|FCM Push Message| Firebase["🔥 Firebase Cloud Messaging"]
    Firebase -->|Web Push Protocol (VAPID)| Browser["💻 Navigateur Dashboard"]
    Browser -->|Affichage Toast & Badge| Header["Header.tsx (Compteur d'alertes)"]
```

#!/bin/bash
# Script bash pour créer le fichier .env.local avec la clé VAPID Firebase

ENV_FILE=".env.local"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  Le fichier .env.local existe déjà."
    read -p "Voulez-vous le remplacer ? (o/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        echo "❌ Opération annulée."
        exit
    fi
fi

cat > "$ENV_FILE" << 'EOF'
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BF2EdrcsPG6AUzyGsvZ03aOUmRZuHOEnfIszRSZd44_hKDHhSPJy638oSDcvbyag9uMTd2QxKucgyUnR5RmP5J0

# API URL du backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF

echo "✅ Fichier .env.local créé avec succès !"
echo "📍 Emplacement: $(pwd)/$ENV_FILE"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Redémarrez le serveur Next.js (npm run dev)"
echo "   2. Connectez-vous au dashboard"
echo "   3. Acceptez la permission de notification dans le navigateur"


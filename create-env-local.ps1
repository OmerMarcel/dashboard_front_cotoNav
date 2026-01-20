# Script PowerShell pour créer le fichier .env.local avec la clé VAPID Firebase

$envContent = @"
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BF2EdrcsPG6AUzyGsvZ03aOUmRZuHOEnfIszRSZd44_hKDHhSPJy638oSDcvbyag9uMTd2QxKucgyUnR5RmP5J0

# API URL du backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
"@

$envFilePath = Join-Path $PSScriptRoot ".env.local"

if (Test-Path $envFilePath) {
    Write-Host "⚠️  Le fichier .env.local existe déjà." -ForegroundColor Yellow
    $overwrite = Read-Host "Voulez-vous le remplacer ? (o/N)"
    if ($overwrite -ne "o" -and $overwrite -ne "O") {
        Write-Host "❌ Opération annulée." -ForegroundColor Red
        exit
    }
}

try {
    $envContent | Out-File -FilePath $envFilePath -Encoding UTF8 -NoNewline
    Write-Host "✅ Fichier .env.local créé avec succès !" -ForegroundColor Green
    Write-Host "📍 Emplacement: $envFilePath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "   1. Redémarrez le serveur Next.js (npm run dev)" -ForegroundColor White
    Write-Host "   2. Connectez-vous au dashboard" -ForegroundColor White
    Write-Host "   3. Acceptez la permission de notification dans le navigateur" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur lors de la création du fichier: $_" -ForegroundColor Red
    exit 1
}


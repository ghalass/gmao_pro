@echo off
echo ========================================
echo Installation et Test - Site et Typeparc
echo ========================================
echo.

echo [1/4] Installation des dependances...
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: Installation echouee
    pause
    exit /b 1
)
echo.

echo [2/4] Generation du client Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERREUR: Generation Prisma echouee
    pause
    exit /b 1
)
echo.

echo [3/4] Creation de la migration...
call npx prisma migrate dev --name add_multi_tenancy_to_config_models
if %errorlevel% neq 0 (
    echo ERREUR: Migration echouee
    pause
    exit /b 1
)
echo.

echo [4/4] Demarrage du serveur de developpement...
echo.
echo ========================================
echo Serveur pret ! Testez les pages :
echo - Sites: http://localhost:3000/fr/sites
echo - Typeparcs: http://localhost:3000/fr/typeparcs
echo ========================================
echo.
call npm run dev

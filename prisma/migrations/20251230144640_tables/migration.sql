-- CreateEnum
CREATE TYPE "StatutEngin" AS ENUM ('ACTIF', 'INACTIF', 'EN_MAINTENANCE', 'HORS_SERVICE');

-- CreateEnum
CREATE TYPE "SourceAnomalie" AS ENUM ('VS', 'VJ', 'INSPECTION', 'AUTRE');

-- CreateEnum
CREATE TYPE "Priorite" AS ENUM ('ELEVEE', 'MOYENNE', 'FAIBLE');

-- CreateEnum
CREATE TYPE "StatutAnomalie" AS ENUM ('ATTENTE_PDR', 'PDR_PRET', 'NON_PROGRAMMEE', 'PROGRAMMEE', 'EXECUTE');

-- CreateEnum
CREATE TYPE "OrigineOrgane" AS ENUM ('BRC', 'APPRO', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeMouvementOrgane" AS ENUM ('POSE', 'DEPOSE');

-- CreateEnum
CREATE TYPE "TypeCauseMouvementOrgane" AS ENUM ('PREVENTIF', 'INCIDENT');

-- CreateEnum
CREATE TYPE "TypeRevisionOrgane" AS ENUM ('VP', 'RG', 'INTERVENTION');

-- CreateTable
CREATE TABLE "site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "typeparc" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typeparc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parc" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typeparcId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "typeconsommation_lub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typeconsommation_lub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "typeconsommation_lub_parc" (
    "parc_id" TEXT NOT NULL,
    "typeconsommationlub_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typeconsommation_lub_parc_pkey" PRIMARY KEY ("parc_id","typeconsommationlub_id")
);

-- CreateTable
CREATE TABLE "lubrifiant_parc" (
    "parc_id" TEXT NOT NULL,
    "lubrifiant_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lubrifiant_parc_pkey" PRIMARY KEY ("parc_id","lubrifiant_id")
);

-- CreateTable
CREATE TABLE "engin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "parcId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "initialHeureChassis" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "typepanne" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typepanne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panne" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "typepanneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saisie_hrm" (
    "id" TEXT NOT NULL,
    "du" TIMESTAMP(3) NOT NULL,
    "enginId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "hrm" DOUBLE PRECISION NOT NULL,
    "compteur" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saisie_hrm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saisie_him" (
    "id" TEXT NOT NULL,
    "panneId" TEXT NOT NULL,
    "him" DOUBLE PRECISION NOT NULL,
    "ni" INTEGER NOT NULL,
    "saisiehrmId" TEXT NOT NULL,
    "obs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enginId" TEXT NOT NULL,

    CONSTRAINT "saisie_him_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomalie" (
    "id" TEXT NOT NULL,
    "numeroBacklog" TEXT NOT NULL,
    "dateDetection" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "source" "SourceAnomalie" NOT NULL,
    "priorite" "Priorite" NOT NULL,
    "besoinPDR" BOOLEAN NOT NULL DEFAULT false,
    "quantite" INTEGER,
    "reference" TEXT,
    "code" TEXT,
    "stock" TEXT,
    "numeroBS" TEXT,
    "programmation" TEXT,
    "sortiePDR" TEXT,
    "equipe" TEXT,
    "statut" "StatutAnomalie" NOT NULL,
    "dateExecution" TIMESTAMP(3),
    "confirmation" TEXT,
    "observations" TEXT,
    "enginId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anomalie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statut_anomalie" (
    "id" TEXT NOT NULL,
    "anomalieId" TEXT NOT NULL,
    "ancienStatut" "StatutAnomalie" NOT NULL,
    "nouveauStatut" "StatutAnomalie" NOT NULL,
    "dateChangement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,

    CONSTRAINT "statut_anomalie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typeOrganeId" TEXT NOT NULL,
    "marque" TEXT,
    "sn" TEXT,
    "date_mes" TIMESTAMP(3),
    "origine" "OrigineOrgane",
    "circuit" TEXT,
    "hrm_initial" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "obs" TEXT,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_organe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "type_organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mvt_organe" (
    "id" TEXT NOT NULL,
    "organeId" TEXT NOT NULL,
    "enginId" TEXT NOT NULL,
    "date_mvt" TIMESTAMP(3) NOT NULL,
    "type_mvt" "TypeMouvementOrgane" NOT NULL,
    "cause" TEXT NOT NULL,
    "type_cause" "TypeCauseMouvementOrgane",
    "obs" TEXT,
    "test" TEXT,

    CONSTRAINT "mvt_organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revision_organe" (
    "id" TEXT NOT NULL,
    "organeId" TEXT NOT NULL,
    "date_mvt" TIMESTAMP(3) NOT NULL,
    "type_rg" "TypeRevisionOrgane" NOT NULL,
    "obs" TEXT,

    CONSTRAINT "revision_organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_lubrifiant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "type_lubrifiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lubrifiant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typelubrifiantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lubrifiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saisie_lubrifiant" (
    "id" TEXT NOT NULL,
    "lubrifiantId" TEXT NOT NULL,
    "qte" DOUBLE PRECISION NOT NULL,
    "obs" TEXT,
    "saisiehimId" TEXT NOT NULL,
    "typeconsommationlubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saisie_lubrifiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objectif" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "parcId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "dispo" DOUBLE PRECISION,
    "mtbf" DOUBLE PRECISION,
    "tdm" DOUBLE PRECISION,
    "spe_huile" DOUBLE PRECISION,
    "spe_go" DOUBLE PRECISION,
    "spe_graisse" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objectif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParcToTypeOrgane" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ParcToTypeOrgane_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PanneToParc" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PanneToParc_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_name_key" ON "site"("name");

-- CreateIndex
CREATE UNIQUE INDEX "typeparc_name_key" ON "typeparc"("name");

-- CreateIndex
CREATE UNIQUE INDEX "parc_name_key" ON "parc"("name");

-- CreateIndex
CREATE UNIQUE INDEX "typeconsommation_lub_name_key" ON "typeconsommation_lub"("name");

-- CreateIndex
CREATE UNIQUE INDEX "engin_name_key" ON "engin"("name");

-- CreateIndex
CREATE UNIQUE INDEX "typepanne_name_key" ON "typepanne"("name");

-- CreateIndex
CREATE UNIQUE INDEX "panne_name_key" ON "panne"("name");

-- CreateIndex
CREATE UNIQUE INDEX "saisie_hrm_du_enginId_key" ON "saisie_hrm"("du", "enginId");

-- CreateIndex
CREATE UNIQUE INDEX "saisie_him_panneId_saisiehrmId_key" ON "saisie_him"("panneId", "saisiehrmId");

-- CreateIndex
CREATE UNIQUE INDEX "anomalie_numeroBacklog_key" ON "anomalie"("numeroBacklog");

-- CreateIndex
CREATE UNIQUE INDEX "organe_name_typeOrganeId_key" ON "organe"("name", "typeOrganeId");

-- CreateIndex
CREATE UNIQUE INDEX "type_organe_name_key" ON "type_organe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mvt_organe_organeId_enginId_date_mvt_type_mvt_key" ON "mvt_organe"("organeId", "enginId", "date_mvt", "type_mvt");

-- CreateIndex
CREATE UNIQUE INDEX "revision_organe_organeId_date_mvt_type_rg_key" ON "revision_organe"("organeId", "date_mvt", "type_rg");

-- CreateIndex
CREATE UNIQUE INDEX "type_lubrifiant_name_key" ON "type_lubrifiant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lubrifiant_name_key" ON "lubrifiant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "objectif_annee_parcId_siteId_key" ON "objectif"("annee", "parcId", "siteId");

-- CreateIndex
CREATE INDEX "_ParcToTypeOrgane_B_index" ON "_ParcToTypeOrgane"("B");

-- CreateIndex
CREATE INDEX "_PanneToParc_B_index" ON "_PanneToParc"("B");

-- AddForeignKey
ALTER TABLE "parc" ADD CONSTRAINT "parc_typeparcId_fkey" FOREIGN KEY ("typeparcId") REFERENCES "typeparc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typeconsommation_lub_parc" ADD CONSTRAINT "typeconsommation_lub_parc_parc_id_fkey" FOREIGN KEY ("parc_id") REFERENCES "parc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typeconsommation_lub_parc" ADD CONSTRAINT "typeconsommation_lub_parc_typeconsommationlub_id_fkey" FOREIGN KEY ("typeconsommationlub_id") REFERENCES "typeconsommation_lub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lubrifiant_parc" ADD CONSTRAINT "lubrifiant_parc_parc_id_fkey" FOREIGN KEY ("parc_id") REFERENCES "parc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lubrifiant_parc" ADD CONSTRAINT "lubrifiant_parc_lubrifiant_id_fkey" FOREIGN KEY ("lubrifiant_id") REFERENCES "lubrifiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engin" ADD CONSTRAINT "engin_parcId_fkey" FOREIGN KEY ("parcId") REFERENCES "parc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engin" ADD CONSTRAINT "engin_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panne" ADD CONSTRAINT "panne_typepanneId_fkey" FOREIGN KEY ("typepanneId") REFERENCES "typepanne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saisie_hrm" ADD CONSTRAINT "saisie_hrm_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "engin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saisie_hrm" ADD CONSTRAINT "saisie_hrm_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saisie_him" ADD CONSTRAINT "saisie_him_panneId_fkey" FOREIGN KEY ("panneId") REFERENCES "panne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saisie_him" ADD CONSTRAINT "saisie_him_saisiehrmId_fkey" FOREIGN KEY ("saisiehrmId") REFERENCES "saisie_hrm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saisie_him" ADD CONSTRAINT "saisie_him_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "engin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalie" ADD CONSTRAINT "anomalie_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "engin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalie" ADD CONSTRAINT "anomalie_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statut_anomalie" ADD CONSTRAINT "statut_anomalie_anomalieId_fkey" FOREIGN KEY ("anomalieId") REFERENCES "anomalie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organe" ADD CONSTRAINT "organe_typeOrganeId_fkey" FOREIGN KEY ("typeOrganeId") REFERENCES "type_organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mvt_organe" ADD CONSTRAINT "mvt_organe_organeId_fkey" FOREIGN KEY ("organeId") REFERENCES "organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mvt_organe" ADD CONSTRAINT "mvt_organe_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "engin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revision_organe" ADD CONSTRAINT "revision_organe_organeId_fkey" FOREIGN KEY ("organeId") REFERENCES "organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lubrifiant" ADD CONSTRAINT "lubrifiant_typelubrifiantId_fkey" FOREIGN KEY ("typelubrifiantId") REFERENCES "type_lubrifiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saisie_lubrifiant" ADD CONSTRAINT "saisie_lubrifiant_lubrifiantId_fkey" FOREIGN KEY ("lubrifiantId") REFERENCES "lubrifiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saisie_lubrifiant" ADD CONSTRAINT "saisie_lubrifiant_saisiehimId_fkey" FOREIGN KEY ("saisiehimId") REFERENCES "saisie_him"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saisie_lubrifiant" ADD CONSTRAINT "saisie_lubrifiant_typeconsommationlubId_fkey" FOREIGN KEY ("typeconsommationlubId") REFERENCES "typeconsommation_lub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectif" ADD CONSTRAINT "objectif_parcId_fkey" FOREIGN KEY ("parcId") REFERENCES "parc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectif" ADD CONSTRAINT "objectif_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParcToTypeOrgane" ADD CONSTRAINT "_ParcToTypeOrgane_A_fkey" FOREIGN KEY ("A") REFERENCES "parc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParcToTypeOrgane" ADD CONSTRAINT "_ParcToTypeOrgane_B_fkey" FOREIGN KEY ("B") REFERENCES "type_organe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PanneToParc" ADD CONSTRAINT "_PanneToParc_A_fkey" FOREIGN KEY ("A") REFERENCES "panne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PanneToParc" ADD CONSTRAINT "_PanneToParc_B_fkey" FOREIGN KEY ("B") REFERENCES "parc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

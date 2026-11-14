-- CreateEnum
CREATE TYPE "AircraftRole" AS ENUM ('FIGHTER', 'MULTIROLE_FIGHTER', 'ATTACK', 'TRANSPORT', 'HELICOPTER', 'UAV', 'TRAINER', 'MARITIME_PATROL', 'AEW_C', 'TANKER', 'OTHER');

-- CreateEnum
CREATE TYPE "WeaponCategory" AS ENUM ('AIR_TO_AIR_MISSILE', 'AIR_TO_GROUND_MISSILE', 'ANTI_SHIP_MISSILE', 'SURFACE_TO_AIR_MISSILE', 'BOMB', 'ROCKET', 'GUN_CANNON', 'OTHER');

-- AlterTable
ALTER TABLE "AirbaseUnit" ADD COLUMN "aircraftId" TEXT;

-- CreateTable
CREATE TABLE "MilitaryAircraft" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "role" "AircraftRole" NOT NULL,
    "description" TEXT NOT NULL,
    "firstFlight" TEXT,
    "crew" INTEGER,
    "lengthFt" DOUBLE PRECISION,
    "wingspanFt" DOUBLE PRECISION,
    "heightFt" DOUBLE PRECISION,
    "maxSpeed" TEXT,
    "combatRadiusNm" INTEGER,
    "serviceCeilingFt" INTEGER,
    "maxTakeoffWeightLbs" INTEGER,
    "armamentSummary" TEXT,
    "operatorsInRegion" TEXT NOT NULL,
    "variants" TEXT,
    "imageUrl" TEXT,
    "sources" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL DEFAULT 'bot',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilitaryAircraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weapon" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "category" "WeaponCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "guidance" TEXT,
    "rangeNm" DOUBLE PRECISION,
    "speed" TEXT,
    "warhead" TEXT,
    "lengthIn" DOUBLE PRECISION,
    "diameterIn" DOUBLE PRECISION,
    "weightLbs" DOUBLE PRECISION,
    "variants" TEXT,
    "operatorsInRegion" TEXT,
    "imageUrl" TEXT,
    "sources" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL DEFAULT 'bot',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Weapon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AircraftWeapon" (
    "id" TEXT NOT NULL,
    "aircraftId" TEXT NOT NULL,
    "weaponId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AircraftWeapon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MilitaryAircraft_slug_key" ON "MilitaryAircraft"("slug");

-- CreateIndex
CREATE INDEX "MilitaryAircraft_status_idx" ON "MilitaryAircraft"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Weapon_slug_key" ON "Weapon"("slug");

-- CreateIndex
CREATE INDEX "Weapon_status_idx" ON "Weapon"("status");

-- CreateIndex
CREATE INDEX "AircraftWeapon_aircraftId_idx" ON "AircraftWeapon"("aircraftId");

-- CreateIndex
CREATE INDEX "AircraftWeapon_weaponId_idx" ON "AircraftWeapon"("weaponId");

-- CreateIndex
CREATE UNIQUE INDEX "AircraftWeapon_aircraftId_weaponId_key" ON "AircraftWeapon"("aircraftId", "weaponId");

-- CreateIndex
CREATE INDEX "AirbaseUnit_aircraftId_idx" ON "AirbaseUnit"("aircraftId");

-- AddForeignKey
ALTER TABLE "AirbaseUnit" ADD CONSTRAINT "AirbaseUnit_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "MilitaryAircraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AircraftWeapon" ADD CONSTRAINT "AircraftWeapon_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "MilitaryAircraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AircraftWeapon" ADD CONSTRAINT "AircraftWeapon_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "Weapon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

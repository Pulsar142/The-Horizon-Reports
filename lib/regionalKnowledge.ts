import type { AirbaseType, AirbaseUnitCategory, AircraftRole, WeaponCategory } from "@/generated/prisma/client";

export const REGIONAL_KNOWLEDGE_COUNTRIES = [
  "Singapore",
  "Indonesia",
  "Brunei",
  "Philippines",
  "Vietnam",
  "Cambodia",
  "Thailand",
  "Malaysia",
  "Laos",
  "Myanmar",
  "Timor-Leste",
  "South China Sea",
] as const;

export const AIRCRAFT_ROLE_LABELS: Record<AircraftRole, string> = {
  FIGHTER: "Fighter",
  MULTIROLE_FIGHTER: "Multirole Fighter",
  ATTACK: "Attack",
  TRANSPORT: "Transport",
  HELICOPTER: "Helicopter",
  UAV: "UAV",
  TRAINER: "Trainer",
  MARITIME_PATROL: "Maritime Patrol",
  AEW_C: "Airborne Early Warning & Control",
  TANKER: "Tanker",
  OTHER: "Other",
};

export const WEAPON_CATEGORY_LABELS: Record<WeaponCategory, string> = {
  AIR_TO_AIR_MISSILE: "Air-to-Air Missile",
  AIR_TO_GROUND_MISSILE: "Air-to-Ground Missile",
  ANTI_SHIP_MISSILE: "Anti-Ship Missile",
  SURFACE_TO_AIR_MISSILE: "Surface-to-Air Missile",
  BOMB: "Bomb",
  ROCKET: "Rocket",
  GUN_CANNON: "Gun / Cannon",
  OTHER: "Other",
};

export const AIRBASE_TYPE_LABELS: Record<AirbaseType, string> = {
  MILITARY: "Military",
  CIVIL_MILITARY_SHARED: "Civil/Military Shared",
};

export const AIRBASE_UNIT_CATEGORY_LABELS: Record<AirbaseUnitCategory, string> = {
  FIGHTER_SQUADRON: "Fighter Squadron",
  TRANSPORT_SQUADRON: "Transport Squadron",
  HELICOPTER_SQUADRON: "Helicopter Squadron",
  UAV_SQUADRON: "UAV Squadron",
  AIR_DEFENSE: "Air Defence",
  SUPPORT: "Support",
  AMMUNITION_DEPOT: "Ammunition Depot",
  OTHER: "Other",
};

export const AIRBASE_UNIT_CATEGORIES: AirbaseUnitCategory[] = [
  "FIGHTER_SQUADRON",
  "TRANSPORT_SQUADRON",
  "HELICOPTER_SQUADRON",
  "UAV_SQUADRON",
  "AIR_DEFENSE",
  "SUPPORT",
  "AMMUNITION_DEPOT",
  "OTHER",
];

/** True if any of an airbase's units represent a flying squadron (vs. a ground-only installation). */
const FLYING_CATEGORIES: AirbaseUnitCategory[] = [
  "FIGHTER_SQUADRON",
  "TRANSPORT_SQUADRON",
  "HELICOPTER_SQUADRON",
  "UAV_SQUADRON",
];
export function hasFlyingUnit(categories: AirbaseUnitCategory[]): boolean {
  return categories.some((c) => FLYING_CATEGORIES.includes(c));
}

import {
  CarIcon,
  MotorcycleIcon,
  TruckIcon,
  TruckTrailerIcon,
  VanIcon,
  type Icon,
  type IconProps,
} from "@phosphor-icons/react";
import type { VehicleType } from "../lib/types";

const VEHICLE_ICONS: Record<VehicleType, Icon> = {
  MOTO: MotorcycleIcon,
  CARRO: CarIcon,
  FIORINO: VanIcon,
  VAN: VanIcon,
  CAMINHAO_PEQUENO: TruckIcon,
  CAMINHAO_BAU: TruckTrailerIcon,
};

export function VehicleIcon({ type, ...props }: { type: VehicleType } & IconProps) {
  const VehicleGlyph = VEHICLE_ICONS[type];
  return <VehicleGlyph {...props} />;
}

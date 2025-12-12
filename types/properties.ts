/**
 * TypeScript definitions for real estate properties
 * This file provides strong typing for all property data structures
 */

// Base property interface with common fields
export interface BaseProperty {
  id: string;
  title: string;
  price: number;
  showPrice?: boolean;
  currency: "USD" | "DOP";
  location: string;
  type: string;
  area: string;
  image: string;
  description: string;
  features: string[];
  status: string;
  badge: string;
}

// Extended property with optional fields
export interface Property extends BaseProperty {
  units?: number;
  gallery?: string[];
  payment_plan?: PaymentPlan;
  apartment_types?: ApartmentType[];
  delivery?: string;
}

// Payment plan structure
export interface PaymentPlan {
  reservation?: string;
  contract?: string;
  construction?: string;
  delivery?: string;
}

// Apartment type details
export interface ApartmentType {
  type: string;
  area: string;
  price: string;
  features: string[];
}

// Solar (land) structure
export interface Solar {
  area_m2: number | string;
  frente_m: number | null;
  fondo_m: number | null;
  precio_usd_m2: number | string;
  estatus_legal: LegalStatus;
}

// Solar location grouping
export interface SolarLocation {
  ubicacion: string;
  solares: Solar[];
}

// Legal status types
export type LegalStatus =
  | "CON TÍTULO"
  | "DESLINDADO"
  | "SIN DESLINDAR"
  | "EN PROCESO";

// Property category with metadata
export interface PropertyCategory {
  name: string;
  description: string;
  properties: Property[];
}

// Solar category with different structure
export interface SolarCategory {
  name: string;
  description: string;
  isListFormat: true;
  data: SolarLocation[];
}

// Main data structure
export interface PropertiesData {
  categories: {
    propiedades: PropertyCategory;
    oficinas: PropertyCategory;
    solares: SolarCategory;
  };
  featured: Property[];
}

// Type guards for runtime validation
export function isProperty(obj: any): obj is Property {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.price === "number" &&
    typeof obj.currency === "string" &&
    typeof obj.location === "string" &&
    typeof obj.type === "string" &&
    typeof obj.image === "string" &&
    typeof obj.description === "string" &&
    Array.isArray(obj.features)
  );
}

export function isSolar(obj: any): obj is Solar {
  return (
    typeof obj === "object" &&
    (typeof obj.area_m2 === "number" || typeof obj.area_m2 === "string") &&
    (obj.frente_m === null || typeof obj.frente_m === "number") &&
    (obj.fondo_m === null || typeof obj.fondo_m === "number") &&
    (typeof obj.precio_usd_m2 === "number" || typeof obj.precio_usd_m2 === "string") &&
    typeof obj.estatus_legal === "string"
  );
}

export function isSolarLocation(obj: any): obj is SolarLocation {
  return (
    typeof obj === "object" &&
    typeof obj.ubicacion === "string" &&
    Array.isArray(obj.solares) &&
    obj.solares.every(isSolar)
  );
}

// Helper types for filtering and searching
export interface PropertyFilters {
  search?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  type?: string;
  status?: string;
  location?: string;
}

export interface SolarFilters {
  location?: string;
  areaMin?: number;
  areaMax?: number;
  priceMin?: number;
  priceMax?: number;
  legalStatus?: LegalStatus;
}

// Pagination interface
export interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

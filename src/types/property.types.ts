export interface Property {
  id: string;
  title: string;
  price: number;
  showPrice: boolean;
  currency: 'USD' | 'DOP';
  location: string;
  type: string;
  units?: number;
  area: string;
  image: string;
  description: string;
  features: string[];
  status: string;
  badge: string;
  gallery: string[];

  // Solar-specific fields
  isAvailable?: boolean;
  pricePerMeter?: number;
  totalMeters?: number;
  measurementUnit?: string;
  legalStatus?: string;

  // Additional fields
  payment_plan?: string;
  apartment_types?: ApartmentType[];
}

export interface ApartmentType {
  type: string;
  area: string;
  price: number;
  features: string[];
}

export interface Category {
  name: string;
  description: string;
  properties: Property[];
}

export interface SolarLocation {
  name: string;
  description?: string;
  solares: Property[];
}

export interface PropertiesData {
  categories: {
    propiedades: Category;
    solares: {
      name: string;
      description: string;
      locations: SolarLocation[];
    };
    oficinas?: Category;
  };
  featured: Property[];
}

import type { PropertiesData, Property } from '../types';

/**
 * Fetches all properties data from the static JSON file
 */
export async function fetchProperties(): Promise<PropertiesData> {
  try {
    const response = await fetch('/data/properties.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: PropertiesData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

/**
 * Fetches a single property by ID
 */
export async function fetchPropertyById(id: string): Promise<Property | null> {
  try {
    const data = await fetchProperties();

    // Search in propiedades
    const propiedad = data.categories.propiedades.properties.find(
      (p) => p.id === id
    );
    if (propiedad) return propiedad;

    // Search in solares
    for (const location of data.categories.solares.locations) {
      const solar = location.solares.find((s) => s.id === id);
      if (solar) return solar;
    }

    // Search in oficinas if exists
    if (data.categories.oficinas) {
      const oficina = data.categories.oficinas.properties.find(
        (p) => p.id === id
      );
      if (oficina) return oficina;
    }

    return null;
  } catch (error) {
    console.error('Error fetching property by ID:', error);
    return null;
  }
}

/**
 * Gets featured properties
 */
export async function fetchFeaturedProperties(): Promise<Property[]> {
  try {
    const data = await fetchProperties();
    return data.featured || [];
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return [];
  }
}

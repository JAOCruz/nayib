import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PropertiesData, Property, FilterState } from '../types';
import { fetchProperties, fetchFeaturedProperties } from '../services/propertiesService';

interface PropertiesStore {
  // Data
  rawData: PropertiesData | null;
  featured: Property[];
  loading: boolean;
  error: string | null;

  // Filter state
  filters: FilterState;
  searchQuery: string;
  currentCategory: 'propiedades' | 'solares' | 'oficinas';
  currentPage: number;
  itemsPerPage: number;

  // Actions
  loadProperties: () => Promise<void>;
  loadFeaturedProperties: () => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  setSearchQuery: (query: string) => void;
  setCategory: (category: 'propiedades' | 'solares' | 'oficinas') => void;
  setPage: (page: number) => void;
  resetFilters: () => void;

  // Computed getters
  getFilteredProperties: () => Property[];
  getCurrentPageProperties: () => Property[];
  getTotalPages: () => number;
}

const initialFilters: FilterState = {
  location: '',
  type: '',
  priceRange: null,
  areaRange: null,
  legalStatus: '',
  sortBy: 'newest',
};

export const usePropertiesStore = create<PropertiesStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      rawData: null,
      featured: [],
      loading: false,
      error: null,
      filters: initialFilters,
      searchQuery: '',
      currentCategory: 'propiedades',
      currentPage: 1,
      itemsPerPage: 9,

      // Load all properties
      loadProperties: async () => {
        set({ loading: true, error: null });
        try {
          const data = await fetchProperties();
          set({ rawData: data, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load properties',
            loading: false,
          });
        }
      },

      // Load featured properties
      loadFeaturedProperties: async () => {
        set({ loading: true, error: null });
        try {
          const featured = await fetchFeaturedProperties();
          set({ featured, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load featured properties',
            loading: false,
          });
        }
      },

      // Set filters
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1, // Reset to page 1 when filters change
        }));
      },

      // Set search query
      setSearchQuery: (query) => {
        set({ searchQuery: query, currentPage: 1 });
      },

      // Set category
      setCategory: (category) => {
        set({
          currentCategory: category,
          currentPage: 1,
          filters: initialFilters,
        });
      },

      // Set page
      setPage: (page) => {
        set({ currentPage: page });
      },

      // Reset filters
      resetFilters: () => {
        set({ filters: initialFilters, searchQuery: '', currentPage: 1 });
      },

      // Get filtered properties
      getFilteredProperties: () => {
        const { rawData, filters, searchQuery, currentCategory } = get();
        if (!rawData) return [];

        let properties: Property[] = [];

        // Get properties from selected category
        if (currentCategory === 'propiedades') {
          properties = rawData.categories.propiedades.properties;
        } else if (currentCategory === 'solares') {
          properties = rawData.categories.solares.locations.flatMap(
            (loc) => loc.solares
          );
        } else if (currentCategory === 'oficinas' && rawData.categories.oficinas) {
          properties = rawData.categories.oficinas.properties;
        }

        // Apply search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          properties = properties.filter(
            (p) =>
              p.title.toLowerCase().includes(query) ||
              p.description.toLowerCase().includes(query) ||
              p.location.toLowerCase().includes(query)
          );
        }

        // Apply location filter
        if (filters.location) {
          properties = properties.filter((p) =>
            p.location.toLowerCase().includes(filters.location.toLowerCase())
          );
        }

        // Apply type filter
        if (filters.type) {
          properties = properties.filter((p) =>
            p.type.toLowerCase().includes(filters.type.toLowerCase())
          );
        }

        // Apply price range filter
        if (filters.priceRange) {
          properties = properties.filter(
            (p) =>
              p.price >= filters.priceRange!.min &&
              p.price <= filters.priceRange!.max
          );
        }

        // Apply sorting
        switch (filters.sortBy) {
          case 'price-asc':
            properties.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            properties.sort((a, b) => b.price - a.price);
            break;
          case 'newest':
          default:
            // Keep original order (assumed to be newest first)
            break;
        }

        return properties;
      },

      // Get current page properties
      getCurrentPageProperties: () => {
        const { getFilteredProperties, currentPage, itemsPerPage } = get();
        const filtered = getFilteredProperties();
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filtered.slice(start, end);
      },

      // Get total pages
      getTotalPages: () => {
        const { getFilteredProperties, itemsPerPage } = get();
        const filtered = getFilteredProperties();
        return Math.ceil(filtered.length / itemsPerPage);
      },
    }),
    { name: 'properties-store' }
  )
);

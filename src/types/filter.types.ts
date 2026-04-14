export interface FilterState {
  location: string;
  type: string;
  priceRange: PriceRange | null;
  areaRange: AreaRange | null;
  legalStatus: string;
  sortBy: SortOption;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface AreaRange {
  min: number;
  max: number;
}

export type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'area-asc'
  | 'area-desc'
  | 'newest'
  | 'featured';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

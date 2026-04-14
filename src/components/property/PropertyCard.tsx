import { Link } from 'react-router-dom';
import type { Property } from '../../types';

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'featured' | 'compact';
}

export function PropertyCard({ property }: PropertyCardProps) {
  const formatPrice = (price: number, currency: string) => {
    if (!property.showPrice) return 'Precio a consultar';
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const mainImage = property.gallery?.[0] || property.image;

  return (
    <Link
      to={`/property/${property.id}`}
      className="group block"
    >
      <div className="card-hover overflow-hidden rounded-xl h-full flex flex-col">
        {/* Image Container with Glassmorphism Overlay */}
        <div className="relative h-64 overflow-hidden bg-gray-200 flex-shrink-0">
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Glassmorphism Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badge */}
          {property.badge && (
            <div className="absolute top-4 left-4 glass-white px-3 py-1.5 rounded-full">
              <span className="text-xs font-semibold text-primary">
                {property.badge}
              </span>
            </div>
          )}

          {/* Status Badge */}
          {property.status && (
            <div className="absolute top-4 right-4">
              <span className={`badge ${
                property.status.toLowerCase() === 'disponible'
                  ? 'badge-success'
                  : 'badge-info'
              }`}>
                {property.status}
              </span>
            </div>
          )}

          {/* Price Overlay - Shows on Hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="glass-white rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">
                {formatPrice(property.price, property.currency)}
              </p>
              {property.pricePerMeter && (
                <p className="text-sm text-gray-600">
                  {formatPrice(property.pricePerMeter, property.currency)}/m²
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white flex-1 flex flex-col">
          <div className="mb-3">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
              {property.title}
            </h3>
            <p className="text-sm text-gray-500 flex items-center">
              <svg
                className="w-4 h-4 mr-1.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {property.location}
            </p>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
            {property.description}
          </p>

          {/* Spacer to push content to bottom */}
          <div className="flex-1"></div>

          {/* Property Info Grid */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            {property.area && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Área</p>
                <p className="font-semibold text-sm text-gray-900">{property.area}</p>
              </div>
            )}
            {property.type && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Tipo</p>
                <p className="font-semibold text-sm text-gray-900">{property.type}</p>
              </div>
            )}
            {property.units && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Unidades</p>
                <p className="font-semibold text-sm text-gray-900">{property.units}</p>
              </div>
            )}
          </div>

          {/* View Details Button - Appears on Hover */}
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-full text-center py-2 px-4 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors">
              Ver Detalles
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export interface Testimonial {
  id: number;
  name: string;
  location: string;
  text: string;
  rating?: number;
  date?: string;
}

export const testimonialsData: Testimonial[] = [
  {
    id: 1,
    name: 'María González',
    location: 'Bella Vista',
    text: 'Excelente servicio profesional. Me ayudaron a encontrar el apartamento perfecto para mi familia. El proceso fue transparente y rápido. Muy recomendados.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    location: 'Piantini',
    text: 'Vendí mi propiedad en tiempo récord gracias a LOWESS. Su equipo es muy profesional y siempre estuvieron disponibles para responder mis dudas. Los mejores en el sector.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Ana Martínez',
    location: 'Naco',
    text: 'Invertí en un terreno para desarrollo con su asesoría. El acompañamiento fue excepcional, desde la búsqueda hasta el cierre. Definitivamente volveré a trabajar con ellos.',
    rating: 5,
  },
];

export interface Service {
  id: string;
  number: string;
  title: string;
  status: 'active' | 'coming-soon';
  statusLabel: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
}

export const servicesData: Service[] = [
  {
    id: 'buyer-search',
    number: '01',
    title: 'BUSQUEDA DE COMPRADORES PROSPECTOS',
    status: 'active',
    statusLabel: 'Servicio Activo',
    features: [
      'Búsqueda activa de compradores calificados',
      'Negociación profesional en tu nombre',
      'Cierre de operaciones exitosas',
      'Asesoría legal y documental',
      'Marketing digital especializado',
      'Red amplia de contactos verificados',
    ],
    ctaText: 'Solicitar Servicio',
    ctaLink: 'https://wa.me/18098641996?text=Hola, estoy interesado en el servicio de búsqueda de compradores',
  },
  {
    id: 'real-estate-broker',
    number: '02',
    title: 'INTERMEDIARIO INMOBILIARIO',
    status: 'active',
    statusLabel: 'Servicio Activo',
    features: [
      'Evaluación profesional de propiedades',
      'Gestión completa de documentación',
      'Coordinación de visitas y presentaciones',
      'Asesoría en precios de mercado',
      'Seguimiento post-venta',
      'Transparencia en cada transacción',
    ],
    ctaText: 'Solicitar Servicio',
    ctaLink: 'https://wa.me/18098641996?text=Hola, necesito un intermediario inmobiliario',
  },
  {
    id: 'real-estate-development',
    number: '03',
    title: 'DESARROLLO INMOBILIARIO',
    status: 'coming-soon',
    statusLabel: 'Próximamente',
    features: [
      'Análisis de viabilidad de proyectos',
      'Gestión integral de desarrollos',
      'Coordinación con constructoras',
      'Supervisión de calidad',
      'Comercialización de unidades',
      'Entrega y postventa',
    ],
    ctaText: 'Más Información',
    ctaLink: 'https://wa.me/18098641996?text=Hola, quiero información sobre desarrollo inmobiliario',
  },
];

export const serviceCategories = {
  propiedades: {
    name: 'Propiedades',
    icon: '/images/s-1.png',
    description: 'Apartamentos, casas, villas y propiedades comerciales',
    link: '/propiedades',
  },
  solares: {
    name: 'Terrenos',
    icon: '/images/s-2.png',
    description: 'Solares residenciales, comerciales y para desarrollo',
    link: '/solares',
  },
} as const;

export interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  website?: string;
}

export const partnersData: Partner[] = [
  {
    id: 'conarte',
    name: 'CONARTE',
    logo: '/images/conarte.jpeg',
    description: 'Construcción Arquitectura y Técnica',
  },
  {
    id: 'hageco',
    name: 'HAGECO',
    logo: '/images/hageco.png',
    description: 'Desarrollos Inmobiliarios',
  },
  {
    id: 'therrestra',
    name: 'Therrestra',
    logo: '/images/therrestra.png',
    description: 'Construcción y Desarrollo',
  },
  {
    id: 'cohesa',
    name: 'COHESA',
    logo: '/images/cohesa.png',
    description: 'Construcciones y Proyectos',
  },
];

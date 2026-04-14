export interface Stat {
  id: string;
  value: string;
  label: string;
  icon: string;
  description?: string;
}

export const statsData: Stat[] = [
  {
    id: 'experience',
    value: '4+',
    label: 'Años de Experiencia',
    icon: '/images/u-1.png',
    description: 'Años consolidando nuestra presencia en el mercado inmobiliario',
  },
  {
    id: 'clients',
    value: '200+',
    label: 'Clientes Atendidos',
    icon: '/images/u-2.png',
    description: 'Clientes que han confiado en nuestros servicios',
  },
  {
    id: 'satisfaction',
    value: '100%',
    label: 'Clientes Satisfechos',
    icon: '/images/u-3.png',
    description: 'Compromiso con la excelencia y satisfacción del cliente',
  },
  {
    id: 'support',
    value: '24/7',
    label: 'Atención Personalizada',
    icon: '/images/u-4.png',
    description: 'Disponibles para atender tus necesidades en todo momento',
  },
];

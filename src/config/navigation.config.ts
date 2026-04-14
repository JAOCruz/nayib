export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  external?: boolean;
}

export const navigationConfig = {
  // Desktop Navigation (Primary)
  primary: [
    {
      label: 'Inicio',
      path: '/',
    },
    {
      label: 'Propiedades',
      path: '/propiedades',
    },
    {
      label: 'Solares',
      path: '/solares',
    },
    {
      label: 'Acerca de',
      path: '/about',
    },
    {
      label: 'Contacto',
      path: '/contact',
    },
  ] as NavItem[],

  // Mobile Navigation (Includes all)
  mobile: [
    {
      label: 'Inicio',
      path: '/',
    },
    {
      label: 'Propiedades',
      path: '/propiedades',
    },
    {
      label: 'Solares',
      path: '/solares',
    },
    {
      label: 'Acerca de',
      path: '/about',
    },
    {
      label: 'Contacto',
      path: '/contact',
    },
  ] as NavItem[],

  // Footer Navigation
  footer: {
    services: [
      {
        label: 'Búsqueda de Compradores',
        path: '/#services',
      },
      {
        label: 'Intermediario Inmobiliario',
        path: '/#services',
      },
      {
        label: 'Desarrollo Inmobiliario',
        path: '/#desarrollo',
      },
      {
        label: 'Multifamiliares',
        path: '/propiedades?type=multifamiliar',
      },
      {
        label: 'Estudios y Oficinas',
        path: '/propiedades?type=oficina',
      },
      {
        label: 'Contacto',
        path: '/contact',
      },
    ] as NavItem[],

    quickLinks: [
      {
        label: 'Propiedades',
        path: '/propiedades',
      },
      {
        label: 'Terrenos',
        path: '/solares',
      },
      {
        label: 'Acerca de Nosotros',
        path: '/about',
      },
      {
        label: 'Política de Privacidad',
        path: '/privacy',
      },
    ] as NavItem[],
  },
} as const;

export type NavigationConfig = typeof navigationConfig;

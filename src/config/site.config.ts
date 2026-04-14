export const siteConfig = {
  name: 'LOWESS',
  fullName: 'LOWEST-WESSIN INMOBILIARIA, E.I.R.L.',
  tagline: 'Soluciones Integrales en el Sector Inmobiliario',
  description: 'Especialistas en intermediación inmobiliaria, desarrollo de proyectos y gestión de propiedades en República Dominicana',
  foundedYear: 2020,

  contact: {
    phone: '+1 (809) 864-1996',
    phoneRaw: '18098641996',
    email: 'lowestwessin@realestatewl.com',
    whatsapp: '18098641996',
    whatsappLink: 'https://wa.me/18098641996',
    address: {
      line1: 'Av. Sarasota, Esq. Francisco Moreno',
      line2: 'Plaza Comercial Kury, Suite #213',
      city: 'Bella Vista, Santo Domingo',
      country: 'República Dominicana',
      postalCode: '10112',
      full: 'Av. Sarasota, Esq. Francisco Moreno, Plaza Comercial Kury, Suite #213, Bella Vista, Santo Domingo 10112, República Dominicana',
    },
  },

  social: {
    facebook: {
      url: 'https://www.facebook.com/profile.php?id=61550750518618',
      handle: '@lowess',
    },
    instagram: {
      url: 'https://www.instagram.com/lowess_inmobiliaria/',
      handle: '@lowess_inmobiliaria',
    },
    linkedin: {
      url: 'https://www.linkedin.com/company/lowess/',
      handle: 'lowess',
    },
    twitter: {
      url: 'https://twitter.com/lowess',
      handle: '@lowess',
    },
  },

  map: {
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3784.2896796394547!2d-69.9299827!3d18.4697!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDI4JzExLjAiTiA2OcKwNTUnNDcuOSJX!5e0!3m2!1sen!2sdo!4v1234567890',
    coordinates: {
      lat: 18.4697,
      lng: -69.9299827,
    },
  },

  legal: {
    rnc: 'E.I.R.L.',
    privacyPolicyUrl: '/privacy',
    termsOfServiceUrl: '/terms',
  },

  seo: {
    defaultTitle: 'LOWESS - Soluciones Integrales en el Sector Inmobiliario',
    defaultDescription: 'Especialistas en intermediación inmobiliaria, desarrollo de proyectos y gestión de propiedades en República Dominicana. +200 clientes satisfechos.',
    defaultKeywords: 'inmobiliaria, propiedades, terrenos, República Dominicana, LOWESS, bienes raíces, intermediación inmobiliaria',
    ogImage: '/images/og-image.jpg',
    twitterCard: 'summary_large_image',
  },
} as const;

export type SiteConfig = typeof siteConfig;

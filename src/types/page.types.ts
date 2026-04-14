export interface PageMeta {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  ogUrl?: string;
}

export interface RouteParams {
  id?: string;
  type?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId?: string;
}

export interface FormErrors {
  [key: string]: string;
}

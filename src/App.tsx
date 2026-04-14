import { Routes, Route, Navigate } from 'react-router-dom';
import { PageLayout } from './components/layout';
import { HomePage } from './pages/HomePage';

function PropertiesPage() {
  return (
    <div className="container-custom py-16">
      <div className="heading-container">
        <h2>Propiedades en Venta</h2>
        <p>Descubre las mejores propiedades disponibles en República Dominicana.</p>
      </div>
      <div className="mt-8 p-8 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">Componente de listado de propiedades en desarrollo...</p>
        <p className="text-sm text-gray-500 mt-2">Próximamente: Filtros, búsqueda, paginación y tarjetas de propiedades</p>
      </div>
    </div>
  );
}

function SolaresPage() {
  return (
    <div className="container-custom py-16">
      <div className="heading-container">
        <h2>Terrenos y Solares</h2>
        <p>Encuentra el terreno perfecto para tu proyecto.</p>
      </div>
      <div className="mt-8 p-8 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">Componente de listado de solares en desarrollo...</p>
        <p className="text-sm text-gray-500 mt-2">Próximamente: Filtros por ubicación, tamaño y precio</p>
      </div>
    </div>
  );
}

function PropertyDetailPage() {
  return (
    <div className="container-custom py-16">
      <div className="heading-container">
        <h2>Detalle de Propiedad</h2>
      </div>
      <div className="mt-8 p-8 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">Vista detallada de propiedad en desarrollo...</p>
        <p className="text-sm text-gray-500 mt-2">Próximamente: Galería de imágenes, características, ubicación y formulario de contacto</p>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="container-custom py-16">
      <div className="heading-container">
        <h2>Acerca de Nosotros</h2>
        <p>Conoce más sobre LOWESS y nuestra trayectoria.</p>
      </div>
      <div className="mt-8 p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-700 leading-relaxed">
          LOWESS es una empresa dedicada a ofrecer soluciones integrales en el sector inmobiliario.
          Con más de 4 años de experiencia y más de 200 clientes satisfechos, nos especializamos en
          intermediación inmobiliaria, desarrollo de proyectos y gestión de propiedades.
        </p>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="container-custom py-16">
      <div className="heading-container">
        <h2>Contacto</h2>
        <p>Estamos aquí para ayudarte. Contáctanos hoy mismo.</p>
      </div>
      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <div className="p-8 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-xl mb-4">Información de Contacto</h3>
          <div className="space-y-4">
            <p><strong>Teléfono:</strong> +1 (809) 864-1996</p>
            <p><strong>Email:</strong> lowestwessin@realestatewl.com</p>
            <p><strong>Dirección:</strong> Av. Sarasota, Esq. Francisco Moreno, Plaza Comercial Kury, Suite #213</p>
          </div>
        </div>
        <div className="p-8 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">Formulario de contacto en desarrollo...</p>
          <p className="text-sm text-gray-500 mt-2">Próximamente: Formulario con validación y envío</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<PageLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/propiedades" element={<PropertiesPage />} />
        <Route path="/solares" element={<SolaresPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroSection, StatBox, ServiceCard } from '../components/home';
import { PropertyCard } from '../components/property';
import { usePropertiesStore } from '../store/usePropertiesStore';
import { statsData, servicesData } from '../config';

export function HomePage() {
  const { featured, loadFeaturedProperties, loading } = usePropertiesStore();

  useEffect(() => {
    loadFeaturedProperties();
  }, [loadFeaturedProperties]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Motivational Quote Section */}
      <section className="bg-gradient-to-r from-accent-orange to-accent-blue py-16">
        <div className="container-custom">
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              "Haz de cada día tu obra maestra"
            </h2>
            <p className="text-xl opacity-90">- John Wooden</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="heading-container text-center mb-12">
            <h2>¿Por Qué Elegir LOWESS?</h2>
            <p className="mx-auto">
              Años de experiencia respaldados por resultados comprobados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {statsData.map((stat, index) => (
              <StatBox key={stat.id} stat={stat} delay={index * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="section">
        <div className="container-custom">
          <div className="heading-container text-center mb-12">
            <h2>Propiedades Destacadas</h2>
            <p className="mx-auto">
              Descubre las mejores oportunidades inmobiliarias disponibles
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : featured.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                {featured.slice(0, 6).map((property) => (
                  <PropertyCard key={property.id} property={property} variant="featured" />
                ))}
              </div>

              <div className="text-center mt-12">
                <Link to="/propiedades" className="btn-secondary shadow-lg">
                  Ver Todas las Propiedades
                  <svg
                    className="w-5 h-5 ml-2 inline-block"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-600">No hay propiedades destacadas disponibles.</p>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-custom">
          <div className="heading-container text-center mb-12">
            <h2>Nuestros Servicios</h2>
            <p className="mx-auto">
              Soluciones integrales para todas tus necesidades inmobiliarias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {servicesData.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section relative overflow-hidden">
        {/* Background with pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark opacity-95" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />

        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Listo para Encontrar tu Propiedad Ideal?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Nuestro equipo de expertos está aquí para ayudarte en cada paso del camino
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/contact" className="btn-accent shadow-2xl hover:shadow-3xl">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contáctanos
              </Link>
              <Link
                to="/propiedades"
                className="btn bg-white/10 backdrop-blur-sm text-white border-2 border-white hover:bg-white hover:text-primary shadow-xl"
              >
                Explorar Propiedades
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

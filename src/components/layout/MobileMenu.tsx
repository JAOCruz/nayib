import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { navigationConfig } from '../../config';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (!menuRef.current || !linksRef.current) return;

    if (isOpen) {
      // Open animation
      const tl = gsap.timeline();

      tl.to(menuRef.current, {
        x: 0,
        duration: 0.4,
        ease: 'power3.out',
      });

      // Stagger menu links
      const links = linksRef.current.querySelectorAll('.menu-link');
      tl.from(
        links,
        {
          x: -30,
          opacity: 0,
          duration: 0.3,
          stagger: 0.08,
          ease: 'power2.out',
        },
        '-=0.2'
      );
    } else {
      // Close animation
      gsap.to(menuRef.current, {
        x: '-100%',
        duration: 0.3,
        ease: 'power3.in',
      });
    }
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="fixed top-0 left-0 bottom-0 w-80 max-w-full bg-white z-50 lg:hidden shadow-2xl overflow-y-auto"
        style={{ transform: 'translateX(-100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <Link to="/" className="flex items-center">
            <img
              src="/images/logo-mobile.png"
              alt="LOWESS"
              className="h-12 w-auto"
            />
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div ref={linksRef} className="p-6">
          <nav className="space-y-2">
            {navigationConfig.mobile.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`menu-link block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Contact Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Contacto
            </h3>
            <div className="space-y-3">
              <a
                href="tel:+18098641996"
                className="flex items-center text-gray-700 hover:text-primary transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                +1 (809) 864-1996
              </a>
              <a
                href="mailto:lowestwessin@realestatewl.com"
                className="flex items-center text-gray-700 hover:text-primary transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-3"
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
                <span className="text-sm">lowestwessin@realestatewl.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

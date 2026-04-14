import { Link, useLocation } from 'react-router-dom';
import { navigationConfig } from '../../config';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-primary shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container-custom">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/images/logo-mobile.png"
              alt="LOWESS"
              className="h-12 md:h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center space-x-8">
            {navigationConfig.primary.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`text-base font-medium transition-colors duration-300 ${
                    isActive(item.path)
                      ? 'text-white font-semibold'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden flex flex-col items-center justify-center w-10 h-10 space-y-1.5 focus:outline-none focus:ring-2 focus:ring-white rounded"
            aria-label="Toggle menu"
          >
            <span className="block w-6 h-0.5 bg-white transition-all duration-300"></span>
            <span className="block w-6 h-0.5 bg-white transition-all duration-300"></span>
            <span className="block w-6 h-0.5 bg-white transition-all duration-300"></span>
          </button>
        </nav>
      </div>
    </header>
  );
}

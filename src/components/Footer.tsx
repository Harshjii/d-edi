import lbbLogo from '../assets/lbb.jpg';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img
                src={lbbLogo}
                alt="D-EDI Logo"
                className="w-10 h-10 object-contain rounded-lg"
              />
              <span className="text-2xl font-bold">D-EDI</span>
            </div>
            <p className="text-secondary mb-4">
              Premium custom clothing brand offering trendy and ethnic wear with modern designs and exceptional quality.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-secondary hover:text-accent transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/deepjotclothingstore" className="text-secondary hover:text-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-secondary hover:text-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-secondary hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/products" className="text-secondary hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products/t-shirts" className="text-secondary hover:text-white transition-colors">T-Shirts</Link></li>
              <li><Link to="/products/dresses" className="text-secondary hover:text-white transition-colors">Dresses</Link></li>
              <li><Link to="/products/ethnic" className="text-secondary hover:text-white transition-colors">Ethnic Wear</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-secondary hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/shipping" className="text-secondary hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="text-secondary hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/size-guide" className="text-secondary hover:text-white transition-colors">Size Guide</Link></li>
              <li><Link to="/faq" className="text-secondary hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="text-secondary">Mumbai, Maharashtra, India</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-accent" />
                <span className="text-secondary">+91 9876543210</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-accent" />
                <span className="text-secondary">support@d-edi.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-secondary text-sm">
            © 2024 D-EDI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-secondary hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-secondary hover:text-white text-sm transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
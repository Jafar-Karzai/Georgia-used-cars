'use client'

import Link from 'next/link'
import { MessageCircle, Phone, Mail, MapPin } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="bg-precision-950 text-precision-300 py-16" role="contentinfo">
      <div className="max-w-content mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Logo and Description - spans 2 columns on desktop */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-lg">
              <span className="text-precision-900 font-black text-xl">G</span>
            </div>
            <div>
              <h2 className="font-extrabold text-xl tracking-tighter text-white">
                GEORGIA <span className="text-action-500">USED CARS</span>
              </h2>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-sm">
            Premium salvage vehicles imported from US and Canada auctions.
            Specializing in project cars and industrial spare parts.
            Your trusted partner in Sharjah, UAE.
          </p>
        </div>

        {/* Quick Links */}
        <nav aria-label="Footer navigation">
          <h3 className="text-white font-bold text-2xs uppercase tracking-widest mb-6">
            Quick Links
          </h3>
          <ul className="text-sm space-y-4">
            <li>
              <Link
                href="/"
                className="hover:text-white transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/inventory"
                className="hover:text-white transition-colors"
              >
                Live Inventory
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-white transition-colors"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-white transition-colors"
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Contact Info */}
        <div>
          <h3 className="text-white font-bold text-2xs uppercase tracking-widest mb-6">
            Contact
          </h3>
          <ul className="text-sm space-y-4">
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-precision-400" aria-hidden="true" />
              Sharjah Industrial Area 4
            </li>
            <li>
              <a
                href="tel:+971555467220"
                className="flex items-center gap-2 text-precision-400 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                +971 55 546 7220
              </a>
            </li>
            <li>
              <a
                href="mailto:info@georgiacars.com"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-precision-400" aria-hidden="true" />
                info@georgiacars.com
              </a>
            </li>
            <li className="pt-2">
              <a
                href="https://wa.me/971555467220"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-success hover:text-success-light transition-colors"
                aria-label="Contact us on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-content mx-auto px-4 md:px-6 border-t border-precision-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-2xs font-bold uppercase tracking-widest">
        <span>&copy; {new Date().getFullYear()} Georgia Used Cars Sharjah. All Rights Reserved.</span>
        <div className="flex gap-6">
          <Link
            href="/privacy-policy"
            className="hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="hover:text-white transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}

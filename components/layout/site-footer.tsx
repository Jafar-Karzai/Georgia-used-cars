'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Logo and Description - spans 2 columns on desktop */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-lg">
              <span className="text-blue-900 font-black text-xl">G</span>
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tighter text-white">
                GEORGIA <span className="text-red-600">USED CARS</span>
              </h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-sm">
            Premium salvage vehicles imported from US and Canada auctions.
            Specializing in project cars and industrial spare parts.
            Your trusted partner in Sharjah, UAE.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">
            Quick Links
          </h4>
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
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">
            Contact
          </h4>
          <ul className="text-sm space-y-4">
            <li>Sharjah Industrial Area 4</li>
            <li className="text-blue-400">+971 55 546 7220</li>
            <li>info@georgiacars.com</li>
            <li className="pt-2">
              <a
                href="https://wa.me/971555467220"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
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

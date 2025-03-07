
import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FooterProps {
  language: 'en' | 'sw';
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const currentYear = new Date().getFullYear();
  
  const translations = {
    en: {
      about: "About TenderConnect",
      about_text: "TenderConnect is a platform designed to help businesses access tender opportunities in Kenya with a focus on AGPO (Access to Government Procurement Opportunities).",
      resources: "Resources",
      legal: "Legal",
      contact: "Contact Us",
      business_partners: "Business Partners",
      copyright: "© " + currentYear + " TenderConnect. All rights reserved.",
      made_with_love: "Made with ",
      in_kenya: " in Kenya",
      subscribe: "Subscribe to tender alerts",
      enter_email: "Enter your email",
      subscribe_button: "Subscribe",
      links: {
        home: "Home",
        tenders: "Tenders",
        dashboard: "Dashboard",
        about: "About Us",
        how_it_works: "How It Works",
        pricing: "Pricing",
        services: "Services",
        faq: "FAQ",
        blog: "Blog",
        terms: "Terms of Service",
        privacy: "Privacy Policy",
        cookies: "Cookie Policy",
        contact: "Contact Us",
        support: "Support",
        partners: "Partners",
        government: "Government Links",
        investors: "Investors",
        counties: "County Procurement",
        agpo: "AGPO Resources"
      }
    },
    sw: {
      about: "Kuhusu TenderConnect",
      about_text: "TenderConnect ni jukwaa lililoundwa kusaidia biashara kupata fursa za zabuni nchini Kenya kwa kuzingatia AGPO (Ufikiaji wa Fursa za Ununuzi wa Serikali).",
      resources: "Rasilimali",
      legal: "Kisheria",
      contact: "Wasiliana Nasi",
      business_partners: "Washirika wa Biashara",
      copyright: "© " + currentYear + " TenderConnect. Haki zote zimehifadhiwa.",
      made_with_love: "Imetengenezwa kwa ",
      in_kenya: " nchini Kenya",
      subscribe: "Jiandikishe kupokea arifa za zabuni",
      enter_email: "Ingiza barua pepe yako",
      subscribe_button: "Jiandikishe",
      links: {
        home: "Nyumbani",
        tenders: "Zabuni",
        dashboard: "Dashibodi",
        about: "Kuhusu Sisi",
        how_it_works: "Jinsi Inavyofanya Kazi",
        pricing: "Bei",
        services: "Huduma",
        faq: "Maswali Yanayoulizwa Mara kwa Mara",
        blog: "Blogu",
        terms: "Masharti ya Huduma",
        privacy: "Sera ya Faragha",
        cookies: "Sera ya Vidakuzi",
        contact: "Wasiliana Nasi",
        support: "Msaada",
        partners: "Washirika",
        government: "Viungo vya Serikali",
        investors: "Wawekezaji",
        counties: "Ununuzi wa Kaunti",
        agpo: "Rasilimali za AGPO"
      }
    }
  };
  
  const t = translations[language];
  
  return (
    <footer className="bg-slate-900 text-slate-200">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t.about}</h3>
            <p className="text-slate-400 text-sm">{t.about_text}</p>
            <div className="flex space-x-4">
              <a href="https://github.com/tenderconnect" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <Github size={20} />
              </a>
              <a href="https://twitter.com/tenderconnect" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com/company/tenderconnect" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="mailto:info@tenderconnect.app" className="text-slate-400 hover:text-white transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          {/* Resources & Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t.resources}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  {t.links.home}
                </Link>
              </li>
              <li>
                <Link to="/tenders" className="text-slate-400 hover:text-white transition-colors">
                  {t.links.tenders}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  {t.links.dashboard}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  {t.links.about}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-400 hover:text-white transition-colors">
                  {t.links.how_it_works}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-slate-400 hover:text-white transition-colors">
                  {t.links.blog}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Government & County Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t.business_partners}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://www.treasury.go.ke" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  Ministry of Finance
                </a>
              </li>
              <li>
                <a href="https://agpo.go.ke" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  AGPO Portal
                </a>
              </li>
              <li>
                <a href="https://www.ppoa.go.ke" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  Public Procurement Authority
                </a>
              </li>
              <li>
                <a href="https://supplier.treasury.go.ke" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  Supplier Portal
                </a>
              </li>
              <li>
                <a href="https://www.kra.go.ke" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  Kenya Revenue Authority
                </a>
              </li>
              <li>
                <a href="https://www.nys.go.ke" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  National Youth Service
                </a>
              </li>
            </ul>
          </div>
          
          {/* Legal & Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t.legal}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
                  {t.links.terms}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  {t.links.privacy}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-slate-400 hover:text-white transition-colors">
                  {t.links.cookies}
                </Link>
              </li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-6">{t.contact}</h3>
            <address className="not-italic text-sm text-slate-400">
              <p>TenderConnect Ltd</p>
              <p>Westlands Business Park</p>
              <p>Nairobi, Kenya</p>
              <p>
                <a href="mailto:info@tenderconnect.app" className="hover:text-white transition-colors">
                  info@tenderconnect.app
                </a>
              </p>
              <p>
                <a href="tel:+254700000000" className="hover:text-white transition-colors">
                  +254 700 000000
                </a>
              </p>
            </address>
          </div>
        </div>
        
        {/* Newsletter Subscription */}
        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.subscribe}</h3>
              <p className="text-slate-400 text-sm">Stay updated with the latest tender opportunities</p>
            </div>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder={t.enter_email}
                className="px-4 py-2 bg-slate-800 text-white rounded-md flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="default">{t.subscribe_button}</Button>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
          <p>{t.copyright}</p>
          <p className="mt-4 md:mt-0 flex items-center">
            {t.made_with_love}<Heart size={16} className="mx-1 text-red-500" fill="currentColor" />{t.in_kenya}
          </p>
        </div>
      </div>
    </footer>
  );
};

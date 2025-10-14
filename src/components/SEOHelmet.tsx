import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  children?: React.ReactNode;
}

const SEOHelmet: React.FC<SEOHelmetProps> = ({
  title = "MyEnglishOne - Domine a Fluência em Inglês",
  description = "Aprenda frases úteis diariamente, pratique conversação com IA e desenvolva confiança para falar inglês naturalmente. Plataforma personalizada para iniciantes e intermediários.",
  keywords = "inglês, fluência, conversação, aprender inglês, frases inglês, prática inglês",
  image = "https://myenglishone.com/lovable-uploads/1b7b0c42-8757-4195-b088-3486df413224.png",
  type = "website",
  children
}) => {
  const location = useLocation();
  const canonicalUrl = `https://myenglishone.com${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Update or create link tags
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      
      element.setAttribute('href', href);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:locale', 'pt_BR', true);

    // Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Canonical URL
    updateLinkTag('canonical', canonicalUrl);

  }, [title, description, keywords, image, type, canonicalUrl]);

  return <>{children}</>;
};

export default SEOHelmet;
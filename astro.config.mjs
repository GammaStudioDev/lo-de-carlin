// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: reemplazar por el dominio real de producción antes de publicar el
  // sitio — de este valor dependen el sitemap y las URLs canónicas/og:url.
  site: 'https://www.automotoresdelmolino.com.ar',

  redirects: {
    '/aboutUs': '/nosotros',
    '/contact': '/contacto',
    '/services': '/eventos',
    '/productView': '/eventos'
  },

  image: {
    domains: ['http2.mlstatic.com', 'picsum.photos', 'fastly.picsum.photos']
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});
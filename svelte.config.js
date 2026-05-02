import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html'
    }),
    alias: {
      $components: 'src/lib/components',
      $services: 'src/lib/services',
      $entities: 'src/lib/entities'
    }
  }
};

export default config;

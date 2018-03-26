module.exports = {
  env: {
    apiRoot: 'http://localhost:3001/',
    builtAt: new Date(),
  },
  dev: process.env.NODE_ENV !== 'production',
  head: {
    link: [
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css?family=Ubuntu|Ubuntu+Condensed|Ubuntu+Mono',
      },
    ],
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ]
  },
  css: [
    { src: 'mdi/css/materialdesignicons.css', lang: 'css' },
    { src: 'highlight.js/styles/vs.css', lang: 'css' },
    { src: '@/css/bulma.scss', lang: 'scss' },
    { src: '@/css/katex.scss', lang: 'scss' },
    { src: '@/css/app.scss', lang: 'scss' },
  ],
   build: {
    extend (config) {
      // config.module.rules.push({
      //   test: /\.(eot|woff|woff2|svg|ttf)([\?]?.*)$/, loader: "file-loader",
      // })
    },
    postcss: {
      plugins: {
        'postcss-custom-properties': false, // supress bulma warning
      }
    }
  },
  render: {
    bundleRenderer: {
      shouldPreload: (file, type) => {
        return ['script', 'style', 'font'].includes(type)
      }
    }
  },
  plugins: [
    { src: '~plugins/ga', ssr: false },
    '~plugins/components',
    '~plugins/my-components',
    '~plugins/vuex-router-sync',
  ],
}

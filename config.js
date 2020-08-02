export default {
  url: 'https://www.nerdwallet.com/article/investing/how-to-invest-dividend-stocks',
  runs: 1,
  keyAudits: [
    'largest-contentful-paint',
    'total-blocking-time',
    'speed-index',
    'interactive',
    'first-contentful-paint',
  ],
  assetTests: [
    //'aggregate',
    'individual',
  ],
  assetGroups: [
    {
      label: 'Featured image',
      assetPatterns: [
        'GettyImages-1084461368',
      ]
    },
    {
      label: 'Auth dialog',
      assetPatterns: [
        'nw-auth-dialog',
      ]
    },
    {
      label: 'Fonts',
      assetPatterns: [
        'chronicle',
        'gotham'
      ]
    },
    {
      label: '3rd Party',
      assetPatterns: [
        'appsflyer',
        'google',
        'facebook',
        'cloudflare',
        'trafficguard',
        'tgtag',
        'adsymptotic',
        'mtrcs',
        'nr-data',
        'yahoo',
        'kaptcha',
        'doubleclick',
        'taboola',
        'linkedin',
        'revjet',
        'outbrain',
        'turn.com',
        'yimg',
      ]
    },
    {
      label: 'Embeds',
      assetPatterns: [
        'cff',
        'global-markup/legacy',
        'nw-jquery-bundle',
        'wp-includes',
        'wp-content/plugins',
        'wp-content/themes',
        'wp-content/dist',
      ]
    },
    {
      label: 'Images',
      assetPatterns: [
        'png',
        'jpg',
        'jpeg',
      ]
    },
    {
      label: 'Tracking',
      assetPatterns: [
        'amplitude',
        'nwa',
      ]
    },
    {
      label: 'Nav',
      assetPatterns: [
        'nav'
      ]
    },
    {
      label: 'App',
      assetPatterns: [
        'app.'
      ]
    },
  ],
  lighthouseConfig: {
    extends: 'lighthouse:mobile',
    settings: {
      onlyCategories: ['performance'],
    },
  },
};
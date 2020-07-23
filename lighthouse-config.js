module.exports = {
  extends: 'lighthouse:mobile',
  settings: {
    onlyCategories: ['performance'],
    blockedUrlPatterns: [
      // Featured image
      //'GettyImages-1084461368',
      // Auth dialog
      'nw-auth-dialog',
      // // Comments
      'disqus',
      // // Fonts
      // 'chronicle',
      // 'Chronicle',
      // 'gotham',
      // 'Gotham',
      // // 3rd party
      // 'appsflyer',
      // 'google',
      // 'facebook',
      // 'trafficguard',
      // 'tgtag',
      // 'adsymptotic',
      // 'mtrcs',
      // 'nr-data',
      // 'yahoo',
      // 'kaptcha',
      // 'doubleclick',
      // 'taboola',
      // 'linkedin',
      // 'revjet',
      // 'outbrain',
      // 'turn.com',
      // 'yimg',
      // // Embed assets
      // 'cff',
      // 'global-markup/legacy',
      // 'nw-jquery-bundle',
      // 'wp-includes',
      // 'wp-content/plugins',
      // 'wp-content/themes',
      // 'wp-content/dist',
      // // Images
      // 'png',
      // 'jpg',
      // 'jpeg',
      // // Tracking
      // 'amplitude',
      // 'nwa',
      // // Cloudflare
      // 'cloudflare',
      // // Nav
      // 'nav',
      // App
      //'app.',
    ]
  },
};
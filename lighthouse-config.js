module.exports = {
  extends: 'lighthouse:mobile',
  settings: {
    onlyCategories: ['performance'],
    blockedUrlPatterns: [
      // 'GettyImages-1084461368', // Featured image
    ]
  },
};
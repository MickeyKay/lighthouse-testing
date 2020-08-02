# Lighthouse Optimizer

An opinionated performance tool built on top of [lighthouse-batch](https://github.com/mikestead/lighthouse-batch). Lighthouse optimizer measures the performance impact of selectively blocking specific assets.

## Usage
1. Configure `config.js` and `lighthouse-config.js`
1. Run `npm run test`

## Configuration

### `config.js`
Specify your target URL, number of test runs per asset groups, and specific asset patterns to block.

### `lighthouse-config.js`
[Lighthouse-specific configuration](https://github.com/GoogleChrome/lighthouse/blob/master/docs/configuration.md)

## Todo
- [x] Convert bash to node script for ease of use
- [ ] Add support for config
	- [x] # of runs
	- [x] assets to remove
	- [x] grouping of assets
	- [ ] URL(s)
	-
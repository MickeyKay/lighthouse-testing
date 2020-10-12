#!/usr/bin/env node

import fs from 'fs-extra';
import lighthouseBatch from 'lighthouse-batch';

import customConfig from '../config.js';

const SITES_FILE = 'sites.txt';
const REPORTS_DIR = 'reports';
const BASELINE_LABEL = 'Baseline';

const CONFIG_DEFAULTS = {
	runs: 3,
	keyAudits: [
		'largest-contentful-paint',
		'total-blocking-time',
		'speed-index',
		'interactive',
		'first-contentful-paint',
	],
	assetTests: [
		'individual',
	],
};

const config = {
  ...customConfig,
  ...CONFIG_DEFAULTS,
};

const setup = () => {
	fs.removeSync(REPORTS_DIR);
};

const getAssetGroupLabels = () => config.assetGroups.map(group => group.label);

const runLighthouseBatch = ({
	assetPatterns = [],
	reportType,
	testLabel,
}) => {
	// Params: lighthouse config file
	let lighthouseParams = [
		'--config-path=./lighthouse-config.cjs',
	];

	// Params: blocked URL patterns
	assetPatterns.forEach(assetPattern => {
		lighthouseParams.push(`--blocked-url-patterns=${assetPattern}`);
	});

	lighthouseBatch({
		sites: Array(config.runs || 1).fill(config.url),
		html: true,
		out: `${REPORTS_DIR}/${reportType}/${testLabel}`,
		params: lighthouseParams.join(' '),
	});
}

const generateSummaries = () => {
	fs.readdirSync(REPORTS_DIR, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(reportDir => generateSummariesForTestBatch(reportDir.name));
}

const generateSummariesForTestBatch = (reportDir) => {
  const parentDirectory = `${REPORTS_DIR}/${reportDir}`;
	const directories = fs.readdirSync(parentDirectory, { withFileTypes: true }).filter(dirent => dirent.isDirectory());

	const customSummaries = {};

	// 1. Loop through each set of results.
	[BASELINE_LABEL].concat(getAssetGroupLabels()).forEach(directory => {
		const directoryPath = `./${parentDirectory}/${directory}`;

		// 2. Get all summaries for each set of results.
		const lighthouseSummaries = fs.readJsonSync(`${directoryPath}/summary.json`);

		const keyedResults = {};

		lighthouseSummaries.forEach(lighthouseSummary => {
			const details = fs.readJsonSync(`${directoryPath}/${lighthouseSummary.file}`);

			for (const auditId in details.audits) {
				keyedResults[auditId] = (keyedResults[auditId] || []).concat(details.audits[auditId].score*100);
			};
		});

		const averagesSummary = {};
		for (const auditId in keyedResults) {
			averagesSummary[auditId] = keyedResults[auditId].reduce((a,b) => a + b, 0) / keyedResults[auditId].length;
		}

		customSummaries[directory] = averagesSummary;
	});

	// Assemble table header html.
	let headerHtml = '<tr><th scope="col">Test</th>';
	config.keyAudits.forEach(auditId => {
		headerHtml += `<th scope="col">${auditId}</th>`;
	});

	headerHtml += '</tr>';

	// Assemble table rows.
	const getRowHtml = (summaryId, counter = 0) => {
		let rowHtml = `<th scope="row">${counter}. ${summaryId}</th>`;

		config.keyAudits.forEach(auditId => {
			const baselineValue = customSummaries[BASELINE_LABEL][auditId].toFixed(0);
			const testValue = customSummaries[summaryId][auditId].toFixed(0);

			const rawDelta = ((testValue - baselineValue) / baselineValue * 100).toFixed(0);
      const delta = isNaN(rawDelta) ? 0 : rawDelta;

			let deltaClass = '';

			if (delta >= 30) {
				deltaClass = 'plus-3';
			} else if (delta >= 20) {
				deltaClass = 'plus-2';
			} else if (delta >= 5) {
				deltaClass = 'plus-1';
			} else if (delta <= -30) {
				deltaClass = 'minus-3';
			} else if (delta <= -20) {
				deltaClass = 'minus-2';
			} else if (delta <= -5) {
				deltaClass = 'minus-1';
			}


			rowHtml += `<td class="${deltaClass}"><b>${testValue}</b> ${summaryId === BASELINE_LABEL ? '' : '(' + (delta > 0 ? '+' : '') + delta + '%)'}</td>`;
		});

		return `<tr>${rowHtml}</td>`;
	}

	let rowsHtml = '';

	rowsHtml += getRowHtml(BASELINE_LABEL);

  let counter = 1;
	for (const summaryId in customSummaries) {
		if (summaryId === BASELINE_LABEL) {
			continue;
		}

		rowsHtml += getRowHtml(summaryId, counter++);
	}

  const title = `Summary: ${reportDir.charAt(0).toUpperCase() + reportDir.slice(1)}`;

	const html = `
		<!doctype html>
		<html lang="en">
			<head>
			  <head>
          <!-- Required meta tags -->
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

          <!-- Bootstrap CSS -->
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">

          <title>${title}</title>
  			  <style>
    				.plus-1 {
    					background: YellowGreen;
    					color: white;
    				}

    				.plus-2 {
    					background: MediumSeaGreen;
    					color: white;
    				}

    				.plus-3 {
    					background: DarkGreen;
    					color: white;
    				}

    				.minus-1 {
    					background: Coral;
    					color: white;
    				}

    				.minus-2 {
    					background: OrangeRed;
    					color: white;
    				}

    				.minus-3 {
    					background: Red;
    					color: white;
    				}
  			  </style>
         </head>
         <body>
           <div class="container">
             <h1 class="h2 mt-3 mb-3 text-center">${title}</h1>
             <ul class="nav nav-tabs" id="myTab" role="tablist">
              <li class="nav-item">
                <a class="nav-link active" id="scores-tab" data-toggle="tab" href="#tab-scores" role="tab" aria-controls="scores" aria-selected="true">Scores</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" id="3-tab" data-toggle="tab" href="#tab-2" role="tab" aria-controls="profile" aria-selected="false">Tab 2</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" id="3-tab" data-toggle="tab" href="#tab-3" role="tab" aria-controls="tab-3" aria-selected="false">Tab 3</a>
              </li>
            </ul>
            <div class="tab-content" id="myTabContent">
              <div class="tab-pane fade show active" id="tab-scores" role="tabpanel" aria-labelledby="scores-tab">
                <div class="table-responsive">
                 <table class="table table-bordered">
                   <thead class="thead-light">${headerHtml}</thead>
                   <tbody>${rowsHtml}</tbody>
                 </table>
                </div>
              </div>
              <div class="tab-pane fade" id="tab-2" role="tabpanel" aria-labelledby="2-tab">TAB 2</div>
              <div class="tab-pane fade" id="tab-3" role="tabpanel" aria-labelledby="3-tab">TAB 3</div>
            </div>
          </div>
         <!-- Optional JavaScript -->
         <!-- jQuery first, then Popper.js, then Bootstrap JS -->
         <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
         <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js" integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN" crossorigin="anonymous"></script>
         <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js" integrity="sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV" crossorigin="anonymous"></script>
         </body>
		</html>
	`;

	fs.writeFileSync(`${parentDirectory}/summary.html`, html);
}

const runTests = () => {
	if (!config.url) {
		console.error('No URL specified. Please specify a URL in config.js.');
		return null;
	}

	// Run individual tests.
	if (config.assetGroups && (config.assetTests || []).includes('individual')) {

		// Run baseline asset tests.
		runLighthouseBatch({
			reportType: 'individual',
			testLabel: BASELINE_LABEL,
		});

		config.assetGroups.forEach((assetGroup) => {

			// Run individual asset tests.
			runLighthouseBatch({
				assetPatterns: assetGroup.assetPatterns,
				reportType: 'individual',
				testLabel: assetGroup.label,
			});
		});
	}

	// Run aggregate tests.
	if (config.assetGroups && (config.assetTests || []).includes('aggregate')) {

		// Run baseline asset tests.
		runLighthouseBatch({
			reportType: 'aggregate',
			testLabel: BASELINE_LABEL,
		});

		for ( let i = 0; i < config.assetGroups.length; i++ ) {
			const assetGroups = config.assetGroups.slice(0, i);

			const assetPatterns = assetGroups.reduce((allPatterns, groupPatterns) => allPatterns.concat(groupPatterns), []);

			runLighthouseBatch({
				assetPatterns: assetGroup.assetPatterns,
				reportType: 'aggregate',
				testLabel: assetGroup.label,
			});
		}

	}
}

//setup();
//runTests();
generateSummaries();

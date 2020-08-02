#!/usr/bin/env node

import fs from 'fs-extra';
import lighthouseBatch from 'lighthouse-batch';

import config from '../config.js';

const SITES_FILE = 'sites.txt';
const REPORTS_DIR = 'reports';
const BASELINE_LABEL = 'Baseline';

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
	fs.readdirSync(REPORTS_DIR, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(reportDir => generateSummariesForTestBatch(`${REPORTS_DIR}/${reportDir.name}`));
}

const generateSummariesForTestBatch = (parentDirectory) => {
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
	let headerHtml = '<tr><th>Test</th>';
	config.keyAudits.forEach(auditId => {
		headerHtml += `<th>${auditId}</th>`;
	});

	headerHtml += '</tr>';

	// Assemble table rows.
	const getRowHtml = (summaryId) => {
		let rowHtml = `<td>${summaryId}</td>`;
		config.keyAudits.forEach(auditId => {
			const baselineValue = customSummaries[BASELINE_LABEL][auditId].toFixed(0);
			const testValue = customSummaries[summaryId][auditId].toFixed(0);

			const delta = ((testValue - baselineValue) / baselineValue * 100).toFixed(0);

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


			if (summaryId === BASELINE_LABEL) {
				rowHtml += `<td><b>${testValue}</b></td>`;
			} else {
				rowHtml += `<td class="${deltaClass}"><b>${testValue}</b> (${delta > 0 ? '+' : ''}${delta}%)</td>`;
			}
		});

		return `<tr>${rowHtml}</td>`;
	}

	let rowsHtml = '';

	rowsHtml += getRowHtml(BASELINE_LABEL);

	for (const summaryId in customSummaries) {
		if (summaryId === BASELINE_LABEL) {
			continue;
		}

		rowsHtml += getRowHtml(summaryId);
	}

	const html = `
		<!doctype html>
		<html lang="en">
			<head>
			  <meta charset="utf-8">
			  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">
			  <style>
				table {
				  border-collapse: collapse;
				  white-space: nowrap;
				}

				table, th, td {
				  border: 1px solid black;
				}

				th, td{
					padding: 5px;
				}

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
				<table>
					<thead>${headerHtml}</thead>
					<tbody>${rowsHtml}</tbody>
				</table>
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

// setup();
// runTests();
generateSummaries();

// cleanup();
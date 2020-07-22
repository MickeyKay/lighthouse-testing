#!/bin/bash

SITES_DIR=../sites.text
REPORT_DIR=./report/lighthouse
REPORTS_DIR=./reports

read -p "Test name: " test_name



copy_results() {
	individual_scores=$(jq '.[].detail.performance' $REPORT_DIR/summary.json)

	total = 0
	for score in $individual_scores
	do
		total = $total + $score
		echo $total
		((count++))
	done
	echo "scale=2; $total / $count" | bc

	dest_dir="./reports/$(date +'%Y-%m-%d-%H:%M:%S')"
	mkdir -p ./reports

	if [ ! -z $1 ]
		then
			cp -R $REPORT_DIR "$dest_dir (${1})"
		else
			cp -R $REPORT_DIR $dest_dir
	fi
}

run_tests() {
	npm run run-lighthouse
}

copy_results $test_name



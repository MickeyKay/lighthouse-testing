#!/bin/bash

SITES_DIR=../sites.text
REPORT_DIR=./report/lighthouse
REPORTS_DIR=./reports

read -p "Test name: " test_name

copy_results() {
	individual_scores=$(jq '.[].detail.performance | tonumber' $REPORT_DIR/summary.json)

	count=0;
	total=0;

	for score in $individual_scores
	do
		total=$(echo $total+$score | bc)
		((count++))
	done

	average_score=$(echo "scale=2; $total / $count" | bc)

	dest_dir="./reports/$(date +'%Y-%m-%d-%H:%M:%S')"
	mkdir -p ./reports

	if [ ! -z "${test_name}" ]
		then
			path="$dest_dir ($test_name)"
		else
			path=$dest_dir
	fi

	cp -R $REPORT_DIR "$path [$average_score]"
}

run_tests() {
	npm run run-lighthouse
}

run_tests && copy_results



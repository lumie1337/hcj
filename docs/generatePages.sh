#!/bin/bash

pages=(
	"home"
	"tutorial_01"
	"tutorial_02"
	"tutorial_03"
	"tutorial_04"
	"apiComponents"
	"apiLayouts"
	"apiStyles"
	"apiForms"
	"apiFormsExamples"
	"apiFormFor"
	"apiColors"
	"apiStreams"
	"apiExamples"
	"definingComponents"
	"definingLayouts"
)

index_page="home"

if [[ $1 == "-generate" ]]; then
	for page in "${pages[@]}"
	do
		sed "s/<!-- PAGE -->/var page = \"${page}\";/" docs.html > "${page}.html"
	done
	cp "${index_page}.html" "index.html"
fi

if [[ $1 == "-prerender" ]]; then
    ../src/prerender.sh -is "${pages[@]/%/.html}"
    cp "${index_page}.html" "index.html"
fi

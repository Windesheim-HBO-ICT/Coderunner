package runner

import (
	"fmt"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/utility"
)

type langDefenition struct {
	Language string `json:"language"`
	Shorhand string `json:"shorthand"`
	Image    string `json:"image"`
	Local    bool   `json:"local"`
}

// map of language definitions
var LangDefs = map[string]langDefenition{}

func ParseJSON(file string) error {
	langList := []langDefenition{}

	// Read the file
	err := utility.ReadJSON(file, &langList)
	if err != nil {
		return fmt.Errorf("Could not parse file: %v", err)
	}

	// Fill the map
	for _, lang := range langList {
		LangDefs[lang.Language] = lang
		LangDefs[lang.Shorhand] = lang
	}

	return nil
}

func RunCode(code string, language string) (string, error) {
	stream, err := StreamCode(code, language)
	if err != nil {
		return "", err
	}

	output := ""
	// Read the output from the stream until it's closed
	for line := range stream {
		output += line
	}

	return output, nil
}

func StreamCode(code string, language string) (chan string, error) {
	langDef, ok := LangDefs[language]
	if !ok {
		return nil, fmt.Errorf("Invalid language")
	}

	return runLang(langDef, code)
}

func runLang(langDef langDefenition, code string) (chan string, error) {
	output, err := executeCodeOnImage(code, langDef.Image, langDef.Local)
	if err != nil {
		return nil, fmt.Errorf("Error executing code: %v", err)
	}

	return output, nil
}

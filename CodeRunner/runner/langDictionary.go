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
var langDefs = map[string]langDefenition{}

func ParseJSON(file string) error {
	langList := []langDefenition{}

	// Read the file
	err := utility.ReadJSON(file, &langList)
	if err != nil {
		return fmt.Errorf("Could not parse file: %v", err)
	}

	// Fill the map
	for _, lang := range langList {
		langDefs[lang.Language] = lang
		langDefs[lang.Shorhand] = lang
	}

	return nil
}

func RunCode(code string, language string) (string, error) {
	langDef, ok := langDefs[language]
	if !ok {
		return "", fmt.Errorf("Invalid language")
	}

	return runLang(langDef, code)
}

func runLang(langDef langDefenition, code string) (string, error) {
	output, err := executeCodeOnImage(code, langDef.Image, langDef.Local)
	if err != nil {
		return "", fmt.Errorf("Error executing code: %v", err)
	}

	return output, nil
}

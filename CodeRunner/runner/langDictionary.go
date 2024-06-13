package runner

import (
	"fmt"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/utility"
)

type LangDefenition struct {
	Language string `json:"language"`
	Shorhand string `json:"shorthand"`
	Image    string `json:"image"`
	Local    bool   `json:"local"`
}

// map of language definitions
var LangDefs = map[string]LangDefenition{}

func ParseJSON(file string) error {
	langList := []LangDefenition{}

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

func GetLangDef(language string) (*LangDefenition, error) {
	langDef, ok := LangDefs[language]
	if !ok {
		return nil, fmt.Errorf("Invalid language")
	}

	return &langDef, nil
}

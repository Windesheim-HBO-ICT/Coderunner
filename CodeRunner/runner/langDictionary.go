package runner

import (
	"fmt"
	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/utility"
	"os"
	"os/exec"
	"strings"
)

type langDefenition struct {
	Language   string `json:"language"`
	Shorhand   string `json:"shorthand"`
	FileName   string `json:"fileName"`
	RunCommand string `json:"runCommand"`
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
	// Write the code
	err := utility.WriteToFile(code, langDef.FileName)

	// Remove the file
	defer os.Remove(langDef.FileName)

	if err != nil {
		return "", err
	}

	cmd := strings.Split(langDef.RunCommand, " ")

	// Run the code
	out, err := exec.Command(cmd[0], cmd[1:]...).Output()

	if err != nil {
		return "", err
	}

	return strings.TrimSpace(string(out)), nil
}

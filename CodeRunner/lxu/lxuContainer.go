package lxu

import (
	"fmt"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/runner"
	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/utility"
)

type LXUContainer struct {
	languageDef runner.LangDefenition
	isActive    bool
	containerID string
}

func RunCode(language string, code string) (string, error) {
	langDef, ok := runner.LangDefs[language]
	if !ok {
		return "", fmt.Errorf("Invalid language")
	}

	lxuContainer, err := StartLXUContainer(langDef.Language)
	if err != nil {
		return "", err
	}
	defer lxuContainer.Stop()

	output, err := lxuContainer.RunCode(code)
	if err != nil {
		return "", err
	}

	return output, nil
}

func StartLXUContainer(language string) (*LXUContainer, error) {
	langDef, ok := runner.LangDefs[language]
	if !ok {
		return nil, fmt.Errorf("Invalid language")
	}

	containerID, err := utility.StartContainer(langDef.Image, langDef.Local)
	if err != nil {
		return nil, err
	}

	fmt.Printf("Started container: %v\n", containerID)

	return &LXUContainer{
		languageDef: langDef,
		isActive:    true,
		containerID: containerID,
	}, nil
}

func (lxu *LXUContainer) RunCode(code string) (string, error) {
	if !lxu.isActive {
		return "", fmt.Errorf("Container is not active")
	}

	stream, err := lxu.StreamCode(code)
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

func (lxu *LXUContainer) StreamCode(code string) (chan string, error) {
	if !lxu.isActive {
		return nil, fmt.Errorf("Container is not active")
	}

	return utility.RunCodeOnContainer(code, lxu.containerID)
}

func (lxu *LXUContainer) Restart() error {
	if !lxu.isActive {
		return fmt.Errorf("Container is not active")
	}

	fmt.Printf("Restarting container: %v\n", lxu.containerID)

	err := utility.StopContainer(lxu.containerID)
	if err != nil {
		return err
	}

	containerID, err := utility.StartContainer(lxu.languageDef.Image, lxu.languageDef.Local)
	if err != nil {
		return err
	}

	lxu.containerID = containerID

	return nil
}

func (lxu *LXUContainer) Stop() error {
	if !lxu.isActive {
		return fmt.Errorf("Container is not active")
	}

	fmt.Printf("Stopping container: %v", lxu.containerID)

	err := utility.StopContainer(lxu.containerID)
	if err != nil {
		return err
	}

	lxu.isActive = false

	return nil
}

package lxu

import (
	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/runner"
)

type LXUManager struct {
	containers  map[string]LXUContainer
	subscribers map[string][]chan string
}

func NewLXUManager() *LXUManager {
	return &LXUManager{
		containers:  make(map[string]LXUContainer),
		subscribers: make(map[string][]chan string),
	}
}

var LXUM *LXUManager = NewLXUManager()

func (lxum *LXUManager) CreateContainer(languageDef *runner.LangDefenition) (*LXUReference, error) {
	lxu, ok := lxum.containers[languageDef.Image]
	if ok {
		return lxu.CreateLXUReference(), nil
	}

	lxu, err := CreateLXUContainer(*languageDef)
	if err != nil {
		return nil, err
	}

	imageName := lxu.GetImageName()
	lxum.containers[imageName] = lxu

	return lxu.CreateLXUReference(), nil
}

func (lxum *LXUManager) RunCode(languageDef *runner.LangDefenition, code string) (string, error) {
	lxu, err := lxum.CreateContainer(languageDef)
	if err != nil {
		return "", err
	}

	output, err := lxu.RunCode(code)
	if err != nil {
		return "", err
	}

	return output, nil
}

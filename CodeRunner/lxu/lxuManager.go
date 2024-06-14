package lxu

import (
	"sync"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/runner"
)

type LXUManager struct {
	containers      map[string]*LXUContainer
	containersMutex sync.Mutex
}

func NewLXUManager() *LXUManager {
	return &LXUManager{
		containers: make(map[string]*LXUContainer),
	}
}

var LXUM *LXUManager = NewLXUManager()

func (lxum *LXUManager) GetContainer(languageDef *runner.LangDefenition) (*LXUContainer, error) {
	lxum.containersMutex.Lock()
	defer lxum.containersMutex.Unlock()

	lxu, ok := lxum.containers[languageDef.Image]
	if ok {
		if lxu.isActive {
			return lxu, nil
		}

		delete(lxum.containers, languageDef.Image)
	}

	lxu, err := CreateLXUContainer(*languageDef)
	if err != nil {
		return nil, err
	}

	imageName := lxu.GetImageName()
	lxum.containers[imageName] = lxu

	return lxu, nil
}

func (lxum *LXUManager) CreateContainerRef(languageDef *runner.LangDefenition) (*LXUReference, error) {
	lxu, err := lxum.GetContainer(languageDef)
	if err != nil {
		return nil, err
	}

	lxur := lxu.CreateLXUReference()

	return lxur, nil
}

func (lxum *LXUManager) RunCode(languageDef *runner.LangDefenition, code string) (string, error) {
	lxu, err := lxum.CreateContainerRef(languageDef)
	if err != nil {
		return "", err
	}

	output, err := lxu.RunCode(code)
	if err != nil {
		return "", err
	}

	return output, nil
}

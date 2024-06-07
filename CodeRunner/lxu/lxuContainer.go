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

func CreateLXUContainer(langDef runner.LangDefenition) (LXUContainer, error) {
	containerID, err := utility.StartContainer(langDef.Image, langDef.Local)
	if err != nil {
		return LXUContainer{}, err
	}

	fmt.Printf("Started container: %v\n", containerID)

	return LXUContainer{
		languageDef: langDef,
		isActive:    true,
		containerID: containerID,
	}, nil
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

func (lxu *LXUContainer) GetImageName() string {
	return lxu.languageDef.Image
}

func (lxu *LXUContainer) CreateLXUReference() *LXUReference {
	input, output := utility.CreateChannelPair(lxu.containerID)

	fmt.Println("Created channel pair for container: ", lxu.containerID)

	return &LXUReference{
		output: output,
		input:  input,
	}
}

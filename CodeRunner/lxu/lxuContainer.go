package lxu

import (
	"fmt"
	"time"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/runner"
	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/utility"
)

type LXUContainer struct {
	languageDef runner.LangDefenition
	isActive    bool
	containerID string
	references  map[string]*LXUReference
}

func CreateLXUContainer(langDef runner.LangDefenition) (*LXUContainer, error) {
	containerID, err := utility.StartContainer(langDef.Image, langDef.Local)
	if err != nil {
		return nil, err
	}

	fmt.Printf("Started container: %v\n", containerID)

	return &LXUContainer{
		languageDef: langDef,
		isActive:    true,
		containerID: containerID,
		references:  make(map[string]*LXUReference),
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

	if len(lxu.references) > 0 {
		return fmt.Errorf("Container still has active references")
	}

	fmt.Printf("Stopping container: %v \n", lxu.containerID)
	lxu.isActive = false

	err := utility.StopContainer(lxu.containerID)
	if err != nil {
		return err
	}

	return nil
}

func (lxu *LXUContainer) GetImageName() string {
	return lxu.languageDef.Image
}

func (lxu *LXUContainer) CreateLXUReference() *LXUReference {
	input, output := utility.CreateChannelPair(lxu.containerID)

	// Create a uid for the reference based on the image name and a unix timestamp
	uid := fmt.Sprintf("%v-%v", lxu.GetImageName(), time.Now().Unix())

	lxu.references[uid] = &LXUReference{
		output: output,
		input:  input,
		id:     uid,
		parent: lxu,
	}

	return lxu.references[uid]
}

func (lxu *LXUContainer) RemoveReference(uid string) {
	delete(lxu.references, uid)

	if len(lxu.references) == 0 {
		lxu.Stop()
	}
}

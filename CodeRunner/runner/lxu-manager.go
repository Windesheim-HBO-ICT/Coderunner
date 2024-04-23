package runner

import (
	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/utility"
)

func executeCodeOnImage(input, image string, isLocalImage bool) (string, error) {
	output, err := utility.RunContainer(image, isLocalImage, input)
	if err != nil {
		return "", err
	}

	return output, nil
}

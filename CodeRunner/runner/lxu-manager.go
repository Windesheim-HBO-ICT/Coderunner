package runner

import (
	"fmt"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/utility"
)

func executeCodeOnImage(input, image string, isLocalImage bool) (chan string, error) {
	output, err := utility.RunContainer(image, isLocalImage, input)
	if err != nil {
		println(fmt.Sprintf("Error running container: %s", err.Error()))
		return nil, err
	}

	return output, nil
}

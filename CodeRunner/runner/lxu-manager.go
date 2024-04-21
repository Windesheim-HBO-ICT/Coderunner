package runner

import (
	"os"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/utility"
)

func executeCodeOnImage(input, image string) (string, error) {
	// Get current working directory
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	// Write the input to a file
	err = utility.WriteToFile(input, "input.txt")
	if err != nil {
		return "", err
	}

	// Delete the input file
	defer os.Remove("./input.txt")

	output, err := utility.RunContainer(image, cwd+"/input.txt")
	if err != nil {
		return "", err
	}

	return output, nil
}

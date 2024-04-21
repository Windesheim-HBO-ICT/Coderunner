package main

import (
	"context"
	"io"
	"os"
	"strings"

	"github.com/Windesheim-HBO-ICT/Deeltaken/DockerManager/utility"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

// This we would host somewhere
var languageImageMap = map[string]string{
	"typescript": "lxu-bun",
	"javascript": "lxu-bun",
	"python":     "lxu-python",
	"csharp":     "lxu-csharp",
}

func main() {
	// Create a new docker client
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		panic(err)
	}

	output, err := ExecuteCode(cli, "using System; Console.WriteLine(\"Wow it works\");", "csharp")
	if err != nil {
		panic(err)
	}

	println("Output of code: \n", output)
}

func ExecuteCode(cli *client.Client, input, language string) (string, error) {
	// Get current working directory
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	containerImage := languageImageMap[language]

	// Write the input to a file
	err = utility.WriteToFile(input, "input.txt")
	if err != nil {
		return "", err
	}

	output, err := RunContainer(cli, containerImage, cwd+"/input.txt")
	if err != nil {
		return "", err
	}

	// Delete the input file
	_ = os.Remove("./input.txt")

	return output, nil
}

func RunContainer(cli *client.Client, ImageName, absInFileLoc string) (string, error) {
	// Run a image same as command: `docker run -v "ABSINFILELOC:/input.txt IMAGENAME`
	resp, err := cli.ContainerCreate(context.Background(), &container.Config{
		Image: ImageName,
	}, &container.HostConfig{
		Binds: []string{absInFileLoc + ":/input.txt"},
	}, nil, nil, "")

	if err != nil {
		return "", err
	}

	if err := cli.ContainerStart(context.Background(), resp.ID, container.StartOptions{}); err != nil {
		return "", err
	}

	// Wait for the container to finish
	statusCh, errCh := cli.ContainerWait(context.Background(), resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:

		if err != nil {
			return "", err
		}
	case <-statusCh:
	}

	out, err := cli.ContainerLogs(context.Background(), resp.ID, container.LogsOptions{ShowStdout: true})
	if err != nil {
		return "", err
	}

	buf := new(strings.Builder)
	if _, err = io.Copy(buf, out); err != nil {
		return "", err
	}

	// Remove the container
	if err := cli.ContainerRemove(context.Background(), resp.ID, container.RemoveOptions{}); err != nil {
		return "", err
	}

	output := buf.String()
	output = strings.Trim(output, "\n")

	return output, nil
}

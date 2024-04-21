package utility

import (
	"context"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

var cli, _ = client.NewClientWithOpts(client.FromEnv)

func RunContainer(imageName string, isLocalImage bool, code string) (string, error) {
	// Pull the image
	if !isLocalImage {
		if err := PullImage(imageName); err != nil {
			return "", err
		}
	}

	// Run a image same as command: `docker run -v "ABSINFILELOC:/input.txt IMAGENAME`
	resp, err := cli.ContainerCreate(context.Background(), &container.Config{
		Image: imageName,
		Cmd:   []string{"/source/script.sh", code},
	}, nil, nil, nil, "")

	if err != nil {
		return "", err
	}

	// Start the container
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

	// Get the logs
	out, err := cli.ContainerLogs(context.Background(), resp.ID, container.LogsOptions{ShowStdout: true})
	if err != nil {
		return "", err
	}

	// Put the logs in a string
	buf := new(strings.Builder)
	if _, err = io.Copy(buf, out); err != nil {
		return "", err
	}

	// Remove the container
	if err := cli.ContainerRemove(context.Background(), resp.ID, container.RemoveOptions{}); err != nil {
		return "", err
	}

	// Remove the header from the log output
	output := buf.String()
	if len(output) < 8 {
		return "", fmt.Errorf("Error: No output")
	}
	output = strings.Trim(output[8:], "\n")

	if strings.HasPrefix(output, "Error") {
		return "", fmt.Errorf(output)
	}

	return output, nil
}

func IsImagePresent(imageName string) bool {
	list, err := cli.ImageList(context.Background(), image.ListOptions{})
	if err != nil {
		panic(err)
	}
	for _, ims := range list {
		for _, tag := range ims.RepoTags {
			if strings.HasPrefix(tag, imageName) {
				return true
			}
		}
	}

	return false
}

func PullImage(imageName string) error {
	// Always pull the image to make sure it is up to date
	_, err := cli.ImagePull(context.Background(), imageName, image.PullOptions{})

	// Wait for any image to be usable
	wg := sync.WaitGroup{}
	wg.Add(1)
	go func(wg *sync.WaitGroup) {
		for !IsImagePresent(imageName) {
			time.Sleep(1 * time.Second)
		}
		wg.Done()
	}(&wg)
	wg.Wait()

	return err
}

package utility

import (
	"context"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

var cli, _ = client.NewClientWithOpts(client.FromEnv)

func StartContainer(imageName string, isLocalImage bool) (string, error) {
	// Pull the image
	if !isLocalImage {
		if err := PullImage(imageName); err != nil {
			return "", err
		}
	}

	// Run a image same as command: `docker run -di --rm IMAGENAME`
	resp, err := cli.ContainerCreate(context.Background(), &container.Config{
		Image:     imageName,
		OpenStdin: true,
	}, &container.HostConfig{
		AutoRemove: true,
	}, nil, nil, "")
	if err != nil {
		return "", err
	}

	if err := cli.ContainerStart(context.Background(), resp.ID, container.StartOptions{}); err != nil {
		return "", err
	}

	return resp.ID, nil
}

func StopContainer(containerID string) error {
	// Run a image same as command: `docker kill CONTAINERID`
	return cli.ContainerKill(context.Background(), containerID, "KILL")
}

func RunCodeOnContainer(code, containerID string) (chan string, error) {
	// Run this command: docker exec -i container_id2 sh -c 'cat > ./bar/foo.txt' < ./input.txt
	cmd := exec.Command("docker", "exec", "-i", containerID, "sh", "-c", "cat > /input.txt")

	// Create a pipe to the stdin of the command
	stdin, err := cmd.StdinPipe()
	if err != nil {
		println("Error creating stdin pipe", err.Error())
		return nil, err
	}

	// Write the code to the stdin of the command
	if _, err := stdin.Write([]byte(code)); err != nil {
		println("Error writing to stdin", err.Error())
		return nil, err
	}

	// Close the stdin pipe
	if err := stdin.Close(); err != nil {
		println("Error closing stdin", err.Error())
		return nil, err
	}

	if err := cmd.Run(); err != nil {
		println("Error running command", err.Error())
		return nil, err
	}

	cmd = exec.Command("docker", "exec", containerID, "/source/script.sh")

	// Create a pipe to the stdout of the command
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		println("Error creating stdout pipe", err.Error())
		return nil, err
	}

	// Create a pipe to the stderr of the command
	stderr, err := cmd.StderrPipe()
	if err != nil {
		println("Error creating stderr pipe", err.Error())
		return nil, err
	}

	// Start the command
	if err := cmd.Start(); err != nil {
		println("Error starting command", err.Error())
		return nil, err
	}

	// Create a channel to return the output
	output := make(chan string)

	// Read the output of the command
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := stdout.Read(buf)
			if err != nil {
				break
			}
			output <- string(buf[:n])
		}
		close(output)
	}()

	// Read the error of the command
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := stderr.Read(buf)
			if err != nil {
				break
			}
			output <- string(buf[:n])
		}
	}()

	return output, nil
}

func RunContainer(imageName string, isLocalImage bool, code string) (chan string, error) {
	// Pull the image
	if !isLocalImage {
		if err := PullImage(imageName); err != nil {
			return nil, err
		}
	}

	// Check if container is already running
	containers, err := cli.ContainerList(context.Background(), container.ListOptions{})
	if err != nil {
		println("Error listing containers", err.Error())
		return nil, err
	}
	println("Found", len(containers), "containers")

	containerID := ""
	for _, container := range containers {
		if strings.Split(container.Image, ":")[0] == strings.Split(imageName, ":")[0] {
			println("Found container with image: " + imageName + " with ID: " + container.ID)
			containerID = container.ID
			break
		}
	}

	if containerID == "" {
		// Run a image same as command: `docker run -v "ABSINFILELOC:/input.txt IMAGENAME`
		resp, err := cli.ContainerCreate(context.Background(), &container.Config{
			Image: imageName,
		}, &container.HostConfig{
			AutoRemove: true,
		}, nil, nil, "")
		if err != nil {
			println("Error creating container", err.Error())
			return nil, err
		}

		containerID = resp.ID

		// Start the container
		if err := cli.ContainerStart(context.Background(), containerID, container.StartOptions{}); err != nil {
			println("Error starting container", err.Error())
			return nil, err
		}
	}

	// Run this command: docker exec -i container_id2 sh -c 'cat > ./bar/foo.txt' < ./input.txt
	cmd := exec.Command("docker", "exec", "-i", containerID, "sh", "-c", "cat > /input.txt")

	// Create a pipe to the stdin of the command
	stdin, err := cmd.StdinPipe()
	if err != nil {
		println("Error creating stdin pipe", err.Error())
		return nil, err
	}

	// Write the code to the stdin of the command
	if _, err := stdin.Write([]byte(code)); err != nil {
		println("Error writing to stdin", err.Error())
		return nil, err
	}

	// Close the stdin pipe
	if err := stdin.Close(); err != nil {
		println("Error closing stdin", err.Error())
		return nil, err
	}

	if err := cmd.Run(); err != nil {
		println("Error running command", err.Error())
		return nil, err
	}

	cmd = exec.Command("docker", "exec", containerID, "/source/script.sh")

	// Create a pipe to the stdout of the command
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		println("Error creating stdout pipe", err.Error())
		return nil, err
	}

	// Create a pipe to the stderr of the command
	stderr, err := cmd.StderrPipe()
	if err != nil {
		println("Error creating stderr pipe", err.Error())
		return nil, err
	}

	// Start the command
	if err := cmd.Start(); err != nil {
		println("Error starting command", err.Error())
		return nil, err
	}

	// Create a channel to return the output
	output := make(chan string)

	// Read the output of the command
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := stdout.Read(buf)
			if err != nil {
				break
			}
			output <- string(buf[:n])
		}
		close(output)
	}()

	// Read the error of the command
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := stderr.Read(buf)
			if err != nil {
				break
			}
			output <- string(buf[:n])
		}
	}()

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

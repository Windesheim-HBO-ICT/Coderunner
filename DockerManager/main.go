package main

import (
	"context"
	"io"
	"os"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

func main() {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		panic(err)
	}

	// Get current working directory
	cwd, err := os.Getwd()
	if err != nil {
		panic(err)
	}

	// Run a image same as command: `docker run -v "$(pwd)`/program.ts:/input.txt lxu-bun`
	resp, err := cli.ContainerCreate(context.Background(), &container.Config{
		Image: "lxu-bun",
	}, &container.HostConfig{
		Binds: []string{cwd + "/program.ts:/input.txt"},
	}, nil, nil, "")

	if err != nil {
		panic(err)
	}

	if err := cli.ContainerStart(context.Background(), resp.ID, container.StartOptions{}); err != nil {
		panic(err)
	}

	// Wait for the container to finish
	statusCh, errCh := cli.ContainerWait(context.Background(), resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:

		if err != nil {
			panic(err)
		}
	case <-statusCh:
	}

	out, err := cli.ContainerLogs(context.Background(), resp.ID, container.LogsOptions{ShowStdout: true})
	if err != nil {
		panic(err)
	}

	if _, err := io.Copy(os.Stdout, out); err != nil {
		panic(err)
	}

	// Remove the container
	if err := cli.ContainerRemove(context.Background(), resp.ID, container.RemoveOptions{}); err != nil {
		panic(err)
	}
}

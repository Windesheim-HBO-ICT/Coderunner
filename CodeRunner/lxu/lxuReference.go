package lxu

import (
	"fmt"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/utility"
)

type LXUReference struct {
	output chan utility.OutputCommand
	input  chan utility.InputCommand
}

func (lxu *LXUReference) RunCode(code string) (string, error) {
	outputChan, err := lxu.StreamCode(code)
	if err != nil {
		return "", err
	}

	output := ""
	for {
		line, ok := <-outputChan
		if !ok {
			break
		}
		output += line
	}

	return output, nil
}

func (lxu *LXUReference) Stop() {
	lxu.input <- utility.InputCommand{
		InputCommand: utility.Stop,
	}
}

func (lxu *LXUReference) StreamCode(code string) (chan string, error) {
	lxu.input <- utility.InputCommand{
		InputCommand: utility.RunCode,
		Payload:      code,
	}

	outputChannel := make(chan string)

	output := <-lxu.output
	switch output.OutputCommand {
	case utility.StartCodeOutput:
		go func() {
			for {
				output := <-lxu.output
				if output.OutputCommand == utility.EndCodeOutput {
					close(outputChannel)
					return
				} else if output.OutputCommand == utility.Failed {
					close(outputChannel)
					return
				} else if output.OutputCommand == utility.CodeOutput {
					outputChannel <- output.Payload
				}
			}
		}()
		return outputChannel, nil
	case utility.Failed:
		return nil, fmt.Errorf(output.Payload)
	default:
		return nil, fmt.Errorf("Unexpected output command: %d", output.OutputCommand)
	}
}

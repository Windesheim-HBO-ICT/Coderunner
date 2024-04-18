package utility

import (
	"encoding/json"
	"os"
)

func WriteToFile(code string, filename string) error {
	f, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.WriteString(code)
	if err != nil {
		return err
	}

	return nil
}

func ReadJSON(filename string, structToFill any) error {
	f, err := os.ReadFile(filename)
	if err != nil {
		return err
	}

	err = json.Unmarshal(f, structToFill)
	if err != nil {
		return err
	}

	return nil
}

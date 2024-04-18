package endpoints

import (
	"encoding/json"
	"io"
	"net/http"
)

func Init(router *http.ServeMux) {
	router.HandleFunc("POST /code", codeEndpoint)
}

func bodyToStruct(body io.ReadCloser, s interface{}) error {
	bodyBytes, err := io.ReadAll(body)
	if err != nil {
		return err
	}

	err = json.Unmarshal(bodyBytes, s)
	if err != nil {
		return err
	}

	return nil
}

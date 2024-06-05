package endpoints

import (
	"encoding/json"
	"io"
	"net/http"
)

func Init(router *http.ServeMux) {
	router.HandleFunc("/code", logginMiddleware(codeEndpoint))
	router.HandleFunc("/languages", logginMiddleware(languagesEndpoint))
	router.HandleFunc("/codeSocket", logginMiddleware(codeWebsocket))
}

func logginMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		println(r.Method, r.URL.Path)
		next(w, r)
	}
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

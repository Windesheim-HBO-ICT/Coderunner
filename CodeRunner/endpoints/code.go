package endpoints

import (
	"net/http"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/runner"
)

type CodeRequest struct {
	Language string `json:"language"`
	Code     string `json:"code"`
}

func codeEndpoint(w http.ResponseWriter, r *http.Request) {
	var codeReq CodeRequest
	err := bodyToStruct(r.Body, &codeReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	output, err := runner.RunCode(codeReq.Code, codeReq.Language)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = w.Write([]byte(output))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

package endpoints

import (
	"net/http"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/runner"
	"github.com/gorilla/websocket"
)

func codeWebsocket(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	language := r.URL.Query().Get("language")
	if language == "" {
		http.Error(w, "Could not find language: '"+language+"'", http.StatusUnprocessableEntity)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		outputStream, err := runner.StreamCode(string(message), language)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for output := range outputStream {
			err = conn.WriteMessage(websocket.TextMessage, []byte(output))
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
	}
}

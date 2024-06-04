package endpoints

import (
	"fmt"
	"net/http"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/runner"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

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

	if _, ok := runner.LangDefs[language]; !ok {
		http.Error(w, "Language '"+language+"' is not supported", http.StatusUnprocessableEntity)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Could not upgrade connection", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	for {
		msgType, message, err := conn.ReadMessage()
		if err != nil {
			println("Could not read message", err)
			conn.WriteMessage(websocket.TextMessage, []byte(err.Error()))
			continue
		}
		println("Received message: ", string(message), msgType)

		if string(message) == "ping" {
			conn.WriteMessage(websocket.TextMessage, []byte("pong"))
			continue
		}

		outputStream, err := runner.StreamCode(string(message), language)
		if err != nil {
			fmt.Println("Could not run code", err)
			conn.WriteMessage(websocket.TextMessage, []byte(err.Error()))
			continue
		}

		conn.WriteMessage(websocket.TextMessage, []byte("-- START OUTPUT --"))

		for output := range outputStream {
			err = conn.WriteMessage(websocket.TextMessage, []byte(output))
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				continue
			}
		}

		conn.WriteMessage(websocket.TextMessage, []byte("-- END OUTPUT --"))
	}
}

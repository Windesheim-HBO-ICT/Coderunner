package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/endpoints"
	"github.com/Windesheim-HBO-ICT/Deeltaken/CodeRunner/runner"
)

func main() {
	err := runner.ParseJSON("./languages.json")
	if err != nil {
		fmt.Println("Error parsing languages: ", err)
		return
	}

	port := os.Getenv("PORT")
	if port == "" {
		fmt.Println("No port specified, using 8080")
		port = "8080"
	}

	router := http.NewServeMux()

	// Add the endpoints
	endpoints.Init(router)

	fmt.Println("Listening on port " + port)
	err = http.ListenAndServe(":"+port, router)

	if err != nil {
		fmt.Println("Error starting server: ", err)
	}

	println("Writeln")
}

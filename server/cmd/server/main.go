package main

import (
	"fmt"
	"net/http"
	"os"

	"server/internal/server"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	x := os.Getenv("WITH_INGRESS")

	s := server.CreateNewServer()

	mux := http.NewServeMux()

	mux.HandleFunc(fmt.Sprintf("%s/config", x), s.ConfigHandler)
	mux.HandleFunc("/test", s.TestHandler)
	mux.HandleFunc(fmt.Sprintf("%s/overview", x), s.OverviewHandler)
	fmt.Println("Server starting on :8082")
	http.ListenAndServe(":8082", mux)

}

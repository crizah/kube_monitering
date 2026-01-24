package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"server/internal/db"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	db, err := db.InitialiseDBserver()
	if err != nil {
		log.Fatalf("Failed to initialize server: %v", err)
	}

	x := os.Getenv("WITH_INGRESS")
	mux := http.NewServeMux()

	mux.HandleFunc(fmt.Sprintf("%s/signup", x), db.SignUpHandler)
	fmt.Println("Server starting on :8082")
	http.ListenAndServe(":8082", mux)

}

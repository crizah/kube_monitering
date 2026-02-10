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
	// mux.HandleFunc(fmt.Sprint("%s/yay", x), s.EncryptionHandler)

	mux.HandleFunc(fmt.Sprintf("%s/config", x), s.ConfigHandler)
	// mux.HandleFunc("/test", s.TestHandler)
	mux.HandleFunc(fmt.Sprintf("%s/overview", x), s.OverviewHandler)

	mux.HandleFunc(fmt.Sprintf("%s/pods", x), s.PodsHandler)
	mux.HandleFunc(fmt.Sprintf("%s/nodes", x), s.NodesHandler)
	mux.HandleFunc(fmt.Sprintf("%s/refresh", x), s.RefreshHandler)
	mux.HandleFunc(fmt.Sprintf("%s/svc", x), s.SVCHandler)
	mux.HandleFunc(fmt.Sprintf("%s/configmap", x), s.ConfigMapHandler)
	// mux.HandleFunc(fmt.Sprintf("%s/delpod", x), s.DelPodHandler)
	mux.HandleFunc(fmt.Sprintf("%s/restartpod", x), s.RestartPodHandler)

	mux.HandleFunc(fmt.Sprintf("%s/secrets", x), s.SecretsHandler)
	mux.HandleFunc(fmt.Sprintf("%s/ingress", x), s.IngressHandler)

	fmt.Println("starting on :8082")
	http.ListenAndServe(":8082", mux)

}

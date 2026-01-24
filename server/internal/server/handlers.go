package server

import (
	"encoding/json"
	"io"
	"net/http"

	"k8s.io/client-go/tools/clientcmd"
)

var allowedOrigins = map[string]bool{
	"http://localhost:3000": true,
	"http://localhost:80":   true,
}

func EnableCors(w http.ResponseWriter, r *http.Request, origin string) {
	w.Header().Set("Access-Control_Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OOPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-credentials", "true")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return

	}
}

func OverviewHandler(w http.ResponseWriter, r *http.Request) {
	// get request

	// give the overview
	// number of nodes running
	// number of pods running
	// services running
	// cpu usage

	// memory usage

}

func ConfigHandler(w http.ResponseWriter, r *http.Request) {
	// gets the ~/.kube/config
	origin := r.Header.Get("Origin")
	EnableCors(w, r, origin)

	// user can upload ~/.kube/config file or paste the contents

	pasted := r.FormValue("pasted")
	var configBytes []byte

	if pasted == "" {
		// if not pasted, get the formfile
		file, _, err := r.FormFile("file")
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer file.Close()

		configBytes, err = io.ReadAll(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		configBytes = []byte(pasted)
	}

	config, err := clientcmd.Load(configBytes)
	if err != nil {
		http.Error(w, "error parsing the config file "+err.Error(), http.StatusInternalServerError)
		return

	}

	restConfig, err := clientcmd.NewDefaultClientConfig(*config, &clientcmd.ConfigOverrides{}).ClientConfig()
	if err != nil {
		http.Error(w, "Failed to build config: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Store in session (you'll need to set up session middleware)
	session, _ := store.Get(r, "k8s-session")
	session.Values["config"] = restConfig // This needs custom encoding
	session.Save(r, w)

	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]string{
		"message": "yay",
	})

}

// func PodsHandler(w http.ResponseWriter, r *http.Request) {
// 	// kubectl get pods
// 	// logs
// 	// kubectl get pods -o wide
// }

// func IngressHandler() {
// 	// Get recipient and sender

// }

// func PodsHandler(w http.ResponseWriter, r *http.Request) {
// 	// kubectl get pods
// 	// logs
// 	// kubectl get pods -o wide
// }

// func IngressHandler(w http.ResponseWriter, r *http.Request) {
// 	// gets all info about ingress controler
// }

// func SVCHandler(w http.ResponseWriter, r *http.Request) {
// 	// all about svc's
// }

// func SecretsHandler(w http.ResponseWriter, r *http.Request) {
// 	// all info about secrets
// }

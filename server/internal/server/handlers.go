package server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

var allowedOrigins = map[string]bool{
	"http://localhost:3000": true,
	"http://localhost:80":   true,
}

func (s *Server) TestHandler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	EnableCors(w, r, origin)

	var req struct {
		Yes string `json:"yes"`
	}

	json.NewDecoder(r.Body).Decode(&req)
	fmt.Println(req.Yes)

	json.NewEncoder(w).Encode(map[string]string{
		"msg": "yay",
	})

}

func EnableCors(w http.ResponseWriter, r *http.Request, origin string) {
	if allowedOrigins[origin] {
		w.Header().Set("Access-Control-Allow-Origin", origin)

	}

	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
}

func (s *Server) OverviewHandler(w http.ResponseWriter, r *http.Request) {
	// get
	origin := r.Header.Get("Origin")
	EnableCors(w, r, origin)

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	session, err := s.Store.Get(r, "k8s-config-session")
	if err != nil {
		http.Error(w, "error getting session"+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Printf("Session values: %+v\n", session.Values)
	auth, ok := session.Values["authenticated"].(bool)
	if !ok || !auth {
		http.Error(w, "not authenticated", http.StatusUnauthorized)
		return

	}

	c := session.Values["config"].(*RestConfig)
	restConfig := &rest.Config{
		Host:            c.Host,
		BearerToken:     c.BearerToken,
		TLSClientConfig: c.TLSClientConfig,
		Username:        c.Username,
		Password:        c.Password,
	}

	overview, err := GetOverview(restConfig)
	fmt.Printf("total nodes %d", overview.Nodes.TotalNodes)
	if err != nil {
		http.Error(w, "error getting whatever it is that u wanted"+err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"overview": overview,
	})

}

func (s *Server) ConfigHandler(w http.ResponseWriter, r *http.Request) {
	// gets the ~/.kube/config
	origin := r.Header.Get("Origin")
	EnableCors(w, r, origin)

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

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

	configStruct := MakeConfig(restConfig)

	// store it in session
	session, _ := s.Store.Get(r, "k8s-config-session")

	session.Values["config"] = configStruct
	session.Values["authenticated"] = true

	err = session.Save(r, w)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

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

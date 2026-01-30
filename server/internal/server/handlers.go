package server

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/google/uuid"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

var allowedOrigins = map[string]bool{
	"http://localhost:3000": true,
	"http://localhost:80":   true,
}

// func (s *Server) TestHandler(w http.ResponseWriter, r *http.Request) {
// 	origin := r.Header.Get("Origin")
// 	EnableCors(w, r, origin)

// 	var req struct {
// 		Yes string `json:"yes"`
// 	}

// 	json.NewDecoder(r.Body).Decode(&req)
// 	fmt.Println(req.Yes)

// 	json.NewEncoder(w).Encode(map[string]string{
// 		"msg": "yay",
// 	})

// }

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

	auth, ok := session.Values["authenticated"].(bool)
	if !ok || !auth {
		http.Error(w, "not authenticated", http.StatusUnauthorized)
		return

	}
	// works till here
	configID := session.Values["id"].(string)
	restConfig := s.ConfigStore[configID]

	overview, err := GetOverview(restConfig)

	if err != nil {
		http.Error(w, "error getting whatever it is that u wanted "+err.Error(), http.StatusInternalServerError)
		return
	}
	s.OverviewStore[configID] = overview

	json.NewEncoder(w).Encode(map[string]interface{}{
		"totalNodes":   overview.Nodes.TotalNodes,
		"runningNodes": overview.Nodes.RunningNodes,
		"totalPods":    overview.Pods.TotalPods,
		"runningPods":  overview.Pods.RunningPods,
		"namespaces":   overview.NameSpace.TotalNamespaces,
		"services":     overview.Services.Totalservices,
		"totalIngress": overview.Ingress.TotalIngress,
		"totalSecrets": overview.Secrets.TotalSecrets,
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

	c, err := clientcmd.NewDefaultClientConfig(*config, &clientcmd.ConfigOverrides{}).ClientConfig()
	if err != nil {
		http.Error(w, "Failed to build config: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// test connection

	cs, err := kubernetes.NewForConfig(c)
	if err != nil {
		http.Error(w, "error creating client"+err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = cs.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{Limit: 1})
	if err != nil {
		http.Error(w, "error connecting to cluster "+err.Error(), http.StatusUnauthorized)
		return
	}

	configID := uuid.New().String()

	// cartoon logic frfr
	s.ConfigStore[configID] = c

	session, _ := s.Store.Get(r, "k8s-config-session")
	session.Values["id"] = configID

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

func (s *Server) PodsHandler(w http.ResponseWriter, r *http.Request) {

	// get
	// kubectl get pods
	// logs
	// kubectl get pods -o wide
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

	sid, ok := session.Values["id"].(string)
	if !ok {
		http.Error(w, "no session id", http.StatusUnauthorized)
		return
	}

	ov := s.OverviewStore[sid]
	pods := ov.Pods

	json.NewEncoder(w).Encode(map[string]interface{}{
		"pods": pods,
	})

}

func (s *Server) IngressHandler(w http.ResponseWriter, r *http.Request) {
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

	sid, ok := session.Values["id"].(string)
	if !ok {
		http.Error(w, "error getting session id ", http.StatusInternalServerError)
		return

	}

	ingress := s.OverviewStore[sid].Ingress

	json.NewEncoder(w).Encode(map[string]interface{}{
		"ingress": ingress,
	})

}

func (s *Server) NodesHandler(w http.ResponseWriter, r *http.Request) {
	// kubectl get pods
	// logs
	// kubectl get pods -o wide

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

	sid, ok := session.Values["id"].(string)
	if !ok {
		http.Error(w, "error getting session id ", http.StatusInternalServerError)
		return

	}

	nodes := s.OverviewStore[sid].Nodes

	json.NewEncoder(w).Encode(map[string]interface{}{
		"nodes": nodes,
	})

}

func (s *Server) SVCHandler(w http.ResponseWriter, r *http.Request) {
	// all about svc's
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

	sid, ok := session.Values["id"].(string)
	if !ok {
		http.Error(w, "error getting session id ", http.StatusInternalServerError)
		return

	}

	svc := s.OverviewStore[sid].Services

	json.NewEncoder(w).Encode(map[string]interface{}{
		"services": svc,
	})

}

func (s *Server) SecretsHandler(w http.ResponseWriter, r *http.Request) {
	// all info about secrets
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

	sid, ok := session.Values["id"].(string)
	if !ok {
		http.Error(w, "error getting session id ", http.StatusInternalServerError)
		return

	}

	secrets := s.OverviewStore[sid].Secrets

	json.NewEncoder(w).Encode(map[string]interface{}{
		"secrets": secrets,
	})

}

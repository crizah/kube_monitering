package server

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/tools/clientcmd"
)

var allowedOrigins = map[string]bool{
	"http://localhost:3000": true,
	os.Getenv("CLIENT_IP"):  true,
	"http://localhost:80":   true,
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

func (s *Server) RefreshHandler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	EnableCors(w, r, origin)

	if r.Method != http.MethodGet {
		http.Error(w, "method not allpowed", http.StatusMethodNotAllowed)
		return
	}

	// session, err := s.Store.Get(r, "k8s-config-session")
	// if err != nil {
	// 	http.Error(w, "error getting session"+err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// auth, ok := session.Values["authenticated"].(bool)
	// if !ok || !auth {
	// 	http.Error(w, "not authenticated", http.StatusUnauthorized)
	// 	return

	// }

	// configID := session.Values["id"].(string)
	// restConfig := s.ConfigStore[configID]

	overview, err := s.GetOverview()

	if err != nil {
		http.Error(w, "error getting whatever it is that u wanted "+err.Error(), http.StatusInternalServerError)
		return
	}
	s.Overview = overview
	json.NewEncoder(w).Encode(map[string]string{
		"message": "yay",
	})

}

func (s *Server) OverviewHandler(w http.ResponseWriter, r *http.Request) {
	// get
	origin := r.Header.Get("Origin")
	EnableCors(w, r, origin)

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// session, err := s.Store.Get(r, "k8s-config-session")
	// if err != nil {
	// 	http.Error(w, "error getting session"+err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// sid, ok := session.Values["id"].(string)
	// if !ok {
	// 	http.Error(w, "no session id", http.StatusUnauthorized)
	// 	return
	// }

	overview := s.Overview

	json.NewEncoder(w).Encode(map[string]interface{}{
		"totalNodes":   overview.Nodes.TotalNodes,
		"runningNodes": overview.Nodes.RunningNodes,
		"pods":         overview.Pods,

		"namespaces": overview.NameSpace,

		"services":        overview.Services,
		"totalIngress":    overview.Ingress,
		"totalSecrets":    overview.Secrets,
		"totalConfigMaps": overview.ConfigMaps,
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

	cs, err := NewClientSet(c)
	if err != nil {
		http.Error(w, "error creating client"+err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = cs.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{Limit: 1})
	if err != nil {
		http.Error(w, "error connecting to cluster "+err.Error(), http.StatusUnauthorized)
		return
	}

	s.ClientSet = cs
	s.RestConfig = c
	overview, err := s.GetOverview()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return

	}
	s.Overview = overview
	// configID := uuid.New().String()

	// // cartoon logic frfr
	// s.ConfigStore[configID] = c

	// session, _ := s.Store.Get(r, "k8s-config-session")
	// session.Values["id"] = configID

	// session.Values["authenticated"] = true
	// overview, err := GetOverview(c)
	// s.OverviewStore[configID] = overview

	// err = session.Save(r, w)
	// if err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return
	// }

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

	// session, err := s.Store.Get(r, "k8s-config-session")
	// if err != nil {
	// 	http.Error(w, "error getting session"+err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// sid, ok := session.Values["id"].(string)
	// if !ok {
	// 	http.Error(w, "no session id", http.StatusUnauthorized)
	// 	return
	// }

	ov := s.Overview
	pods := ov.Pods
	ns_list := ov.NameSpace.NameSpaceList
	pods.NamespaceList = ns_list

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

	// session, err := s.Store.Get(r, "k8s-config-session")
	// if err != nil {
	// 	http.Error(w, "error getting session"+err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// sid, ok := session.Values["id"].(string)
	// if !ok {
	// 	http.Error(w, "error getting session id ", http.StatusInternalServerError)
	// 	return

	// }
	ov := s.Overview
	ingress := ov.Ingress
	ns_list := ov.NameSpace.NameSpaceList
	ingress.NameSpaceList = ns_list

	json.NewEncoder(w).Encode(map[string]interface{}{
		"ingress": ingress,
	})

}

// func DelPodHandler(w http.ResponseWriter, r *http.Request) {
// 	origin := r.Header.Get("Origin")
// 	EnableCors(w, r, origin)

// 	if r.Method != http.MethodPost {
// 		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
// 		return
// 	}

// 	// get data
// 	var res struct {
// 		PodName string `json:"podname"`
// 	}
// 	err := json.NewDecoder(r.Body).Decode(&res)
// 	if err != nil {
// 		http.Error(w, "Invalid request", http.StatusBadRequest)
// 		return
// 	}

// 	// delete
// 	err = s.DeletePod(res.PodName)
// 	if err != nil {
// 		http.Error(w, "couldnt delere"+err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	// send success
// 	json.NewEncoder(w).Encode(map[string]string{
// 		"msg": "yay",
// 	})
// }

func (s *Server) ConfigMapHandler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	EnableCors(w, r, origin)

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// session, err := s.Store.Get(r, "k8s-config-session")
	// if err != nil {
	// 	http.Error(w, "error getting session"+err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// sid, ok := session.Values["id"].(string)
	// if !ok {
	// 	http.Error(w, "error getting session id ", http.StatusInternalServerError)
	// 	return

	// }
	ov := s.Overview
	m := ov.ConfigMaps
	ns_list := ov.NameSpace.NameSpaceList
	m.NameSpaceList = ns_list

	json.NewEncoder(w).Encode(map[string]interface{}{
		"configmap": m,
	})

}

func (s *Server) NodesHandler(w http.ResponseWriter, r *http.Request) {

	origin := r.Header.Get("Origin")
	EnableCors(w, r, origin)

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// session, err := s.Store.Get(r, "k8s-config-session")
	// if err != nil {
	// 	http.Error(w, "error getting session"+err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// sid, ok := session.Values["id"].(string)
	// if !ok {
	// 	http.Error(w, "error getting session id ", http.StatusInternalServerError)
	// 	return

	// }

	nodes := s.Overview.Nodes

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

	// session, err := s.Store.Get(r, "k8s-config-session")
	// if err != nil {
	// 	http.Error(w, "error getting session"+err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// sid, ok := session.Values["id"].(string)
	// if !ok {
	// 	http.Error(w, "error getting session id ", http.StatusInternalServerError)
	// 	return

	// }
	ov := s.Overview
	svc := ov.Services
	ns_list := ov.NameSpace.NameSpaceList
	svc.NameSpaceList = ns_list

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

	// session, err := s.Store.Get(r, "k8s-config-session")
	// if err != nil {
	// 	http.Error(w, "error getting session"+err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// sid, ok := session.Values["id"].(string)
	// if !ok {
	// 	http.Error(w, "error getting session id ", http.StatusInternalServerError)
	// 	return

	// }

	ov := s.Overview
	secrets := ov.Secrets
	ns_list := ov.NameSpace.NameSpaceList
	secrets.NameSpaceList = ns_list

	json.NewEncoder(w).Encode(map[string]interface{}{
		"secrets": secrets,
	})

}

package db

import (
	"encoding/json"
	"net/http"
	"server/internal/server"
	"sync"
)

func (s *DBserver) SignUpHandler(w http.ResponseWriter, r *http.Request) {
	// sign up with username and password
	origin := r.Header.Get("Origin")
	server.EnableCors(w, r, origin)

	var res struct {
		Username string `json:"userame"`
		Password string `json:"password"`
	}

	json.NewDecoder(r.Body).Decode(&res)
	// hash the pass
	hashedPass, err := HashPassword(res.Password)
	if err != nil {
		http.Error(w, "couldnt hash the password"+err.Error(), http.StatusInternalServerError)
		return
	}
	// put into users and pass table

	var wg sync.WaitGroup
	wg.Add(2)

	ch := make(chan error, 2)

	go func() {
		defer wg.Done()

		ch <- s.PutIntoUsersTable(res.Username)

	}()

	go func() {
		defer wg.Done()
		ch <- s.PutIntoPassTable(res.Username, hashedPass)

	}()

	wg.Wait()
	close(ch)
	for err := range ch {
		if err != nil {
			http.Error(w, "error putting user info into tables"+err.Error(), http.StatusInternalServerError)
			return

		}
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "user successfully signed up",
	})

}

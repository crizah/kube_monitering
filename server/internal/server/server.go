package server

import (
	"crypto/rand"

	"github.com/gorilla/sessions"
	"k8s.io/client-go/rest"
)

type Server struct {
	SessionKey    []byte
	Store         *sessions.CookieStore
	ConfigStore   map[string]*rest.Config
	OverviewStore map[string]*Overview
}

func CreateNewServer() *Server {
	sessionKey := createSessionKey()

	Store := sessions.NewCookieStore(sessionKey)
	// Store.Options = &sessions.Options{
	// 	Path:     "/",
	// 	MaxAge:   86400 * 7, // 7 days
	// 	HttpOnly: true,
	// 	Secure:   false,
	// 	SameSite: http.SameSiteLaxMode,
	// }
	c := make(map[string]*rest.Config)
	o := make(map[string]*Overview)

	return &Server{SessionKey: sessionKey, Store: Store, ConfigStore: c, OverviewStore: o}

}

func createSessionKey() []byte {
	key := make([]byte, 32)
	rand.Read(key)
	return key

}

package server

import (
	"crypto/rand"
	"net/http"

	"github.com/gorilla/sessions"
	"k8s.io/client-go/rest"
)

// create a session key
// set env variable as SESSION_KEY
// var store = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY"))) when we want to use it

type Server struct {
	SessionKey []byte
	Store      *sessions.CookieStore
}

func CreateNewServer() *Server {
	sessionKey := CreateSessionKey()
	Store := sessions.NewCookieStore(sessionKey)
	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}

	return &Server{SessionKey: sessionKey, Store: Store}

}

type RestConfig struct {
	Host            string
	BearerToken     string
	TLSClientConfig rest.TLSClientConfig
	Username        string
	Password        string
}

func MakeConfig(c *rest.Config) *RestConfig {
	return &RestConfig{
		Host:            c.Host,
		BearerToken:     c.BearerToken,
		TLSClientConfig: c.TLSClientConfig,
		Username:        c.Username,
		Password:        c.Password,
	}

}

// enable cors
func SessionMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		EnableCors(w, r, origin)
	}
}

func CreateSessionKey() []byte {
	key := make([]byte, 32)
	rand.Read(key)
	return key

}

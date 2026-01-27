package server

import (
	"crypto/rand"
	"net/http"

	"k8s.io/client-go/rest"
)

// create a session key
// set env variable as SESSION_KEY
// var store = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY"))) when we want to use it

type Server struct {
	ConfigStore map[string]*rest.Config
}

func CreateNewServer() *Server {

	c := make(map[string]*rest.Config)

	return &Server{ConfigStore: c}

}

type TLS struct {
	TLSClientConfig rest.TLSClientConfig
}

type RestConfig struct {
	Insecure      bool
	Authenticated bool
	Host          string
	BearerToken   string
	Username      string
	Password      string
}

// {
// 		{"id": "id"
// 		  "host" : c.Host,
// 		  "insecure" : "true",
// 		  "authenticated" : "true",
// 		  "ca_data" : base64.StdEncoding.EncodeToString(c.CAData)
// 		  "bearer_token" : c.BearerToken
// 		  "cert_data" : base64.StdEncoding.EncodeToString(c.CertData),
// 		  "key_data" : base64.StdEncoding.EncodeToString(c.KeyData),
// 		  "username" : c.Username,
// 		  "password" : c.Password

// 	    }

// 	}

func MakeConfig(c *rest.Config) (*RestConfig, *TLS) {
	return &RestConfig{
			Host:        c.Host,
			BearerToken: c.BearerToken,

			Username: c.Username,
			Password: c.Password,
		}, &TLS{
			TLSClientConfig: c.TLSClientConfig,
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

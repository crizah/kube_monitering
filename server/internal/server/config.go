package server

import (
	"k8s.io/client-go/tools/clientcmd"
)

type ConfigData struct {
	Clusters       map[string]*Cluster
	Contexts       map[string]*Context
	AuthInfos      map[string]*AuthInfo
	CurrentContext string
}

type Cluster struct {
	Name                  string
	Server                string
	CertificateAuthData   []byte
	InsecureSkipTLSVerify bool
}

type Context struct {
	Name      string
	Cluster   string
	User      string
	Namespace string
}

type AuthInfo struct {
	Name           string
	ClientCertData []byte
	ClientKeyData  []byte
	Token          string
	Username       string
	Password       string
}

func GetConfigData(configBytes []byte) (*ConfigData, error) {
	config, err := clientcmd.Load(configBytes)
	if err != nil {
		return nil, err
	}

	configData := &ConfigData{
		Clusters:       make(map[string]*Cluster),
		Contexts:       make(map[string]*Context),
		AuthInfos:      make(map[string]*AuthInfo),
		CurrentContext: config.CurrentContext,
	}

	// Extract clusters
	for name, cluster := range config.Clusters {
		configData.Clusters[name] = &Cluster{
			Name:                  name,
			Server:                cluster.Server,
			CertificateAuthData:   cluster.CertificateAuthorityData,
			InsecureSkipTLSVerify: cluster.InsecureSkipTLSVerify,
		}
	}

	// Extract contexts
	for name, ctx := range config.Contexts {
		configData.Contexts[name] = &Context{
			Name:      name,
			Cluster:   ctx.Cluster,
			User:      ctx.AuthInfo,
			Namespace: ctx.Namespace,
		}
	}

	// Extract auth info
	for name, authInfo := range config.AuthInfos {
		configData.AuthInfos[name] = &AuthInfo{
			Name:           name,
			ClientCertData: authInfo.ClientCertificateData,
			ClientKeyData:  authInfo.ClientKeyData,
			Token:          authInfo.Token,
			Username:       authInfo.Username,
			Password:       authInfo.Password,
		}
	}

	return configData, nil
}

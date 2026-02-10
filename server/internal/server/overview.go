package server

import (
	"context"
	"strconv"
	"sync"
	"time"

	networkingv1 "k8s.io/api/networking/v1"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// deployments
// {
//     totalDeployments: int,
//     deployments: [
//         {
//             name: string,
//             namespace: string,
//             ready: string,         // "3/3" (ready/desired replicas)
//             upToDate: int,
//             available: int,
//             age: string,
//             containers: string[],  // container names
//             images: string[]       // container images
//         }
//     ]
// }

type Nodes struct {
	TotalNodes   int          `json:"total"`
	RunningNodes int          `json:"running"`
	Nodes        []*Nodesinfo `json:"nodes"`
}
type Nodesinfo struct {
	Name    string `json:"name"`
	Status  string `json:"status"`
	Roles   string `json:"roles"`
	Age     string `json:"age"`
	Version string `json:"version"`

	InternalIP    string `json:"ip"`
	OSImage       string `json:"osimage"`
	KernelVersion string `json:"kernelversion"`
	Runtime       string `json:"runtime"`

	CPUcapacity string `json:"cpucapacity"`

	MemoryCapacity string `json:"memorycapacity"`
	PodsCapacity   string `json:"podscapacity"`
}

type Container struct {
	Name  string  `json:"name"`
	Image string  `json:"image"`
	Ports []*Port `json:"ports"`
}

type Port struct {
	Port       int    `json:"port"`
	TargetPort int    `json:"targetport"`
	Protocol   string `json:"protocol"`
}

type Pods struct {
	TotalPods     map[string]int `json:"total"`
	RunningPods   map[string]int `json:"running"`
	PodsList      []*PodsInfo    `json:"pods"`
	NamespaceList []string       `json:"namespacelist"`
}

type PodsInfo struct {
	Name           string       `json:"name"`
	NameSpace      string       `json:"namespace"`
	Status         string       `json:"status"`
	Restarts       int          `json:"restarts"`
	Age            string       `json:"age"`
	Node           string       `json:"node"`
	IP             string       `json:"ip"`
	Containers     []*Container `json:"container"`
	ReadyContainer int          `json:"readycontainer"`
	TotalContainer int          `json:"totalcontainer"`
}

type Ingress struct {
	TotalIngress   map[string]int `json:"total"`
	RunningIngress map[string]int `json:"running"`
	// IngressListfr  map[string]*networkingv1.IngressList `json:"ingressfr"`
	IngressList   []*IngressInfo                       `json:"ingress"`
	Ingress       map[string]*networkingv1.IngressList `json:"fr"`
	NameSpaceList []string                             `json:"namespacelist"`
}

type IngressInfo struct {
	Name      string   `json:"name"`
	Namespace string   `json:"namespace"`
	Hosts     []string `json:"hosts"`
	Address   string   `json:"address"`

	Age   string  `json:"age"`
	Rules []*Rule `json:"rules"`
}

type Rule struct {
	Host  string  `json:"host"`
	Paths []*Path `json:"paths"`
}

type Path struct {
	Path     string   `json:"path"`
	PathType string   `json:"pathtype"`
	Backend  *Backend `json:"backend"`
}

type Backend struct {
	Name string `json:"name"`
	Port int    `json:"ports"`
}

type Services struct {
	Totalservices map[string]int `json:"total"`
	NameSpaceList []string       `json:"namespacelist"`
	ServiceList   []*ServiceInfo `json:"services"`
}

type ServiceInfo struct {
	Name       string            `json:"name"`
	Namespace  string            `json:"namespace"`
	Type       string            `json:"type"`
	Selector   map[string]string `json:"selector"`
	ClusterIP  []string          `json:"clusterip"`
	ExternalIP []string          `json:"externalip"`
	Ports      []*Port           `json:"ports"`
	Age        string            `json:"age"`
}

type NameSpace struct {
	TotalNamespaces int               `json:"total"`
	NameSpaceList   []string          `json:"namespacelist"`
	NameSpaces      *v1.NamespaceList `json:"namespaces"`
}

type Secrets struct {
	TotalSecrets map[string]int `json:"total"`

	Secrets       []*SecretsInfo `json:"secrets"`
	NameSpaceList []string       `json:"namespacelist"`
}

type SecretsInfo struct {
	Name      string `json:"name"`
	NameSpace string `json:"namespace"`
	Type      string `json:"type"`      // Opaque, kubernetes.io/tls, etc.
	DataCount int    `json:"datacount"` // number of secret keys
	Age       string `json:"age"`
}
type ConfigMaps struct {
	Total         map[string]int   `json:"total"`
	Confs         []*ConfigMapInfo `json:"confs"`
	NameSpaceList []string         `json:"namespacelist"`
}

type ConfigMapInfo struct {
	Name      string `json:"name"`
	NameSpace string `json:"namespace"`
	DataCount int    `json:"datacount"`
	Age       string `json:"age"`
}

// type Deployments struct {
// 	Total map[string]int `json:"total"`

// 	DeploymentList []*DeploymentInfo `json:"deployments"`
// }

// type DeploymentInfo struct {
// 	Name       string
// 	NameSpace  string
// 	Ready      string
// 	Age        string
// 	Containers []*Container
// }

type Overview struct {
	Nodes      *Nodes      `json:"nodes"`
	Pods       *Pods       `json:"pods"`
	Services   *Services   `json:"services"`
	NameSpace  *NameSpace  `json:"namespaces"`
	Ingress    *Ingress    `json:"ingress"`
	Secrets    *Secrets    `json:"secrets"`
	ConfigMaps *ConfigMaps `json:"configmaps"`
	// Deployments *Deployments `json:"deployments"`
	Errors []error
}

func (s *Server) GetOverview() (*Overview, error) {

	namespaces, err := s.getNamespaces()
	if err != nil {
		return nil, err
	}

	var wg sync.WaitGroup
	var mux sync.Mutex
	wg.Add(6)
	n := make([]string, 0)
	for _, ns := range namespaces.Items {
		n = append(n, ns.Name)
	}

	ov := &Overview{NameSpace: &NameSpace{
		TotalNamespaces: len(namespaces.Items),
		NameSpaces:      namespaces,
		NameSpaceList:   n,
	}, Errors: make([]error, 0)}

	go func() {
		defer wg.Done()
		nodes, err := s.getNodes()
		mux.Lock()
		defer mux.Unlock()

		if err != nil {
			ov.Errors = append(ov.Errors, err)
		} else {
			ov.Nodes = nodes

		}

	}()
	go func() {
		defer wg.Done()
		pods, err := s.getPods(namespaces)
		mux.Lock()
		defer mux.Unlock()
		if err != nil {
			ov.Errors = append(ov.Errors, err)
		} else {
			ov.Pods = pods
		}
	}()
	go func() {
		defer wg.Done()
		svc, err := s.getServices(namespaces)
		mux.Lock()
		defer mux.Unlock()

		if err != nil {
			ov.Errors = append(ov.Errors, err)
		} else {
			ov.Services = svc
		}

	}()
	go func() {
		defer wg.Done()
		ing, err := s.getIngress(namespaces)
		mux.Lock()
		defer mux.Unlock()
		if err != nil {
			ov.Errors = append(ov.Errors, err)
		} else {
			ov.Ingress = ing
		}
	}()
	go func() {
		defer wg.Done()
		sec, err := s.getSecrets(namespaces)
		mux.Lock()
		defer mux.Unlock()
		if err != nil {
			ov.Errors = append(ov.Errors, err)
		} else {
			ov.Secrets = sec
		}

	}()
	go func() {
		defer wg.Done()
		m, err := s.getConfigMaps(namespaces)
		mux.Lock()
		defer mux.Unlock()
		if err != nil {
			ov.Errors = append(ov.Errors, err)
		} else {
			ov.ConfigMaps = m
		}

	}()

	wg.Wait()
	if len(ov.Errors) > 0 {
		return nil, ov.Errors[0]
	}

	return ov, nil

}

func NewClientSet(c *rest.Config) (*kubernetes.Clientset, error) {
	clientSet, err := kubernetes.NewForConfig(c)
	if err != nil {
		return nil, err
	}

	return clientSet, nil

}

func (s *Server) getNamespaces() (*v1.NamespaceList, error) {

	namespaces, err := s.ClientSet.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return namespaces, nil
}

func (s *Server) getNodes() (*Nodes, error) {

	nodes, err := s.ClientSet.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	var arr []*Nodesinfo

	runningNodes := 0
	for _, node := range nodes.Items {
		var n *Nodesinfo

		// node status
		status := "nah"

		// running nodes
		for _, condition := range node.Status.Conditions {
			if condition.Type == v1.NodeReady && condition.Status == v1.ConditionTrue {
				status = "yay"

				runningNodes++
				break
			}
		}

		// internal ip
		addrs := ""

		for _, addr := range node.Status.Addresses {
			if addr.Type == v1.NodeInternalIP {
				addrs = addr.Address
			}
		}

		// age

		duration := time.Since(node.CreationTimestamp.Time)
		age := strconv.FormatFloat(duration.Hours(), 'f', -1, 64)

		n = &Nodesinfo{
			Name:           node.Name,
			Status:         status,
			Age:            age,
			Version:        node.Status.NodeInfo.KubeletVersion,
			InternalIP:     addrs,
			OSImage:        node.Status.NodeInfo.OSImage,
			KernelVersion:  node.Status.NodeInfo.KernelVersion,
			Runtime:        node.Status.NodeInfo.ContainerRuntimeVersion,
			CPUcapacity:    node.Status.Allocatable.Cpu().String(),
			MemoryCapacity: node.Status.Allocatable.Memory().String(),
			PodsCapacity:   node.Status.Allocatable.Pods().String(),
		}

		arr = append(arr, n)

	}

	return &Nodes{TotalNodes: len(nodes.Items), RunningNodes: runningNodes, Nodes: arr}, nil
}

func (s *Server) getPods(namespaces *v1.NamespaceList) (*Pods, error) {

	var arr []*PodsInfo
	totalPods := make(map[string]int)
	runPods := make(map[string]int)

	runningPods := 0

	for _, ns := range namespaces.Items {
		r := 0
		l := 0

		pods, err := s.ClientSet.CoreV1().Pods(ns.Name).List(context.Background(), metav1.ListOptions{})

		if err != nil {
			return nil, err
		}

		l = l + len(pods.Items)

		for _, pod := range pods.Items {

			var p *PodsInfo

			// status
			status := "nah"

			// running pods

			for _, condition := range pod.Status.Conditions {
				if condition.Type == v1.PodReady && condition.Status == v1.ConditionTrue {
					status = "yay"
					r++
					runningPods++
					break
				}
			}

			// age

			duration := time.Since(pod.CreationTimestamp.Time)
			age := strconv.FormatFloat(duration.Hours(), 'f', -1, 64)

			// containers

			var containers []*Container

			for _, cont := range pod.Spec.Containers {
				// ports

				var ports []*Port
				for _, port := range cont.Ports {
					ports = append(ports, &Port{
						Port:     int(port.ContainerPort),
						Protocol: string(port.Protocol),
					})
				}

				containers = append(containers, &Container{
					Name:  cont.Name,
					Image: cont.Image,
					Ports: ports,
				})
			}

			// restarts

			restarts := int32(0)
			for _, status := range pod.Status.ContainerStatuses {
				restarts += status.RestartCount
			}

			// ready containers and total containers

			ready := 0
			total := len(pod.Status.ContainerStatuses)
			for _, status := range pod.Status.ContainerStatuses {
				if status.Ready {
					ready++
				}
			}

			p = &PodsInfo{
				Name:           pod.Name,
				NameSpace:      ns.Name,
				Status:         status,
				Restarts:       int(restarts),
				IP:             pod.Status.PodIP,
				Age:            age,
				Containers:     containers,
				Node:           pod.Spec.NodeName,
				ReadyContainer: ready,
				TotalContainer: total,
			}

			arr = append(arr, p)

		}
		runPods[ns.Name] = r
		totalPods[ns.Name] = l

	}

	return &Pods{TotalPods: totalPods, RunningPods: runPods, PodsList: arr}, nil
}

func (s *Server) getServices(namespaces *v1.NamespaceList) (*Services, error) {

	total := make(map[string]int)
	// ser := make(map[string]*v1.ServiceList)
	Svc := make([]*ServiceInfo, 0)
	for _, ns := range namespaces.Items {

		l := 0

		svc, err := s.ClientSet.CoreV1().Services(ns.Name).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return nil, err
		}

		for _, ser := range svc.Items {

			// age
			duration := time.Since(ser.CreationTimestamp.Time)
			age := strconv.FormatFloat(duration.Hours(), 'f', -1, 64)

			// ports
			var ports []*Port
			for _, port := range ser.Spec.Ports {
				ports = append(ports, &Port{
					Port:       int(port.Port),
					TargetPort: int(port.TargetPort.IntVal),
					Protocol:   string(port.Protocol),
				})
			}

			x := &ServiceInfo{
				Name:       ser.Name,
				Namespace:  ser.Namespace,
				Age:        age,
				ClusterIP:  ser.Spec.ClusterIPs,
				Type:       string(ser.Spec.Type),
				Ports:      ports,
				Selector:   ser.Spec.Selector,
				ExternalIP: ser.Spec.ExternalIPs,
			}

			Svc = append(Svc, x)

		}

		l = l + len(svc.Items)
		// ser[ns.Name] = svc

		total[ns.Name] = l

	}

	return &Services{Totalservices: total, ServiceList: Svc}, nil
}

func (s *Server) getIngress(namespace *v1.NamespaceList) (*Ingress, error) {

	total := make(map[string]int)
	// Ing := make(map[string]*networkingv1.IngressList)
	ing := make([]*IngressInfo, 0)
	for _, ns := range namespace.Items {
		length := 0
		ingress, err := s.ClientSet.NetworkingV1().Ingresses(ns.Name).List(context.Background(), metav1.ListOptions{})

		if err != nil {
			return nil, err
		}

		for _, i := range ingress.Items {

			// age
			duration := time.Since(i.CreationTimestamp.Time)
			age := strconv.FormatFloat(duration.Hours(), 'f', -1, 64)

			// rules
			kitty := make([]*Rule, 0)
			h := make([]string, 0)

			for _, rule := range i.Spec.Rules {
				// paths
				hey := make([]*Path, 0)
				for _, path := range rule.HTTP.Paths {
					hey = append(hey, &Path{
						Path:     path.Path,
						PathType: string(*path.PathType),
						Backend: &Backend{
							Name: path.Backend.Service.Name,
							Port: int(path.Backend.Service.Port.Number),
						},
					})

				}
				h = append(h, rule.Host)
				kitty = append(kitty, &Rule{
					Host:  rule.Host,
					Paths: hey,
				})

			}

			meow := &IngressInfo{
				Name:      i.Name,
				Namespace: i.Namespace,
				Age:       age,
				Rules:     kitty,
				Hosts:     h,
				Address:   i.Status.LoadBalancer.Ingress[0].IP,
			}

			ing = append(ing, meow)

		}

		length = length + len(ingress.Items)

		total[ns.Name] = length
		// Ing[ns.Name] = ingress
	}

	return &Ingress{TotalIngress: total, IngressList: ing}, nil

}

func (s *Server) getSecrets(namespace *v1.NamespaceList) (*Secrets, error) {

	x := make(map[string]int)

	// Sec := make(map[string]*v1.SecretList)
	secrets := make([]*SecretsInfo, 0)

	for _, ns := range namespace.Items {
		length := 0
		sec, err := s.ClientSet.CoreV1().Secrets(ns.Name).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return nil, err
		}

		for _, secret := range sec.Items {
			// age
			duration := time.Since(secret.CreationTimestamp.Time)
			age := strconv.FormatFloat(duration.Hours(), 'f', -1, 64)

			a := &SecretsInfo{
				Name:      secret.Name,
				NameSpace: secret.Namespace,
				Age:       age,
				Type:      string(secret.Type),
				DataCount: len(secret.Data),
			}

			secrets = append(secrets, a)
		}

		length = length + len(sec.Items)
		x[ns.Name] = length

		// Sec[ns.Name] = sec

	}

	return &Secrets{TotalSecrets: x, Secrets: secrets}, nil

}

func (s *Server) getConfigMaps(namespace *v1.NamespaceList) (*ConfigMaps, error) {

	x := make(map[string]int)

	kitty := make([]*ConfigMapInfo, 0)
	for _, ns := range namespace.Items {

		l := 0
		m, err := s.ClientSet.CoreV1().ConfigMaps(ns.Name).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return nil, err
		}

		for _, meow := range m.Items {

			duration := time.Since(meow.CreationTimestamp.Time)
			age := strconv.FormatFloat(duration.Hours(), 'f', -1, 64)

			suck := &ConfigMapInfo{
				Name:      meow.Name,
				NameSpace: meow.Namespace,
				Age:       age,
				DataCount: len(meow.Data),
			}

			kitty = append(kitty, suck)
		}

		l = l + len(m.Items)
		x[ns.Name] = l

	}

	return &ConfigMaps{Total: x, Confs: kitty}, nil

}

// func (s *Server) DeletePod(name string) error {

// }

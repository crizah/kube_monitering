package server

import (
	"context"
	"strconv"
	"sync"
	"time"

	v1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

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
	Port     int    `json:"port"`
	Protocol string `json:"protocol"`
}

type Pods struct {
	TotalPods   int         `json:"total"`
	RunningPods int         `json:"running"`
	PodsList    []*PodsInfo `json:"pods"`
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
	TotalIngress int
	IngressList  map[string]*networkingv1.IngressList
}

type Services struct {
	Totalservices int
	ServiceList   map[string]*v1.ServiceList
}

type NameSpace struct {
	TotalNamespaces int
	NameSpaces      *v1.NamespaceList
}

type Secrets struct {
	TotalSecrets int
	Secrets      map[string]*v1.SecretList
}

type Overview struct {
	Nodes     *Nodes
	Pods      *Pods
	Services  *Services
	NameSpace *NameSpace
	Ingress   *Ingress
	Secrets   *Secrets
	Errors    []error
}

func GetOverview(c *rest.Config) (*Overview, error) {
	cs, err := NewClientSet(c)
	if err != nil {
		return nil, err
	}

	namespaces, err := getNamespaces(cs)
	if err != nil {
		return nil, err
	}

	var wg sync.WaitGroup
	var mux sync.Mutex
	wg.Add(5)

	ov := &Overview{NameSpace: &NameSpace{
		TotalNamespaces: len(namespaces.Items),
		NameSpaces:      namespaces,
	}, Errors: make([]error, 0)}

	go func() {
		defer wg.Done()
		nodes, err := getNodes(cs)
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
		pods, err := getPods(cs, namespaces)
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
		svc, err := getServices(cs, namespaces)
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
		ing, err := getIngress(cs, namespaces)
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
		sec, err := getSecrets(cs, namespaces)
		mux.Lock()
		defer mux.Unlock()
		if err != nil {
			ov.Errors = append(ov.Errors, err)
		} else {
			ov.Secrets = sec
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

func getNamespaces(cs *kubernetes.Clientset) (*v1.NamespaceList, error) {

	namespaces, err := cs.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return namespaces, nil
}

func getNodes(cs *kubernetes.Clientset) (*Nodes, error) {

	nodes, err := cs.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
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

func getPods(cs *kubernetes.Clientset, namespaces *v1.NamespaceList) (*Pods, error) {

	var arr []*PodsInfo
	runningPods := 0
	length := 0 // total pods

	for _, ns := range namespaces.Items {

		pods, err := cs.CoreV1().Pods(ns.Name).List(context.Background(), metav1.ListOptions{})

		if err != nil {
			return nil, err
		}

		length = length + len(pods.Items)

		for _, pod := range pods.Items {

			var p *PodsInfo

			// status
			status := string(pod.Status.Phase)

			// running pods

			for _, condition := range pod.Status.Conditions {
				if condition.Type == v1.PodReady && condition.Status == v1.ConditionTrue {
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

	}

	return &Pods{TotalPods: length, RunningPods: runningPods, PodsList: arr}, nil
}

func getServices(cs *kubernetes.Clientset, namespaces *v1.NamespaceList) (*Services, error) {
	length := 0
	Svc := make(map[string]*v1.ServiceList)
	for _, ns := range namespaces.Items {
		svc, err := cs.CoreV1().Services(ns.Name).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		Svc[ns.Name] = svc
		length = length + len(svc.Items)

	}

	return &Services{Totalservices: length, ServiceList: Svc}, nil
}

func getIngress(cs *kubernetes.Clientset, namespace *v1.NamespaceList) (*Ingress, error) {
	l := 0
	Ing := make(map[string]*networkingv1.IngressList)
	for _, ns := range namespace.Items {
		ingress, err := cs.NetworkingV1().Ingresses(ns.Name).List(context.Background(), metav1.ListOptions{})

		if err != nil {
			return nil, err
		}
		l = l + len(ingress.Items)
		Ing[ns.Name] = ingress
	}

	return &Ingress{TotalIngress: l, IngressList: Ing}, nil

}

func getSecrets(cs *kubernetes.Clientset, namespace *v1.NamespaceList) (*Secrets, error) {
	l := 0

	Sec := make(map[string]*v1.SecretList)
	for _, ns := range namespace.Items {
		sec, err := cs.CoreV1().Secrets(ns.Name).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return nil, err
		}

		Sec[ns.Name] = sec
		l = l + len(sec.Items)

	}

	return &Secrets{TotalSecrets: l, Secrets: Sec}, nil

}

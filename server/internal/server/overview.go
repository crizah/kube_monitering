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

// ingress
// {
//     totalIngress: int,
//     ingress: [
//         {
//             name: string,
//             namespace: string,
//             hosts: string[],       // ["example.com", "*.example.com"]
//             address: string,       // load balancer address
//             ports: string,         // "80, 443"
//             age: string,
//             rules: [               // detailed rules
//                 {
//                     host: string,
//                     paths: [
//                         {
//                             path: string,
//                             pathType: string,
//                             backend: string  // service name
//                         }
//                     ]
//                 }
//             ]
//         }
//     ]
// }

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

// configmaps
// {
//     totalConfigMaps: int,
//     configMaps: [
//         {
//             name: string,
//             namespace: string,
//             dataCount: int,        // number of key-value pairs
//             age: string
//         }
//     ]
// }

// secrets
// {
//     totalSecrets: int,
//     secrets: [
//         {
//             name: string,
//             namespace: string,
//             type: string,          // Opaque, kubernetes.io/tls, etc.
//             dataCount: int,        // number of secret keys
//             age: string
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
	TotalIngress   map[string]int                       `json:"total"`
	RunningIngress map[string]int                       `json:"running"`
	IngressList    map[string]*networkingv1.IngressList `json:"ingress"`
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
	TotalSecrets map[string]int            `json:"total"`
	Secrets      map[string]*v1.SecretList `json:"secrets"`
}

type Overview struct {
	Nodes     *Nodes     `json:"nodes"`
	Pods      *Pods      `json:"pods"`
	Services  *Services  `json:"services"`
	NameSpace *NameSpace `json:"namespaces"`
	Ingress   *Ingress   `json:"ingress"`
	Secrets   *Secrets   `json:"secrets"`
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
	totalPods := make(map[string]int)
	runPods := make(map[string]int)

	runningPods := 0
	length := 0 // total pods

	for _, ns := range namespaces.Items {
		r := 0
		l := 0

		pods, err := cs.CoreV1().Pods(ns.Name).List(context.Background(), metav1.ListOptions{})

		if err != nil {
			return nil, err
		}

		length = length + len(pods.Items)
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

func getServices(cs *kubernetes.Clientset, namespaces *v1.NamespaceList) (*Services, error) {

	total := make(map[string]int)
	// ser := make(map[string]*v1.ServiceList)
	Svc := make([]*ServiceInfo, 0)
	for _, ns := range namespaces.Items {

		l := 0

		svc, err := cs.CoreV1().Services(ns.Name).List(context.Background(), metav1.ListOptions{})
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

func getIngress(cs *kubernetes.Clientset, namespace *v1.NamespaceList) (*Ingress, error) {
	l := 0
	total := make(map[string]int)
	Ing := make(map[string]*networkingv1.IngressList)
	for _, ns := range namespace.Items {
		length := 0
		ingress, err := cs.NetworkingV1().Ingresses(ns.Name).List(context.Background(), metav1.ListOptions{})

		if err != nil {
			return nil, err
		}
		length = length + len(ingress.Items)
		l = l + len(ingress.Items)
		total[ns.Name] = l
		Ing[ns.Name] = ingress
	}

	return &Ingress{TotalIngress: total, IngressList: Ing}, nil

}

func getSecrets(cs *kubernetes.Clientset, namespace *v1.NamespaceList) (*Secrets, error) {
	l := 0

	x := make(map[string]int)

	Sec := make(map[string]*v1.SecretList)
	length := 0
	for _, ns := range namespace.Items {
		sec, err := cs.CoreV1().Secrets(ns.Name).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		length = length + len(sec.Items)
		x[ns.Name] = length

		Sec[ns.Name] = sec
		l = l + len(sec.Items)

	}

	return &Secrets{TotalSecrets: x, Secrets: Sec}, nil

}

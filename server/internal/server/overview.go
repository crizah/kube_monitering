package server

import (
	"context"
	"sync"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

type Nodes struct {
	TotalNodes   int
	RunningNodes int
	Nodes        *v1.NodeList
}

type Pods struct {
	TotalPods   int
	RunningPods int
	PodsList    map[string]*v1.PodList
}

type Services struct {
	ServiceList map[string]*v1.ServiceList
}

type Overview struct {
	Nodes    *Nodes
	Pods     *Pods
	Services *Services
	Errors   []error
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
	wg.Add(3)

	ov := &Overview{Errors: make([]error, 0)}

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
	// kubectl get namespaces
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

	runningNodes := 0
	for _, node := range nodes.Items {
		for _, condition := range node.Status.Conditions {
			if condition.Type == v1.NodeReady && condition.Status == v1.ConditionTrue {
				runningNodes++
				break
			}
		}
	}

	return &Nodes{TotalNodes: len(nodes.Items), RunningNodes: runningNodes, Nodes: nodes}, nil
}

func getPods(cs *kubernetes.Clientset, namespaces *v1.NamespaceList) (*Pods, error) {
	PodsList := make(map[string]*v1.PodList)
	runningPods := 0
	length := 0

	for _, ns := range namespaces.Items {
		pods, err := cs.CoreV1().Pods(ns.Name).List(context.Background(), metav1.ListOptions{})

		if err != nil {
			return nil, err
		}
		length = length + len(pods.Items)
		PodsList[ns.Name] = pods
		for _, pod := range pods.Items {
			for _, condition := range pod.Status.Conditions {
				if condition.Type == v1.PodReady && condition.Status == v1.ConditionTrue {
					runningPods++
					break
				}
			}
		}

	}

	return &Pods{TotalPods: length, RunningPods: runningPods, PodsList: PodsList}, nil
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

	return &Services{ServiceList: Svc}, nil
}

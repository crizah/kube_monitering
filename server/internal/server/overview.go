package server

import (
	v1 "k8s.io/api/core/v1"
)

// clientcmd.BuildConfigFromFlags() to parse the kubeconfigNodes
// Parse with clientcmd to create a *rest.Config
// creTE THE client set from this
// nodes clientset.CoreV1().Nodes().List(context, metav1.ListOptions{})
// Pods: clientset.CoreV1().Pods(namespace).List(context, metav1.ListOptions{})
// Deployments: clientset.AppsV1().Deployments(namespace).List(...)

// type Client struct {
// 	Nodes *v1.NodeList
// 	Pods  *v1.PodList
// }

type Nodes struct {
	TotalNodes   int
	RunningNodes int
	Nodes        *v1.NodeList
}

type Pods struct {
	TotalPods   int
	RunningPods int
	Pods        *v1.PodList
}

type Overview struct {
	Nodes *Nodes
	Pods  *Pods
}

// func NewClientSet(configPath string) (*kubernetes.Clientset, error) {
// 	restConf, err := clientcmd.BuildConfigFromFlags("", configPath)
// 	if err != nil {
// 		return nil, err
// 	}

// 	clientSet, err := kubernetes.NewForConfig(restConf)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return clientSet, nil

// }

// func getNodes(clientSet *kubernetes.Clientset, ctx context.Context, namespace string) (*Nodes, error) {

// 	nodes, err := clientSet.CoreV1().Nodes().List(ctx, v1.ListOptions{})
// 	if err != nil {
// 		return nil, err
// 	}

// 	runningNodes := 0
// 	for _, node := range nodes.Items {
// 		for _, condition := range node.Status.Conditions {
// 			if condition.Type == v1.NodeReady && condition.Status == v1.ConditionTrue {
// 				runningNodes++
// 				break
// 			}
// 		}
// 	}

// 	return &Nodes{TotalNodes: len(nodes.Items), RunningNodes: runningNodes, Nodes: nodes}, nil
// }

// func getPods(clientSet *kubernetes.Clientset, ctx context.Context, namespace string) (*Pods, error) {

// 	pods, err := clientSet.CoreV1().Pods(namespace).List(ctx, v1.ListOptions{})
// 	if err != nil {
// 		return nil, err
// 	}

// 	runningPods := 0
// 	for _, node := range pods.Items {
// 		for _, condition := range node.Status.Conditions {
// 			if condition.Type == v1.PodReady && condition.Status == v1.ConditionTrue {
// 				runningPods++
// 				break
// 			}
// 		}
// 	}

// 	return &Pods{TotalPods: len(pods.Items), RunningPods: runningPods, Pods: pods}, nil
// }

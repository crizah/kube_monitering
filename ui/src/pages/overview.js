import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../overview.css"




function Overview() {
    const x = process.env.REACT_APP_BACKEND_URL;
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    
    // const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 

    useEffect(() => { 
        overviewHandler();
    }, []);

    async function overviewHandler() {

        try {
            // setLoading(true);
            const res = await axios.get(`${x}/overview`, { 
                withCredentials: true
            });
        
            const o = new Map();
            o.set("totalNodes", res.data.totalNodes);
            o.set("runningNodes", res.data.runningNodes);
            o.set("totalPods", res.data.totalPods);
            o.set("runningPods", res.data.runningPods)
            o.set("namespace",res.data.namespace);
            o.set("services", res.data.services);
            o.set("totalIngress", res.data.totalIngress);
            o.set("totalSecrets", res.data.totalSecrets);
            
            setOverview(o); 
            // setLoading(false);
        } catch (error) {
            console.error("Error fetching overview:", error);
            setError(error.message);
            // setLoading(false);
            
          
            if (error.response?.status === 401) {
                navigate("/");
            }
        }
    }

    // if (loading){
    //     return <div className="container"><h2>put a round guy here</h2></div>;

    // }


    if(error){
        return <div className="container"><h2>rrror: {error}</h2></div>;
    }

    if(!overview) {
        return <div className="container"><h2>no data</h2></div>;
    }

    const stats = [
    {
      title: 'Nodes',
      icon: 'images/k8s.png',
      metrics: [
        { label: 'Total', value: overview.get("totalNodes") },
        { label: 'Running', value: overview.get("runningNodes") }
      ]
    },
    {
      title: 'Pods',
      icon: 'images/k8s.png',
      metrics: [
        { label: 'Total', value: overview.get("totalPods") },
        { label: 'Running', value: overview.get("runningPods") }
      ]
    },
    {
      title: 'Namespaces',
      icon: 'images/k8s.png',
      metrics: [
        { label: 'Total', value: overview.get("namespace") }
      ]
    },
    {
      title: 'Services',
      icon: 'images/k8s.png',
      metrics: [
        { label: 'Total', value: Object.keys(overview.get("services") ) }
      ]
    },
    {
      title: 'Ingress',
      icon: 'images/k8s.png',
      metrics: [
        { label: 'Total', value: Object.keys(overview.get("totalIngress"))}
      ]
    },
    {
      title: 'Secrets',
      icon: 'images/k8s.png',
      metrics: [
        { label: 'Total', value: Object.keys(overview.get("totalSecrets") ) }
      ]
    }
  ];

  const navigationItems = [
    { name: 'Overview', path: '/overview', icon: 'images/k8s.png' },
    { name: 'Nodes', path: '/nodes', icon: 'images/k8s.png',},
    { name: 'Pods', path: '/pods', icon: 'images/k8s.png', },
    { name: 'Services', path: '/services', icon: 'images/k8s.png', },
    { name: 'Deployments', path: '/deployments', icon: 'images/k8s.png', },
    
  ];

   return (
    <div className="app-layout">
        <div className="sidebar">
            <div className = "sidebar-header">
                hello
            </div>
            <div className="sidebar-components">
                {navigationItems.map(item => (
                    <button
                    key={item.name}
                    className="sidebar-item"
                    onclick = {() => navigate(item.path)}>

                    <img src={item.icon}></img>
                    <span>{item.name}</span>
                    </button>
                ))}
                
            </div>

        </div>
        <div className="background">
            <div className="cluster-container">
                <div className="cluster-header">
                    hello again
                    <div className = "stats-container{stats.item}">
                        <div className="nodes">
                            <img src= "images/k8s.png"
                            className="image-class"></img>
                            
                            text1

                        </div>
                        <div className="pods">
                            <img src= "images/k8s.png"
                            className="image-class"></img>
                            text2

                        </div>
                        <div className="services">
                            <img src= "images/k8s.png"
                            className="image-class"></img>
                            text3

                        </div>
                        <div className="namespace">
                            <img src= "images/k8s.png"
                            className="image-class"></img>
                            text4

                        </div>

                    </div>

                </div>
            </div>
        </div>
    </div>


    );

  
}

export { Overview };
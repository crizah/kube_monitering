import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";




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




    return (
         <div className="container"> 
            <h1>Cluster Overview</h1>
            
            <div className="nodes">
                <h2>nodes</h2>
                <p>total nodes: {overview.totalNodes}</p>
                <p>running nodes: {overview.runningNodes}</p>
            </div>

            <div className="pods">
                <h2>pods</h2>
                <p>total Pods: {overview.totalPods}</p>
                <p>running pods: {overview.runningPods}</p>
            </div>

            <div className="services">
                <h2>srvices</h2>
                <p>total svc: {Object.keys(overview.services)}</p>
            </div>
             <div className="ingress">
                <h2>ingress</h2>
                <p>total ingress: {Object.keys(overview.totalIngress)}</p>
            </div>
             <div className="secrets">
                <h2>secrets</h2>
                <p>total secrets {Object.keys(overview.totalSecrets)}</p>
            </div>
        </div>
    );
}

export { Overview };
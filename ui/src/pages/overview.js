import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Overview() {
    const x = process.env.REACT_APP_BACKEND_URL;
    const navigate = useNavigate();
    
    const [overview, setOverview] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 

    useEffect(() => { 
        overviewHandler();
    }, []);

    async function overviewHandler() {
        try {
            setLoading(true);
            const res = await axios.get(`${x}/overview`, { 
                withCredentials: true
            });
            setOverview(res.data.overview); 
            setLoading(false);
        } catch (error) {
            console.error("Error fetching overview:", error);
            setError(error.message);
            setLoading(false);
            
          
            if (error.response?.status === 401) {
                navigate("/");
            }
        }
    }

    if (loading) {
        return <div className="container"><h2>Loading...</h2></div>;
    }

    if (error) {
        return <div className="container"><h2>Error: {error}</h2></div>;
    }

    if (!overview) {
        return <div className="container"><h2>No data available</h2></div>;
    }

    return (
        <div className="container"> 
            <h1>Cluster Overview</h1>
            
            <div className="nodes">
                <h2>Nodes</h2>
                <p>Total Nodes: {overview.Nodes?.TotalNodes || 0}</p>
                <p>Running Nodes: {overview.Nodes?.RunningNodes || 0}</p>
            </div>

            <div className="pods">
                <h2>Pods</h2>
                <p>Total Pods: {overview.Pods?.TotalPods || 0}</p>
                <p>Running Pods: {overview.Pods?.RunningPods || 0}</p>
            </div>

            <div className="services">
                <h2>Services</h2>
                <p>Total Services: {Object.keys(overview.Services?.ServiceList || {}).length}</p>
            </div>
        </div>
    );
}

export { Overview };

import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../nodes.css";

function Nodes() {
  const [nodes, setNodes] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [activeNav, setActiveNav] = useState('nodes');
  const [refreshing, setRefresh] = useState(false);
 
  const navigate = useNavigate();
  // const x = process.env.REACT_APP_BACKEND_URL;
  const x = window.RUNTIME_CONFIG.BACKEND_URL;
  //  const x = window.RUNTIME_CONFIG.BACKEND_URL;

  useEffect(() => { 
    nodesHandler();
  }, []);


  async function refreshHandler() {
    try{
      setRefresh(true)
      const res= await axios.get(`${x}/refresh`, {withCredentials: true});
      nodesHandler()
      setRefresh(false)
    }catch (error){
      console.error("Error fetching nodes:", error);
      setError(error.message);
      setLoading(false);
      if (error.response?.status === 401) {
        navigate("/overview");
      }

    }
  }

  async function nodesHandler() {
    try {
      setLoading(true);
      const res = await axios.get(`${x}/nodes`, { withCredentials: true });
      setNodes(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      setError(error.message);
      setLoading(false);
      if (error.response?.status === 401) {
        navigate("/overview");
      }
    }
  }

  const handleNavigation = (path, navItem) => {
    setActiveNav(navItem);
    navigate(path);
  };

  if (loading) {
    return (
      <div className="nodes-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading Nodes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nodes-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="main-content">
          <div className="error-container">
            <div className="error-icon">⚠</div>
            <h2>Error Loading Data</h2>
            <p>{error}</p>
            <button className="retry-btn" onClick={refreshHandler}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!nodes || !nodes.nodes) {
    return (
      <div className="nodes-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="main-content">
          <div className="no-data-container">
            <h2>No Data Available</h2>
            <p>Unable to fetch nodes information</p>
          </div>
        </div>
      </div>
    );
  }

  const totalNodes = nodes?.nodes?.total || 0;
  const runningNodes = nodes?.nodes?.running|| 0;
  const unavailableNodes = totalNodes - runningNodes;
  const nodesList = nodes?.nodes?.nodes ?? [];


  return (
    <div className="nodes-container">
      <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
      
      <div className="main-content">
        {/* Header Section */}
        <div className="page-header">
          <h1>Nodes</h1>
          <button 
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={refreshHandler}
              disabled={refreshing}
            >
             <svg
  viewBox="0 0 32 32"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  fill="#ffffff"
>
  <g strokeWidth="0" />
  <g strokeLinecap="round" strokeLinejoin="round" />
  <g>
    <title>refresh</title>

    <g fill="none" fillRule="evenodd">
      <g transform="translate(-154, -1141)" fill="#ffffff">
        <path d="M184.858,1143.56 C185.397,1143.02 186.009,1142.55 186.009,1142 C186.009,1141.45 185.562,1141 185.009,1141 L175.009,1141 C174.888,1141 174.009,1141 174.009,1142 L174.009,1152 C174.009,1152.55 174.457,1153 175.009,1153 C175.562,1153 175.947,1152.47 176.373,1152.05 L179.152,1149.27 C180.922,1151.36 182,1154.05 182,1157 C182,1163.63 176.627,1169 170,1169 C163.373,1169 158,1163.63 158,1157 C158,1151.06 162.327,1146.13 168,1145.18 L168,1141.14 C160.109,1142.12 154,1148.84 154,1157 C154,1165.84 161.164,1173 170,1173 C178.836,1173 186,1165.84 186,1157 C186,1152.94 184.484,1149.25 181.993,1146.43 L184.858,1143.56" />
      </g>
    </g>
  </g>
</svg>

          
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="summary-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2"/>
                <rect x="2" y="14" width="20" height="8" rx="2"/>
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Nodes</span>
              <span className="summary-value">{totalNodes}</span>
            </div>
          </div>

          <div className="summary-card running">
            <div className="summary-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Running</span>
              <span className="summary-value">{runningNodes}</span>
            </div>
          </div>

          <div className="summary-card unavailable">
            <div className="summary-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Unavailable</span>
              <span className="summary-value">{unavailableNodes}</span>
            </div>
          </div>
        </div>

        {/* Nodes Table */}
        <div className="table-container">
          <div className="table-header">
            <h2>Node Details</h2>
            <span className="table-count">{nodesList.length} nodes</span>
          </div>

          <div className="table-wrapper">
            <table className="nodes-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Roles</th>
                  <th>Age</th>
                  <th>Version</th>
                  <th>Internal IP</th>
                  <th>OS</th>
                  <th>Kernel</th>
                  <th>Runtime</th>
                  <th>Max Capacity</th>
                </tr>
              </thead>
              <tbody>
                {nodesList.map((node, index) =>( 
                  <tr key={index} className={node.status === "yay" ? "status-ready" : "status-not-ready"}>
                    <td className="node-name">
                      <div className="name-cell">
        
                        {node.name}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${node.status === "yay" ? "ready" : "not-ready"}`}>
                        {node.status}
                      </span>
                    </td>
                    <td>
                      <span className="roles-badge">{node.roles || "<none>"}</span>
                    </td>
                    <td className="age-cell">{node.age}</td>
                    <td className="version-cell">{node.version}</td>
                    <td className="ip-cell">{node.ip}</td>
                    <td className="os-cell" title={node.osimage}>
                      {node.osimage.length > 20 ? node.osimage.substring(0, 20) + '...' : node.osimage}
                    </td>
                    <td className="kernel-cell">{node.kernelversion}</td>
                    <td className="runtime-cell" title={node.runtime}>
                      {node.runtime.split('://')[0]}
                    </td>
                    <td className="resources-cell">
                      <div className="resource-list">
                        <div className="resource-item">
                          <div className="resource-icon">
                            {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <g id="SVGRepo_iconCarrier" stroke="#6371da" strokeWidth="1.5">
      <path
        d="M7 10c0-1.414 0-2.121.44-2.56C7.878 7 8.585 7 10 7h4c1.414 0 2.121 0 2.56.44.44.439.44 1.146.44 2.56v4c0 1.414 0 2.121-.44 2.56-.439.44-1.146.44-2.56.44h-4c-1.414 0-2.121 0-2.56-.44C7 16.122 7 15.415 7 14z"
        opacity="0.5"
      ></path>
      <path d="M4 12c0-3.771 0-5.657 1.172-6.828S8.229 4 12 4s5.657 0 6.828 1.172S20 8.229 20 12s0 5.657-1.172 6.828S15.771 20 12 20s-5.657 0-6.828-1.172S4 15.771 4 12Z"></path>
      <path
        strokeLinecap="round"
        d="M4 12H2M22 12h-2M4 9H2M22 9h-2M4 15H2M22 15h-2M12 20v2M12 2v2M9 20v2M9 2v2M15 20v2M15 2v2"
        opacity="0.5"
      ></path>
    </g>
  </svg> */}
                          </div>
                          <span className="resource-text">CPU: {node.cpucapacity}</span>
                        </div>
                        <div className="resource-item">
                          <span className="resource-icon">
                            {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48">
    <g
      id="SVGRepo_iconCarrier"
      stroke="#6371da"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
    >
      <path d="M40 40H8a2 2 0 0 1-2-2V19.106a2 2 0 0 1 .336-1.11l6.07-9.105A2 2 0 0 1 14.07 8H40a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2M18 16V8M24 16V8M30 16V8M36 16V8"></path>
      <path fill="none" d="M15 28h18v12H15z"></path>
    </g>
  </svg> */}


                          </span>
                          <span className="resource-text">Mem: {node.memorycapacity}</span>
                        </div>
                        <div className="resource-item">
                          <span className="resource-icon">
                            {/* <svg viewBox="0 0 24 24" fill="none" stroke="#6371da" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg> */}



                          </span>
                          <span className="resource-text">Pods: {node.podscapacity}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {nodesList.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2"/>
              <rect x="2" y="14" width="20" height="8" rx="2"/>
            </svg>
            <h3>No Nodes Found</h3>
            <p>There are no nodes in the cluster</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({ activeNav, onNavigate }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="k8"></div>
          <span>K8s Dashboard</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeNav === 'overview' ? 'active' : ''}`}
          onClick={() => onNavigate('/overview', 'overview')}
        >
          
          <span>Overview</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'pods' ? 'active' : ''}`}
          onClick={() => onNavigate('/pods', 'pods')}
        >
          
          <span>Pods</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'nodes' ? 'active' : ''}`}
          onClick={() => onNavigate('/nodes', 'nodes')}
        >
          
          <span>Nodes</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'services' ? 'active' : ''}`}
          onClick={() => onNavigate('/services', 'services')}
        >
         
          <span>Services</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'ingress' ? 'active' : ''}`}
          onClick={() => onNavigate('/ingress', 'ingress')}
        >
         
          <span>Ingress</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'deployments' ? 'active' : ''}`}
          onClick={() => onNavigate('/deployments', 'deployments')}
        >
          
          <span>Deployments</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'configmaps' ? 'active' : ''}`}
          onClick={() => onNavigate('/configmaps', 'configmaps')}
        >
          
          <span>ConfigMaps</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'secrets' ? 'active' : ''}`}
          onClick={() => onNavigate('/secrets', 'secrets')}
        >
         
          <span>Secrets</span>
        </button>
      </nav>
    </div>
  );
}

export { Nodes };
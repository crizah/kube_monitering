
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
  const x = process.env.REACT_APP_BACKEND_URL;
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
          <button className="refresh-btn" onClick={nodesHandler}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh
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
                  <th>Resources</th>
                </tr>
              </thead>
              <tbody>
                {nodesList.map((node, index) =>( 
                  <tr key={index} className={node.status === "yay" ? "status-ready" : "status-not-ready"}>
                    <td className="node-name">
                      <div className="name-cell">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="2" width="20" height="8" rx="2"/>
                          <rect x="2" y="14" width="20" height="8" rx="2"/>
                          <line x1="6" y1="6" x2="6" y2="6"/>
                          <line x1="6" y1="18" x2="6" y2="18"/>
                        </svg>
                        <span>{node.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${node.status === "Ready" ? "ready" : "not-ready"}`}>
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
                          <span className="resource-icon">🖥️</span>
                          <span className="resource-text">CPU: {node.cpucapacity}</span>
                        </div>
                        <div className="resource-item">
                          <span className="resource-icon">💾</span>
                          <span className="resource-text">Mem: {node.memorycapacity}</span>
                        </div>
                        <div className="resource-item">
                          <span className="resource-icon">📦</span>
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
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
          </svg>
          <span>K8s Dashboard</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeNav === 'overview' ? 'active' : ''}`}
          onClick={() => onNavigate('/overview', 'overview')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Overview</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'pods' ? 'active' : ''}`}
          onClick={() => onNavigate('/pods', 'pods')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span>Pods</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'nodes' ? 'active' : ''}`}
          onClick={() => onNavigate('/nodes', 'nodes')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2"/>
            <line x1="6" y1="6" x2="6" y2="6"/>
            <line x1="6" y1="18" x2="6" y2="18"/>
          </svg>
          <span>Nodes</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'services' ? 'active' : ''}`}
          onClick={() => onNavigate('/services', 'services')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="2" x2="12" y2="9"/>
            <line x1="12" y1="15" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="9" y2="12"/>
            <line x1="15" y1="12" x2="22" y2="12"/>
          </svg>
          <span>Services</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'ingress' ? 'active' : ''}`}
          onClick={() => onNavigate('/ingress', 'ingress')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="2" x2="12" y2="22"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Ingress</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'deployments' ? 'active' : ''}`}
          onClick={() => onNavigate('/deployments', 'deployments')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          <span>Deployments</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'configmaps' ? 'active' : ''}`}
          onClick={() => onNavigate('/configmaps', 'configmaps')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span>ConfigMaps</span>
        </button>

        <button 
          className={`nav-item ${activeNav === 'secrets' ? 'active' : ''}`}
          onClick={() => onNavigate('/secrets', 'secrets')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Secrets</span>
        </button>
      </nav>
    </div>
  );
}

export { Nodes };
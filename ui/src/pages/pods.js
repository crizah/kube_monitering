import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../pods.css";

function Pods(){
  const [pods, setPods] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [activeNav, setActiveNav] = useState('pods');
  const [namespace, setNameSpace] = useState('default');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPod, setExpandedPod] = useState(null);
 
  const navigate = useNavigate();
  const x = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    podsHandler();
  }, []);

  async function refreshHandler(){
    try {
      setRefreshing(true);
      await axios.get(`${x}/refresh`, { withCredentials: true });
      await podsHandler();
      setRefreshing(false);
    } catch (error) {
      console.error(error);
      setError(error.message);
      setRefreshing(false);
      if (error.response?.status === 401) {
        navigate("/overview");
      }
    }
  }

  async function podsHandler(){
    try {
      setLoading(true);
      const res = await axios.get(`${x}/pods`, { withCredentials: true });
      setPods(res.data.pods);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pods:", error);
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

  const handleNS = (ns) => {
    setNameSpace(ns);
    setExpandedPod(null); // Close any expanded rows when changing namespace
  };

  const togglePodExpand = (podIndex) => {
    setExpandedPod(expandedPod === podIndex ? null : podIndex);
  };

  if (loading) {
    return (
      <div className="pods-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading Pods...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pods-container">
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

  if (!pods) {
    return (
      <div className="pods-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="main-content">
          <div className="no-data-container">
            <h2>No Data Available</h2>
            <p>Unable to fetch pods information</p>
          </div>
        </div>
      </div>
    );
  }

  // Extract data from pods object
  const totalPodsMap = pods.total || {};
  const runningPodsMap = pods.running || {};
  const allPodsList = pods.pods || [];
  const namespaceList = pods.namespacelist || [];

  // Filter data by selected namespace
  const totalPods = totalPodsMap[namespace] || 0;
  const runningPods = runningPodsMap[namespace] || 0;
  const unavailablePods = totalPods - runningPods;
  
  // Filter pods list to only show pods from selected namespace
  const filteredPodsList = allPodsList.filter(pod => pod.namespace === namespace);

  return (
    <div className="pods-container">
      <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
      
      <div className="main-content">
        {/* Header Section */}
        <div className="page-header">
          <h1>Pods</h1>
          <div className="header-controls">
            <div className="namespace-selector">
              <label htmlFor="namespace-select" className="namespace-label">
                Namespace:
              </label>
              <select
                id="namespace-select"
                className="namespace-dropdown"
                value={namespace}
                onChange={(e) => handleNS(e.target.value)}
              >
                {namespaceList && namespaceList.map((ns) => (
                  <option key={ns} value={ns}>
                    {ns}
                  </option>
                ))}
              </select>
            </div>
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
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="summary-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Pods</span>
              <span className="summary-value">{totalPods}</span>
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
              <span className="summary-value">{runningPods}</span>
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
              <span className="summary-value">{unavailablePods}</span>
            </div>
          </div>
        </div>

        {/* Pods Table */}
        <div className="table-container">
          <div className="table-header">
            <h2>Pod Details</h2>
            <span className="table-count">{filteredPodsList.length} pods</span>
          </div>

          <div className="table-wrapper">
            <table className="pods-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Namespace</th>
                  <th>Restarts</th>
                  <th>Age</th>
                  <th>Node</th>
                  <th>IP</th>
                  <th>Containers</th>
                </tr>
              </thead>
              <tbody>
                {filteredPodsList.map((pod, index) => (
                  <>
                    <tr 
                      key={index} 
                      className={`pod-row ${pod.status === "Running" ? "status-ready" : "status-not-ready"} ${expandedPod === index ? "expanded" : ""}`}
                      onClick={() => togglePodExpand(index)}
                    >
                      <td className="expand-cell">
                        <button className="expand-btn">
                          <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className={expandedPod === index ? "rotated" : ""}
                          >
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </td>
                      <td className="pod-name">
                        <div className="name-cell">
                          
                          {pod.name}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${pod.status === "yay" ? "ready" : "not-ready"}`}>
                          {pod.status}
                        </span>
                      </td>
                      <td className="ns-cell">{pod.namespace}</td>
                      <td className="restarts-cell">{pod.restarts}</td>
                      <td className="age-cell">{pod.age}</td>
                      <td>
                        <span className="node-badge">{pod.node || "<none>"}</span>
                      </td>
                      <td className="ip-cell">{pod.ip}</td>
                      <td className="containers-cell">
                        <span className="container-count">
                          {pod.readycontainer}/{pod.totalcontainer}
                        </span>
                      </td>
                    </tr>
                    {expandedPod === index && (
                      <tr key={`${index}-details`} className="pod-details-row">
                        <td colSpan="9">
                          <div className="pod-details">
                            <div className="details-header">
                              <h3>Containers ({pod.container?.length || 0})</h3>
                            </div>
                            <div className="containers-grid">
                              {pod.container && pod.container.length > 0 ? (
                                pod.container.map((container, containerIndex) => (
                                  <div key={containerIndex} className="container-card">
                                    <div className="container-header">
                                      
                                      <div className="container-title">
                                        <span className="container-name">{container.name}</span>
                                      </div>
                                    </div>
                                    <div className="container-body">
                                      <div className="container-info-item">
                                        <span className="info-label">Image:</span>
                                        <span className="info-value image-value" title={container.image}>
                                          {container.image}
                                        </span>
                                      </div>
                                      {container.ports && container.ports.length > 0 && (
                                        <div className="container-info-item">
                                          <span className="info-label">Ports:</span>
                                          <div className="ports-list">
                                            {container.ports.map((port, portIndex) => (
                                              <span key={portIndex} className="port-badge">
                                                {port.port}/{port.protocol}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="no-containers">
                                  <p>No container information available</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredPodsList.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            <h3>No Pods Found</h3>
            <p>There are no pods in the "{namespace}" namespace</p>
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

export { Pods };
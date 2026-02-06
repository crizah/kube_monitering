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
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="refresh-icon"
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
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
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1"/>
                            <rect x="14" y="3" width="7" height="7" rx="1"/>
                            <rect x="14" y="14" width="7" height="7" rx="1"/>
                            <rect x="3" y="14" width="7" height="7" rx="1"/>
                          </svg>
                          <span>{pod.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${pod.status === "Running" ? "ready" : "not-ready"}`}>
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
                                      <div className="container-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <rect x="4" y="4" width="16" height="16" rx="2"/>
                                          <rect x="9" y="9" width="6" height="6"/>
                                        </svg>
                                      </div>
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

export { Pods };
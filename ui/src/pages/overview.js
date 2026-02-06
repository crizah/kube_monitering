import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../overview.css";

function Overview() {
  const x = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null); 
  const [activeNav, setActiveNav] = useState('overview');
  const [namespace, setNameSpace] = useState('default');

  useEffect(() => { 
    overviewHandler();
  }, []);

  async function refreshHandler(){
    try{
      setRefreshing(true);
      // Call refresh endpoint to update backend cache
      await axios.get(`${x}/refresh`, {
        withCredentials: true
      });
     
      // Fetch updated data
      await overviewHandler();
      setRefreshing(false);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError(error.message);
      setRefreshing(false);
      if (error.response?.status === 401) {
        navigate("/");
      }
    }
  }

  async function overviewHandler() {
    try {
      setLoading(true);
      const res = await axios.get(`${x}/overview`, { 
        withCredentials: true
      });
      const o = new Map();
      o.set("totalNodes", res.data.totalNodes);
      o.set("runningNodes", res.data.runningNodes);
      o.set("totalPods", res.data.pods.total); // map[namespace]int
      o.set("runningPods", res.data.pods.running); // map[namespace]int
      o.set("namespace", res.data.namespaces.total); // int
      o.set("namespacelist", res.data.namespaces.namespacelist); // [string]
      o.set("services", res.data.services.total); // map[namespace]int
      o.set("totalIngress", res.data.totalIngress.total); // map[namespace]int
      o.set("totalSecrets", res.data.totalSecrets.total); // map[namespace]int
      setOverview(o); 
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

  const handleNavigation = (path, navItem) => {
    setActiveNav(navItem);
    navigate(path);
  };

  const handleNS = (ns) => {
    setNameSpace(ns);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation}/>
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
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

  if (!overview) {
    return (
      <div className="dashboard-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="main-content">
          <div className="no-data-container">
            <h2>No Data Available</h2>
            <p>Unable to fetch cluster information</p>
          </div>
        </div>
      </div>
    );
  }

  // Get namespace data
  const totalPodsMap = overview.get("totalPods"); // map[string]int
  const runningPodsMap = overview.get("runningPods"); // map[string]int
  const totalServicesMap = overview.get("services"); // map[string]int
  const totalIngressMap = overview.get("totalIngress"); // map[string]int
  const totalSecretsMap = overview.get("totalSecrets"); // map[string]int
  
  const namespaceList = overview.get("namespacelist"); // [string]

  // values for selected namespace
  const totalPods = totalPodsMap?.[namespace] || 0;
  const runningPods = runningPodsMap?.[namespace] || 0;
  const unavailablePods = totalPods - runningPods;
  
  const totalServices = totalServicesMap?.[namespace] || 0;
  const totalIngress = totalIngressMap?.[namespace] || 0;
  const totalSecrets = totalSecretsMap?.[namespace] || 0;

  const totalNodes = overview.get("totalNodes");
  const runningNodes = overview.get("runningNodes");
  const unavailableNodes = totalNodes - runningNodes; 

  return (
    <div className="dashboard-container">
      <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
      
      <div className="main-content">
        <div className="header">
          <h1>Cluster Overview</h1>
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
              title="Refresh cluster data"
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

        <div className="stats-grid">
          {/* Pods Card */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon pods-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <h3>Pods</h3>
            </div>
            <div className="stat-body">
              <div className="stat-main">
                <span className="stat-number">{totalPods}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-breakdown">
                <div className="stat-item success">
                  <span className="stat-dot"></span>
                  <span className="stat-text">Running: {runningPods}</span>
                </div>
                <div className="stat-item danger">
                  <span className="stat-dot"></span>
                  <span className="stat-text">Unavailable: {unavailablePods}</span>
                </div>
              </div>
            </div>
            <div className="stat-progress">
              <div 
                className="stat-progress-bar success" 
                style={{width: `${totalPods > 0 ? (runningPods / totalPods) * 100 : 0}%`}}
              ></div>
            </div>
          </div>

          {/* Nodes Card */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon nodes-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2"/>
                  <rect x="2" y="14" width="20" height="8" rx="2"/>
                  <line x1="6" y1="6" x2="6" y2="6"/>
                  <line x1="6" y1="18" x2="6" y2="18"/>
                </svg>
              </div>
              <h3>Nodes</h3>
            </div>
            <div className="stat-body">
              <div className="stat-main">
                <span className="stat-number">{totalNodes}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-breakdown">
                <div className="stat-item success">
                  <span className="stat-dot"></span>
                  <span className="stat-text">Running: {runningNodes}</span>
                </div>
                <div className="stat-item danger">
                  <span className="stat-dot"></span>
                  <span className="stat-text">Unavailable: {unavailableNodes}</span>
                </div>
              </div>
            </div>
            <div className="stat-progress">
              <div 
                className="stat-progress-bar success" 
                style={{width: `${totalNodes > 0 ? (runningNodes / totalNodes) * 100 : 0}%`}}
              ></div>
            </div>
          </div>

          {/* Services Card */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon services-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="2" x2="12" y2="9"/>
                  <line x1="12" y1="15" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="9" y2="12"/>
                  <line x1="15" y1="12" x2="22" y2="12"/>
                </svg>
              </div>
              <h3>Services</h3>
            </div>
            <div className="stat-body">
              <div className="stat-main">
                <span className="stat-number">{totalServices}</span>
                <span className="stat-label">Active</span>
              </div>
            </div>
          </div>

          {/* Ingress Card */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon ingress-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="2" x2="12" y2="22"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  <polyline points="7 3 12 2 17 3"/>
                  <polyline points="7 21 12 22 17 21"/>
                </svg>
              </div>
              <h3>Ingress</h3>
            </div>
            <div className="stat-body">
              <div className="stat-main">
                <span className="stat-number">{totalIngress}</span>
                <span className="stat-label">Rules</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Utilization Section */}
        <div className="resource-section">
          <h2 className="section-title">Resource Utilization</h2>
          
          <div className="resource-grid">
            {/* CPU Usage Card */}
            <div className="resource-card">
              <div className="resource-header">
                <div className="resource-icon cpu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <rect x="9" y="9" width="6" height="6"/>
                    <line x1="9" y1="2" x2="9" y2="4"/>
                    <line x1="15" y1="2" x2="15" y2="4"/>
                    <line x1="9" y1="20" x2="9" y2="22"/>
                    <line x1="15" y1="20" x2="15" y2="22"/>
                    <line x1="20" y1="9" x2="22" y2="9"/>
                    <line x1="20" y1="15" x2="22" y2="15"/>
                    <line x1="2" y1="9" x2="4" y2="9"/>
                    <line x1="2" y1="15" x2="4" y2="15"/>
                  </svg>
                </div>
                <h3>CPU Usage</h3>
              </div>
              <div className="resource-body">
                <div className="resource-value">
                  <span className="resource-number">--</span>
                  <span className="resource-unit">%</span>
                </div>
                <div className="resource-bar-container">
                  <div className="resource-bar">
                    <div className="resource-bar-fill cpu-fill" style={{width: '0%'}}></div>
                  </div>
                  <div className="resource-labels">
                    <span>Used: -- cores</span>
                    <span>Total: -- cores</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Memory Usage Card */}
            <div className="resource-card">
              <div className="resource-header">
                <div className="resource-icon memory-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                  </svg>
                </div>
                <h3>Memory Usage</h3>
              </div>
              <div className="resource-body">
                <div className="resource-value">
                  <span className="resource-number">--</span>
                  <span className="resource-unit">%</span>
                </div>
                <div className="resource-bar-container">
                  <div className="resource-bar">
                    <div className="resource-bar-fill memory-fill" style={{width: '0%'}}></div>
                  </div>
                  <div className="resource-labels">
                    <span>Used: -- GB</span>
                    <span>Total: -- GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">🔐</div>
            <div className="info-content">
              <span className="info-label">Secrets</span>
              <span className="info-value">{totalSecrets}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ activeNav, onNavigate}) {
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

export { Overview };
import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../configmap.css";

function ConfigMaps(){
  const [secrets, setSecrets] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [activeNav, setActiveNav] = useState('configmaps');
  const [namespace, setNameSpace] = useState('default');
  const [refreshing, setRefreshing] = useState(false);
  
  const navigate = useNavigate();
  // const x = process.env.REACT_APP_BACKEND_URL;
  const x = window.RUNTIME_CONFIG.BACKEND_URL;

  useEffect(() => {
    secretsHandler();
  }, []);

  async function refreshHandler(){
    try {
      setRefreshing(true);
      await axios.get(`${x}/refresh`, { withCredentials: true });
      await secretsHandler();
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

  async function secretsHandler(){
    try {
      setLoading(true);
      const res = await axios.get(`${x}/configmap`, { withCredentials: true });
      setSecrets(res.data.configmap);
      setLoading(false);
    } catch (error) {
      console.error("error", error);
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
  };

  if (loading) {
    return (
      <div className="secrets-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="secrets-main-content">
          <div className="secrets-loading-container">
            <div className="secrets-spinner"></div>
            <p>Loading Secrets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="secrets-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="secrets-main-content">
          <div className="secrets-error-container">
            <div className="secrets-error-icon">⚠</div>
            <h2>Error Loading Data</h2>
            <p>{error}</p>
            <button className="secrets-retry-btn" onClick={refreshHandler}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!secrets) {
    return (
      <div className="secrets-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="secrets-main-content">
          <div className="secrets-no-data-container">
            <h2>No Data Available</h2>
            <p>Unable to fetch configmap information</p>
          </div>
        </div>
      </div>
    );
  }

  const totalSecretsMap = secrets.total || {};
  const allSecretsList = secrets.confs || [];
  const namespaceList = secrets.namespacelist || [];

  const totalSecrets = totalSecretsMap[namespace] || 0;
  const filteredList = allSecretsList.filter(secret => secret.namespace === namespace);

  return (
    <div className="secrets-container">
      <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
      
      <div className="secrets-main-content">
        {/* Header Section */}
        <div className="secrets-page-header">
          <h1>ConfigMaps</h1>
          <div className="secrets-header-controls">
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
               <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    id="XMLID_195_"
    width="200"
    height="200"
    fill="currentColor"
    version="1.1"
    viewBox="0 0 24 24"
  >
    <g id="SVGRepo_iconCarrier">
      <path
        id="notes"
        d="M16.4 24H2V0h20v18.4zM4 22h10v-6h6V2H4v2h16v2H4zm12-4v3.6l3.6-3.6zm-5 0H6v-2h5zm7-4H6v-2h12zm-2-4H6V8h10z"
      ></path>
    </g>
  </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Total ConfigMaps</span>
              <span className="summary-value">{totalSecrets}</span>
            </div>
          </div>
        </div>

        {/* Secrets Table */}
        <div className="secrets-table-container">
          <div className="table-header">
            <h2>ConfigMaps Details</h2>
            <span className="table-count">{filteredList.length} config maps</span>
          </div>

          <div className="table-wrapper">
            <table className="secrets-table">
              <thead>
                <tr>
                  <th>Name</th>
                  
                  <th>Namespace</th>
                  <th>Data Items</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((secret, index) => (
                  <tr 
                    key={index} 
                    className="secrets-row"
                  >
                    <td className="secrets-name-cell">
                      <div className="secrets-name">
                        
                        <span>{secret.name}</span>
                      </div>
                    </td>
                 
                    <td className="secrets-ns-cell">{secret.namespace}</td>
                    <td className="secrets-datacount-cell">
                      <span className="secrets-datacount-badge">
                        {secret.datacount}
                      </span>
                    </td>
                    <td className="secrets-age-cell">{secret.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredList.length === 0 && (
          <div className="secrets-empty-state">
            <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    id="XMLID_195_"
    width="200"
    height="200"
    fill="currentColor"
    version="1.1"
    viewBox="0 0 24 24"
  >
    <g id="SVGRepo_iconCarrier">
      <path
        id="notes"
        d="M16.4 24H2V0h20v18.4zM4 22h10v-6h6V2H4v2h16v2H4zm12-4v3.6l3.6-3.6zm-5 0H6v-2h5zm7-4H6v-2h12zm-2-4H6V8h10z"
      ></path>
    </g>
  </svg>
            <h3>No Config Maps Found</h3>
            <p>There are no Config Maps in the "{namespace}" namespace</p>
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


export {ConfigMaps};
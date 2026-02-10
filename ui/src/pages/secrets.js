
import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../secrets.css";


function Secrets(){
  const [secrets, setSecrets] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [activeNav, setActiveNav] = useState('secrets');
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
      const res = await axios.get(`${x}/secrets`, { withCredentials: true });
      setSecrets(res.data.secrets);
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
            <p>Unable to fetch secrets information</p>
          </div>
        </div>
      </div>
    );
  }

  const totalSecretsMap = secrets.total || {};
  const allSecretsList = secrets.secrets || [];
  const namespaceList = secrets.namespacelist || [];

  const totalSecrets = totalSecretsMap[namespace] || 0;
  const filteredList = allSecretsList.filter(secret => secret.namespace === namespace);

  return (
    <div className="secrets-container">
      <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
      
      <div className="secrets-main-content">
        {/* Header Section */}
        <div className="secrets-page-header">
          <h1>Secrets</h1>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path
      id="SVGRepo_iconCarrier"
      fill="currentColor"
      fillRule="nonzero"
      d="M20 0v11.887h-3.962a.19.19 0 0 1-.189-.189v-1.132c0-.104.085-.189.189-.189h2.452V1.509h-2.452a.19.19 0 0 1-.189-.188V.189c0-.105.085-.189.189-.189zM4.31 0c.103 0 .188.084.188.189V1.32a.19.19 0 0 1-.189.188h-2.8v8.868h2.783c.105 0 .19.085.19.189v1.132a.19.19 0 0 1-.19.189H0V0zm11.117 3.868v1.456l.06.025 1.351-.478.28.82-1.362.465-.037.098.937 1.26-.706.514-.912-1.26h-.085l-.913 1.26-.705-.514.924-1.26-.024-.098-1.362-.465.28-.82 1.337.478.073-.025V3.868zm-10.231 0V5.31l.06.024 1.351-.473.28.812-1.363.46-.036.097.937 1.248-.706.51-.912-1.249h-.085l-.913 1.248-.705-.509.924-1.248-.024-.097-1.362-.46.28-.812 1.337.473.073-.024V3.868zm5.094 0V5.31l.061.024 1.35-.473.28.812-1.362.46-.037.097.937 1.248-.706.51-.912-1.249h-.085l-.912 1.248-.706-.509.925-1.248-.025-.097-1.362-.46.28-.812 1.338.473.073-.024V3.868z"
      transform="translate(2 6)"
    ></path>
  </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Secrets</span>
              <span className="summary-value">{totalSecrets}</span>
            </div>
          </div>
        </div>

        {/* Secrets Table */}
        <div className="secrets-table-container">
          <div className="table-header">
            <h2>Secret Details</h2>
            <span className="table-count">{filteredList.length} secrets</span>
          </div>

          <div className="table-wrapper">
            <table className="secrets-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
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
                    <td>
                      <span className="secrets-type-badge">
                        {secret.type}
                      </span>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <h3>No Secrets Found</h3>
            <p>There are no secrets in the "{namespace}" namespace</p>
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


export {Secrets};
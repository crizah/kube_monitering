
import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../ingress.css";

function Ingress(){
  const [ingress, setIngress] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [activeNav, setActiveNav] = useState('ingress');
  const [namespace, setNameSpace] = useState('default');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  
  const navigate = useNavigate();
  // const x = process.env.REACT_APP_BACKEND_URL;
  const x = window.RUNTIME_CONFIG.BACKEND_URL;

  useEffect(() => {
    ingressHandler();
  }, []);

  async function refreshHandler(){
    try {
      setRefreshing(true);
      await axios.get(`${x}/refresh`, { withCredentials: true });
      await ingressHandler();
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

  async function ingressHandler(){
    try {
      setLoading(true);
      const res = await axios.get(`${x}/ingress`, { withCredentials: true });
      setIngress(res.data.ingress);
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
    setExpandedRow(null);
  };

  const toggleRowExpand = (ingressIndex) => {
    setExpandedRow(expandedRow === ingressIndex ? null : ingressIndex);
  };

  if (loading) {
    return (
      <div className="ingress-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="ingress-main-content">
          <div className="ingress-loading-container">
            <div className="ingress-spinner"></div>
            <p>Loading Ingress...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ingress-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="ingress-main-content">
          <div className="ingress-error-container">
            <div className="ingress-error-icon">⚠</div>
            <h2>Error Loading Data</h2>
            <p>{error}</p>
            <button className="ingress-retry-btn" onClick={refreshHandler}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!ingress) {
    return (
      <div className="ingress-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="ingress-main-content">
          <div className="ingress-no-data-container">
            <h2>No Data Available</h2>
            <p>Unable to fetch ingress information</p>
          </div>
        </div>
      </div>
    );
  }

  const totalIngressMap = ingress.total || {};
  const allIngressList = ingress.ingress || [];
  const namespaceList = ingress.namespacelist || [];

  const totalIngress = totalIngressMap[namespace] || 0;
  const filteredList = allIngressList.filter(ing => ing.namespace === namespace);

  return (
    <div className="ingress-container">
      <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
      
      <div className="ingress-main-content">
        {/* Header Section */}
        <div className="page-header">
          <h1>Ingress</h1>
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <g id="SVGRepo_iconCarrier">
      <g
        stroke="#6371da"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        clipPath="url(#clip0_429_11126)"
      >
        <path d="M9 4h10v14a2 2 0 0 1-2 2H9M12 15l3-3m0 0-3-3m3 3H5"></path>
      </g>
      <defs>
        <clipPath id="clip0_429_11126">
          <path fill="#6371da" d="M0 0h24v24H0z"></path>
        </clipPath>
      </defs>
    </g>
  </svg>
            </div>
            <div className="ingress-summary-content">
              <span className="ingress-summary-label">Total Ingress</span>
              <span className="ingress-summary-value">{totalIngress}</span>
            </div>
          </div>
        </div>

        {/* Ingress Table */}
        <div className="ingress-table-container">
          <div className="ingress-table-header">
            <h2>Ingress Details</h2>
            <span className="ingress-table-count">{filteredList.length} ingress</span>
          </div>

          <div className="ingress-table-wrapper">
            <table className="ingress-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Namespace</th>
                  <th>Hosts</th>
                  <th>Address</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((ing, index) => (
                  <>
                    <tr 
                      key={index} 
                      className={`ingress-row ${expandedRow === index ? 'expanded' : ''}`}
                      onClick={() => toggleRowExpand(index)}
                    >
                      <td className="ingress-expand-cell">
                        <button className="ingress-expand-btn">
                          <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className={expandedRow === index ? "rotated" : ""}
                          >
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </td>
                      <td className="ingress-name-cell">
                        <div className="ingress-name">
                          {/* <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="2" x2="12" y2="22"/>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg> */}
                          <span>{ing.name}</span>
                        </div>
                      </td>
                      <td className="ingress-ns-cell">{ing.namespace}</td>
                      <td className="ingress-hosts-cell">
                        <div className="ingress-hosts-list">
                          {ing.hosts && ing.hosts.length > 0 ? (
                            ing.hosts.map((host, hostIndex) => (
                              <span key={hostIndex} className="ingress-host-badge">
                                {host}
                              </span>
                            ))
                          ) : (
                            <span className="ingress-no-hosts">-</span>
                          )}
                        </div>
                      </td>
                      <td className="ingress-address-cell">
                        {ing.address || <span className="ingress-no-address">-</span>}
                      </td>
                      <td className="ingress-age-cell">{ing.age}</td>
                    </tr>
                    {expandedRow === index && (
                      <tr key={`${index}-details`} className="ingress-details-row">
                        <td colSpan="6">
                          <div className="ingress-details">
                            <div className="ingress-details-header">
                              <h3>Routing Rules</h3>
                            </div>
                            <div className="ingress-rules-container">
                              {ing.rules && ing.rules.length > 0 ? (
                                ing.rules.map((rule, ruleIndex) => (
                                  <div key={ruleIndex} className="ingress-rule-card">
                                    <div className="ingress-rule-header">
                                      {/* <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12 6 12 12 16 14"/>
                                      </svg> */}
                                      <span className="ingress-rule-host">
                                        Host: <strong>{rule.host || '*'}</strong>
                                      </span>
                                    </div>
                                    <div className="ingress-paths-container">
                                      {rule.paths && rule.paths.length > 0 ? (
                                        rule.paths.map((path, pathIndex) => (
                                          <div key={pathIndex} className="ingress-path-item">
                                            <div className="ingress-path-info">
                                              <span className="ingress-path-badge">
                                                {path.path}
                                              </span>
                                              <span className="ingress-pathtype-badge">
                                                {path.pathtype}
                                              </span>
                                            </div>
                                            {/* <div className="ingress-arrow">→</div> */}
                                            <div className="ingress-backend-info">
                                              <div className="ingress-backend-service">
                                                {/* <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <circle cx="12" cy="12" r="3"/>
                                                  <circle cx="12" cy="12" r="10"/>
                                                </svg> */}
                                                <span>{path.backend.name}</span>
                                              </div>
                                              <span className="ingress-backend-port">
                                                Port: {path.backend.ports}
                                              </span>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="ingress-no-paths">No paths defined</div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="ingress-no-rules">No routing rules defined</div>
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
        {filteredList.length === 0 && (
          <div className="ingress-empty-state">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <g id="SVGRepo_iconCarrier">
      <g
        stroke="#6371da"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        clipPath="url(#clip0_429_11126)"
      >
        <path d="M9 4h10v14a2 2 0 0 1-2 2H9M12 15l3-3m0 0-3-3m3 3H5"></path>
      </g>
      <defs>
        <clipPath id="clip0_429_11126">
          <path fill="#6371da" d="M0 0h24v24H0z"></path>
        </clipPath>
      </defs>
    </g>
  </svg>
            <h3>No Ingress Found</h3>
            <p>There are no ingress resources in the "{namespace}" namespace</p>
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


export {Ingress};
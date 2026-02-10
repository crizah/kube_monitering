import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../svc.css";

function Services(){
  const [svc, setSVC] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [activeNav, setActiveNav] = useState('services');
  const [namespace, setNameSpace] = useState('default');
  const [refreshing, setRefreshing] = useState(false);
  
  const navigate = useNavigate();
  // const x = process.env.REACT_APP_BACKEND_URL;
  const x = window.RUNTIME_CONFIG.BACKEND_URL;

  useEffect(() => {
    svcHandler();
  }, []);

  async function refreshHandler(){
    try {
      setRefreshing(true);
      await axios.get(`${x}/refresh`, { withCredentials: true });
      await svcHandler();
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

  async function svcHandler(){
    try {
      setLoading(true);
      const res = await axios.get(`${x}/svc`, { withCredentials: true });
      setSVC(res.data.services);
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
      <div className="services-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="services-main-content">
          <div className="services-loading-container">
            <div className="services-spinner"></div>
            <p>Loading Services...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="services-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="services-main-content">
          <div className="services-error-container">
            <div className="services-error-icon">⚠</div>
            <h2>Error Loading Data</h2>
            <p>{error}</p>
            <button className="services-retry-btn" onClick={refreshHandler}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!svc) {
    return (
      <div className="services-container">
        <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
        <div className="services-main-content">
          <div className="services-no-data-container">
            <h2>No Data Available</h2>
            <p>Unable to fetch service information</p>
          </div>
        </div>
      </div>
    );
  }

  const totalsvcMap = svc.total || {};
  const allsvcList = svc.services || [];
  const namespaceList = svc.namespacelist || [];

  const totalSvc = totalsvcMap[namespace] || 0;
  const filteredList = allsvcList.filter(service => service.namespace === namespace);

  return (
    <div className="services-container">
      <Sidebar activeNav={activeNav} onNavigate={handleNavigation} />
      
      <div className="services-main-content">
        {/* Header Section */}
                <div className="page-header">
          <h1>Services</h1>
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
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16">
    <g id="SVGRepo_iconCarrier" fill="#00b7ff">
      <path d="M5 1h6v2H9v1.07c3.392.486 6 3.404 6 6.93H1a7 7 0 0 1 6-6.93V3H5zM15 15v-2H1v2z"></path>
    </g>
  </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Services</span>
              <span className="summary-value">{totalSvc}</span>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="services-table-container">
          <div className="table-header">
            <h2>Service Details</h2>
            <span className="table-count">{filteredList.length} services</span>
          </div>

          <div className="table-wrapper">
            <table className="services-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Namespace</th>
                  <th>Age</th>
                  <th>ClusterIP</th>
                  <th>ExternalIP</th>
                  <th>Ports</th>
                  <th>Selector</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((service, index) => (
                  <tr 
                    key={index} 
                    className={`services-row ${service.type === "ClusterIP" ? "type-clusterip" : "type-loadbalancer"}`}
                  >
                    <td className="services-name-cell">
                      <div className="services-name">
                       
                        <span>{service.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`services-type-badge ${service.type === "ClusterIP" ? "clusterip" : "loadbalancer"}`}>
                        {service.type}
                      </span>
                    </td>
                    <td className="services-ns-cell">{service.namespace}</td>
                    <td className="services-age-cell">{service.age}</td>
                    <td className="services-clusterip-cell">
                      {service.clusterip && service.clusterip.length > 0 
                        ? service.clusterip.join(", ") 
                        : "<none>"}
                    </td>
                    <td className="services-externalip-cell">
                      {service.externalip && service.externalip.length > 0 
                        ? service.externalip.join(", ") 
                        : "<none>"}
                    </td>
                    <td className="services-ports-cell">
                      <div className="services-ports-list">
                        {service.ports && service.ports.length > 0 ? (
                          service.ports.map((port, portIndex) => (
                            <span key={portIndex} className="services-port-badge">
                              {port.port}:{port.targetport}/{port.protocol}
                            </span>
                          ))
                        ) : (
                          <span className="services-no-ports">-</span>
                        )}
                      </div>
                    </td>
                    <td className="services-selector-cell">
                      {service.selector && Object.keys(service.selector).length > 0 ? (
                        <div className="services-selector-list">
                          {Object.entries(service.selector).map(([key, value], selectorIndex) => (
                            <span key={selectorIndex} className="services-selector-badge">
                              {key}={value}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="services-no-selector">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredList.length === 0 && (
          <div className="services-empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16">
    <g id="SVGRepo_iconCarrier" fill="#3e555e">
      <path d="M5 1h6v2H9v1.07c3.392.486 6 3.404 6 6.93H1a7 7 0 0 1 6-6.93V3H5zM15 15v-2H1v2z"></path>
    </g>
  </svg>
            
            <h3>No Services Found</h3>
            <p>There are no services in the "{namespace}" namespace</p>
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


export {Services};
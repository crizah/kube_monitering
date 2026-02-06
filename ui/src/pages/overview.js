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

  
  const totalPodsMap = overview.get("totalPods"); // map[string]int
  const runningPodsMap = overview.get("runningPods"); // map[string]int
  const totalServicesMap = overview.get("services"); // map[string]int
  const totalIngressMap = overview.get("totalIngress"); // map[string]int
  const totalSecretsMap = overview.get("totalSecrets"); // map[string]int
  
  const namespaceList = overview.get("namespacelist"); // [string]

  // values for selected namespace
  const totalPods = totalPodsMap[namespace] ;
  const runningPods = runningPodsMap[namespace] ;
  const unavailablePods = totalPods - runningPods;
  
  const totalServices = totalServicesMap[namespace];
  const totalIngress = totalIngressMap[namespace];
  const totalSecrets = totalSecretsMap[namespace];

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

        <div className="stats-grid">


          {/* pods */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon pods-icon">
                 <svg viewBox="0 0 24 24" fill="none" stroke="#6371da" strokeWidth="2">
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

          {/* nodes */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon nodes-icon">
                
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6371da" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2"/>
                <rect x="2" y="14" width="20" height="8" rx="2"/>
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

          {/* svc*/}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon services-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16">
    <g id="SVGRepo_iconCarrier" fill="#6371da">
      <path d="M5 1h6v2H9v1.07c3.392.486 6 3.404 6 6.93H1a7 7 0 0 1 6-6.93V3H5zM15 15v-2H1v2z"></path>
    </g>
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

          {/* egress means exit */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon ingress-icon">
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
              <h3>Ingress</h3>
            </div>
            <div className="stat-body">
              <div className="stat-main">
                <span className="stat-number">{totalIngress}</span>
                <span className="stat-label">Rules</span>
              </div>
            </div>
          </div>





          {/* hush hush */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon secrets-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path
      id="SVGRepo_iconCarrier"
      fill="#6371da"
      fillRule="nonzero"
      d="M20 0v11.887h-3.962a.19.19 0 0 1-.189-.189v-1.132c0-.104.085-.189.189-.189h2.452V1.509h-2.452a.19.19 0 0 1-.189-.188V.189c0-.105.085-.189.189-.189zM4.31 0c.103 0 .188.084.188.189V1.32a.19.19 0 0 1-.189.188h-2.8v8.868h2.783c.105 0 .19.085.19.189v1.132a.19.19 0 0 1-.19.189H0V0zm11.117 3.868v1.456l.06.025 1.351-.478.28.82-1.362.465-.037.098.937 1.26-.706.514-.912-1.26h-.085l-.913 1.26-.705-.514.924-1.26-.024-.098-1.362-.465.28-.82 1.337.478.073-.025V3.868zm-10.231 0V5.31l.06.024 1.351-.473.28.812-1.363.46-.036.097.937 1.248-.706.51-.912-1.249h-.085l-.913 1.248-.705-.509.924-1.248-.024-.097-1.362-.46.28-.812 1.337.473.073-.024V3.868zm5.094 0V5.31l.061.024 1.35-.473.28.812-1.362.46-.037.097.937 1.248-.706.51-.912-1.249h-.085l-.912 1.248-.706-.509.925-1.248-.025-.097-1.362-.46.28-.812 1.338.473.073-.024V3.868z"
      transform="translate(2 6)"
    ></path>
  </svg>
                
              </div>
              <h3>Secrets</h3>
            </div>
            <div className="stat-body">
              <div className="stat-main">
                <span className="stat-number">{totalSecrets}</span>
                <span className="stat-label">Secrets</span>
              </div>
            </div>
          </div>










        </div>

        {/* resources */}
        <div className="resource-section">
          <h2 className="section-title">Resource Utilization</h2>
          
          <div className="resource-grid">
            {/* cpu*/}
            <div className="resource-card">
              <div className="resource-header">
                <div className="resource-icon cpu-icon">

                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

            {/*memory*/}
            <div className="resource-card">
              <div className="resource-header">
                <div className="resource-icon memory-icon">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48">
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

        
      </div>
    </div>
  );
}

function Sidebar({ activeNav, onNavigate}) {
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
          className={`nav-item ${activeNav === 'overview'?'active' : ''}`}
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
          className={`nav-item ${activeNav ==='secrets'?'active':''}`}
          onClick={() => onNavigate('/secrets', 'secrets')}
        >
        
          <span>Secrets</span>
        </button>
      </nav>
    </div>
  );
}

export { Overview };
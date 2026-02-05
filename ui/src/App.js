import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {UploadConf} from "./pages/upload"
import {Overview} from "./pages/overview"
import {Pods} from "./pages/pods"
import {Nodes} from "./pages/nodes"
import {Secrets} from "./pages/secrets"
import {Services} from "./pages/svc"
import {Ingress} from "./pages/ingress"
import {Deployments} from "./pages/deployments"
import {ConfigMaps} from "./pages/configmap"


import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path={"/"}
          element={<UploadConf />} />
        <Route 
          path={"/overview"}
          element={<Overview />}/>

        <Route
          path={"/pods"}
          element={<Pods />}/>

         <Route
          path={"/nodes"}
          element={<Nodes />}/>

           <Route
          path={"/secrets"}
          element={<Secrets />}/>


           <Route
          path={"/services"}
          element={<Services />}/>

           <Route
          path={"/ingress"}
          element={<Ingress />}/>


           <Route
          path={"/deployments"}
          element={<Deployments />}/>


           <Route
          path={"/configmaps"}
          element={<ConfigMaps />}/>


      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {UploadConf} from "./pages/upload"
import {Overview} from "./pages/overview"
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
        
      </Routes>
    </Router>
  );
}

export default App;

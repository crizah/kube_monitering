import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UploadConf() {
    const [file, setFile] = useState(null);
    const [pasted, setPasted] = useState("");
    const navigate = useNavigate();
    const x = process.env.REACT_APP_BACKEND_URL;

    function handleFileChange(e) {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
    }

    function handlePastedContent(e) {
        const pastedContent = e.target.value; 
        setPasted(pastedContent);
    }

    async function upload() {
        if (!file && !pasted) {
            alert("please upload a file or paste the content");
            return;
        }
        try {
            const formData = new FormData();
            formData.append('pasted', pasted);
            if (file) {
                formData.append('file', file);
            }
            const res = await axios.post(
                `${x}/config`,
                formData,
                { withCredentials: true }
            );
            console.log(res.data.message)
            navigate("/overview");
        } catch (error) {
            alert("Error: " + error.message);
        }
    }

    return (
        <div className="container">
            <div className="headings">
                <h1>Please upload your config file or paste its content</h1>
                <h2>Config file usually located at ~/.kube/config</h2>
            </div>
            <div className="paste">
                <h2>Paste content here</h2>
                <textarea 
                    rows="10"
                    cols="50"
                    placeholder="Paste your kubeconfig here..."
                    value={pasted}
                    onChange={handlePastedContent}
                />
            </div>
            <div className="upload">
                <h2>Upload your file here</h2>
                <input
                    type="file"
                    accept=".config,.yaml,.yml" 
                    onChange={handleFileChange}
                />
            </div>
            <button onClick={upload}>Upload</button>
        </div>
    );
}

export { UploadConf };
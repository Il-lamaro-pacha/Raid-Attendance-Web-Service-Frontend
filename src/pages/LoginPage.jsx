import "../css/LoginPage.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../hooks/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";

function LoginPage() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const startLogin = async () => {
        try {

            setError(null);
            setLoading(true);

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const token = await userCredential.user.getIdToken();

            localStorage.setItem("token", token);

            navigate("/list_selection");

        } catch (err) {
            console.error(err);
            setError("Invalid Username or Password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="login-header">
                <h1>Welcome to the Raid Attendance Service</h1>
            </div>

            <div className="form-container">

                <div className="login-container">
                    <h2>Sign in</h2>

                    <input
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button onClick={startLogin} disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {loading && <div className="spinner"></div>}

                    {error && (
                        <p className="error-message" color="red">
                            {error}
                        </p>
                    )}

                </div>

                <div className="registration-section">
                    <h2>Don't have an account?</h2>
                    <p>If you don't have an account, click</p>
                    <p
                        className="registration-link"
                        onClick={() =>
                            navigate("/registration")
                        }
                    >
                        here
                    </p>
                </div>

            </div>

            <div className="footer">
                    
                <div className="info-section">
                    <h2>About the Attendance Service</h2>
                    <p>
                        The Attendance Service is a tool designed to help raid leaders and guild members manage attendance for raids. 
                        It allows you to track who attended each raid, what items were reserved, and how scores are calculated.
                    </p>
                    <p className="author">
                    <em>Author: Il Lamaro Pacha</em>
                    </p>
                </div>
            </div>

        </div>
    );
}

export default LoginPage;
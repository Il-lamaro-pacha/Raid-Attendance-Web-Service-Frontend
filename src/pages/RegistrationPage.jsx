import "../css/RegistrationPage.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../hooks/firebaseConfig";

function RegistrationPage() {

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [guildId, setGuildId] = useState("gda");
    const [server, setServer] = useState("chromiecraft");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const validateForm = () => {

        if (!email || !username || !password || !guildId || !server) {
            return "All fields are required";
        }

        if (!email.includes("@")) {
            return "Invalid email format";
        }

        if (username.length < 3) {
            return "Username must be at least 3 characters";
        }

        if (password.length < 6) {
            return "Password must be at least 6 characters";
        }

        return null;
    };

    const startRegistration = async () => {

        try {

            setLoading(true);
            setError(null);

            const validationError = validateForm();

            if (validationError) {
                setError(validationError);
                setLoading(false);
                return;
            }

            // 1. Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const token = await userCredential.user.getIdToken();

            // 2. Chiamata backend FastAPI
            const response = await fetch(
                 `${import.meta.env.VITE_BACKEND_URL}/attendance_service/registration`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email,
                        username,
                        guild_id: guildId,
                        server
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Backend registration failed");
            }

            // 3. Successo → redirect o login
            console.log("User registered successfully");

        } catch (err) {

            console.error(err);
            setError("Registration failed");

        } finally {
            setLoading(false);
            navigate("/")
        }
    };

    return (

        <div className="registration-page">

            <div className="registration-header">
                <h1>Register New Account</h1>
            </div>

            <div className="registration-container">

            <div className="registration-box">

                <h2>Create Account</h2>

                <div className="input-group">
                    <label>Email</label>

                    <input
                        type="email"
                        placeholder="Insert your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Username</label>

                    <input
                        type="text"
                        placeholder="Insert your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Guild ID</label>

                    <select
                        value={guildId}
                        onChange={(e) => setGuildId(e.target.value)}
                    >
                        <option value="gda">gda</option>
                    </select>
                </div>

                <div className="input-group">
                    <label>Game Server</label>

                    <select
                        value={server}
                        onChange={(e) => setServer(e.target.value)}
                    >
                        <option value="chromiecraft">
                            chromiecraft
                        </option>
                    </select>
                </div>

                <div className="input-group">
                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Insert your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    onClick={startRegistration}
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Register"}
                </button>

                {loading && <div className="spinner"></div>}

                {error && (
                    <p className="error-message">
                        {error}
                    </p>
                )}

            </div>

            </div>

        </div>
    );
}

export default RegistrationPage;
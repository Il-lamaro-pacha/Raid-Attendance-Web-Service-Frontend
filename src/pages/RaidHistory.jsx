import "../css/RaidHistory.css";
import { useEffect, useState } from "react";
import { auth } from "../hooks/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

function RaidHistory() {

    const raidNames = {
        nax_10: "Naxxramas 10 Players",
        nax_25: "Naxxramas 25 Players",
        os_10: "Obsidian Sanctum 10 Players",
        os_25: "Obsidian Sanctum 25 Players",
        eoe_10: "Eye of Eternity 10 Players",
        eoe_25: "Eye of Eternity 25 Players",
        voa_10: "Vault of Archavon 10 Players",
        voa_25: "Vault of Archavon 25 Players",
        ulduar_10: "Ulduar 10 Players",
        ulduar_25: "Ulduar 25 Players",
        toc_10: "Trial of the Crusader 10 Players",
        toc_25: "Trial of the Crusader 25 Players",
        tgc_10: "Trial of the Grand Crusader 10 Players",
        tgc_25: "Trial of the Grand Crusader 10 Players",
        icc_10: "Icecrown Citadel 10 Players",
        icc_25: "Icecrown Citadel 25 Players",
        rs_10: "Ruby Sanctum 10 Players",
        rs_25: "Ruby Sanctum 25 Players",
    };

    const navigate = useNavigate();
    const location = useLocation();

    const raidId = location.state?.raidId;
    const type = location.state?.type;

    const [history, setHistory] = useState([]);
    const [authLoading, setAuthLoading] = useState(true);
    const [loading, setLoading] = useState(true);

    // 🔐 AUTH GUARD
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate("/");
            } else {
                setAuthLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // 🔐 TOKEN HELPER
    const getAuthHeaders = async () => {
        const user = auth.currentUser;

        if (!user) {
            navigate("/");
            throw new Error("Not authenticated");
        }

        const token = await user.getIdToken();

        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    };

    // 📡 FETCH HISTORY
    useEffect(() => {
        if (authLoading) return;
        if (!raidId || !type) return;

        const fetchHistory = async () => {
            try {
                const headers = await getAuthHeaders();

                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/attendance_service/history?raid_id=${raidId}&raid_type=${type}`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error("Error fetching history");
                }

                const data = await response.json();
                setHistory(data);

            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [authLoading, raidId, type]);

    // 🔐 LOADING
    if (authLoading || loading) {
        return (
            <div className="loader">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="raid-history-container">

            <div className="header">
                <h1>Raid History</h1>
                <div className="raid-info">
                    <p>{raidNames[raidId] || raidId}</p>
                    <p>Type: {type}</p>
                </div>
            </div>

            <div className="table-container">
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Done By</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {history.history_list?.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    {new Date(item.date).toLocaleString()}
                                </td>

                                <td>
                                    {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                                </td>

                                <td>
                                    <button
                                        className="view-btn"
                                        onClick={() =>
                                            navigate("/history/view", {
                                                state: {
                                                    raidId,
                                                    type,
                                                    date: item.date,
                                                    name: item.name
                                                }
                                            })
                                        }                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

export default RaidHistory;
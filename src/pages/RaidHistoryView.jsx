import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../hooks/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import "../css/RaidHistoryView.css";

function RaidHistoryView() {

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
        toc_25: "Trial of the Crusader 10 Players",
        tgc_10: "Trial of the Grand Crusader 10 Players",
        tgc_25: "Trial of the Grand Crusader 10 Players",
        icc_10: "Icecrown Citadel 10 Players",
        icc_25: "Icecrown Citadel 25 Players",
        rs_10: "Ruby Sanctum 10 Players",
        rs_25: "Ruby Sanctum 25 Players",
    };

    const location = useLocation();
    const navigate = useNavigate();

    const { raidId, type, date, name } = location.state || {};

    const [raidHistory, setRaidHistory] = useState([]);
    const [authLoading, setAuthLoading] = useState(true);
    const [loading, setLoading] = useState(true);

    const [rolling, setRolling] = useState(false);
    const [rolledIndexes, setRolledIndexes] = useState([]);

    const [showConfirm, setShowConfirm] = useState(false);
    const [result, setResult] = useState(null);

    // AUTH
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) navigate("/");
            else setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

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

    // FETCH
    useEffect(() => {
        if (authLoading) return;
        if (!raidId || !type || !date || !name) return;

        const fetchRaidHistory = async () => {
            try {
                const headers = await getAuthHeaders();

                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/attendance_service/history/raid?raid_id=${raidId}&raid_type=${type}`,
                    {
                        method: "POST",
                        headers,
                        body: JSON.stringify({ date, name })
                    }
                );

                const data = await response.json();
                setRaidHistory(data);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRaidHistory();
    }, [authLoading, raidId, type, date, name]);

    // FORMAT
    const format = (v, fallback) => {
        if (v === -1) return fallback;
        if (v === "None") return fallback;
        return v;
    };

    // PAYLOAD (IMPORTANT)
    const buildRollbackPayload = () => {
        return raidHistory.map(r => ({
            item: r.previous_item,
            item_id: r.previous_item_id,
            name: r.name,
            char_class: r.char_class,
            date: r.date,
            score: r.previous_score
        }));
    };

    // ANIMATION
    const animateRollback = async () => {
        setRolling(true);

        for (let i = 0; i < raidHistory.length; i++) {
            await new Promise(res => setTimeout(res, 180));
            setRolledIndexes(prev => [...prev, i]);
        }

        setRolling(false);
    };

    const capitalize = (s) =>
        s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

    const handleRollback = async () => {
        try {
            setShowConfirm(false);

            const headers = await getAuthHeaders();

            const rollbackPayload = buildRollbackPayload();

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/attendance_service/history/raid?raid_id=${raidId}&raid_type=${type}`,
                {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({rollback: buildRollbackPayload()})
                }
            );

            if (!response.ok) throw new Error();

            await animateRollback();

            setResult({ ok: true, msg: "Rollback completed" });

        } catch (e) {
            console.error(e);
            setResult({ ok: false, msg: "Rollback failed" });
        }
    };

    if (authLoading || loading) {
        return (
            <div className="loader">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className={`raid-history-view-container ${rolling ? "rolling" : ""}`}>

            <div className="header">
                <h1>History View</h1>
                <div className="raid-info">
                    <p>{raidNames[raidId] || raidId}</p>
                    <p>Type: {type}</p>
                    <p>{new Date(date).toLocaleString()} - {name}</p>
                </div>
            </div>

            <div className="cards-container">

                {raidHistory.map((row, i) => (
                    <div
                        key={i}
                        className={`history-card ${rolledIndexes.includes(i) ? "rolled" : ""}`}
                    >

                        <div className="card-box left">
                            <div className="card-title">Previous</div>
                            <div className="player">{capitalize(row.name)}</div>
                            <div className="item">{format(row.previous_item, "No Item")}</div>
                            <div className="score">{format(row.previous_score, "No Score")}</div>
                        </div>

                        <div className="arrow-box">
                            <div className="arrow">⇄</div>
                        </div>

                        <div className="card-box right">
                            <div className="card-title">Next</div>
                            <div className="player">{capitalize(row.name)}</div>
                            <div className="item">{format(row.new_item, "No Item")}</div>
                            <div className="score">{format(row.new_score, "No Score")}</div>
                        </div>

                    </div>
                ))}

            </div>

            <div className="actions">
                <button onClick={() => setShowConfirm(true)}>
                    Rollback
                </button>
            </div>

            {/* CONFIRM MODAL */}
            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Confirm rollback</h2>
                        <p>This will revert ALL previous changes</p>
                        <div className="modal-actions">
                            <button onClick={handleRollback}>Confirm</button>
                            <button onClick={() => setShowConfirm(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESULT MODAL */}
            {result && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2 style={{ color: result.ok ? "#00ff88" : "#ff4d4d" }}>
                            {result.ok ? "Success" : "Error"}
                        </h2>
                        <p>{result.msg}</p>
                        <div className="modal-actions">
                            <button onClick={() => setResult(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default RaidHistoryView;
import { useLocation, useNavigate } from "react-router-dom";
import "../css/AttendanceController.css";
import { useEffect, useState } from "react";
import { auth } from "../hooks/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

function AttendanceController() {
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

  const location = useLocation();
  const navigate = useNavigate();

  const type = location.state?.type;
  const raidId = location.state?.raidId;

  const [attendanceData, setAttendanceData] = useState([]);
  const [raidLink, setRaidLink] = useState("");
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const [updateMode, setUpdateMode] = useState(false);
  const [editedScores, setEditedScores] = useState({});

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showPublishResult, setShowPublishResult] = useState(false);
  const [publishedLink, setPublishedLink] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [showPlayerHistoryModal, setShowPlayerHistoryModal] = useState(false);
  const [playerHistoryLoading, setPlayerHistoryLoading] = useState(false);
  const [playerHistoryError, setPlayerHistoryError] = useState("");
  const [playerHistoryData, setPlayerHistoryData] = useState(null);
  const [playerHistoryForName, setPlayerHistoryForName] = useState("");

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

  // ---------------- FETCH ----------------
  useEffect(() => {
    if (authLoading) return;
    if (!raidId || !type) return;

    const fetchAttendance = async () => {
      try {
        const headers = await getAuthHeaders();

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/attendance_service?raid_id=${raidId}&raid_type=${type}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error("Error fetching attendance");
        }

        const data = await response.json();
        setAttendanceData(data);

      } catch (err) {
        console.error("Error fetching attendance:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [authLoading, raidId, type]);

  const handlePlayerNameClick = async (playerName) => {
    if (!playerName || loading || submitting || publishing) return;

    setPlayerHistoryForName(playerName);
    setShowPlayerHistoryModal(true);
    setPlayerHistoryLoading(true);
    setPlayerHistoryError("");
    setPlayerHistoryData(null);

    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        raid_type: String(type),
        raid_id: String(raidId),
        player_name: String(playerName),
      });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/attendance_service/get_player_history?${params.toString()}`,
        { method: "GET", headers }
      );

      let payload;
      const text = await response.text();
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = text;
      }

      if (!response.ok) {
        const msg =
          typeof payload === "object" && payload !== null && "detail" in payload
            ? JSON.stringify(payload.detail)
            : String(payload ?? response.statusText);
        setPlayerHistoryError(msg || "Failed to load player history");
        return;
      }

      setPlayerHistoryData(payload);
    } catch (err) {
      console.error(err);
      setPlayerHistoryError("Network error");
    } finally {
      setPlayerHistoryLoading(false);
    }
  };

  // ---------------- DELETE ----------------
  const toggleRowSelection = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleConfirmDeleteClick = () => {
    if (selectedRows.length === 0) {
      alert("Select at least one row to delete.");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/attendance_service?raid_id=${raidId}&raid_type=${type}`,
        {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            player_names: selectedRows.map(
              (i) => attendanceData[i].name
            ),
          }),
        }
      );

      if (!response.ok) {
        alert("Error deleting attendance");
        return;
      }

      setAttendanceData((prev) =>
        prev.filter((_, i) => !selectedRows.includes(i))
      );

      setShowDeleteConfirm(false);
      setDeleteMode(false);
      setSelectedRows([]);

    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting attendance");
    }
  };

  // ---------------- UPDATE ----------------
  const getScore = (index, defaultScore) => {
    return editedScores[index] !== undefined
      ? editedScores[index]
      : defaultScore;
  };

  const increaseScore = (index, current) => {
    setEditedScores((prev) => ({
      ...prev,
      [index]: current + 1,
    }));
  };

  const decreaseScore = (index, current) => {
    if (current <= 1) return;

    setEditedScores((prev) => ({
      ...prev,
      [index]: current - 1,
    }));
  };

  const handleSaveUpdate = async () => {
    const updates = Object.entries(editedScores).map(
      ([index, newScore]) => ({
        name: attendanceData[index].name,
        date: attendanceData[index].date,
        char_class: attendanceData[index].char_class,
        item_id: attendanceData[index].item_id,
        item: attendanceData[index].item,
        score: newScore,
      })
    );

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/attendance_service?raid_id=${raidId}&raid_type=${type}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ updates }),
        }
      );

      if (!response.ok) {
        alert("Error updating attendance");
        return;
      }

      setAttendanceData((prev) =>
        prev.map((row, index) =>
          editedScores[index] !== undefined
            ? { ...row, score: editedScores[index] }
            : row
        )
      );

      setUpdateMode(false);
      setEditedScores({});

    } catch (err) {
      console.error("Update error:", err);
      alert("Error updating attendance");
    }
  };

  // ---------------- PUBLISH ----------------
  const handlePublishList = async () => {
    if (!attendanceData.length) {
      alert("Attendance list is empty.");
      return;
    }

    try {
      setPublishing(true);
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/attendance_service/publish_list?raid_type=${type}&raid_id=${raidId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            attendance_list: attendanceData,
          }),
        }
      );

      if (!response.ok) {
        alert("Error publishing attendance list");
        return;
      }

      const data = await response.json();
      const link =
        typeof data === "string"
          ? data
          : data?.link || data?.url || data?.published_link || "";

      setShowPublishConfirm(false);
      setPublishedLink(link);
      setShowPublishResult(true);
    } catch (err) {
      console.error("Publish error:", err);
      alert("Error publishing attendance list");
    } finally {
      setPublishing(false);
    }
  };

  // ---------------- ADD ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!raidLink) {
      alert("Insert a valid link.");
      return;
    }

    try {
      setSubmitting(true);

      const headers = await getAuthHeaders();

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/softres_service/fetch_attendance`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ link: raidLink }),
        }
      );

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const validationToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem("attendance_validation_token", validationToken);
        setShowAttendanceModal(false);
        navigate("/attendance_validation", {
          state: { data, type, raidId, raidLink, validationToken },
        });
      } else {
        alert("Error: No attendance data found.");
      }

    } catch (err) {
      console.error("Error:", err);
      alert("Error during request.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🔐 LOADING AUTH
  if (authLoading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="attendance-container">

      <div className="header">
        <h1>Attendance List</h1>
        <div className="attendance-header-right">
          <div className="raid-info">
            <p>{raidNames[raidId] || raidId}</p>
            <p>Type: {type}</p>
          </div>
          <button
            className="publish-button"
            onClick={() => setShowPublishConfirm(true)}
            disabled={publishing || loading || !attendanceData.length}
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loader">
          <div className="spinner"></div>
        </div>
      )}

      {/* ===== REST OF YOUR UI UNCHANGED ===== */}

      {/* ADD MODAL */}
      {showAttendanceModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAttendanceModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Insert Softres Raid Link</h2>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={raidLink}
                onChange={(e) => setRaidLink(e.target.value)}
                placeholder="https://softres.it/..."
              />

              <div className="modal-actions">
                <button type="submit" disabled={submitting}>
                  {submitting ? "Loading..." : "Ok"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete {selectedRows.length} entries?
            </p>

            <div className="modal-actions">
              <button onClick={handleDeleteConfirm}>
                Yes, Delete
              </button>

              <button onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublishConfirm && (
        <div
          className="modal-overlay"
          onClick={() => !publishing && setShowPublishConfirm(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Publish</h2>
            <p>Do you want to publish this attendance list?</p>

            <div className="modal-actions">
              <button onClick={handlePublishList} disabled={publishing}>
                {publishing ? "Publishing..." : "Ok"}
              </button>
              <button
                onClick={() => setShowPublishConfirm(false)}
                disabled={publishing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublishResult && (
        <div className="modal-overlay" onClick={() => setShowPublishResult(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Publish Completed</h2>
            <p>Attendance list published successfully.</p>
            {publishedLink ? (
              <p className="publish-link">
                <a href={publishedLink} target="_blank" rel="noreferrer">
                  {publishedLink}
                </a>
              </p>
            ) : (
              <p>Link not returned by backend.</p>
            )}
            <div className="modal-actions">
              <button onClick={() => setShowPublishResult(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

  {showPlayerHistoryModal && (
    <div
      className="modal-overlay modal-overlay-history"
      onClick={() => setShowPlayerHistoryModal(false)}
    >
      <div
        className="modal player-history-modal"
        onClick={(e) => e.stopPropagation()}
      >

        <h2>
          {playerHistoryForName.charAt(0).toUpperCase() +
            playerHistoryForName.slice(1)}
        </h2>

        {playerHistoryLoading && (
          <div className="player-history-loading">
            <div className="spinner"></div>
          </div>
        )}

        {!playerHistoryLoading && playerHistoryError && (
          <p className="player-history-error">
            {playerHistoryError}
          </p>
        )}

        {!playerHistoryLoading &&
          !playerHistoryError &&
          playerHistoryData !== null && (
            <div className="player-history-content">

              <div className="player-history-summary">
                <span>Total participations</span>

                <strong>
                  {playerHistoryData.total_attendances}
                </strong>
              </div>

              <div className="player-history-list">

                {playerHistoryData.details.length === 0 ? (
                  <p className="player-history-empty">
                    No attendance history found.
                  </p>
                ) : (
                  playerHistoryData.details.map((entry, index) => {

                    const date = new Date(
                      Number(entry.timestamp) * 1000
                    );

                    return (
                      <div
                        key={`${entry.timestamp}-${index}`}
                        className="player-history-card"
                      >

                        <div className="player-history-card-header">
                          <span className="player-history-date">
                            {date.toLocaleDateString()}{" "}
                            {date.toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="player-history-item">
                          <span>Reserved item</span>

                          <strong>
                            {entry.item || "None"}
                          </strong>
                        </div>

                      </div>
                    );
                  })
                )}

              </div>

            </div>
          )}

        {!playerHistoryLoading &&
          !playerHistoryError &&
          playerHistoryData === null && (
            <p className="player-history-empty">
              No data
            </p>
          )}

        <div className="modal-actions player-history-actions">
          <button
            type="button"
            onClick={() => setShowPlayerHistoryModal(false)}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )}

      {/* TABLE */}
      <div className="table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              {deleteMode && <th></th>}
              <th>Player</th>
              <th>Item</th>
              <th>Score</th>
            </tr>
          </thead>

          <tbody>
            {attendanceData.map((row, index) => {
              const currentScore = getScore(index, row.score);

              return (
                <tr key={index}>
                  {deleteMode && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(index)}
                        onChange={() => toggleRowSelection(index)}
                      />
                    </td>
                  )}

                  <td>
                    <button
                      type="button"
                      className="player-name-button"
                      onClick={() => handlePlayerNameClick(row.name)}
                      disabled={loading || submitting || publishing}
                    >
                      {row.name.charAt(0).toUpperCase() +
                        row.name.slice(1)}
                    </button>
                  </td>

                  <td>{row.item}</td>

                  <td>
                    {updateMode ? (
                      <div className="stepper">
                        <button
                          onClick={() =>
                            decreaseScore(index, currentScore)
                          }
                          disabled={currentScore <= 1}
                        >
                          -
                        </button>

                        <span className="score-value">
                          {currentScore}
                        </span>

                        <button
                          onClick={() =>
                            increaseScore(index, currentScore)
                          }
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      row.score
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="actions">
        {!deleteMode && !updateMode ? (
          <>
            <button onClick={() => setShowAttendanceModal(true)}>
              Add New Attendance
            </button>

            <button onClick={() => setDeleteMode(true)}>
              Delete Attendance
            </button>

            <button onClick={() => setUpdateMode(true)}>
              Update Attendance
            </button>

            <button onClick={() => navigate("/history", { state: { raidId, type } })}>View History</button>
          </>
        ) : deleteMode ? (
          <>
            <button onClick={handleConfirmDeleteClick}>
              Confirm Delete
            </button>

            <button
              onClick={() => {
                setDeleteMode(false);
                setSelectedRows([]);
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={handleSaveUpdate}>
              Save Update
            </button>

            <button
              onClick={() => {
                setUpdateMode(false);
                setEditedScores({});
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>

    </div>
  );
}

export default AttendanceController;
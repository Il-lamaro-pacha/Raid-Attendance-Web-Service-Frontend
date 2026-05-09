import "../css/AttendanceValidation.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../hooks/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

function AttendanceValidation() {
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
  const raidLink = location.state?.raidLink;
  const newAttendanceData = location.state?.data;
  const validationToken = location.state?.validationToken;

  const [previewData, setPreviewData] = useState([]);
  const [validationState, setValidationState] = useState({});

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvCopied, setCsvCopied] = useState(false);

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

  useEffect(() => {
    if (authLoading) return;

    const storedToken = sessionStorage.getItem("attendance_validation_token");
    const hasValidInput =
      !!raidId &&
      !!type &&
      Array.isArray(newAttendanceData) &&
      newAttendanceData.length > 0 &&
      !!validationToken &&
      storedToken === validationToken;

    if (!hasValidInput) {
      navigate("/attendance_sheet", {
        replace: true,
        state: { type, raidId },
      });
    }
  }, [authLoading, raidId, type, newAttendanceData, validationToken, navigate]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("attendance_validation_token");
    };
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

  // ---------------- FETCH PREVIEW ----------------
  useEffect(() => {
    if (authLoading) return;

    const obtainAttendancePreview = async () => {
      try {
        const headers = await getAuthHeaders();

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/attendance_service/preview?raid_id=${raidId}&raid_type=${type}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ newAttendances: newAttendanceData }),
          }
        );

        const data = await response.json();
        setPreviewData(data);

        const initialState = {};
        data.forEach((_, index) => {
          initialState[index] = "accepted";
        });

        setValidationState(initialState);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (raidId && type && newAttendanceData) {
      obtainAttendancePreview();
    }
  }, [authLoading]);

  const handleToggle = (index, value) => {
    setValidationState((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const parseCsvLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    result.push(current);
    return result;
  };

  const toCsvCell = (value) => {
    const cell = value === null || value === undefined ? "" : String(value);
    return `"${cell.replace(/"/g, "\"\"")}"`;
  };

  const updateCsvPlusColumn = (rawCsvText) => {
    const lines = rawCsvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return "";

    const headerCells = parseCsvLine(lines[0]);
    const plusIndex = headerCells.findIndex((cell) => cell.trim() === "Plus");
    const nameIndex = headerCells.findIndex((cell) => cell.trim() === "Name");

    if (plusIndex === -1 || nameIndex === -1) {
      return rawCsvText;
    }

    const scoreByName = new Map();
    previewData.forEach((row) => {
      const name = String(row.name ?? "").trim().toLowerCase();
      if (name) {
        scoreByName.set(name, row.current_score ?? "");
      }
    });

    const updatedRows = [headerCells.map(toCsvCell).join(",")];

    for (let i = 1; i < lines.length; i += 1) {
      const rowCells = parseCsvLine(lines[i]);
      const normalizedName = String(rowCells[nameIndex] ?? "").trim().toLowerCase();

      if (normalizedName && scoreByName.has(normalizedName)) {
        rowCells[plusIndex] = scoreByName.get(normalizedName);
      }

      updatedRows.push(rowCells.map(toCsvCell).join(","));
    }

    return updatedRows.join("\n");
  };

  const buildCsvText = async () => {
    const soft_reserve_id = raidLink?.split("/").filter(Boolean).pop() ?? "";
    if (!soft_reserve_id) {
      throw new Error("Missing SoftRes link");
    }

    const response = await fetch(
      `https://softres.it/api/payload/${soft_reserve_id}/reserves`,
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error("Unable to fetch SoftRes CSV");
    }

    const rawCsvText = await response.text();
    return updateCsvPlusColumn(rawCsvText);
  };

  useEffect(() => {
    if (!showCsvModal) return;

    const loadCsv = async () => {
      try {
        setCsvLoading(true);
        const updatedCsvText = await buildCsvText();
        setCsvText(updatedCsvText);
      } catch (error) {
        console.error(error);
        setCsvText("Error loading CSV preview");
      } finally {
        setCsvLoading(false);
      }
    };

    loadCsv();
  }, [showCsvModal, raidLink, previewData]);

  const handleCopyCsv = async () => {
    if (!csvText || csvLoading || csvText === "Error loading CSV preview") return;

    try {
      await navigator.clipboard.writeText(csvText);
      setCsvCopied(true);
      setTimeout(() => setCsvCopied(false), 1500);
    } catch (error) {
      console.error(error);
      alert("Unable to copy CSV");
    }
  };

  // ---------------- ASSIGN ----------------
  const handleAssign = async () => {
    setSubmitting(true);

    const acceptedAttendances = previewData
      .filter((_, index) => validationState[index] === "accepted")
      .map((row) => ({
        name: row.name,
        date: row.date,
        char_class: row.char_class,
        item_id: row.next_item_id,
      }));

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/attendance_service?raid_id=${raidId}&raid_type=${type}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            attendance_list: acceptedAttendances,
          }),
        }
      );

      if (!response.ok) {
        alert("Error assigning attendance");
        return;
      }

      sessionStorage.removeItem("attendance_validation_token");
      navigate("/attendance_sheet", {
        replace: true,
        state: { type, raidId },
      });

    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // 🔐 AUTH LOADING SCREEN
  if (authLoading) {
    return (
      <div className="modal-overlay">
        <div className="loader">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-validation-container">

      {(loading || submitting) && (
        <div className="modal-overlay">
          <div className="loader">
            <div className="spinner"></div>
          </div>
        </div>
      )}

      <div className="header">
        <h1>Validate the New Attendance</h1>
        <p>{raidNames[raidId] || raidId}</p>
        <p>Type: {type}</p>
        <button
          type="button"
          className="header-csv-button"
          disabled={submitting || loading || previewData.length === 0}
          onClick={() => setShowCsvModal(true)}
        >
          .csv
        </button>
      </div>

      <div className="table-container">
        <table className="validation-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Date</th>
              <th>Current Item</th>
              <th>Current Score</th>
              <th>Next Item</th>
              <th>Next Score</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {previewData?.map((row, index) => (
              <tr key={index}>
                <td>{row.name}</td>
                <td>{row.date}</td>

                <td>{row.current_item ?? "No Item"}</td>
                <td>{row.current_score ?? "No Score"}</td>

                <td>{row.next_item ?? "No Item"}</td>
                <td>{row.next_score ?? "No Score"}</td>

                <td className="action-buttons">
                  <button
                    className={`validate-button ${
                      validationState[index] === "accepted" ? "active" : ""
                    }`}
                    onClick={() => handleToggle(index, "accepted")}
                  >
                    Accept
                  </button>

                  <button
                    className={`reject-button ${
                      validationState[index] === "rejected" ? "active" : ""
                    }`}
                    onClick={() => handleToggle(index, "rejected")}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button
          className="confirm-attendance"
          disabled={submitting}
          onClick={handleAssign}
        >
          Assign
        </button>
      </div>

      {showCsvModal && (
        <div className="modal-overlay" onClick={() => setShowCsvModal(false)}>
          <div className="modal csv-modal" onClick={(e) => e.stopPropagation()}>
            <h2>CSV Preview</h2>
            <textarea
              readOnly
              value={csvLoading ? "Loading CSV..." : csvText}
              className="csv-preview"
            />
            <div className="modal-actions">
              <button
                type="button"
                className="copy-csv-button"
                onClick={handleCopyCsv}
                disabled={csvLoading || !csvText || csvText === "Error loading CSV preview"}
                title={csvCopied ? "Copied!" : "Copy CSV"}
                aria-label={csvCopied ? "Copied" : "Copy CSV"}
              >
                {csvCopied ? "✓" : "⧉"}
              </button>
              <button onClick={() => setShowCsvModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AttendanceValidation;
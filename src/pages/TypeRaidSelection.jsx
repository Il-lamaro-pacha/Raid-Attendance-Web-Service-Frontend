import "../css/TypeRaidSelection.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RaidTypeCard from "../components/RaidTypeCard";
import { auth } from "../hooks/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

function TypeRaidSelection() {

  const [raidTypes, setRaidTypes] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true); // API loading
  const [authLoading, setAuthLoading] = useState(true); // 🔥 Firebase loading
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [newRaid, setNewRaid] = useState("");
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  // 🔥 Auth guard (fondamentale)
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

  // 🔥 helper headers
  const getAuthHeaders = async () => {
    const user = auth.currentUser;

    if (!user) {
      navigate("/");
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // 🔥 fetch dati SOLO dopo auth pronta
  useEffect(() => {
    if (authLoading) return;

    const fetchRaidTypes = async () => {
      try {
        const headers = await getAuthHeaders();

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/attendance_service/raid_types`,
          { headers }
        );

        if (response.status === 401) {
          navigate("/");
          return;
        }

        if (!response.ok) {
          throw new Error("Errore nella risposta del server");
        }

        const data = await response.json();
        setRaidTypes(data);

      } catch (err) {
        console.error("Errore:", err);
        setError("Error during fetching raid types. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRaidTypes();
  }, [authLoading]);

  const handleClick = (rt) => {
    setSelected(rt);
    navigate("/raid_selection", { state: { type: rt } });
  };

  const handleCreate = async () => {
    if (!newRaid.trim()) return;

    try {
      setCreating(true);

      const headers = await getAuthHeaders();

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/attendance_service/list?raid_type=${newRaid}`,
        {
          method: "POST",
          headers,
        }
      );

      if (response.status === 401) {
        navigate("/");
        return;
      }

      if (!response.ok) {
        throw new Error("Errore nella creazione");
      }

      setRaidTypes((prev) => [...prev, newRaid]);

      setNewRaid("");
      setShowModal(false);

    } catch (err) {
      console.error(err);
      setError("Error creating raid type");
    } finally {
      setCreating(false);
    }
  };

  // 🔥 BLOCCA UI finché Firebase non è pronto
  if (authLoading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="type-raid-selection">
      <div className="header">
        <h1>Choose the Raid Type</h1>
      </div>

      {loading && (
        <div className="loader">
          <div className="spinner"></div>
        </div>
      )}

      {error && !loading && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="vertical-list">
          {raidTypes.map((rt) => (
            <RaidTypeCard
              key={rt}
              id={rt}
              name={rt}
              selected={selected === rt}
              onClick={() => handleClick(rt)}
            />
          ))}

          <div
            className="raid-type-card add-card"
            onClick={() => setShowModal(true)}
          >
            <h2>+ Add New Type</h2>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Raid Type</h2>

            <input
              type="text"
              placeholder="Raid type..."
              value={newRaid}
              onChange={(e) => setNewRaid(e.target.value)}
              disabled={creating}
            />

            <div className="modal-actions">
              <button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button onClick={() => setShowModal(false)} disabled={creating}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TypeRaidSelection;
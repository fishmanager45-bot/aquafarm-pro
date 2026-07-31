import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ponds, setPonds] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPondForm, setShowPondForm] = useState(false);
const [savingPond, setSavingPond] = useState(false);
const [editingPondId, setEditingPondId] = useState(null);
const [newPond, setNewPond] = useState({
  name: "",
  species: "",
  fish_count: "",
  average_weight_g: "",
  daily_feed_kg: "",
  status: "Aktiv",
});

  const loadPonds = async (accessToken) => {
    try {
      const response = await fetch(`${API_URL}/ponds`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error("Hovuz məlumatları alınmadı");
      }

      const data = await response.json();
      setPonds(data);
    } catch {
      setError("Backend ilə əlaqə yaratmaq mümkün olmadı");
    }
  };

  useEffect(() => {
    if (token) {
      loadPonds(token);
    }
  }, [token]);
const openEditPond = (pond) => {
  setEditingPondId(pond.id);

  setNewPond({
    name: pond.name || "",
    species: pond.species || "",
    fish_count: pond.fish_count ?? "",
    average_weight_g: pond.average_weight_g ?? "",
    daily_feed_kg: pond.daily_feed_kg ?? "",
    status: pond.status || "Aktiv",
  });

  setError("");
  setShowPondForm(true);
};
  const createPond = async (event) => {
  event.preventDefault();
  setSavingPond(true);
  setError("");

  try {
    const url = editingPondId
  ? `${API_URL}/ponds/${editingPondId}`
  : `${API_URL}/ponds`;

const response = await fetch(url, {
  method: editingPondId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newPond.name,
        species: newPond.species || null,
        fish_count: Number(newPond.fish_count || 0),
        average_weight_g: Number(newPond.average_weight_g || 0),
        daily_feed_kg: Number(newPond.daily_feed_kg || 0),
        status: newPond.status,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Hovuz əlavə edilmədi");
    }

    await loadPonds(token);

    setNewPond({
      name: "",
      species: "",
      fish_count: "",
      average_weight_g: "",
      daily_feed_kg: "",
      status: "Aktiv",
    });

    setEditingPondId(null);
    setShowPondForm(false);
  } catch (err) {
    setError(err.message);
  } finally {
    setSavingPond(false);
  }
};
  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("E-poçt və ya şifrə yanlışdır");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setPonds([]);
  };

  const totalFish = ponds.reduce(
    (sum, pond) => sum + Number(pond.fish_count || 0),
    0
  );

  const totalBiomass = ponds.reduce(
    (sum, pond) =>
      sum +
      (Number(pond.fish_count || 0) *
        Number(pond.average_weight_g || 0)) /
        1000,
    0
  );

  const totalFeed = ponds.reduce(
    (sum, pond) => sum + Number(pond.daily_feed_kg || 0),
    0
  );

  if (!token) {
    return (
      <div className="login-page">
        <form className="login-box" onSubmit={login}>
          <div className="login-logo">🐟</div>
          <h1>AquaFarm Pro</h1>
          <p>İdarəetmə sisteminə daxil olun</p>

          <label>E-poçt</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-poçt ünvanınız"
            required
          />

          <label>Şifrə</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Şifrəniz"
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Giriş edilir..." : "Daxil ol"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span>🐟</span>
          <div>
            <h2>AquaFarm Pro</h2>
            <p>İdarəetmə sistemi</p>
          </div>
        </div>

        <nav>
          <button className="active">📊 İdarəetmə paneli</button>
          <button>🌊 Hovuzlar</button>
          <button>🐟 Balıq partiyaları</button>
          <button>🍽️ Yemləmə</button>
          <button>⚕️ Sağlamlıq</button>
          <button>📋 Hesabatlar</button>
          <button className="logout-button" onClick={logout}>
            🚪 Çıxış
          </button>
        </nav>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>İdarəetmə paneli</h1>
            <p>Təsərrüfatın real vaxt üzrə ümumi vəziyyəti</p>
          </div>
       <button
  className="add-button"
  onClick={() => {
  setEditingPondId(null);
  setNewPond({
    name: "",
    species: "",
    fish_count: "",
    average_weight_g: "",
    daily_feed_kg: "",
    status: "Aktiv",
  });
  setError("");
  setShowPondForm(true);
}}
>
  + Yeni hovuz
</button>
        </header>
{showPondForm && (
  <div className="modal-overlay">
    <form className="pond-form" onSubmit={createPond}>
      <div className="form-header">
        <div>
          <h2>{editingPondId ? "Hovuzu redaktə et" : "Yeni hovuz əlavə et"}</h2>
          <p>Hovuzun ilkin məlumatlarını daxil edin</p>
        </div>

        <button
          type="button"
          className="close-button"
          onClick={() => setShowPondForm(false)}
        >
          ×
        </button>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label>Hovuzun adı *</label>
          <input
            value={newPond.name}
            onChange={(event) =>
              setNewPond({ ...newPond, name: event.target.value })
            }
            placeholder="Məsələn: Hovuz 2"
            required
          />
        </div>

        <div className="form-field">
          <label>Balıq növü</label>
          <input
            value={newPond.species}
            onChange={(event) =>
              setNewPond({ ...newPond, species: event.target.value })
            }
            placeholder="Məsələn: Rus nərəsi"
          />
        </div>

        <div className="form-field">
          <label>Balıq sayı</label>
          <input
            type="number"
            min="0"
            value={newPond.fish_count}
            onChange={(event) =>
              setNewPond({ ...newPond, fish_count: event.target.value })
            }
            placeholder="0"
          />
        </div>

        <div className="form-field">
          <label>Orta çəki (qram)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={newPond.average_weight_g}
            onChange={(event) =>
              setNewPond({
                ...newPond,
                average_weight_g: event.target.value,
              })
            }
            placeholder="0"
          />
        </div>

        <div className="form-field">
          <label>Gündəlik yem (kq)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={newPond.daily_feed_kg}
            onChange={(event) =>
              setNewPond({
                ...newPond,
                daily_feed_kg: event.target.value,
              })
            }
            placeholder="0"
          />
        </div>

        <div className="form-field">
          <label>Status</label>
          <select
            value={newPond.status}
            onChange={(event) =>
              setNewPond({ ...newPond, status: event.target.value })
            }
          >
            <option value="Aktiv">Aktiv</option>
            <option value="Boş">Boş</option>
            <option value="Təmirdə">Təmirdə</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={() => setShowPondForm(false)}
        >
          Ləğv et
        </button>

        <button
          type="submit"
          className="save-button"
          disabled={savingPond}
        >
          {savingPond
  ? "Yadda saxlanılır..."
  : editingPondId
    ? "Dəyişiklikləri yadda saxla"
    : "Hovuzu yadda saxla"}
        </button>
      </div>
    </form>
  </div>
)}
        {error && <div className="dashboard-error">{error}</div>}

        <section className="cards">
          <div className="card">
            <span className="icon blue">🌊</span>
            <div>
              <p>Ümumi hovuz</p>
              <h2>{ponds.length}</h2>
            </div>
          </div>

          <div className="card">
            <span className="icon green">🐟</span>
            <div>
              <p>Balıq sayı</p>
              <h2>{totalFish.toLocaleString("az-AZ")}</h2>
            </div>
          </div>

          <div className="card">
            <span className="icon orange">⚖️</span>
            <div>
              <p>Ümumi biokütlə</p>
              <h2>{totalBiomass.toFixed(1)} kq</h2>
            </div>
          </div>

          <div className="card">
            <span className="icon purple">🍽️</span>
            <div>
              <p>Gündəlik yem</p>
              <h2>{totalFeed.toFixed(1)} kq</h2>
            </div>
          </div>
        </section>

        <section className="table-section">
          <div className="section-title">
            <div>
              <h2>Hovuzların vəziyyəti</h2>
              <p>PostgreSQL bazasındakı hovuz məlumatları</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Hovuz</th>
                <th>Növ</th>
                <th>Balıq sayı</th>
                <th>Orta çəki</th>
                <th>Biokütlə</th>
                <th>Status</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>

            <tbody>
              {ponds.map((pond) => {
                const biomass =
                  (Number(pond.fish_count || 0) *
                    Number(pond.average_weight_g || 0)) /
                  1000;

                return (
                  <tr key={pond.id}>
                    <td><strong>{pond.name}</strong></td>
                    <td>{pond.species || "—"}</td>
                    <td>{Number(pond.fish_count || 0).toLocaleString("az-AZ")}</td>
                    <td>{Number(pond.average_weight_g || 0)} q</td>
                    <td>{biomass.toFixed(1)} kq</td>
                    <td><span className="status">{pond.status}</span></td>
                    <td>
  <button
    className="edit-button"
    onClick={() => openEditPond(pond)}
  >
    Redaktə et
  </button>
</td>
                  </tr>
                );
              })}

              {ponds.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-row">
                    Hovuz məlumatı yoxdur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default App;
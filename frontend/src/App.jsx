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
          <button className="add-button">+ Yeni hovuz</button>
        </header>

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
                  </tr>
                );
              })}

              {ponds.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-row">
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
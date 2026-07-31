import { useEffect, useState } from "react";
import "./App.css";

// AquaFarm Pro ölüm modulu: növ, doğum ili, avtomatik yaş və cins.

const API_URL = "http://127.0.0.1:8000";

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 10);
};

const emptyPond = () => ({
  name: "",
  unit_type: "Hovuz",
  area_m2: "",
  species: "",
  fish_count: "",
  average_weight_g: "",
  daily_feed_kg: "",
  status: "Aktiv",
});

const emptyMortality = () => ({
  pond_id: "",
  record_date: getToday(),
  dead_count: "",
  average_weight_g: "",
  species: "",
  birth_year: "",
  sex: "Naməlum",
  reason: "",
  notes: "",
});

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ponds, setPonds] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("Hamısı");

  const [showPondForm, setShowPondForm] = useState(false);
  const [savingPond, setSavingPond] = useState(false);
  const [editingPondId, setEditingPondId] = useState(null);
  const [newPond, setNewPond] = useState(emptyPond());

  const [mortalityRecords, setMortalityRecords] = useState([]);
  const [mortalitySummary, setMortalitySummary] = useState([]);
  const [summaryPeriod, setSummaryPeriod] = useState("daily");
  const [savingMortality, setSavingMortality] = useState(false);
  const [editingMortalityId, setEditingMortalityId] = useState(null);
  const [mortalityForm, setMortalityForm] = useState(emptyMortality());

  const authorizedFetch = (url, options = {}) =>
    fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setPonds([]);
    setMortalityRecords([]);
    setMortalitySummary([]);
  };

  const loadPonds = async (accessToken = token) => {
    try {
      const response = await fetch(`${API_URL}/ponds`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }
      if (!response.ok) throw new Error("Hovuz məlumatları alınmadı");
      setPonds(await response.json());
    } catch (err) {
      setError(err.message || "Backend ilə əlaqə yaratmaq mümkün olmadı");
    }
  };

  const loadMortality = async () => {
    try {
      const response = await authorizedFetch(`${API_URL}/mortality`);
      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }
      if (!response.ok) throw new Error("Ölüm qeydləri alınmadı");
      setMortalityRecords(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const loadMortalitySummary = async (period = summaryPeriod) => {
    try {
      const response = await authorizedFetch(
        `${API_URL}/mortality/summary?period=${period}`
      );
      if (!response.ok) throw new Error("Ölüm hesabatı alınmadı");
      setMortalitySummary(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token) loadPonds(token);
  }, [token]);

  useEffect(() => {
    if (token && activeView === "Ölüm") {
      loadMortality();
      loadMortalitySummary(summaryPeriod);
    }
  }, [token, activeView, summaryPeriod]);

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error("E-poçt və ya şifrə yanlışdır");
      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openNewPond = () => {
    setEditingPondId(null);
    setNewPond(emptyPond());
    setError("");
    setShowPondForm(true);
  };

  const openEditPond = (pond) => {
    setEditingPondId(pond.id);
    setNewPond({
      name: pond.name || "",
      unit_type: pond.unit_type || "Hovuz",
      area_m2: pond.area_m2 ?? "",
      species: pond.species || "",
      fish_count: pond.fish_count ?? "",
      average_weight_g: pond.average_weight_g ?? "",
      daily_feed_kg: pond.daily_feed_kg ?? "",
      status: pond.status || "Aktiv",
    });
    setError("");
    setShowPondForm(true);
  };

  const savePond = async (event) => {
    event.preventDefault();
    setSavingPond(true);
    setError("");
    try {
      const response = await authorizedFetch(
        editingPondId ? `${API_URL}/ponds/${editingPondId}` : `${API_URL}/ponds`,
        {
          method: editingPondId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newPond.name,
            unit_type: newPond.unit_type,
            area_m2: Number(newPond.area_m2 || 0),
            species: newPond.species || null,
            fish_count: Number(newPond.fish_count || 0),
            average_weight_g: Number(newPond.average_weight_g || 0),
            daily_feed_kg: Number(newPond.daily_feed_kg || 0),
            status: newPond.status,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Vahid yadda saxlanmadı");
      }
      await loadPonds();
      setShowPondForm(false);
      setEditingPondId(null);
      setNewPond(emptyPond());
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPond(false);
    }
  };

  const saveMortality = async (event) => {
    event.preventDefault();
    setSavingMortality(true);
    setError("");
    try {
      const response = await authorizedFetch(
        editingMortalityId
          ? `${API_URL}/mortality/${editingMortalityId}`
          : `${API_URL}/mortality`,
        {
          method: editingMortalityId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pond_id: Number(mortalityForm.pond_id),
            record_date: mortalityForm.record_date,
            dead_count: Number(mortalityForm.dead_count),
            average_weight_g: Number(mortalityForm.average_weight_g || 0),
            species: mortalityForm.species || null,
            birth_year: mortalityForm.birth_year
              ? Number(mortalityForm.birth_year)
              : null,
            sex: mortalityForm.sex || null,
            reason: mortalityForm.reason || null,
            notes: mortalityForm.notes || null,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Ölüm qeydi yadda saxlanmadı");
      }
      setMortalityForm(emptyMortality());
      setEditingMortalityId(null);
      await loadMortality();
      await loadMortalitySummary(summaryPeriod);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMortality(false);
    }
  };

  const editMortality = (record) => {
    setEditingMortalityId(record.id);
    setMortalityForm({
      pond_id: String(record.pond_id),
      record_date: record.record_date,
      dead_count: String(record.dead_count),
      average_weight_g: String(record.average_weight_g),
      species: record.species || "",
      birth_year: record.birth_year ? String(record.birth_year) : "",
      sex: record.sex || "Naməlum",
      reason: record.reason || "",
      notes: record.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteMortality = async (recordId) => {
    if (!window.confirm("Bu ölüm qeydini silmək istəyirsiniz?")) return;
    try {
      const response = await authorizedFetch(`${API_URL}/mortality/${recordId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Ölüm qeydi silinmədi");
      await loadMortality();
      await loadMortalitySummary(summaryPeriod);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredPonds =
    activeView === "Hamısı" || activeView === "Ölüm"
      ? ponds
      : ponds.filter((pond) => (pond.unit_type || "Hovuz") === activeView);

  const totalFish = filteredPonds.reduce(
    (sum, pond) => sum + Number(pond.fish_count || 0),
    0
  );
  const totalBiomass = filteredPonds.reduce(
    (sum, pond) =>
      sum +
      (Number(pond.fish_count || 0) * Number(pond.average_weight_g || 0)) / 1000,
    0
  );
  const totalFeed = filteredPonds.reduce(
    (sum, pond) => sum + Number(pond.daily_feed_kg || 0),
    0
  );
  const mortalityTotal = mortalitySummary.reduce(
    (sum, item) => sum + Number(item.total_dead_count || 0),
    0
  );
  const mortalityBiomassTotal = mortalitySummary.reduce(
    (sum, item) => sum + Number(item.total_biomass_kg || 0),
    0
  );

  const pondName = (pondId) =>
    ponds.find((pond) => pond.id === pondId)?.name || `Vahid ${pondId}`;

  if (!token) {
    return (
      <div className="login-page">
        <form className="login-box" onSubmit={login}>
          <div className="login-logo">🐟</div>
          <h1>AquaFarm Pro</h1>
          <p>İdarəetmə sisteminə daxil olun</p>
          <label>E-poçt</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-poçt ünvanınız" required />
          <label>Şifrə</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifrəniz" required />
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
          <div><h2>AquaFarm Pro</h2><p>İdarəetmə sistemi</p></div>
        </div>
        <nav>
          <button className={activeView === "Hamısı" ? "active" : ""} onClick={() => setActiveView("Hamısı")}>📊 İdarəetmə paneli</button>
          <button className={activeView === "Hovuz" ? "active" : ""} onClick={() => setActiveView("Hovuz")}>🌊 Hovuzlar</button>
          <button className={activeView === "Nohur" ? "active" : ""} onClick={() => setActiveView("Nohur")}>🏞️ Nohurlar</button>
          <button className={activeView === "Qəfəs" ? "active" : ""} onClick={() => setActiveView("Qəfəs")}>🧺 Qəfəslər</button>
          <button>🐟 Balıq partiyaları</button>
          <button>🤲 Yemləmə</button>
          <button className={activeView === "Ölüm" ? "active" : ""} onClick={() => setActiveView("Ölüm")}>⚠️ Ölüm</button>
          <button>⚕️ Sağlamlıq</button>
          <button>📋 Hesabatlar</button>
          <button className="logout-button" onClick={logout}>🚪 Çıxış</button>
        </nav>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>{activeView === "Ölüm" ? "Ölüm qeydiyyatı" : "İdarəetmə paneli"}</h1>
            <p>{activeView === "Ölüm" ? "Gündəlik ölüm qeydləri və ümumi hesabat" : "Təsərrüfatın real vaxt üzrə ümumi vəziyyəti"}</p>
          </div>
          {activeView !== "Ölüm" && <button className="add-button" onClick={openNewPond}>+ Yeni vahid</button>}
        </header>

        {error && <div className="dashboard-error">{error}</div>}

        {activeView === "Ölüm" ? (
          <>
            <section className="table-section mortality-form-section">
              <div className="section-title">
                <div>
                  <h2>{editingMortalityId ? "Ölüm qeydini redaktə et" : "Yeni ölüm qeydi"}</h2>
                  <p>Tarix avtomatik olaraq bu günə təyin edilir</p>
                </div>
              </div>
              <form className="mortality-form" onSubmit={saveMortality}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Tarix *</label>
                    <input type="date" value={mortalityForm.record_date} onChange={(e) => setMortalityForm({ ...mortalityForm, record_date: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label>Hovuz / nohur / qəfəs *</label>
                    <select value={mortalityForm.pond_id} onChange={(e) => {
                      const selectedPond = ponds.find(
                        (pond) => pond.id === Number(e.target.value)
                      );
                      setMortalityForm({
                        ...mortalityForm,
                        pond_id: e.target.value,
                        species: selectedPond?.species || mortalityForm.species,
                      });
                    }} required>
                      <option value="">Seçin</option>
                      {ponds.map((pond) => <option key={pond.id} value={pond.id}>{pond.name} — {pond.unit_type || "Hovuz"}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Ölən balıq sayı *</label>
                    <input type="number" min="1" value={mortalityForm.dead_count} onChange={(e) => setMortalityForm({ ...mortalityForm, dead_count: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label>Orta çəki (qram)</label>
                    <input type="number" min="0" step="0.01" value={mortalityForm.average_weight_g} onChange={(e) => setMortalityForm({ ...mortalityForm, average_weight_g: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Balıq növü</label>
                    <input value={mortalityForm.species} onChange={(e) => setMortalityForm({ ...mortalityForm, species: e.target.value })} placeholder="Məsələn: Rus nərəsi" />
                  </div>
                  <div className="form-field">
                    <label>Doğum ili</label>
                    <input type="number" min="1900" max={new Date().getFullYear()} value={mortalityForm.birth_year} onChange={(e) => setMortalityForm({ ...mortalityForm, birth_year: e.target.value })} placeholder="Məsələn: 2022" />
                  </div>
                  <div className="form-field">
                    <label>Yaş (avtomatik)</label>
                    <input value={mortalityForm.birth_year ? `${new Date().getFullYear() - Number(mortalityForm.birth_year)} yaş` : "—"} disabled />
                  </div>
                  <div className="form-field">
                    <label>Cins</label>
                    <select value={mortalityForm.sex} onChange={(e) => setMortalityForm({ ...mortalityForm, sex: e.target.value })}>
                      <option value="Naməlum">Naməlum</option>
                      <option value="Erkək">Erkək</option>
                      <option value="Dişi">Dişi</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Ölən biokütlə</label>
                    <input value={`${((Number(mortalityForm.dead_count || 0) * Number(mortalityForm.average_weight_g || 0)) / 1000).toFixed(3)} kq`} disabled />
                  </div>
                  <div className="form-field">
                    <label>Səbəb</label>
                    <input value={mortalityForm.reason} onChange={(e) => setMortalityForm({ ...mortalityForm, reason: e.target.value })} placeholder="Məsələn: temperatur, xəstəlik" />
                  </div>
                  <div className="form-field mortality-notes">
                    <label>Qeyd</label>
                    <textarea value={mortalityForm.notes} onChange={(e) => setMortalityForm({ ...mortalityForm, notes: e.target.value })} placeholder="Əlavə müşahidə və məlumat" rows="3" />
                  </div>
                </div>
                <div className="form-actions">
                  {editingMortalityId && <button type="button" className="cancel-button" onClick={() => { setEditingMortalityId(null); setMortalityForm(emptyMortality()); }}>Ləğv et</button>}
                  <button type="submit" className="save-button" disabled={savingMortality}>{savingMortality ? "Yadda saxlanılır..." : editingMortalityId ? "Dəyişiklikləri saxla" : "Ölümü qeyd et"}</button>
                </div>
              </form>
            </section>

            <section className="cards mortality-cards">
              <div className="card"><span className="icon orange">⚠️</span><div><p>Seçilən dövr üzrə ölüm</p><h2>{mortalityTotal.toLocaleString("az-AZ")}</h2></div></div>
              <div className="card"><span className="icon purple">⚖️</span><div><p>Ölən biokütlə</p><h2>{mortalityBiomassTotal.toFixed(3)} kq</h2></div></div>
              <div className="card"><span className="icon blue">📅</span><div><p>Qeyd sayı</p><h2>{mortalityRecords.length}</h2></div></div>
            </section>

            <section className="table-section summary-section">
              <div className="section-title summary-heading">
                <div><h2>Ölüm hesabatı</h2><p>Gün, ay və il üzrə avtomatik cəmlər</p></div>
                <select value={summaryPeriod} onChange={(e) => setSummaryPeriod(e.target.value)}>
                  <option value="daily">Gündəlik</option>
                  <option value="monthly">Aylıq</option>
                  <option value="yearly">İllik</option>
                </select>
              </div>
              <table>
                <thead><tr><th>Dövr</th><th>Ölüm sayı</th><th>Ölən biokütlə</th></tr></thead>
                <tbody>
                  {mortalitySummary.map((item) => <tr key={item.period}><td><strong>{item.period}</strong></td><td>{Number(item.total_dead_count).toLocaleString("az-AZ")}</td><td>{Number(item.total_biomass_kg).toFixed(3)} kq</td></tr>)}
                  {mortalitySummary.length === 0 && <tr><td colSpan="3" className="empty-row">Bu dövr üçün məlumat yoxdur</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="table-section">
              <div className="section-title"><div><h2>Ölüm qeydləri</h2><p>Bütün qeydlərin ətraflı siyahısı</p></div></div>
              <table>
                <thead><tr><th>Tarix</th><th>Vahid</th><th>Balıq növü</th><th>Doğum ili</th><th>Yaş</th><th>Cins</th><th>Ölüm sayı</th><th>Orta çəki</th><th>Biokütlə</th><th>Səbəb</th><th>Qeyd</th><th>Əməliyyat</th></tr></thead>
                <tbody>
                  {mortalityRecords.map((record) => (
                    <tr key={record.id}>
                      <td><strong>{record.record_date}</strong></td>
                      <td>{pondName(record.pond_id)}</td>
                      <td>{record.species || "—"}</td>
                      <td>{record.birth_year || "—"}</td>
                      <td>{record.birth_year ? `${new Date(record.record_date).getFullYear() - Number(record.birth_year)} yaş` : "—"}</td>
                      <td>{record.sex || "Naməlum"}</td>
                      <td>{Number(record.dead_count).toLocaleString("az-AZ")}</td>
                      <td>{Number(record.average_weight_g).toLocaleString("az-AZ")} q</td>
                      <td>{Number(record.mortality_biomass_kg).toFixed(3)} kq</td>
                      <td>{record.reason || "—"}</td><td>{record.notes || "—"}</td>
                      <td><div className="action-buttons"><button className="edit-button" onClick={() => editMortality(record)}>Redaktə et</button><button className="delete-button" onClick={() => deleteMortality(record.id)}>Sil</button></div></td>
                    </tr>
                  ))}
                  {mortalityRecords.length === 0 && <tr><td colSpan="12" className="empty-row">Ölüm qeydi yoxdur</td></tr>}
                </tbody>
              </table>
            </section>
          </>
        ) : (
          <>
            <section className="cards">
              <div className="card"><span className="icon blue">🌊</span><div><p>Ümumi vahid</p><h2>{filteredPonds.length}</h2></div></div>
              <div className="card"><span className="icon green">🐟</span><div><p>Balıq sayı</p><h2>{totalFish.toLocaleString("az-AZ")}</h2></div></div>
              <div className="card"><span className="icon orange">⚖️</span><div><p>Ümumi biokütlə</p><h2>{totalBiomass.toFixed(1)} kq</h2></div></div>
              <div className="card"><span className="icon purple">🤲</span><div><p>Gündəlik yem</p><h2>{totalFeed.toFixed(1)} kq</h2></div></div>
            </section>
            <section className="table-section">
              <div className="section-title"><div><h2>Saxlama vahidlərinin vəziyyəti</h2><p>PostgreSQL bazasındakı hovuz məlumatları</p></div></div>
              <table>
                <thead><tr><th>Ad</th><th>Tip</th><th>Sahə</th><th>Ədəd/m²</th><th>kq/m²</th><th>Növ</th><th>Balıq sayı</th><th>Orta çəki</th><th>Biokütlə</th><th>Status</th><th>Əməliyyat</th></tr></thead>
                <tbody>
                  {filteredPonds.map((pond) => {
                    const fishCount = Number(pond.fish_count || 0);
                    const averageWeight = Number(pond.average_weight_g || 0);
                    const area = Number(pond.area_m2 || 0);
                    const biomass = (fishCount * averageWeight) / 1000;
                    const fishPerM2 = area > 0 ? fishCount / area : null;
                    const biomassPerM2 = area > 0 ? biomass / area : null;
                    return <tr key={pond.id}><td><strong>{pond.name}</strong></td><td>{pond.unit_type || "Hovuz"}</td><td>{area > 0 ? `${area.toLocaleString("az-AZ")} m²` : "—"}</td><td>{fishPerM2 !== null ? fishPerM2.toFixed(1) : "—"}</td><td>{biomassPerM2 !== null ? biomassPerM2.toFixed(2) : "—"}</td><td>{pond.species || "—"}</td><td>{fishCount.toLocaleString("az-AZ")}</td><td>{averageWeight.toLocaleString("az-AZ")} q</td><td>{biomass.toFixed(1)} kq</td><td><span className="status">{pond.status}</span></td><td><button className="edit-button" onClick={() => openEditPond(pond)}>Redaktə et</button></td></tr>;
                  })}
                  {filteredPonds.length === 0 && <tr><td colSpan="11" className="empty-row">Bu bölmədə məlumat yoxdur</td></tr>}
                </tbody>
              </table>
            </section>
          </>
        )}

        {showPondForm && (
          <div className="modal-overlay">
            <form className="pond-form" onSubmit={savePond}>
              <div className="form-header"><div><h2>{editingPondId ? "Vahidi redaktə et" : "Yeni vahid əlavə et"}</h2><p>Saxlama vahidinin ilkin məlumatlarını daxil edin</p></div><button type="button" className="close-button" onClick={() => setShowPondForm(false)}>×</button></div>
              <div className="form-grid">
                <div className="form-field"><label>Saxlama tipi *</label><select value={newPond.unit_type} onChange={(e) => setNewPond({ ...newPond, unit_type: e.target.value })} required><option value="Hovuz">Hovuz</option><option value="Nohur">Nohur</option><option value="Qəfəs">Qəfəs</option></select></div>
                <div className="form-field"><label>Vahidin adı *</label><input value={newPond.name} onChange={(e) => setNewPond({ ...newPond, name: e.target.value })} placeholder="Məsələn: Hovuz 2" required /></div>
                <div className="form-field"><label>Balıq növü</label><input value={newPond.species} onChange={(e) => setNewPond({ ...newPond, species: e.target.value })} placeholder="Məsələn: Rus nərəsi" /></div>
                <div className="form-field"><label>Sahə (m²) *</label><input type="number" min="0" step="0.01" value={newPond.area_m2} onChange={(e) => setNewPond({ ...newPond, area_m2: e.target.value })} required /></div>
                <div className="form-field"><label>Balıq sayı</label><input type="number" min="0" value={newPond.fish_count} onChange={(e) => setNewPond({ ...newPond, fish_count: e.target.value })} /></div>
                <div className="form-field"><label>Orta çəki (qram)</label><input type="number" min="0" step="0.01" value={newPond.average_weight_g} onChange={(e) => setNewPond({ ...newPond, average_weight_g: e.target.value })} /></div>
                <div className="form-field"><label>Gündəlik yem (kq)</label><input type="number" min="0" step="0.01" value={newPond.daily_feed_kg} onChange={(e) => setNewPond({ ...newPond, daily_feed_kg: e.target.value })} /></div>
                <div className="form-field"><label>Status</label><select value={newPond.status} onChange={(e) => setNewPond({ ...newPond, status: e.target.value })}><option value="Aktiv">Aktiv</option><option value="Boş">Boş</option><option value="Təmirdə">Təmirdə</option></select></div>
              </div>
              <div className="form-actions"><button type="button" className="cancel-button" onClick={() => setShowPondForm(false)}>Ləğv et</button><button type="submit" className="save-button" disabled={savingPond}>{savingPond ? "Yadda saxlanılır..." : editingPondId ? "Dəyişiklikləri yadda saxla" : "Vahidi yadda saxla"}</button></div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

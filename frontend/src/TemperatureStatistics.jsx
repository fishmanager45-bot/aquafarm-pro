import { useEffect, useMemo, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ record_date: today(), temperature_c: "", notes: "" });
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

export default function TemperatureStatistics({ API_URL, token, compact = false }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

  const authFetch = (url, options = {}) => fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });

  const load = async () => {
    try {
      const response = await authFetch(`${API_URL}/temperature-records`);
      if (!response.ok) throw new Error("Temperatur məlumatları alınmadı");
      setRecords(await response.json());
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { load(); }, [token]);

  const daily = useMemo(() => {
    const grouped = new Map();
    records.forEach((record) => {
      const values = grouped.get(record.record_date) || [];
      values.push(Number(record.temperature_c));
      grouped.set(record.record_date, values);
    });
    return [...grouped.entries()].map(([date, values]) => ({ date, average: average(values), count: values.length })).sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const monthly = useMemo(() => {
    const grouped = new Map();
    daily.forEach((item) => {
      const month = item.date.slice(0, 7);
      const values = grouped.get(month) || [];
      values.push(item.average);
      grouped.set(month, values);
    });
    return [...grouped.entries()].map(([month, values]) => ({ month, average: average(values), days: values.length })).sort((a, b) => b.month.localeCompare(a.month));
  }, [daily]);

  const yearly = useMemo(() => {
    const grouped = new Map();
    daily.forEach((item) => {
      const year = item.date.slice(0, 4);
      const values = grouped.get(year) || [];
      values.push(item.average);
      grouped.set(year, values);
    });
    return [...grouped.entries()].map(([year, values]) => ({ year, average: average(values), days: values.length })).sort((a, b) => b.year.localeCompare(a.year));
  }, [daily]);

  const years = [...new Set(daily.map((item) => item.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const yearDaily = daily.filter((item) => item.date.startsWith(yearFilter));
  const yearMonthly = monthly.filter((item) => item.month.startsWith(yearFilter));
  const todayRecord = daily.find((item) => item.date === today());
  const currentMonth = monthly.find((item) => item.month === today().slice(0, 7));
  const currentYear = yearly.find((item) => item.year === today().slice(0, 4));
  const recentSeven = [...daily].slice(0, 7).reverse();

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await authFetch(editingId ? `${API_URL}/temperature-records/${editingId}` : `${API_URL}/temperature-records`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_date: form.record_date, temperature_c: Number(form.temperature_c), source: "Əl ilə", notes: form.notes || null }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.detail || "Temperatur saxlanmadı"); }
      setForm(emptyForm()); setEditingId(null); await load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const edit = (record) => { setEditingId(record.id); setForm({ record_date: record.record_date, temperature_c: record.temperature_c, notes: record.notes || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = async (id) => { if (!window.confirm("Temperatur qeydi silinsin?")) return; const response = await authFetch(`${API_URL}/temperature-records/${id}`, { method: "DELETE" }); if (response.ok) await load(); };

  const chart = <div style={{ display: "flex", gap: 10, alignItems: "end", minHeight: 150, padding: "18px 8px 4px" }}>
    {recentSeven.map((item) => <div key={item.date} style={{ flex: 1, minWidth: 42, textAlign: "center" }}><strong style={{ display: "block", marginBottom: 6 }}>{item.average.toFixed(1)}°</strong><div style={{ height: `${Math.max(12, Math.min(110, item.average * 3.5))}px`, background: item.average >= 29 ? "linear-gradient(#fb7185,#e11d48)" : "linear-gradient(#38bdf8,#0284c7)", borderRadius: "8px 8px 3px 3px" }} /><small style={{ display: "block", marginTop: 6 }}>{item.date.slice(5)}</small></div>)}
    {recentSeven.length === 0 && <div className="empty-row" style={{ width: "100%" }}>Temperatur qeydi yoxdur</div>}
  </div>;

  if (compact) return <section className="table-section" style={{ marginBottom: 20 }}>
    <div className="section-title"><div><h2>🌡️ Gündəlik temperatur</h2><p>Son 7 günün təsərrüfat temperaturu</p></div><div style={{ textAlign: "right" }}><small>Bugünkü orta</small><h2>{todayRecord ? `${todayRecord.average.toFixed(1)} °C` : "Daxil edilməyib"}</h2></div></div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(260px,2fr) repeat(2,minmax(130px,1fr))", gap: 20, padding: "0 24px 22px" }}><div>{chart}</div><div className="card" style={{ boxShadow: "none" }}><div><p>Aylıq orta</p><h2>{currentMonth ? `${currentMonth.average.toFixed(1)} °C` : "—"}</h2></div></div><div className="card" style={{ boxShadow: "none" }}><div><p>İllik orta</p><h2>{currentYear ? `${currentYear.average.toFixed(1)} °C` : "—"}</h2></div></div></div>
  </section>;

  return <>
    {error && <div className="dashboard-error">{error}</div>}
    <section className="cards">
      <div className="card"><span className="icon blue">🌡️</span><div><p>Bugünkü orta</p><h2>{todayRecord ? `${todayRecord.average.toFixed(1)} °C` : "—"}</h2></div></div>
      <div className="card"><span className="icon green">📅</span><div><p>Aylıq orta</p><h2>{currentMonth ? `${currentMonth.average.toFixed(1)} °C` : "—"}</h2></div></div>
      <div className="card"><span className="icon orange">📊</span><div><p>İllik orta</p><h2>{currentYear ? `${currentYear.average.toFixed(1)} °C` : "—"}</h2></div></div>
      <div className="card"><span className="icon purple">🗓️</span><div><p>Qeyd olunan gün</p><h2>{daily.length}</h2></div></div>
    </section>

    <section className="table-section mortality-form-section">
      <div className="section-title"><div><h2>{editingId ? "Temperaturu redaktə et" : "Gündəlik temperatur daxil et"}</h2><p>Hazırda əl ilə, gələcəkdə Wi‑Fi sensoru ilə</p></div></div>
      <form className="mortality-form" onSubmit={save}><div className="form-grid"><div className="form-field"><label>Tarix *</label><input type="date" value={form.record_date} onChange={(e) => setForm({ ...form, record_date: e.target.value })} required /></div><div className="form-field"><label>Temperatur (°C) *</label><input type="number" min="-10" max="50" step="0.1" value={form.temperature_c} onChange={(e) => setForm({ ...form, temperature_c: e.target.value })} required /></div><div className="form-field"><label>Mənbə</label><input value="Əl ilə" disabled /></div><div className="form-field"><label>Qeyd</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div></div><div className="form-actions">{editingId && <button type="button" className="cancel-button" onClick={() => { setEditingId(null); setForm(emptyForm()); }}>Ləğv et</button>}<button className="save-button" disabled={saving}>{saving ? "Saxlanılır..." : "Yadda saxla"}</button></div></form>
    </section>

    <section className="table-section" style={{ marginBottom: 20 }}><div className="section-title"><div><h2>Son 7 gün</h2><p>Gündəlik orta temperatur</p></div></div><div style={{ padding: "0 24px 20px" }}>{chart}</div></section>

    <section className="table-section" style={{ marginBottom: 20 }}><div className="section-title"><div><h2>Statistika ili</h2><p>Aylıq və gündəlik hesabat üçün il seçin</p></div><select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ maxWidth: 180 }}>{years.length === 0 && <option>{yearFilter}</option>}{years.map((year) => <option key={year}>{year}</option>)}</select></div></section>

    <section className="table-section" style={{ marginBottom: 20 }}><div className="section-title"><div><h2>Aylıq orta temperatur</h2><p>{yearFilter} ili</p></div></div><table><thead><tr><th>Ay</th><th>Qeyd olunan gün</th><th>Orta temperatur</th></tr></thead><tbody>{yearMonthly.map((item) => <tr key={item.month}><td>{new Date(`${item.month}-01T00:00:00`).toLocaleDateString("az-AZ", { year: "numeric", month: "long" })}</td><td>{item.days}</td><td><strong>{item.average.toFixed(2)} °C</strong></td></tr>)}{yearMonthly.length === 0 && <tr><td colSpan="3" className="empty-row">Məlumat yoxdur</td></tr>}</tbody></table></section>

    <section className="table-section" style={{ marginBottom: 20 }}><div className="section-title"><div><h2>İllik orta temperatur</h2><p>Bütün illər</p></div></div><table><thead><tr><th>İl</th><th>Qeyd olunan gün</th><th>İllik orta</th></tr></thead><tbody>{yearly.map((item) => <tr key={item.year}><td>{item.year}</td><td>{item.days}</td><td><strong>{item.average.toFixed(2)} °C</strong></td></tr>)}{yearly.length === 0 && <tr><td colSpan="3" className="empty-row">Məlumat yoxdur</td></tr>}</tbody></table></section>

    <section className="table-section"><div className="section-title"><div><h2>Gündəlik temperatur cədvəli</h2><p>{yearFilter} ili üzrə gündəlik ortalar</p></div></div><table><thead><tr><th>Tarix</th><th>Gündəlik orta</th><th>Ölçmə sayı</th></tr></thead><tbody>{yearDaily.map((item) => <tr key={item.date}><td>{item.date}</td><td><strong>{item.average.toFixed(2)} °C</strong></td><td>{item.count}</td></tr>)}{yearDaily.length === 0 && <tr><td colSpan="3" className="empty-row">Məlumat yoxdur</td></tr>}</tbody></table></section>

    <section className="table-section" style={{ marginTop: 20 }}><div className="section-title"><div><h2>Bütün ölçmələr</h2><p>Redaktə və silmə əməliyyatları</p></div></div><table><thead><tr><th>Tarix</th><th>Temperatur</th><th>Mənbə</th><th>Qeyd</th><th>Əməliyyat</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{record.record_date}</td><td><strong>{Number(record.temperature_c).toFixed(1)} °C</strong></td><td>{record.source}</td><td>{record.notes || "—"}</td><td><div className="action-buttons"><button className="edit-button" onClick={() => edit(record)}>Redaktə et</button><button className="delete-button" onClick={() => remove(record.id)}>Sil</button></div></td></tr>)}</tbody></table></section>
  </>;
}

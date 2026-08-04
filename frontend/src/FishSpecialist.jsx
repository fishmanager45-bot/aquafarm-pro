import { useEffect, useMemo, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (type = "Baxış") => ({
  record_type: type,
  pond_id: "",
  record_date: today(),
  title: "",
  water_temperature: "",
  oxygen: "",
  fish_condition: "Normal",
  symptoms: "",
  diagnosis: "",
  treatment: "",
  medication: "",
  responsible_person: "",
  due_date: "",
  status: "Açıq",
  result: "",
  notes: "",
});

export default function FishSpecialist({ API_URL, token, ponds }) {
  const [records, setRecords] = useState([]);
  const [tab, setTab] = useState("Nəzarət");
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [unitFilter, setUnitFilter] = useState("Hamısı");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const authFetch = (url, options = {}) => fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });

  const load = async () => {
    try {
      const response = await authFetch(`${API_URL}/fish-specialist/records`);
      if (!response.ok) throw new Error("Balıqşünas qeydləri alınmadı");
      setRecords(await response.json());
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { load(); }, [token]);

  const visiblePonds = useMemo(() => ponds.filter((pond) =>
    unitFilter === "Hamısı" || (pond.unit_type || "Hovuz") === unitFilter
  ), [ponds, unitFilter]);

  const pondName = (id) => ponds.find((pond) => pond.id === id)?.name || "—";
  const recordType = tab === "Gündəlik baxış" ? "Baxış" : tab === "Tapşırıqlar" ? "Tapşırıq" : "Müalicə";
  const visibleRecords = records.filter((record) => record.record_type === recordType);
  const openTasks = records.filter((record) => record.record_type === "Tapşırıq" && record.status !== "Tamamlandı").length;
  const activeTreatments = records.filter((record) => record.record_type === "Müalicə" && record.status !== "Tamamlandı").length;
  const warningUnits = ponds.filter((pond) => Number(pond.oxygen || 99) < 6 || Number(pond.water_temperature || 0) >= 29).length;

  const startNew = (type) => {
    setEditingId(null);
    setForm(emptyForm(type));
  };

  const edit = (record) => {
    setEditingId(record.id);
    setForm(Object.fromEntries(Object.entries(emptyForm(record.record_type)).map(([key, fallback]) => [key, record[key] ?? fallback])));
    setTab(record.record_type === "Baxış" ? "Gündəlik baxış" : record.record_type === "Tapşırıq" ? "Tapşırıqlar" : "Müalicə");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    const payload = {
      ...form,
      pond_id: form.pond_id ? Number(form.pond_id) : null,
      water_temperature: form.water_temperature === "" ? null : Number(form.water_temperature),
      oxygen: form.oxygen === "" ? null : Number(form.oxygen),
      due_date: form.due_date || null,
    };
    try {
      const response = await authFetch(editingId ? `${API_URL}/fish-specialist/records/${editingId}` : `${API_URL}/fish-specialist/records`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.detail || "Qeyd saxlanmadı"); }
      startNew(form.record_type); await load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Bu qeyd silinsin?")) return;
    const response = await authFetch(`${API_URL}/fish-specialist/records/${id}`, { method: "DELETE" });
    if (response.ok) await load();
  };

  const openFormForUnit = (pond, type = "Baxış") => {
    setTab(type === "Baxış" ? "Gündəlik baxış" : type === "Tapşırıq" ? "Tapşırıqlar" : "Müalicə");
    setEditingId(null);
    setForm({
      ...emptyForm(type),
      pond_id: String(pond.id),
      title: `${pond.name} — ${type === "Baxış" ? "gündəlik baxış" : type}`,
      water_temperature: pond.water_temperature ?? "",
      oxygen: pond.oxygen ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const field = (label, key, props = {}) => (
    <div className="form-field"><label>{label}</label><input {...props} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></div>
  );

  return <>
    {error && <div className="dashboard-error">{error}</div>}
    <section className="cards">
      <div className="card"><span className="icon blue">🌊</span><div><p>Nəzarətdə vahid</p><h2>{ponds.length}</h2></div></div>
      <div className="card"><span className="icon orange">⚠️</span><div><p>Diqqət tələb edir</p><h2>{warningUnits}</h2></div></div>
      <div className="card"><span className="icon purple">📋</span><div><p>Açıq tapşırıq</p><h2>{openTasks}</h2></div></div>
      <div className="card"><span className="icon green">💊</span><div><p>Aktiv müalicə</p><h2>{activeTreatments}</h2></div></div>
    </section>

    <section className="table-section" style={{ marginBottom: 20 }}>
      <div className="section-title"><div><h2>Balıqşünas idarəetməsi</h2><p>Hovuz, nohur və qəfəslərin baxışı, tapşırığı və müalicəsi</p></div></div>
      <div style={{ display: "flex", gap: 8, padding: "0 24px 20px", flexWrap: "wrap" }}>
        {["Nəzarət", "Gündəlik baxış", "Tapşırıqlar", "Müalicə"].map((item) => <button key={item} className={tab === item ? "save-button" : "cancel-button"} onClick={() => { setTab(item); if (item !== "Nəzarət") startNew(item === "Gündəlik baxış" ? "Baxış" : item === "Tapşırıqlar" ? "Tapşırıq" : "Müalicə"); }}>{item}</button>)}
      </div>
    </section>

    {tab === "Nəzarət" ? <>
      <section className="table-section" style={{ marginBottom: 20 }}><div className="section-title"><div><h2>Bütün saxlama vahidləri</h2><p>Göstəricilər və sürətli əməliyyatlar</p></div><select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} style={{ maxWidth: 220 }}><option>Hamısı</option><option>Hovuz</option><option>Nohur</option><option>Qəfəs</option></select></div></section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 16 }}>
        {visiblePonds.map((pond) => {
          const biomass = Number(pond.fish_count || 0) * Number(pond.average_weight_g || 0) / 1000;
          const warning = Number(pond.oxygen || 99) < 6 || Number(pond.water_temperature || 0) >= 29;
          return <article key={pond.id} style={{ background: "white", border: `1px solid ${warning ? "#fca5a5" : "#dbe5ec"}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><div><small>{pond.unit_type || "Hovuz"}</small><h2>{pond.name}</h2><p>{pond.species || "Balıq növü qeyd edilməyib"}</p></div><span className="status">{warning ? "Diqqət" : pond.status}</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, margin: "16px 0" }}><div><small>Temperatur</small><strong style={{ display: "block" }}>{pond.water_temperature ?? "—"} °C</strong></div><div><small>Oksigen</small><strong style={{ display: "block" }}>{pond.oxygen ?? "—"} mg/L</strong></div><div><small>Balıq sayı</small><strong style={{ display: "block" }}>{Number(pond.fish_count || 0).toLocaleString("az-AZ")}</strong></div><div><small>Biokütlə</small><strong style={{ display: "block" }}>{biomass.toFixed(1)} kq</strong></div></div>
            <div className="action-buttons"><button className="edit-button" onClick={() => openFormForUnit(pond, "Baxış")}>Baxış</button><button className="edit-button" onClick={() => openFormForUnit(pond, "Tapşırıq")}>Tapşırıq</button><button className="delete-button" onClick={() => openFormForUnit(pond, "Müalicə")}>Müalicə</button></div>
          </article>;
        })}
      </section>
    </> : <>
      <section className="table-section mortality-form-section">
        <div className="section-title"><div><h2>{editingId ? "Qeydi redaktə et" : `Yeni ${recordType.toLocaleLowerCase("az")} qeydi`}</h2><p>Bütün sahələr tarixçədə saxlanılır</p></div></div>
        <form className="mortality-form" onSubmit={save}>
          <div className="form-grid">
            <div className="form-field"><label>Vahid</label><select value={form.pond_id} onChange={(e) => setForm({ ...form, pond_id: e.target.value })}><option value="">Ümumi təsərrüfat</option>{ponds.map((pond) => <option key={pond.id} value={pond.id}>{pond.unit_type || "Hovuz"} — {pond.name}</option>)}</select></div>
            {field("Tarix", "record_date", { type: "date", required: true })}
            {field("Başlıq *", "title", { required: true })}
            {recordType === "Baxış" && <>{field("Su temperaturu (°C)", "water_temperature", { type: "number", step: "0.1" })}{field("Oksigen (mg/L)", "oxygen", { type: "number", min: 0, step: "0.1" })}<div className="form-field"><label>Balığın vəziyyəti</label><select value={form.fish_condition} onChange={(e) => setForm({ ...form, fish_condition: e.target.value })}><option>Normal</option><option>Diqqət tələb edir</option><option>Kritik</option></select></div></>}
            {recordType === "Tapşırıq" && <>{field("Məsul şəxs", "responsible_person")}{field("Son tarix", "due_date", { type: "date" })}</>}
            {recordType === "Müalicə" && <>{field("Əlamətlər", "symptoms")}{field("Diaqnoz", "diagnosis")}{field("Müalicə", "treatment")}{field("Dərman / doza", "medication")}</>}
            <div className="form-field"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Açıq</option><option>İcradadır</option><option>Tamamlandı</option><option>Ləğv edildi</option></select></div>
            {field("Nəticə", "result")}{field("Qeyd", "notes")}
          </div>
          <div className="form-actions">{editingId && <button type="button" className="cancel-button" onClick={() => startNew(recordType)}>Ləğv et</button>}<button className="save-button" disabled={saving}>{saving ? "Saxlanılır..." : "Yadda saxla"}</button></div>
        </form>
      </section>
      <section className="table-section"><div className="section-title"><div><h2>{tab} tarixçəsi</h2><p>{visibleRecords.length} qeyd</p></div></div><table><thead><tr><th>Tarix</th><th>Vahid</th><th>Başlıq</th><th>Göstərici / məlumat</th><th>Məsul / son tarix</th><th>Status</th><th>Nəticə</th><th>Əməliyyat</th></tr></thead><tbody>{visibleRecords.map((record) => <tr key={record.id}><td>{record.record_date}</td><td>{record.pond_id ? pondName(record.pond_id) : "Ümumi"}</td><td><strong>{record.title}</strong></td><td>{record.record_type === "Baxış" ? `${record.water_temperature ?? "—"} °C / ${record.oxygen ?? "—"} mg/L / ${record.fish_condition || "—"}` : record.record_type === "Tapşırıq" ? record.notes || "—" : `${record.diagnosis || "—"} / ${record.treatment || "—"} / ${record.medication || "—"}`}</td><td>{record.responsible_person || "—"}{record.due_date ? ` / ${record.due_date}` : ""}</td><td><span className="status">{record.status}</span></td><td>{record.result || "—"}</td><td><div className="action-buttons"><button className="edit-button" onClick={() => edit(record)}>Redaktə et</button><button className="delete-button" onClick={() => remove(record.id)}>Sil</button></div></td></tr>)}{visibleRecords.length === 0 && <tr><td colSpan="8" className="empty-row">Qeyd yoxdur</td></tr>}</tbody></table></section>
    </>}
  </>;
}

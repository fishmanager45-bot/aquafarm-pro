import { useEffect, useState } from "react";
import "./App.css";
import DrugWarehouse from "./DrugWarehouse";
import Sales from "./Sales";
import ColdStorage from "./ColdStorage";
import Personnel from "./Personnel";

// AquaFarm Pro ölüm modulu: növ, doğum ili, avtomatik yaş və cins.

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000");

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

const emptyGrowth = () => ({
  pond_id: "",
  measurement_date: getToday(),
  fish_count: "",
  average_weight_g: "",
  feed_used_kg: "",
  notes: "",
});

const emptyFeedProduct = () => ({
  brand: "",
  product_name: "",
  species: "",
  pellet_size_mm: "",
  batch_number: "",
  supplier: "",
  manufacture_date: "",
  expiry_date: "",
  unit_price: "",
  minimum_stock_kg: "",
  notes: "",
});

const emptyFeedTransaction = () => ({
  product_id: "",
  transaction_type: "Giriş",
  quantity_kg: "",
  transaction_date: getToday(),
  unit_price: "",
  notes: "",
});

const emptyBroodstock = () => ({ chip_number: "", species: "", sex: "Dişi", birth_year: "", pond_id: "", weight_kg: "", length_cm: "", origin: "", status: "Aktiv", notes: "" });
const emptyBroodstockUse = () => ({ use_date: getToday(), use_type: "Kürü", amount: "", fertilization_percent: "", hatch_percent: "", hormone: "", hormone_dose: "", result: "", notes: "" });
const emptyPolarization = () => ({ measurement_date: getToday(), average_value: "", minimum_value: "", maximum_value: "", egg_count: "", ready_for_use: false, notes: "" });

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ponds, setPonds] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("Hamısı");
  const [employees, setEmployees] = useState([]);

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
  const [mortalityPondSearch, setMortalityPondSearch] = useState("");
  const [mortalityPhotos, setMortalityPhotos] = useState([]);
  const [mortalityPhotoPreviews, setMortalityPhotoPreviews] = useState([]);
  const [existingMortalityPhotos, setExistingMortalityPhotos] = useState([]);

  const [growthRecords, setGrowthRecords] = useState([]);
  const [growthCalculations, setGrowthCalculations] = useState([]);
  const [growthForm, setGrowthForm] = useState(emptyGrowth());
  const [savingGrowth, setSavingGrowth] = useState(false);
  const [editingGrowthId, setEditingGrowthId] = useState(null);
  const [growthSpeciesFilter, setGrowthSpeciesFilter] = useState("Hamısı");
  const [growthBirthYearFilter, setGrowthBirthYearFilter] = useState("Hamısı");
  const [growthSexFilter, setGrowthSexFilter] = useState("Hamısı");

  const [feedProducts, setFeedProducts] = useState([]);
  const [feedTransactions, setFeedTransactions] = useState([]);
  const [feedProductForm, setFeedProductForm] = useState(emptyFeedProduct());
  const [feedTransactionForm, setFeedTransactionForm] = useState(emptyFeedTransaction());
  const [editingFeedProductId, setEditingFeedProductId] = useState(null);
  const [editingFeedTransactionId, setEditingFeedTransactionId] = useState(null);
  const [savingFeedWarehouse, setSavingFeedWarehouse] = useState(false);
  const [feedWarehouseSearch, setFeedWarehouseSearch] = useState("");
  const [feedInvoicePhoto, setFeedInvoicePhoto] = useState(null);
  const [feedHistoryTypeFilter, setFeedHistoryTypeFilter] = useState("Hamısı");
  const [feedHistoryBrandFilter, setFeedHistoryBrandFilter] = useState("Hamısı");
  const [feedHistorySupplierFilter, setFeedHistorySupplierFilter] = useState("Hamısı");
  const [feedHistoryPelletFilter, setFeedHistoryPelletFilter] = useState("Hamısı");
  const [feedHistoryDateFrom, setFeedHistoryDateFrom] = useState("");
  const [feedHistoryDateTo, setFeedHistoryDateTo] = useState("");
  const [broodstock, setBroodstock] = useState([]);
  const [selectedBroodstockId, setSelectedBroodstockId] = useState(null);
  const [broodstockUses, setBroodstockUses] = useState([]);
  const [polarizations, setPolarizations] = useState([]);
  const [broodstockForm, setBroodstockForm] = useState(emptyBroodstock());
  const [broodstockUseForm, setBroodstockUseForm] = useState(emptyBroodstockUse());
  const [polarizationForm, setPolarizationForm] = useState(emptyPolarization());
  const [editingBroodstockId, setEditingBroodstockId] = useState(null);
  const [broodstockPhoto, setBroodstockPhoto] = useState(null);
  const [broodstockSearch, setBroodstockSearch] = useState("");
  const [broodstockSpeciesFilter, setBroodstockSpeciesFilter] = useState("Hamısı");
  const [broodstockSexFilter, setBroodstockSexFilter] = useState("Hamısı");
  const [broodstockStatusFilter, setBroodstockStatusFilter] = useState("Hamısı");

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
    setGrowthRecords([]);
    setGrowthCalculations([]);
    setFeedProducts([]);
    setFeedTransactions([]);
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

  const loadEmployees = async () => {
    try {
      const response = await authorizedFetch(`${API_URL}/employees`);
      if (!response.ok) throw new Error("İşçi məlumatları alınmadı");
      setEmployees(await response.json());
    } catch (err) {
      setError(err.message);
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

  const loadGrowth = async () => {
    try {
      const [recordsResponse, calculationsResponse] = await Promise.all([
        authorizedFetch(`${API_URL}/growth`),
        authorizedFetch(`${API_URL}/growth/calculations`),
      ]);
      if (!recordsResponse.ok || !calculationsResponse.ok) {
        throw new Error("Artım məlumatları alınmadı");
      }
      setGrowthRecords(await recordsResponse.json());
      setGrowthCalculations(await calculationsResponse.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const loadFeedWarehouse = async () => {
    try {
      const [productsResponse, transactionsResponse] = await Promise.all([
        authorizedFetch(`${API_URL}/feed-warehouse/products`),
        authorizedFetch(`${API_URL}/feed-warehouse/transactions`),
      ]);
      if (!productsResponse.ok || !transactionsResponse.ok) {
        throw new Error("Yem anbarı məlumatları alınmadı");
      }
      setFeedProducts(await productsResponse.json());
      setFeedTransactions(await transactionsResponse.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const loadBroodstock = async () => {
    try {
      const response = await authorizedFetch(`${API_URL}/broodstock`);
      if (!response.ok) throw new Error("Damazlıq balıqlar alınmadı");
      setBroodstock(await response.json());
    } catch (err) { setError(err.message); }
  };

  const loadBroodstockDetails = async (fishId) => {
    if (!fishId) return;
    try {
      const [usesResponse, polarizationResponse] = await Promise.all([
        authorizedFetch(`${API_URL}/broodstock/${fishId}/uses`),
        authorizedFetch(`${API_URL}/broodstock/${fishId}/polarizations`),
      ]);
      if (!usesResponse.ok || !polarizationResponse.ok) throw new Error("Damazlıq tarixçəsi alınmadı");
      setBroodstockUses(await usesResponse.json());
      setPolarizations(await polarizationResponse.json());
    } catch (err) { setError(err.message); }
  };

  useEffect(() => {
    if (token) {
      loadPonds(token);
      loadEmployees();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeView === "Ölüm") {
      loadMortality();
      loadMortalitySummary(summaryPeriod);
    }
  }, [token, activeView, summaryPeriod]);

  useEffect(() => {
    if (token && activeView === "Artım") loadGrowth();
  }, [token, activeView]);

  useEffect(() => {
    if (token && activeView === "Yem anbarı") loadFeedWarehouse();
  }, [token, activeView]);

  useEffect(() => {
    if (token && activeView === "Damazlıq balıqlar") loadBroodstock();
  }, [token, activeView]);

  useEffect(() => { loadBroodstockDetails(selectedBroodstockId); }, [selectedBroodstockId]);

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
      if (!mortalityForm.pond_id) {
        throw new Error("Siyahıdan hovuz / nohur / qəfəs seçin");
      }

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

      const savedRecord = await response.json();

      if (mortalityPhotos.length > 0) {
        const photoData = new FormData();
        mortalityPhotos.forEach((photo) => photoData.append("photos", photo));

        const photoResponse = await authorizedFetch(
          `${API_URL}/mortality/${savedRecord.id}/photos`,
          {
            method: "POST",
            body: photoData,
          }
        );

        if (!photoResponse.ok) {
          const photoError = await photoResponse.json();
          throw new Error(
            photoError.detail ||
              "Ölüm qeydi saxlanıldı, amma şəkil yüklənmədi"
          );
        }
      }

      mortalityPhotoPreviews.forEach((item) => URL.revokeObjectURL(item.url));
      setMortalityForm(emptyMortality());
      setMortalityPondSearch("");
      setMortalityPhotos([]);
      setMortalityPhotoPreviews([]);
      setExistingMortalityPhotos([]);
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
    const selectedPond = ponds.find((pond) => pond.id === record.pond_id);
    setEditingMortalityId(record.id);
    mortalityPhotoPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    setMortalityPhotos([]);
    setMortalityPhotoPreviews([]);
    const savedPhotos = [...(record.photos || [])];
    if (
      record.photo_path &&
      !savedPhotos.some((item) => item.photo_path === record.photo_path)
    ) {
      savedPhotos.unshift({ id: null, photo_path: record.photo_path });
    }
    setExistingMortalityPhotos(savedPhotos);
    setMortalityPondSearch(
      selectedPond
        ? `${selectedPond.name} — ${selectedPond.unit_type || "Hovuz"}`
        : ""
    );
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

  const saveGrowth = async (event) => {
    event.preventDefault();
    setSavingGrowth(true);
    setError("");
    try {
      const response = await authorizedFetch(
        editingGrowthId
          ? `${API_URL}/growth/${editingGrowthId}`
          : `${API_URL}/growth`,
        {
        method: editingGrowthId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(!editingGrowthId && {
            pond_id: Number(growthForm.pond_id),
          }),
          measurement_date: growthForm.measurement_date,
          fish_count: Number(growthForm.fish_count),
          average_weight_g: Number(growthForm.average_weight_g),
          feed_used_kg: Number(growthForm.feed_used_kg || 0),
          notes: growthForm.notes || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Artım qeydi saxlanmadı");
      }
      setGrowthForm(emptyGrowth());
      setEditingGrowthId(null);
      await Promise.all([loadGrowth(), loadPonds()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingGrowth(false);
    }
  };

  const editGrowth = (recordId) => {
    const record = growthRecords.find((item) => item.id === recordId);
    if (!record) return;

    setEditingGrowthId(record.id);
    setGrowthForm({
      pond_id: String(record.pond_id),
      measurement_date: record.measurement_date,
      fish_count: String(record.fish_count),
      average_weight_g: String(record.average_weight_g),
      feed_used_kg: String(record.feed_used_kg ?? 0),
      notes: record.notes || "",
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelGrowthEdit = () => {
    setEditingGrowthId(null);
    setGrowthForm(emptyGrowth());
    setError("");
  };

  const saveFeedProduct = async (event) => {
    event.preventDefault();
    setSavingFeedWarehouse(true);
    setError("");
    try {
      const response = await authorizedFetch(
        editingFeedProductId
          ? `${API_URL}/feed-warehouse/products/${editingFeedProductId}`
          : `${API_URL}/feed-warehouse/products`,
        {
          method: editingFeedProductId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: feedProductForm.brand,
            product_name: feedProductForm.product_name,
            species: feedProductForm.species || null,
            pellet_size_mm: feedProductForm.pellet_size_mm ? Number(feedProductForm.pellet_size_mm) : null,
            batch_number: feedProductForm.batch_number || null,
            supplier: feedProductForm.supplier || null,
            manufacture_date: feedProductForm.manufacture_date || null,
            expiry_date: feedProductForm.expiry_date || null,
            unit_price: Number(feedProductForm.unit_price || 0),
            minimum_stock_kg: Number(feedProductForm.minimum_stock_kg || 0),
            notes: feedProductForm.notes || null,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Yem məhsulu saxlanmadı");
      }
      setFeedProductForm(emptyFeedProduct());
      setEditingFeedProductId(null);
      await loadFeedWarehouse();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFeedWarehouse(false);
    }
  };

  const editFeedProduct = (product) => {
    setEditingFeedProductId(product.id);
    setFeedProductForm({
      brand: product.brand || "",
      product_name: product.product_name || "",
      species: product.species || "",
      pellet_size_mm: product.pellet_size_mm ?? "",
      batch_number: product.batch_number || "",
      supplier: product.supplier || "",
      manufacture_date: product.manufacture_date || "",
      expiry_date: product.expiry_date || "",
      unit_price: product.unit_price ?? "",
      minimum_stock_kg: product.minimum_stock_kg ?? "",
      notes: product.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteFeedProduct = async (productId) => {
    if (!window.confirm("Yem məhsulu və onun bütün tarixçəsi silinsin?")) return;
    try {
      const response = await authorizedFetch(`${API_URL}/feed-warehouse/products/${productId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Yem məhsulu silinmədi");
      await loadFeedWarehouse();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveFeedTransaction = async (event) => {
    event.preventDefault();
    setSavingFeedWarehouse(true);
    setError("");
    try {
      const response = await authorizedFetch(
        editingFeedTransactionId
          ? `${API_URL}/feed-warehouse/transactions/${editingFeedTransactionId}`
          : `${API_URL}/feed-warehouse/transactions`,
        {
          method: editingFeedTransactionId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(!editingFeedTransactionId && { product_id: Number(feedTransactionForm.product_id) }),
            transaction_type: feedTransactionForm.transaction_type,
            quantity_kg: Number(feedTransactionForm.quantity_kg),
            transaction_date: feedTransactionForm.transaction_date,
            unit_price: feedTransactionForm.unit_price ? Number(feedTransactionForm.unit_price) : null,
            notes: feedTransactionForm.notes || null,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Anbar əməliyyatı saxlanmadı");
      }
      const savedTransaction = await response.json();
      if (feedInvoicePhoto) {
        const documentData = new FormData();
        documentData.append("document", feedInvoicePhoto);
        const documentResponse = await authorizedFetch(
          `${API_URL}/feed-warehouse/transactions/${savedTransaction.id}/document`,
          { method: "POST", body: documentData }
        );
        if (!documentResponse.ok) {
          const data = await documentResponse.json();
          throw new Error(data.detail || "Əməliyyat saxlanıldı, amma qaimə şəkli yüklənmədi");
        }
      }
      setFeedTransactionForm(emptyFeedTransaction());
      setEditingFeedTransactionId(null);
      setFeedInvoicePhoto(null);
      await loadFeedWarehouse();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFeedWarehouse(false);
    }
  };

  const editFeedTransaction = (transaction) => {
    setEditingFeedTransactionId(transaction.id);
    setFeedInvoicePhoto(null);
    setFeedTransactionForm({
      product_id: String(transaction.product_id),
      transaction_type: transaction.transaction_type,
      quantity_kg: String(transaction.quantity_kg),
      transaction_date: transaction.transaction_date,
      unit_price: transaction.unit_price ?? "",
      notes: transaction.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteFeedTransaction = async (transactionId) => {
    if (!window.confirm("Bu anbar əməliyyatı silinsin?")) return;
    try {
      const response = await authorizedFetch(`${API_URL}/feed-warehouse/transactions/${transactionId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Anbar əməliyyatı silinmədi");
      }
      await loadFeedWarehouse();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveBroodstock = async (event) => {
    event.preventDefault(); setError("");
    try {
      const response = await authorizedFetch(editingBroodstockId ? `${API_URL}/broodstock/${editingBroodstockId}` : `${API_URL}/broodstock`, {
        method: editingBroodstockId ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...broodstockForm, birth_year: broodstockForm.birth_year ? Number(broodstockForm.birth_year) : null, pond_id: broodstockForm.pond_id ? Number(broodstockForm.pond_id) : null, weight_kg: broodstockForm.weight_kg ? Number(broodstockForm.weight_kg) : null, length_cm: broodstockForm.length_cm ? Number(broodstockForm.length_cm) : null, origin: broodstockForm.origin || null, notes: broodstockForm.notes || null }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.detail || "Damazlıq balıq saxlanmadı"); }
      const saved = await response.json();
      if (broodstockPhoto) { const formData = new FormData(); formData.append("photo", broodstockPhoto); const photoResponse = await authorizedFetch(`${API_URL}/broodstock/${saved.id}/photo`, { method: "POST", body: formData }); if (!photoResponse.ok) throw new Error("Balıq saxlanıldı, amma şəkil yüklənmədi"); }
      setBroodstockForm(emptyBroodstock()); setBroodstockPhoto(null); setEditingBroodstockId(null); setSelectedBroodstockId(saved.id); await loadBroodstock(); await loadBroodstockDetails(saved.id);
    } catch (err) { setError(err.message); }
  };

  const editBroodstock = (fish) => { setEditingBroodstockId(fish.id); setBroodstockForm({ chip_number: fish.chip_number, species: fish.species, sex: fish.sex, birth_year: fish.birth_year ?? "", pond_id: fish.pond_id ?? "", weight_kg: fish.weight_kg ?? "", length_cm: fish.length_cm ?? "", origin: fish.origin || "", status: fish.status, notes: fish.notes || "" }); setBroodstockPhoto(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openBroodstockProfile = (fishId) => { setSelectedBroodstockId(fishId); setEditingBroodstockId(null); setBroodstockForm(emptyBroodstock()); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const closeBroodstockProfile = () => { setSelectedBroodstockId(null); setBroodstockUses([]); setPolarizations([]); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deleteBroodstock = async (id) => { if (!window.confirm("Bu çip və bütün tarixçəsi silinsin?")) return; const response = await authorizedFetch(`${API_URL}/broodstock/${id}`, { method: "DELETE" }); if (response.ok) { setSelectedBroodstockId(null); setBroodstockUses([]); setPolarizations([]); await loadBroodstock(); } };

  const saveBroodstockUse = async (event) => { event.preventDefault(); if (!selectedBroodstockId) return; const response = await authorizedFetch(`${API_URL}/broodstock/${selectedBroodstockId}/uses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...broodstockUseForm, amount: broodstockUseForm.amount ? Number(broodstockUseForm.amount) : null, fertilization_percent: broodstockUseForm.fertilization_percent ? Number(broodstockUseForm.fertilization_percent) : null, hatch_percent: broodstockUseForm.hatch_percent ? Number(broodstockUseForm.hatch_percent) : null }) }); if (response.ok) { setBroodstockUseForm(emptyBroodstockUse()); await loadBroodstockDetails(selectedBroodstockId); } else { const data = await response.json(); setError(data.detail || "İstifadə qeydi saxlanmadı"); } };
  const deleteBroodstockUse = async (id) => { await authorizedFetch(`${API_URL}/broodstock/uses/${id}`, { method: "DELETE" }); await loadBroodstockDetails(selectedBroodstockId); };

  const savePolarization = async (event) => { event.preventDefault(); if (!selectedBroodstockId) return; const response = await authorizedFetch(`${API_URL}/broodstock/${selectedBroodstockId}/polarizations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...polarizationForm, average_value: Number(polarizationForm.average_value), minimum_value: polarizationForm.minimum_value ? Number(polarizationForm.minimum_value) : null, maximum_value: polarizationForm.maximum_value ? Number(polarizationForm.maximum_value) : null, egg_count: polarizationForm.egg_count ? Number(polarizationForm.egg_count) : null }) }); if (response.ok) { setPolarizationForm(emptyPolarization()); await loadBroodstockDetails(selectedBroodstockId); } else { const data = await response.json(); setError(data.detail || "Polarizasiya qeydi saxlanmadı"); } };
  const deletePolarization = async (id) => { await authorizedFetch(`${API_URL}/broodstock/polarizations/${id}`, { method: "DELETE" }); await loadBroodstockDetails(selectedBroodstockId); };

  const filteredPonds =
    activeView === "Hamısı" || activeView === "Ölüm" || activeView === "Artım"
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

  const growthSpeciesOptions = [
    ...new Set(ponds.map((pond) => pond.species).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "az"));
  const growthBirthYearOptions = [
    ...new Set(ponds.map((pond) => pond.birth_year).filter(Boolean)),
  ].sort((a, b) => b - a);
  const growthSexOptions = [
    ...new Set(ponds.map((pond) => pond.sex || "Naməlum")),
  ].sort((a, b) => a.localeCompare(b, "az"));

  const growthPondIds = new Set(
    ponds
      .filter(
        (pond) =>
          (growthSpeciesFilter === "Hamısı" ||
            pond.species === growthSpeciesFilter) &&
          (growthBirthYearFilter === "Hamısı" ||
            String(pond.birth_year) === growthBirthYearFilter) &&
          (growthSexFilter === "Hamısı" ||
            (pond.sex || "Naməlum") === growthSexFilter)
      )
      .map((pond) => pond.id)
  );
  const filteredGrowthCalculations = growthCalculations.filter((item) =>
    growthPondIds.has(item.pond_id)
  );
  const growthTotals = filteredGrowthCalculations.reduce(
    (totals, item) => {
      totals.weightGainG += Number(item.weight_gain_g || 0);
      totals.days += Number(item.days_between || 0);
      totals.biomassGainKg += Number(item.biomass_gain_kg || 0);
      totals.feedKg += Number(item.feed_used_kg || 0);
      if (Number(item.biomass_gain_kg) > 0) {
        totals.fcrFeedKg += Number(item.feed_used_kg || 0);
        totals.fcrBiomassGainKg += Number(item.biomass_gain_kg);
      }
      return totals;
    },
    {
      weightGainG: 0,
      days: 0,
      biomassGainKg: 0,
      feedKg: 0,
      fcrFeedKg: 0,
      fcrBiomassGainKg: 0,
    }
  );
  const filteredOverallFcr =
    growthTotals.fcrBiomassGainKg > 0
      ? growthTotals.fcrFeedKg / growthTotals.fcrBiomassGainKg
      : null;
  const latestGrowth = filteredGrowthCalculations.length
    ? [...filteredGrowthCalculations].sort(
        (a, b) =>
          String(a.measurement_date).localeCompare(String(b.measurement_date)) ||
          a.record_id - b.record_id
      )[filteredGrowthCalculations.length - 1]
    : null;

  const filteredFeedProducts = feedProducts.filter((product) => {
    const query = feedWarehouseSearch.trim().toLocaleLowerCase("az");
    if (!query) return true;
    return [product.brand, product.product_name, product.species, product.batch_number, product.supplier]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("az").includes(query));
  });
  const totalFeedStockKg = filteredFeedProducts.reduce((sum, product) => sum + Number(product.current_stock_kg || 0), 0);
  const totalFeedStockValue = filteredFeedProducts.reduce((sum, product) => sum + Number(product.current_stock_kg || 0) * Number(product.unit_price || 0), 0);
  const lowStockCount = filteredFeedProducts.filter((product) => Number(product.current_stock_kg || 0) <= Number(product.minimum_stock_kg || 0)).length;
  const expiringFeedCount = filteredFeedProducts.filter((product) => {
    if (!product.expiry_date) return false;
    const days = (new Date(`${product.expiry_date}T00:00:00`) - new Date()) / 86400000;
    return days <= 30;
  }).length;
  const feedProductName = (productId) => {
    const product = feedProducts.find((item) => item.id === productId);
    return product ? `${product.brand} — ${product.product_name}` : `Məhsul ${productId}`;
  };
  const feedHistoryBrandOptions = [...new Set(feedProducts.map((product) => product.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, "az"));
  const feedHistorySupplierOptions = [...new Set(feedProducts.map((product) => product.supplier).filter(Boolean))].sort((a, b) => a.localeCompare(b, "az"));
  const feedHistoryPelletOptions = [...new Set(feedProducts.map((product) => product.pellet_size_mm).filter((value) => value != null))].sort((a, b) => Number(a) - Number(b));
  const filteredFeedTransactions = feedTransactions.filter((transaction) => {
    const product = feedProducts.find((item) => item.id === transaction.product_id);
    return (
      (feedHistoryTypeFilter === "Hamısı" || transaction.transaction_type === feedHistoryTypeFilter) &&
      (feedHistoryBrandFilter === "Hamısı" || product?.brand === feedHistoryBrandFilter) &&
      (feedHistorySupplierFilter === "Hamısı" || product?.supplier === feedHistorySupplierFilter) &&
      (feedHistoryPelletFilter === "Hamısı" || String(product?.pellet_size_mm) === feedHistoryPelletFilter) &&
      (!feedHistoryDateFrom || transaction.transaction_date >= feedHistoryDateFrom) &&
      (!feedHistoryDateTo || transaction.transaction_date <= feedHistoryDateTo)
    );
  });
  const filteredFeedHistoryQuantity = filteredFeedTransactions.reduce((sum, transaction) => sum + Number(transaction.quantity_kg || 0), 0);
  const filteredFeedHistoryAmount = filteredFeedTransactions.reduce((sum, transaction) => sum + Number(transaction.quantity_kg || 0) * Number(transaction.unit_price || 0), 0);
  const broodstockSpeciesOptions = [...new Set(broodstock.map((fish) => fish.species))].sort((a, b) => a.localeCompare(b, "az"));
  const filteredBroodstock = broodstock.filter((fish) => (broodstockSpeciesFilter === "Hamısı" || fish.species === broodstockSpeciesFilter) && (broodstockSexFilter === "Hamısı" || fish.sex === broodstockSexFilter) && (broodstockStatusFilter === "Hamısı" || fish.status === broodstockStatusFilter) && (!broodstockSearch || fish.chip_number.toLowerCase().includes(broodstockSearch.toLowerCase())));
  const selectedBroodstock = broodstock.find((fish) => fish.id === selectedBroodstockId) || null;
  const broodstockUseYears = [...new Set(broodstockUses.map((record) => new Date(`${record.use_date}T00:00:00`).getFullYear()))].sort((a, b) => b - a);

  const birthdayAlerts = employees
    .filter((employee) => employee.status === "İşləyir" && employee.birth_date)
    .map((employee) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const [, month, day] = employee.birth_date.split("-").map(Number);
      let birthday = new Date(now.getFullYear(), month - 1, day);
      birthday.setHours(0, 0, 0, 0);
      if (birthday < now) birthday.setFullYear(now.getFullYear() + 1);
      const daysLeft = Math.round((birthday - now) / 86400000);
      return { ...employee, daysLeft, birthday };
    })
    .filter((employee) => employee.daysLeft === 0 || employee.daysLeft === 1)
    .sort((a, b) => a.daysLeft - b.daysLeft);

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
          <button className={activeView === "Yem anbarı" ? "active" : ""} onClick={() => setActiveView("Yem anbarı")}>📦 Yem anbarı</button>
          <button className={activeView === "Dərman anbarı" ? "active" : ""} onClick={() => setActiveView("Dərman anbarı")}>💊 Dərman anbarı</button>
          <button className={activeView === "Satış" ? "active" : ""} onClick={() => setActiveView("Satış")}>🧾 Satış</button>
          <button className={activeView === "Soyuducu anbarı" ? "active" : ""} onClick={() => setActiveView("Soyuducu anbarı")}>❄️ Soyuducu anbarı</button>
          <button className={activeView === "İşçi personalı" ? "active" : ""} onClick={() => setActiveView("İşçi personalı")}>👥 İşçi personalı</button>
          <button className={activeView === "Damazlıq balıqlar" ? "active" : ""} onClick={() => setActiveView("Damazlıq balıqlar")}>🐟 Damazlıq balıqlar</button>
          <button className={activeView === "Artım" ? "active" : ""} onClick={() => setActiveView("Artım")}>📈 Artım</button>
          <button className={activeView === "Ölüm" ? "active" : ""} onClick={() => setActiveView("Ölüm")}>⚠️ Ölüm</button>
          <button>⚕️ Sağlamlıq</button>
          <button>📋 Hesabatlar</button>
          <button className="logout-button" onClick={logout}>🚪 Çıxış</button>
        </nav>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>{activeView === "Ölüm" ? "Ölüm qeydiyyatı" : activeView === "Artım" ? "Balıqların artımı" : activeView === "Yem anbarı" ? "Yem anbarı" : activeView === "Dərman anbarı" ? "Dərman anbarı" : activeView === "Satış" ? "Satış" : activeView === "Soyuducu anbarı" ? "Soyuducu anbarı" : activeView === "İşçi personalı" ? "İşçi personalı" : activeView === "Damazlıq balıqlar" ? "Damazlıq balıqlar" : "İdarəetmə paneli"}</h1>
            <p>{activeView === "Ölüm" ? "Gündəlik ölüm qeydləri və ümumi hesabat" : activeView === "Artım" ? "Çəki, biokütlə, SGR və FCR göstəriciləri" : activeView === "Yem anbarı" ? "Yem ehtiyatı, giriş-çıxış və son istifadə nəzarəti" : activeView === "Dərman anbarı" ? "Dərman ehtiyatı, giriş-çıxış və son istifadə nəzarəti" : activeView === "Satış" ? "Balıq satışı, ödəniş və qaimə nəzarəti" : activeView === "Soyuducu anbarı" ? "Soyuducu məhsullarının qəbulu və qalığı" : activeView === "İşçi personalı" ? "İşçilər, davamiyyət, maaş və sənədlər" : "Təsərrüfatın real vaxt üzrə ümumi vəziyyəti"}</p>
          </div>
          {activeView !== "Ölüm" && activeView !== "Artım" && activeView !== "Yem anbarı" && activeView !== "Dərman anbarı" && activeView !== "Satış" && activeView !== "Soyuducu anbarı" && activeView !== "İşçi personalı" && activeView !== "Damazlıq balıqlar" && <button className="add-button" onClick={openNewPond}>+ Yeni vahid</button>}
        </header>

        {error && <div className="dashboard-error">{error}</div>}

        {activeView === "Hamısı" && birthdayAlerts.length > 0 && (
          <section style={{ marginBottom: "20px", display: "grid", gap: "10px" }}>
            {birthdayAlerts.map((employee) => (
              <div
                key={employee.id}
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  background: employee.daysLeft === 0 ? "#dcfce7" : "#fff7d6",
                  border: employee.daysLeft === 0 ? "1px solid #86efac" : "1px solid #facc15",
                  color: "#334155",
                  fontWeight: 600,
                }}
              >
                🎂 {employee.daysLeft === 0
                  ? `Bu gün ${employee.full_name} adlı işçinin doğum günüdür!`
                  : `Sabah ${employee.full_name} adlı işçinin doğum günüdür — ${employee.birthday.toLocaleDateString("az-AZ", { day: "numeric", month: "long" })}`}
              </div>
            ))}
          </section>
        )}

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
                    <input
                      list="mortality-pond-list"
                      value={mortalityPondSearch}
                      placeholder="Hovuzun adını yazın..."
                      onChange={(e) => {
                        const searchValue = e.target.value;
                        const selectedPond = ponds.find(
                          (pond) =>
                            `${pond.name} — ${pond.unit_type || "Hovuz"}` ===
                            searchValue
                        );

                        setMortalityPondSearch(searchValue);
                        setMortalityForm({
                          ...mortalityForm,
                          pond_id: selectedPond ? String(selectedPond.id) : "",
                          species:
                            selectedPond?.species || mortalityForm.species,
                        });
                      }}
                      required
                    />
                    <datalist id="mortality-pond-list">
                      {ponds.map((pond) => (
                        <option
                          key={pond.id}
                          value={`${pond.name} — ${pond.unit_type || "Hovuz"}`}
                        />
                      ))}
                    </datalist>
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
                  <div className="form-field mortality-notes">
                    <label>Ölü balığın şəkilləri (maksimum 5)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      multiple
                      onChange={(e) => {
                        const selectedFiles = Array.from(e.target.files || []);
                        if (selectedFiles.length === 0) return;

                        if (
                          selectedFiles.some(
                            (file) => file.size > 10 * 1024 * 1024
                          )
                        ) {
                          setError("Hər şəkil maksimum 10 MB ola bilər");
                          e.target.value = "";
                          return;
                        }

                        const remainingCount =
                          5 -
                          existingMortalityPhotos.length -
                          mortalityPhotos.length;

                        if (selectedFiles.length > remainingCount) {
                          setError(
                            `Ən çox ${remainingCount} şəkil də əlavə edə bilərsiniz`
                          );
                          e.target.value = "";
                          return;
                        }

                        setError("");
                        setMortalityPhotos([
                          ...mortalityPhotos,
                          ...selectedFiles,
                        ]);
                        setMortalityPhotoPreviews([
                          ...mortalityPhotoPreviews,
                          ...selectedFiles.map((file) => ({
                            name: file.name,
                            url: URL.createObjectURL(file),
                          })),
                        ]);
                        e.target.value = "";
                      }}
                    />
                    <small>
                      Telefonda kamera, kompüterdə şəkil seçimi açılır. Hər şəkil
                      maksimum 10 MB ola bilər.
                    </small>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                      {existingMortalityPhotos.map((photo, index) => (
                        <img
                          key={`saved-${photo.id ?? index}`}
                          src={`${API_URL}${photo.photo_path}`}
                          alt="Saxlanmış ölü balıq"
                          style={{ width: "120px", height: "90px", objectFit: "cover", borderRadius: "10px" }}
                        />
                      ))}
                      {mortalityPhotoPreviews.map((preview, index) => (
                        <div key={preview.url} style={{ position: "relative" }}>
                          <img
                            src={preview.url}
                            alt={`Yeni şəkil ${index + 1}`}
                            style={{ width: "120px", height: "90px", objectFit: "cover", borderRadius: "10px" }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(preview.url);
                              setMortalityPhotos(
                                mortalityPhotos.filter((_, itemIndex) => itemIndex !== index)
                              );
                              setMortalityPhotoPreviews(
                                mortalityPhotoPreviews.filter((_, itemIndex) => itemIndex !== index)
                              );
                            }}
                            style={{ position: "absolute", top: "4px", right: "4px", border: 0, borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", background: "#dc2626", color: "white" }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  {editingMortalityId && <button type="button" className="cancel-button" onClick={() => { mortalityPhotoPreviews.forEach((item) => URL.revokeObjectURL(item.url)); setEditingMortalityId(null); setMortalityForm(emptyMortality()); setMortalityPondSearch(""); setMortalityPhotos([]); setMortalityPhotoPreviews([]); setExistingMortalityPhotos([]); }}>Ləğv et</button>}
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
                <thead><tr><th>Tarix</th><th>Vahid</th><th>Balıq növü</th><th>Doğum ili</th><th>Yaş</th><th>Cins</th><th>Ölüm sayı</th><th>Orta çəki</th><th>Biokütlə</th><th>Səbəb</th><th>Qeyd</th><th>Şəkil</th><th>Əməliyyat</th></tr></thead>
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
                      <td>
                        {(() => {
                          const recordPhotos = [...(record.photos || [])];
                          if (record.photo_path && !recordPhotos.some((item) => item.photo_path === record.photo_path)) {
                            recordPhotos.unshift({ id: null, photo_path: record.photo_path });
                          }
                          return recordPhotos.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", minWidth: "140px" }}>
                              {recordPhotos.map((photo, index) => (
                                <a key={photo.id ?? `legacy-${index}`} href={`${API_URL}${photo.photo_path}`} target="_blank" rel="noreferrer">
                                  <img src={`${API_URL}${photo.photo_path}`} alt={`Ölü balıq ${index + 1}`} style={{ width: "54px", height: "42px", objectFit: "cover", borderRadius: "6px" }} />
                                </a>
                              ))}
                            </div>
                          ) : "—";
                        })()}
                      </td>
                      <td><div className="action-buttons"><button className="edit-button" onClick={() => editMortality(record)}>Redaktə et</button><button className="delete-button" onClick={() => deleteMortality(record.id)}>Sil</button></div></td>
                    </tr>
                  ))}
                  {mortalityRecords.length === 0 && <tr><td colSpan="13" className="empty-row">Ölüm qeydi yoxdur</td></tr>}
                </tbody>
              </table>
            </section>
          </>
        ) : activeView === "Artım" ? (
          <>
            <section className="table-section mortality-form-section">
              <div className="section-title">
                <div>
                  <h2>{editingGrowthId ? "Artım qeydini redaktə et" : "Yeni çəki ölçüsü"}</h2>
                  <p>Eyni vahid üzrə hər ölçmə əvvəlki tarixlə avtomatik müqayisə edilir</p>
                </div>
              </div>
              <form className="mortality-form" onSubmit={saveGrowth}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Tarix *</label>
                    <input type="date" value={growthForm.measurement_date} onChange={(e) => setGrowthForm({ ...growthForm, measurement_date: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label>Vahid *</label>
                    <select value={growthForm.pond_id} onChange={(e) => {
                      const pond = ponds.find((item) => item.id === Number(e.target.value));
                      setGrowthForm({
                        ...growthForm,
                        pond_id: e.target.value,
                        fish_count: pond ? String(pond.fish_count ?? "") : "",
                        average_weight_g: pond ? String(pond.average_weight_g ?? "") : "",
                      });
                    }} required disabled={Boolean(editingGrowthId)}>
                      <option value="">Vahid seçin</option>
                      {ponds.map((pond) => <option key={pond.id} value={pond.id}>{pond.name} — {pond.unit_type || "Hovuz"}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Balıq sayı *</label>
                    <input type="number" min="0" value={growthForm.fish_count} onChange={(e) => setGrowthForm({ ...growthForm, fish_count: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label>Yeni orta çəki (qram) *</label>
                    <input type="number" min="0.001" step="0.001" value={growthForm.average_weight_g} onChange={(e) => setGrowthForm({ ...growthForm, average_weight_g: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label>Ölçmələr arasında verilən yem (kq)</label>
                    <input type="number" min="0" step="0.01" value={growthForm.feed_used_kg} onChange={(e) => setGrowthForm({ ...growthForm, feed_used_kg: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Qeyd</label>
                    <input value={growthForm.notes} onChange={(e) => setGrowthForm({ ...growthForm, notes: e.target.value })} placeholder="Məsələn: 50 balıq nümunəsi çəkildi" />
                  </div>
                </div>
                <div className="form-actions">
                  {editingGrowthId && <button type="button" className="cancel-button" onClick={cancelGrowthEdit}>Ləğv et</button>}
                  <button type="submit" className="save-button" disabled={savingGrowth}>{savingGrowth ? "Yadda saxlanılır..." : editingGrowthId ? "Dəyişiklikləri saxla" : "Ölçünü yadda saxla"}</button>
                </div>
              </form>
            </section>

            <section className="cards">
              <div className="card"><span className="icon blue">📏</span><div><p>Ölçü sayı</p><h2>{filteredGrowthCalculations.length}</h2></div></div>
              <div className="card"><span className="icon green">⚖️</span><div><p>Son orta çəki</p><h2>{latestGrowth ? `${Number(latestGrowth.current_weight_g).toFixed(2)} q` : "—"}</h2></div></div>
              <div className="card"><span className="icon orange">📈</span><div><p>Son günlük artım</p><h2>{latestGrowth?.daily_weight_gain_g != null ? `${Number(latestGrowth.daily_weight_gain_g).toFixed(3)} q` : "—"}</h2></div></div>
              <div className="card"><span className="icon purple">🔄</span><div><p>Son FCR</p><h2>{latestGrowth?.fcr != null ? Number(latestGrowth.fcr).toFixed(2) : "—"}</h2></div></div>
            </section>

            <section className="table-section">
              <div className="section-title"><div><h2>Artım hesabatı</h2><p>İlk ölçüdən sonrakı qeydlərdə artım göstəriciləri hesablanır</p></div></div>
              <div className="form-grid" style={{ padding: "20px 24px" }}>
                <div className="form-field">
                  <label>Balıq növü üzrə filtr</label>
                  <select value={growthSpeciesFilter} onChange={(e) => setGrowthSpeciesFilter(e.target.value)}>
                    <option value="Hamısı">Bütün növlər</option>
                    {growthSpeciesOptions.map((species) => <option key={species} value={species}>{species}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Yaş üzrə filtr</label>
                  <select value={growthBirthYearFilter} onChange={(e) => setGrowthBirthYearFilter(e.target.value)}>
                    <option value="Hamısı">Bütün yaşlar</option>
                    {growthBirthYearOptions.map((year) => <option key={year} value={String(year)}>{new Date().getFullYear() - Number(year)} yaş ({year})</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Cins üzrə filtr</label>
                  <select value={growthSexFilter} onChange={(e) => setGrowthSexFilter(e.target.value)}>
                    <option value="Hamısı">Bütün cinslər</option>
                    {growthSexOptions.map((sex) => <option key={sex} value={sex}>{sex}</option>)}
                  </select>
                </div>
              </div>
              <table>
                <thead><tr><th>Tarix</th><th>Vahid</th><th>Balıq növü</th><th>Yaş</th><th>Cins</th><th>Əvvəlki çəki</th><th>Yeni çəki</th><th>Fərq</th><th>Gün</th><th>Günlük artım</th><th>Artım %</th><th>SGR %/gün</th><th>Biokütlə</th><th>Biokütlə artımı</th><th>Yem</th><th>FCR</th><th>Əməliyyat</th></tr></thead>
                <tbody>
                  {[...filteredGrowthCalculations].reverse().map((item) => {
                    const growthPond = ponds.find((pond) => pond.id === item.pond_id);
                    const measurementYear = new Date(`${item.measurement_date}T00:00:00`).getFullYear();
                    const hasGrowthResult = item.weight_gain_g != null;
                    const isBadGrowth = hasGrowthResult && (Number(item.weight_gain_g) <= 0 || (item.fcr != null && Number(item.fcr) > 1.5));
                    const isGoodGrowth = hasGrowthResult && !isBadGrowth;
                    return <tr key={item.record_id} style={{ backgroundColor: isGoodGrowth ? "#dcfce7" : isBadGrowth ? "#fee2e2" : undefined }}>
                      <td>{item.measurement_date}</td>
                      <td><strong>{pondName(item.pond_id)}</strong></td>
                      <td>{growthPond?.species || "—"}</td>
                      <td>{growthPond?.birth_year ? `${measurementYear - Number(growthPond.birth_year)} yaş` : "—"}</td>
                      <td>{growthPond?.sex || "Naməlum"}</td>
                      <td>{item.previous_weight_g != null ? `${Number(item.previous_weight_g).toFixed(2)} q` : "İlk ölçü"}</td>
                      <td>{Number(item.current_weight_g).toFixed(2)} q</td>
                      <td>{item.weight_gain_g != null ? `${Number(item.weight_gain_g).toFixed(2)} q` : "—"}</td>
                      <td>{item.days_between ?? "—"}</td>
                      <td>{item.daily_weight_gain_g != null ? `${Number(item.daily_weight_gain_g).toFixed(3)} q` : "—"}</td>
                      <td>{item.growth_percent != null ? `${Number(item.growth_percent).toFixed(2)}%` : "—"}</td>
                      <td>{item.sgr_percent_day != null ? `${Number(item.sgr_percent_day).toFixed(3)}%` : "—"}</td>
                      <td>{Number(item.current_biomass_kg).toFixed(2)} kq</td>
                      <td>{item.biomass_gain_kg != null ? `${Number(item.biomass_gain_kg).toFixed(2)} kq` : "—"}</td>
                      <td>{Number(item.feed_used_kg).toFixed(2)} kq</td>
                      <td>{item.fcr != null ? Number(item.fcr).toFixed(2) : "—"}</td>
                      <td><button className="edit-button" onClick={() => editGrowth(item.record_id)}>Redaktə et</button></td>
                    </tr>
                  })}
                  {filteredGrowthCalculations.length === 0 && <tr><td colSpan="17" className="empty-row">Seçilən filtr üzrə artım qeydi yoxdur</td></tr>}
                </tbody>
                {filteredGrowthCalculations.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="5"><strong>Filtr üzrə cəmi</strong></td>
                      <td>—</td>
                      <td>—</td>
                      <td><strong>{growthTotals.weightGainG.toFixed(2)} q</strong></td>
                      <td><strong>{growthTotals.days}</strong></td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td><strong>{growthTotals.biomassGainKg.toFixed(2)} kq</strong></td>
                      <td><strong>{growthTotals.feedKg.toFixed(2)} kq</strong></td>
                      <td><strong>{filteredOverallFcr != null ? filteredOverallFcr.toFixed(2) : "—"}</strong></td>
                      <td>—</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </section>
          </>
        ) : activeView === "İşçi personalı" ? (
          <Personnel token={token} />
        ) : activeView === "Soyuducu anbarı" ? (
          <ColdStorage token={token} />
        ) : activeView === "Satış" ? (
          <Sales token={token} />
        ) : activeView === "Dərman anbarı" ? (
          <DrugWarehouse token={token} />
        ) : activeView === "Yem anbarı" ? (
          <>
            <section className="cards">
              <div className="card"><span className="icon blue">📦</span><div><p>Yem məhsulu</p><h2>{filteredFeedProducts.length}</h2></div></div>
              <div className="card"><span className="icon green">⚖️</span><div><p>Ümumi qalıq</p><h2>{totalFeedStockKg.toFixed(2)} kq</h2></div></div>
              <div className="card"><span className="icon orange">₼</span><div><p>Stok dəyəri</p><h2>{totalFeedStockValue.toFixed(2)} AZN</h2></div></div>
              <div className="card"><span className="icon purple">⚠️</span><div><p>Xəbərdarlıq</p><h2>{lowStockCount + expiringFeedCount}</h2></div></div>
            </section>

            <section className="table-section mortality-form-section">
              <div className="section-title"><div><h2>{editingFeedProductId ? "Yem məhsulunu redaktə et" : "Yeni yem məhsulu"}</h2><p>Məhsul, partiya, qiymət və son istifadə məlumatları</p></div></div>
              <form className="mortality-form" onSubmit={saveFeedProduct}>
                <div className="form-grid">
                  <div className="form-field"><label>Marka *</label><input value={feedProductForm.brand} onChange={(e) => setFeedProductForm({ ...feedProductForm, brand: e.target.value })} placeholder="Məsələn: Aller Aqua" required /></div>
                  <div className="form-field"><label>Məhsul adı *</label><input value={feedProductForm.product_name} onChange={(e) => setFeedProductForm({ ...feedProductForm, product_name: e.target.value })} placeholder="Məsələn: Futura" required /></div>
                  <div className="form-field"><label>Balıq növü</label><input value={feedProductForm.species} onChange={(e) => setFeedProductForm({ ...feedProductForm, species: e.target.value })} placeholder="Məsələn: Nərə" /></div>
                  <div className="form-field"><label>Dənə ölçüsü (mm)</label><input type="number" min="0" step="0.01" value={feedProductForm.pellet_size_mm} onChange={(e) => setFeedProductForm({ ...feedProductForm, pellet_size_mm: e.target.value })} /></div>
                  <div className="form-field"><label>Partiya nömrəsi</label><input value={feedProductForm.batch_number} onChange={(e) => setFeedProductForm({ ...feedProductForm, batch_number: e.target.value })} /></div>
                  <div className="form-field"><label>Təchizatçı</label><input value={feedProductForm.supplier} onChange={(e) => setFeedProductForm({ ...feedProductForm, supplier: e.target.value })} /></div>
                  <div className="form-field"><label>İstehsal tarixi</label><input type="date" value={feedProductForm.manufacture_date} onChange={(e) => setFeedProductForm({ ...feedProductForm, manufacture_date: e.target.value })} /></div>
                  <div className="form-field"><label>Son istifadə tarixi</label><input type="date" value={feedProductForm.expiry_date} onChange={(e) => setFeedProductForm({ ...feedProductForm, expiry_date: e.target.value })} /></div>
                  <div className="form-field"><label>1 kq qiyməti (AZN)</label><input type="number" min="0" step="0.01" value={feedProductForm.unit_price} onChange={(e) => setFeedProductForm({ ...feedProductForm, unit_price: e.target.value })} /></div>
                  <div className="form-field"><label>Minimum stok (kq)</label><input type="number" min="0" step="0.01" value={feedProductForm.minimum_stock_kg} onChange={(e) => setFeedProductForm({ ...feedProductForm, minimum_stock_kg: e.target.value })} /></div>
                  <div className="form-field mortality-notes"><label>Qeyd</label><input value={feedProductForm.notes} onChange={(e) => setFeedProductForm({ ...feedProductForm, notes: e.target.value })} /></div>
                </div>
                <div className="form-actions">
                  {editingFeedProductId && <button type="button" className="cancel-button" onClick={() => { setEditingFeedProductId(null); setFeedProductForm(emptyFeedProduct()); }}>Ləğv et</button>}
                  <button type="submit" className="save-button" disabled={savingFeedWarehouse}>{savingFeedWarehouse ? "Yadda saxlanılır..." : editingFeedProductId ? "Dəyişiklikləri saxla" : "Məhsulu əlavə et"}</button>
                </div>
              </form>
            </section>

            <section className="table-section mortality-form-section">
              <div className="section-title"><div><h2>{editingFeedTransactionId ? "Anbar əməliyyatını redaktə et" : "Yem girişi / çıxışı"}</h2><p>Hər əməliyyatdan sonra qalıq avtomatik yenilənir</p></div></div>
              <form className="mortality-form" onSubmit={saveFeedTransaction}>
                <div className="form-grid">
                  <div className="form-field"><label>Yem məhsulu *</label><select value={feedTransactionForm.product_id} disabled={Boolean(editingFeedTransactionId)} onChange={(e) => { const product = feedProducts.find((item) => item.id === Number(e.target.value)); setFeedTransactionForm({ ...feedTransactionForm, product_id: e.target.value, unit_price: product?.unit_price ?? "" }); }} required><option value="">Məhsul seçin</option>{feedProducts.map((product) => <option key={product.id} value={product.id}>{product.brand} — {product.product_name} ({Number(product.current_stock_kg).toFixed(2)} kq)</option>)}</select></div>
                  <div className="form-field"><label>Əməliyyat *</label><select value={feedTransactionForm.transaction_type} onChange={(e) => setFeedTransactionForm({ ...feedTransactionForm, transaction_type: e.target.value })}><option value="Giriş">Giriş</option><option value="Çıxış">Çıxış</option></select></div>
                  <div className="form-field"><label>Miqdar (kq) *</label><input type="number" min="0.001" step="0.001" value={feedTransactionForm.quantity_kg} onChange={(e) => setFeedTransactionForm({ ...feedTransactionForm, quantity_kg: e.target.value })} required /></div>
                  <div className="form-field"><label>Tarix *</label><input type="date" value={feedTransactionForm.transaction_date} onChange={(e) => setFeedTransactionForm({ ...feedTransactionForm, transaction_date: e.target.value })} required /></div>
                  <div className="form-field"><label>1 kq qiyməti (AZN)</label><input type="number" min="0" step="0.01" value={feedTransactionForm.unit_price} onChange={(e) => setFeedTransactionForm({ ...feedTransactionForm, unit_price: e.target.value })} /></div>
                  <div className="form-field"><label>Qeyd</label><input value={feedTransactionForm.notes} onChange={(e) => setFeedTransactionForm({ ...feedTransactionForm, notes: e.target.value })} /></div>
                  <div className="form-field mortality-notes"><label>Qaimənin şəkli</label><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => { const file = e.target.files?.[0] || null; if (file && file.size > 10 * 1024 * 1024) { setError("Qaimə şəkli maksimum 10 MB ola bilər"); e.target.value = ""; setFeedInvoicePhoto(null); return; } setError(""); setFeedInvoicePhoto(file); }} /><small>Telefonda kamera, kompüterdə şəkil seçimi açılır. JPG, PNG və WEBP; maksimum 10 MB.</small>{feedInvoicePhoto && <p><strong>Seçildi:</strong> {feedInvoicePhoto.name}</p>}</div>
                </div>
                <div className="form-actions">
                  {editingFeedTransactionId && <button type="button" className="cancel-button" onClick={() => { setEditingFeedTransactionId(null); setFeedTransactionForm(emptyFeedTransaction()); setFeedInvoicePhoto(null); }}>Ləğv et</button>}
                  <button type="submit" className="save-button" disabled={savingFeedWarehouse}>{savingFeedWarehouse ? "Yadda saxlanılır..." : editingFeedTransactionId ? "Dəyişiklikləri saxla" : "Əməliyyatı yadda saxla"}</button>
                </div>
              </form>
            </section>

            <section className="table-section">
              <div className="section-title"><div><h2>Yem qalığı</h2><p>Minimum stok və son istifadə xəbərdarlıqları</p></div><input value={feedWarehouseSearch} onChange={(e) => setFeedWarehouseSearch(e.target.value)} placeholder="Marka, məhsul, növ, partiya axtar..." style={{ maxWidth: "360px" }} /></div>
              <table>
                <thead><tr><th>Marka</th><th>Məhsul</th><th>Növ</th><th>Ölçü</th><th>Partiya</th><th>Təchizatçı</th><th>Son istifadə</th><th>Qalıq</th><th>Minimum</th><th>Qiymət</th><th>Dəyər</th><th>Status</th><th>Əməliyyat</th></tr></thead>
                <tbody>
                  {filteredFeedProducts.map((product) => { const low = Number(product.current_stock_kg) <= Number(product.minimum_stock_kg); const expired = product.expiry_date && new Date(`${product.expiry_date}T00:00:00`) <= new Date(); return <tr key={product.id}><td><strong>{product.brand}</strong></td><td>{product.product_name}</td><td>{product.species || "—"}</td><td>{product.pellet_size_mm != null ? `${product.pellet_size_mm} mm` : "—"}</td><td>{product.batch_number || "—"}</td><td>{product.supplier || "—"}</td><td>{product.expiry_date || "—"}</td><td><strong>{Number(product.current_stock_kg).toFixed(2)} kq</strong></td><td>{Number(product.minimum_stock_kg).toFixed(2)} kq</td><td>{Number(product.unit_price).toFixed(2)} AZN</td><td>{(Number(product.current_stock_kg) * Number(product.unit_price)).toFixed(2)} AZN</td><td><span className="status">{expired ? "Vaxtı bitib" : low ? "Az qalıb" : "Normal"}</span></td><td><div className="action-buttons"><button className="edit-button" onClick={() => editFeedProduct(product)}>Redaktə et</button><button className="delete-button" onClick={() => deleteFeedProduct(product.id)}>Sil</button></div></td></tr>; })}
                  {filteredFeedProducts.length === 0 && <tr><td colSpan="13" className="empty-row">Yem məhsulu yoxdur</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="table-section">
              <div className="section-title"><div><h2>Giriş–çıxış tarixçəsi</h2><p>Bütün anbar hərəkətləri</p></div></div>
              <div className="form-grid" style={{ padding: "20px 24px" }}>
                <div className="form-field"><label>Giriş / çıxış</label><select value={feedHistoryTypeFilter} onChange={(e) => setFeedHistoryTypeFilter(e.target.value)}><option value="Hamısı">Hamısı</option><option value="Giriş">Giriş</option><option value="Çıxış">Çıxış</option></select></div>
                <div className="form-field"><label>Marka</label><select value={feedHistoryBrandFilter} onChange={(e) => setFeedHistoryBrandFilter(e.target.value)}><option value="Hamısı">Bütün markalar</option>{feedHistoryBrandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div>
                <div className="form-field"><label>Təchizatçı firma</label><select value={feedHistorySupplierFilter} onChange={(e) => setFeedHistorySupplierFilter(e.target.value)}><option value="Hamısı">Bütün firmalar</option>{feedHistorySupplierOptions.map((supplier) => <option key={supplier} value={supplier}>{supplier}</option>)}</select></div>
                <div className="form-field"><label>Yem ölçüsü (mm)</label><select value={feedHistoryPelletFilter} onChange={(e) => setFeedHistoryPelletFilter(e.target.value)}><option value="Hamısı">Bütün ölçülər</option>{feedHistoryPelletOptions.map((size) => <option key={size} value={String(size)}>{size} mm</option>)}</select></div>
                <div className="form-field"><label>Başlanğıc tarix</label><input type="date" value={feedHistoryDateFrom} onChange={(e) => setFeedHistoryDateFrom(e.target.value)} /></div>
                <div className="form-field"><label>Son tarix</label><input type="date" min={feedHistoryDateFrom || undefined} value={feedHistoryDateTo} onChange={(e) => setFeedHistoryDateTo(e.target.value)} /></div>
              </div>
              <table>
                <thead><tr><th>Tarix</th><th>Marka / məhsul</th><th>Firma</th><th>Ölçü</th><th>Əməliyyat</th><th>Miqdar</th><th>Qiymət</th><th>Məbləğ</th><th>Qeyd</th><th>Qaimə</th><th>Əməliyyat</th></tr></thead>
                <tbody>
                  {filteredFeedTransactions.map((transaction) => { const product = feedProducts.find((item) => item.id === transaction.product_id); return <tr key={transaction.id}><td>{transaction.transaction_date}</td><td><strong>{feedProductName(transaction.product_id)}</strong></td><td>{product?.supplier || "—"}</td><td>{product?.pellet_size_mm != null ? `${product.pellet_size_mm} mm` : "—"}</td><td>{transaction.transaction_type}</td><td>{Number(transaction.quantity_kg).toFixed(3)} kq</td><td>{transaction.unit_price != null ? `${Number(transaction.unit_price).toFixed(2)} AZN` : "—"}</td><td>{transaction.unit_price != null ? `${(Number(transaction.quantity_kg) * Number(transaction.unit_price)).toFixed(2)} AZN` : "—"}</td><td>{transaction.notes || "—"}</td><td>{transaction.document_path ? <a href={`${API_URL}${transaction.document_path}`} target="_blank" rel="noreferrer"><img src={`${API_URL}${transaction.document_path}`} alt="Qaimə" style={{ width: "70px", height: "50px", objectFit: "cover", borderRadius: "6px" }} /></a> : "—"}</td><td><div className="action-buttons"><button className="edit-button" onClick={() => editFeedTransaction(transaction)}>Redaktə et</button><button className="delete-button" onClick={() => deleteFeedTransaction(transaction.id)}>Sil</button></div></td></tr>; })}
                  {filteredFeedTransactions.length === 0 && <tr><td colSpan="11" className="empty-row">Seçilən filtr üzrə əməliyyat yoxdur</td></tr>}
                </tbody>
                {filteredFeedTransactions.length > 0 && <tfoot><tr><td colSpan="5"><strong>Filtr üzrə cəmi</strong></td><td><strong>{filteredFeedHistoryQuantity.toFixed(3)} kq</strong></td><td>—</td><td><strong>{filteredFeedHistoryAmount.toFixed(2)} AZN</strong></td><td colSpan="3">—</td></tr></tfoot>}
              </table>
            </section>
          </>
        ) : activeView === "Damazlıq balıqlar" ? (
          <>
            {!selectedBroodstockId && <>
            <section className="table-section mortality-form-section">
              <div className="section-title"><div><h2>{editingBroodstockId ? "Damazlıq balığı redaktə et" : "Yeni çip əlavə et"}</h2><p>Hər balıq ayrıca çip nömrəsi ilə qeyd olunur</p></div></div>
              <form className="mortality-form" onSubmit={saveBroodstock}><div className="form-grid">
                <div className="form-field"><label>Çip nömrəsi *</label><input value={broodstockForm.chip_number} onChange={(e) => setBroodstockForm({ ...broodstockForm, chip_number: e.target.value })} required /></div>
                <div className="form-field"><label>Növ *</label><input value={broodstockForm.species} onChange={(e) => setBroodstockForm({ ...broodstockForm, species: e.target.value })} required /></div>
                <div className="form-field"><label>Cins *</label><select value={broodstockForm.sex} onChange={(e) => setBroodstockForm({ ...broodstockForm, sex: e.target.value })}><option>Dişi</option><option>Erkək</option><option>Naməlum</option></select></div>
                <div className="form-field"><label>Doğum ili</label><input type="number" min="1900" max={new Date().getFullYear()} value={broodstockForm.birth_year} onChange={(e) => setBroodstockForm({ ...broodstockForm, birth_year: e.target.value })} /></div>
                <div className="form-field"><label>Hovuz</label><select value={broodstockForm.pond_id} onChange={(e) => setBroodstockForm({ ...broodstockForm, pond_id: e.target.value })}><option value="">Seçilməyib</option>{ponds.map((pond) => <option key={pond.id} value={pond.id}>{pond.name}</option>)}</select></div>
                <div className="form-field"><label>Çəki (kq)</label><input type="number" min="0" step="0.01" value={broodstockForm.weight_kg} onChange={(e) => setBroodstockForm({ ...broodstockForm, weight_kg: e.target.value })} /></div>
                <div className="form-field"><label>Uzunluq (sm)</label><input type="number" min="0" step="0.1" value={broodstockForm.length_cm} onChange={(e) => setBroodstockForm({ ...broodstockForm, length_cm: e.target.value })} /></div>
                <div className="form-field"><label>Mənşə</label><input value={broodstockForm.origin} onChange={(e) => setBroodstockForm({ ...broodstockForm, origin: e.target.value })} /></div>
                <div className="form-field"><label>Status</label><select value={broodstockForm.status} onChange={(e) => setBroodstockForm({ ...broodstockForm, status: e.target.value })}><option>Aktiv</option><option>Hazır</option><option>İstirahətdə</option><option>Satılıb</option><option>Ölüb</option></select></div>
                <div className="form-field"><label>Balığın şəkli</label><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => setBroodstockPhoto(e.target.files?.[0] || null)} /></div>
                <div className="form-field mortality-notes"><label>Qeyd</label><input value={broodstockForm.notes} onChange={(e) => setBroodstockForm({ ...broodstockForm, notes: e.target.value })} /></div>
              </div><div className="form-actions">{editingBroodstockId && <button type="button" className="cancel-button" onClick={() => { setEditingBroodstockId(null); setBroodstockForm(emptyBroodstock()); setBroodstockPhoto(null); }}>Ləğv et</button>}<button className="save-button">{editingBroodstockId ? "Dəyişiklikləri saxla" : "Çipi əlavə et"}</button></div></form>
            </section>

            <section className="table-section"><div className="section-title"><div><h2>Çiplərin siyahısı</h2><p>Çip nömrəsinə klikləyib bütün məlumatları açın</p></div></div>
              <div className="form-grid" style={{ padding: "20px 24px" }}><div className="form-field"><label>Çip axtarışı</label><input value={broodstockSearch} onChange={(e) => setBroodstockSearch(e.target.value)} /></div><div className="form-field"><label>Növ</label><select value={broodstockSpeciesFilter} onChange={(e) => setBroodstockSpeciesFilter(e.target.value)}><option value="Hamısı">Bütün növlər</option>{broodstockSpeciesOptions.map((item) => <option key={item}>{item}</option>)}</select></div><div className="form-field"><label>Cins</label><select value={broodstockSexFilter} onChange={(e) => setBroodstockSexFilter(e.target.value)}><option value="Hamısı">Hamısı</option><option>Dişi</option><option>Erkək</option><option>Naməlum</option></select></div><div className="form-field"><label>Status</label><select value={broodstockStatusFilter} onChange={(e) => setBroodstockStatusFilter(e.target.value)}><option value="Hamısı">Bütün statuslar</option><option>Aktiv</option><option>Hazır</option><option>İstirahətdə</option><option>Satılıb</option><option>Ölüb</option></select></div></div>
              <table><thead><tr><th>Çip</th><th>Növ</th><th>Cins</th><th>Yaş</th><th>Çəki</th><th>Hovuz</th><th>Status</th><th>Əməliyyat</th></tr></thead><tbody>{filteredBroodstock.map((fish) => <tr key={fish.id}><td><button className="edit-button" onClick={() => openBroodstockProfile(fish.id)}>{fish.chip_number}</button></td><td>{fish.species}</td><td>{fish.sex}</td><td>{fish.birth_year ? `${new Date().getFullYear() - fish.birth_year} yaş` : "—"}</td><td>{fish.weight_kg != null ? `${fish.weight_kg} kq` : "—"}</td><td>{fish.pond_id ? pondName(fish.pond_id) : "—"}</td><td>{fish.status}</td><td><div className="action-buttons"><button className="edit-button" onClick={() => editBroodstock(fish)}>Redaktə et</button><button className="delete-button" onClick={() => deleteBroodstock(fish.id)}>Sil</button></div></td></tr>)}{filteredBroodstock.length === 0 && <tr><td colSpan="8" className="empty-row">Çip yoxdur</td></tr>}</tbody></table>
            </section>
            </>}

            {selectedBroodstock && <>
              <section className="table-section">
                <div className="section-title"><div><button className="cancel-button" onClick={closeBroodstockProfile}>← Çip siyahısına qayıt</button><h2 style={{ marginTop: "14px" }}>Çip: {selectedBroodstock.chip_number}</h2><p>Bu balığa aid bütün məlumatlar</p></div><div className="action-buttons"><button className="edit-button" onClick={() => { editBroodstock(selectedBroodstock); closeBroodstockProfile(); }}>Əsas məlumatları redaktə et</button></div></div>
                <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "24px", padding: "24px" }}>
                  <div>{selectedBroodstock.photo_path ? <img src={`${API_URL}${selectedBroodstock.photo_path}`} alt="Damazlıq balıq" style={{ width: "180px", height: "140px", objectFit: "cover", borderRadius: "12px" }} /> : <div style={{ width: "180px", height: "140px", display: "grid", placeItems: "center", background: "#eef4f7", borderRadius: "12px", fontSize: "48px" }}>🐟</div>}</div>
                  <div className="form-grid">
                    <div><strong>Növ:</strong><p>{selectedBroodstock.species}</p></div><div><strong>Cins:</strong><p>{selectedBroodstock.sex}</p></div>
                    <div><strong>Doğum ili / yaş:</strong><p>{selectedBroodstock.birth_year ? `${selectedBroodstock.birth_year} / ${new Date().getFullYear() - selectedBroodstock.birth_year} yaş` : "—"}</p></div><div><strong>Hovuz:</strong><p>{selectedBroodstock.pond_id ? pondName(selectedBroodstock.pond_id) : "—"}</p></div>
                    <div><strong>Çəki:</strong><p>{selectedBroodstock.weight_kg != null ? `${selectedBroodstock.weight_kg} kq` : "—"}</p></div><div><strong>Uzunluq:</strong><p>{selectedBroodstock.length_cm != null ? `${selectedBroodstock.length_cm} sm` : "—"}</p></div>
                    <div><strong>Mənşə:</strong><p>{selectedBroodstock.origin || "—"}</p></div><div><strong>Status:</strong><p>{selectedBroodstock.status}</p></div>
                    <div><strong>İstifadə olunduğu illər:</strong><p>{broodstockUseYears.join(", ") || "Hələ istifadə edilməyib"}</p></div><div><strong>Son polarizasiya:</strong><p>{polarizations[0] ? `${polarizations[0].average_value} (${polarizations[0].measurement_date})` : "—"}</p></div>
                    <div style={{ gridColumn: "1 / -1" }}><strong>Qeyd:</strong><p>{selectedBroodstock.notes || "—"}</p></div>
                  </div>
                </div>
              </section>
              <section className="table-section mortality-form-section"><div className="section-title"><div><h2>İstifadə qeydi</h2><p>Kürü, sperma, hormon və nəticə</p></div></div><form className="mortality-form" onSubmit={saveBroodstockUse}><div className="form-grid"><div className="form-field"><label>Tarix</label><input type="date" value={broodstockUseForm.use_date} onChange={(e) => setBroodstockUseForm({ ...broodstockUseForm, use_date: e.target.value })} /></div><div className="form-field"><label>İstifadə</label><select value={broodstockUseForm.use_type} onChange={(e) => setBroodstockUseForm({ ...broodstockUseForm, use_type: e.target.value })}><option>Kürü</option><option>Sperma</option><option>Sınaq</option></select></div><div className="form-field"><label>Miqdar</label><input type="number" step="0.01" value={broodstockUseForm.amount} onChange={(e) => setBroodstockUseForm({ ...broodstockUseForm, amount: e.target.value })} /></div><div className="form-field"><label>Mayalanma %</label><input type="number" min="0" max="100" value={broodstockUseForm.fertilization_percent} onChange={(e) => setBroodstockUseForm({ ...broodstockUseForm, fertilization_percent: e.target.value })} /></div><div className="form-field"><label>Çıxım %</label><input type="number" min="0" max="100" value={broodstockUseForm.hatch_percent} onChange={(e) => setBroodstockUseForm({ ...broodstockUseForm, hatch_percent: e.target.value })} /></div><div className="form-field"><label>Hormon</label><input value={broodstockUseForm.hormone} onChange={(e) => setBroodstockUseForm({ ...broodstockUseForm, hormone: e.target.value })} /></div><div className="form-field"><label>Doza</label><input value={broodstockUseForm.hormone_dose} onChange={(e) => setBroodstockUseForm({ ...broodstockUseForm, hormone_dose: e.target.value })} /></div><div className="form-field"><label>Nəticə</label><input value={broodstockUseForm.result} onChange={(e) => setBroodstockUseForm({ ...broodstockUseForm, result: e.target.value })} /></div></div><div className="form-actions"><button className="save-button">İstifadəni əlavə et</button></div></form><table><thead><tr><th>İl/Tarix</th><th>İstifadə</th><th>Miqdar</th><th>Mayalanma</th><th>Çıxım</th><th>Hormon/Doza</th><th>Nəticə</th><th>Sil</th></tr></thead><tbody>{broodstockUses.map((item) => <tr key={item.id}><td>{item.use_date}</td><td>{item.use_type}</td><td>{item.amount ?? "—"}</td><td>{item.fertilization_percent != null ? `${item.fertilization_percent}%` : "—"}</td><td>{item.hatch_percent != null ? `${item.hatch_percent}%` : "—"}</td><td>{item.hormone || "—"} {item.hormone_dose || ""}</td><td>{item.result || "—"}</td><td><button className="delete-button" onClick={() => deleteBroodstockUse(item.id)}>Sil</button></td></tr>)}</tbody></table></section>
              <section className="table-section mortality-form-section"><div className="section-title"><div><h2>Polarizasiya qeydi</h2><p>Tarix üzrə bütün ölçmələr saxlanılır</p></div></div><form className="mortality-form" onSubmit={savePolarization}><div className="form-grid"><div className="form-field"><label>Tarix</label><input type="date" value={polarizationForm.measurement_date} onChange={(e) => setPolarizationForm({ ...polarizationForm, measurement_date: e.target.value })} /></div><div className="form-field"><label>Orta polarizasiya *</label><input type="number" min="0" step="0.001" value={polarizationForm.average_value} onChange={(e) => setPolarizationForm({ ...polarizationForm, average_value: e.target.value })} required /></div><div className="form-field"><label>Minimum</label><input type="number" step="0.001" value={polarizationForm.minimum_value} onChange={(e) => setPolarizationForm({ ...polarizationForm, minimum_value: e.target.value })} /></div><div className="form-field"><label>Maksimum</label><input type="number" step="0.001" value={polarizationForm.maximum_value} onChange={(e) => setPolarizationForm({ ...polarizationForm, maximum_value: e.target.value })} /></div><div className="form-field"><label>Yumurta sayı</label><input type="number" min="0" value={polarizationForm.egg_count} onChange={(e) => setPolarizationForm({ ...polarizationForm, egg_count: e.target.value })} /></div><div className="form-field"><label><input type="checkbox" checked={polarizationForm.ready_for_use} onChange={(e) => setPolarizationForm({ ...polarizationForm, ready_for_use: e.target.checked })} /> İstifadəyə hazırdır</label></div></div><div className="form-actions"><button className="save-button">Polarizasiyanı əlavə et</button></div></form><table><thead><tr><th>Tarix</th><th>Orta</th><th>Min</th><th>Maks</th><th>Yumurta</th><th>Hazırdır</th><th>Qeyd</th><th>Sil</th></tr></thead><tbody>{polarizations.map((item) => <tr key={item.id}><td>{item.measurement_date}</td><td><strong>{item.average_value}</strong></td><td>{item.minimum_value ?? "—"}</td><td>{item.maximum_value ?? "—"}</td><td>{item.egg_count ?? "—"}</td><td>{item.ready_for_use ? "Bəli" : "Xeyr"}</td><td>{item.notes || "—"}</td><td><button className="delete-button" onClick={() => deletePolarization(item.id)}>Sil</button></td></tr>)}</tbody></table></section>
            </>}
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

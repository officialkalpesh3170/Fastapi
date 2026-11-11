import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Edit3, Trash2, Eye, Server, RefreshCw, 
  CheckCircle, AlertCircle, MapPin, Building, Hash, Code, Sun, Moon, 
  X, Filter, SlidersHorizontal, Info, ShieldCheck, Globe, ChevronRight, Activity
} from 'lucide-react';

// Default mock seed data in case API is unreachable or Demo Mode is toggled on
const INITIAL_MOCK_DATA = {
  "101": {
    name: "Alex Morgan",
    address: { street: "123 Tech Lane", city: "San Francisco", state: "CA", zip_code: "94105" }
  },
  "102": {
    name: "Sophia Chen",
    address: { street: "456 Innovation Way", city: "Austin", state: "TX", zip_code: "78701" }
  },
  "103": {
    name: "Marcus Vance",
    address: { street: "789 Pine Forest Dr", city: "Seattle", state: "WA", zip_code: "98101" }
  },
  "104": {
    name: "Elena Rostova",
    address: { street: "321 Beacon Hill Rd", city: "Boston", state: "MA", zip_code: "02108" }
  }
};

export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Connection & API Settings State
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8000");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("idle"); // 'connected' | 'disconnected' | 'checking' | 'idle'
  const [apiMessage, setApiMessage] = useState("");

  // Data & Data-Fetching State
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI & Search/Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null if creating, string ID if editing
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    street: "",
    city: "",
    state: "",
    zip_code: ""
  });
  const [formError, setFormError] = useState("");

  const [detailStudent, setDetailStudent] = useState(null); // { id, name, address }
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Toast Notification State
  const [toasts, setToasts] = useState([]);

  const addToast = (type, text) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Check Backend Connection
  const checkConnection = async () => {
    if (isDemoMode) {
      setConnectionStatus("demo");
      return;
    }

    setConnectionStatus("checking");
    try {
      const res = await fetch(`${apiBaseUrl}/`, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus("connected");
        setApiMessage(data.message || "Connected");
      } else {
        setConnectionStatus("disconnected");
      }
    } catch (err) {
      setConnectionStatus("disconnected");
    }
  };

  // Fetch Students Data
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);

    if (isDemoMode) {
      setTimeout(() => {
        setStudents(INITIAL_MOCK_DATA);
        setLoading(false);
      }, 300);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/students`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setStudents(data || {});
      setConnectionStatus("connected");
    } catch (err) {
      console.warn("Failed to fetch live API, falling back to mock view option:", err);
      setError("Unable to connect to FastAPI endpoint at " + apiBaseUrl);
      setConnectionStatus("disconnected");
    } finally {
      setLoading(false);
    }
  };

  // Run connection check & fetch when API URL or Demo Mode changes
  useEffect(() => {
    checkConnection();
    fetchStudents();
  }, [apiBaseUrl, isDemoMode]);

  // Unique list of cities for filtering dropdown
  const uniqueCities = useMemo(() => {
    const cities = new Set();
    Object.values(students).forEach((s) => {
      if (s?.address?.city) cities.add(s.address.city);
    });
    return Array.from(cities).sort();
  }, [students]);

  // Filtered & Searched Students List
  const filteredStudents = useMemo(() => {
    return Object.entries(students).filter(([id, data]) => {
      const nameMatch = data.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = id.includes(searchQuery);
      const cityMatch = data.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
      const stateMatch = data.address?.state?.toLowerCase().includes(searchQuery.toLowerCase());
      const zipMatch = data.address?.zip_code?.includes(searchQuery);

      const matchesSearch = nameMatch || idMatch || cityMatch || stateMatch || zipMatch;
      const matchesCity = cityFilter === "all" || data.address?.city === cityFilter;

      return matchesSearch && matchesCity;
    });
  }, [students, searchQuery, cityFilter]);

  // Open Form Modal for Create
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ id: "", name: "", street: "", city: "", state: "", zip_code: "" });
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEdit = (id, student) => {
    setEditingId(id);
    setFormData({
      id: id,
      name: student.name || "",
      street: student.address?.street || "",
      city: student.address?.city || "",
      state: student.address?.state || "",
      zip_code: student.address?.zip_code || ""
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Form Submit Handler (Handles Create / Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    const parsedId = parseInt(formData.id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      setFormError("Student ID must be a valid positive integer.");
      return;
    }

    if (!formData.name.trim() || !formData.street.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip_code.trim()) {
      setFormError("All fields are required.");
      return;
    }

    const payload = {
      id: parsedId,
      name: formData.name.trim(),
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim()
      }
    };

    if (isDemoMode) {
      const stringId = String(parsedId);
      setStudents((prev) => ({
        ...prev,
        [stringId]: {
          name: payload.name,
          address: payload.address
        }
      }));
      addToast("success", `Student ${editingId ? "updated" : "created"} successfully (Demo Mode)!`);
      setIsFormModalOpen(false);
      return;
    }

    try {
      if (editingId) {
        // PUT /update/{id}
        const res = await fetch(`${apiBaseUrl}/update/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to update student");
        }
        addToast("success", "Student updated successfully!");
      } else {
        // POST /create
        const res = await fetch(`${apiBaseUrl}/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to create student");
        }
        addToast("success", "Student created successfully!");
      }

      setIsFormModalOpen(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.message);
      addToast("error", err.message);
    }
  };

  // Delete Student (Simulated client deletion since API endpoint for DELETE wasn't specified)
  const handleDelete = (id) => {
    setStudents((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setDeleteConfirmId(null);
    addToast("info", `Student #${id} removed from current view.`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border transition-all animate-bounce-in ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 backdrop-blur-md"
                : toast.type === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 backdrop-blur-md"
                : "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 backdrop-blur-md"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === "info" && <Info className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Glassmorphism Header */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
                Student Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">FastAPI React Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-all ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Add Student Button */}
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* API Backend Bar */}
        <section className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <Server className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  FastAPI Server URL
                </label>
                <input
                  type="text"
                  disabled={isDemoMode}
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className={`w-full text-sm px-3 py-1.5 rounded-lg border font-mono transition-all ${
                    darkMode
                      ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500"
                      : "bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500"
                  } ${isDemoMode ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              {/* Status Badge */}
              {isDemoMode ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> Demo Mode Active
                </span>
              ) : connectionStatus === "connected" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Backend Online
                </span>
              ) : connectionStatus === "checking" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5" /> Backend Offline
                </span>
              )}

              {/* Demo Mode Switch */}
              <button
                onClick={() => setIsDemoMode(!isDemoMode)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  isDemoMode
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : darkMode
                    ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isDemoMode ? "Disable Demo Mode" : "Enable Mock Mode"}
              </button>

              {/* Reload API Button */}
              <button
                onClick={fetchStudents}
                className={`p-2 rounded-lg border transition-all ${
                  darkMode ? "bg-slate-700 border-slate-600 hover:bg-slate-600" : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                }`}
                title="Refresh Data from API"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Dashboard Statistics Overview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border transition-all ${darkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
                <h3 className="text-2xl font-bold mt-1">{Object.keys(students).length}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${darkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cities Represented</p>
                <h3 className="text-2xl font-bold mt-1">{uniqueCities.length}</h3>
              </div>
              <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl">
                <Building className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${darkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Filters</p>
                <h3 className="text-2xl font-bold mt-1">
                  {cityFilter !== "all" || searchQuery ? "Active" : "None"}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Filter className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${darkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Mode</p>
                <h3 className="text-2xl font-bold mt-1">{isDemoMode ? "Mock" : "Live API"}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Toolbar: Search, Filters, View Modes */}
        <section className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 justify-between items-center ${
          darkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"
        }`}>
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Name, City, State or Zip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-sm rounded-xl border transition-all ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500"
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
              }`}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* City Dropdown Filter */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className={`text-sm px-3 py-2 rounded-xl border transition-all ${
                  darkMode
                    ? "bg-slate-900 border-slate-700 text-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <option value="all">All Cities</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Layout Toggle */}
            <div className={`p-1 rounded-xl border flex gap-1 ${darkMode ? "bg-slate-900 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </section>

        {/* Offline Warning Banner */}
        {error && !isDemoMode && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">Unable to fetch live API data</p>
                <p className="text-xs opacity-80">Make sure your FastAPI server is running with CORS enabled, or toggle Mock Mode to preview UI features.</p>
              </div>
            </div>
            <button
              onClick={() => setIsDemoMode(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all flex-shrink-0"
            >
              Switch to Mock Mode
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading student directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          /* Empty State */
          <div className={`p-12 text-center rounded-2xl border ${darkMode ? "bg-slate-800/40 border-slate-800" : "bg-white border-slate-200"}`}>
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-semibold mb-1">No Students Found</h3>
            <p className="text-sm text-slate-400 mb-4">
              {searchQuery || cityFilter !== "all"
                ? "Try adjusting your search criteria or city filter."
                : "Get started by adding your first student record."}
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Add Student
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(([id, student]) => (
              <div
                key={id}
                className={`group rounded-2xl border transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
                  darkMode
                    ? "bg-slate-800/60 border-slate-700/60 hover:border-indigo-500/50"
                    : "bg-white border-slate-200 hover:border-indigo-500/50 shadow-sm"
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Top Bar with ID */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {student.name ? student.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <h3 className="font-bold text-base leading-tight group-hover:text-indigo-500 transition-colors">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Hash className="w-3 h-3" />
                          <span>ID: {id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailStudent({ id, ...student })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all"
                        title="View JSON Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(id, student)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                        title="Edit Student"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Address Card Container */}
                  <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    darkMode ? "bg-slate-900/60 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"
                  }`}>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{student.address?.street}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-700/20">
                      <span>{student.address?.city}, {student.address?.state}</span>
                      <span className="font-mono bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-[10px]">
                        {student.address?.zip_code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View Layout */
          <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase tracking-wider font-semibold border-b ${
                  darkMode ? "bg-slate-900/50 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}>
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Street Address</th>
                    <th className="px-6 py-4">City / State</th>
                    <th className="px-6 py-4">Zip Code</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {filteredStudents.map(([id, student]) => (
                    <tr key={id} className={`hover:bg-indigo-500/5 transition-colors ${darkMode ? "hover:bg-slate-700/30" : ""}`}>
                      <td className="px-6 py-4 font-mono font-medium text-xs text-indigo-500">#{id}</td>
                      <td className="px-6 py-4 font-semibold">{student.name}</td>
                      <td className="px-6 py-4 text-slate-400">{student.address?.street}</td>
                      <td className="px-6 py-4">{student.address?.city}, {student.address?.state}</td>
                      <td className="px-6 py-4 font-mono text-xs">{student.address?.zip_code}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDetailStudent({ id, ...student })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all"
                            title="View JSON"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(id, student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* CREATE / EDIT FORM MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
            darkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingId ? `Edit Student (#${editingId})` : "Create New Student"}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ID Input (Editable when creating, disabled when editing) */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Student ID (Integer)</label>
                <input
                  type="number"
                  required
                  disabled={Boolean(editingId)}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g. 105"
                  className={`w-full text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
                    darkMode
                      ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-indigo-500"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500"
                  } ${editingId ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className={`w-full text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
                    darkMode
                      ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-indigo-500"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500"
                  }`}
                />
              </div>

              {/* Address Section Header */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider block mb-3">
                  Address Details
                </span>
                
                {/* Street Input */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="e.g. 123 Main St"
                    className={`w-full text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
                      darkMode
                        ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-indigo-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* City */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. New York"
                      className={`w-full text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
                        darkMode
                          ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-indigo-500"
                          : "bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500"
                      }`}
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. NY"
                      className={`w-full text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
                        darkMode
                          ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-indigo-500"
                          : "bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500"
                      }`}
                    />
                  </div>

                  {/* Zip Code */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Zip Code</label>
                    <input
                      type="text"
                      required
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      placeholder="e.g. 10001"
                      className={`w-full text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
                        darkMode
                          ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-indigo-500"
                          : "bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                    darkMode
                      ? "border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  {editingId ? "Save Changes" : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT DETAIL & JSON MODAL */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
            darkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base">Student API Schema View</h3>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FastAPI Payload Output</p>
                <pre className={`p-4 rounded-xl text-xs font-mono overflow-x-auto border ${
                  darkMode ? "bg-slate-950 border-slate-800 text-emerald-400" : "bg-slate-900 border-slate-800 text-emerald-400"
                }`}>
                  {JSON.stringify(
                    {
                      id: parseInt(detailStudent.id, 10),
                      name: detailStudent.name,
                      address: detailStudent.address
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setDetailStudent(null)}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl p-6 space-y-4 ${
            darkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg">Delete Student record?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove student <span className="font-semibold text-slate-200">#{deleteConfirmId}</span>?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className={`w-full py-2.5 text-sm font-medium rounded-xl border transition-all ${
                  darkMode ? "border-slate-700 hover:bg-slate-700" : "border-slate-200 hover:bg-slate-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="w-full py-2.5 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
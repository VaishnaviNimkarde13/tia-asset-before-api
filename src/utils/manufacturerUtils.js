

const MANUFACTURERS_KEY = "tia_manufacturers";

const DEFAULT_MANUFACTURERS = [
  {
    id: "m1",
    name: "Teva Pharmaceuticals",
    code: "TEVA",
    type: "Pharma",
    country: "Israel",
    website: "www.tevapharm.com",
    contactPhone: "1-888-838-2872",
    contactEmail: "orders@tevapharm.com",
    regNumber: "TEVA-US-001",
    status: "Active",
    notes: ""
  },
  {
    id: "m2",
    name: "Pfizer Inc.",
    code: "PFZ",
    type: "Pharma",
    country: "USA",
    website: "www.pfizer.com",
    contactPhone: "1-800-879-3477",
    contactEmail: "orders@pfizer.com",
    regNumber: "PFZ-US-001",
    status: "Active",
    notes: ""
  },
  {
    id: "m3",
    name: "Abbott Laboratories",
    code: "ABT",
    type: "Pharma",
    country: "USA",
    website: "www.abbott.com",
    contactPhone: "1-800-255-5550",
    contactEmail: "orders@abbott.com",
    regNumber: "ABT-US-001",
    status: "Active",
    notes: ""
  },
  {
    id: "m4",
    name: "Baxter International",
    code: "BAX",
    type: "Pharma",
    country: "USA",
    website: "www.baxter.com",
    contactPhone: "1-800-422-9837",
    contactEmail: "orders@baxter.com",
    regNumber: "BAX-US-001",
    status: "Active",
    notes: ""
  },
  
];

/**
 * @param {string} manufacturerName 
 * @returns {Object|null}
 */
export const getManufacturerByName = (manufacturerName) => {
  const manufacturers = getManufacturers();
  return manufacturers.find(m => m.name === manufacturerName) || null;
};

/**
 * @returns {Array} 
 */
export const getManufacturers = () => {
  try {
    const data = localStorage.getItem(MANUFACTURERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading manufacturers from localStorage:", error);
    return [];
  }
};

/**
 
 * @returns {Array}
 */
export const getManufacturerNames = () => {
  const manufacturers = getManufacturers();
  return manufacturers
    .filter(m => m.status === "Active")
    .map(m => m.name)
    .sort();
};

/**
 * @param {Array} manufacturers 
 */
export const saveManufacturers = (manufacturers) => {
  try {
    localStorage.setItem(MANUFACTURERS_KEY, JSON.stringify(manufacturers));
    // Dispatch custom event for cross-tab sync
    window.dispatchEvent(new CustomEvent("manufacturersUpdated", { detail: manufacturers }));
  } catch (error) {
    console.error("Error saving manufacturers to localStorage:", error);
  }
};

/**
 * @param {Object} manufacturer 
 */
export const addManufacturer = (manufacturer) => {
  const manufacturers = getManufacturers();
  manufacturers.push(manufacturer);
  saveManufacturers(manufacturers);
};

/**
 * @param {string} manufacturerId 
 * @param {Object} updates 
 */
export const updateManufacturer = (manufacturerId, updates) => {
  const manufacturers = getManufacturers();
  const index = manufacturers.findIndex(m => m.id === manufacturerId);
  if (index !== -1) {
    manufacturers[index] = { ...manufacturers[index], ...updates };
    saveManufacturers(manufacturers);
  }
};

/**
 * @param {string} manufacturerId 
 */
export const deleteManufacturer = (manufacturerId) => {
  const manufacturers = getManufacturers();
  const filtered = manufacturers.filter(m => m.id !== manufacturerId);
  saveManufacturers(filtered);
};

/**
 * @param {Array} defaultManufacturers - 
 */
export const initializeManufacturers = (defaultManufacturers = DEFAULT_MANUFACTURERS) => {
  const existing = localStorage.getItem(MANUFACTURERS_KEY);
  if (!existing) {
    saveManufacturers(defaultManufacturers);
  }
};

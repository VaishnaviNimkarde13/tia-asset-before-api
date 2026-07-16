

const SUPPLIERS_KEY = "tia_suppliers";

const DEFAULT_SUPPLIERS = [
  {
    id: "s1",
    company: "McKesson Medical-Surgical",
    location: "Irving, TX",
    contactName: "John Reid",
    contactEmail: "orders@mckesson.com",
    phone: "1-800-625-5672",
    gpo: "Vizient",
    contractNumber: "VZ-2024-MCK",
    terms: "Net-30",
    leadTime: "2d",
    manufacturers: ["TEVA", "PFZ", "WWPH"],
    instruments: [],
    status: "Active"
  },
  {
    id: "s2",
    company: "Cardinal Health",
    location: "Dublin, OH",
    contactName: "Lisa Park",
    contactEmail: "orders@cardinal.com",
    phone: "1-800-234-8701",
    gpo: "Premier",
    contractNumber: "PR-2024-CAR",
    terms: "Net-30",
    leadTime: "2d",
    manufacturers: ["PFZ", "BAX"],
    instruments: [],
    status: "Active"
  },
  {
    id: "s3",
    company: "Medline Industries",
    location: "Northfield, IL",
    contactName: "Tom Evans",
    contactEmail: "orders@medline.com",
    phone: "1-800-633-5463",
    gpo: "Provista",
    contractNumber: "PV-2024-MDL",
    terms: "Net-45",
    leadTime: "4d",
    manufacturers: ["ANSELL", "3M", "MDL"],
    instruments: [],
    status: "Active"
  },
  {
    id: "s4",
    company: "Fisher Scientific",
    location: "Waltham, MA",
    contactName: "Amy Zhao",
    contactEmail: "orders@fisher.com",
    phone: "1-800-766-7000",
    gpo: "Intalere",
    contractNumber: "IN-2024-FSH",
    terms: "Net-45",
    leadTime: "5d",
    manufacturers: ["BD"],
    instruments: [],
    status: "Active"
  },
 
];

/**
 * @returns {Array} 
 */
export const getSuppliers = () => {
  try {
    const data = localStorage.getItem(SUPPLIERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading suppliers from localStorage:", error);
    return [];
  }
};

/**
 * @returns {Array}
 */
export const getSupplierNames = () => {
  const suppliers = getSuppliers();
  return suppliers
    .filter(s => s.status === "Active")
    .map(s => s.company)
    .sort();
};

/**
 * @param {string} companyName 
 * @returns {Object|null} 
 */
export const getSupplierByName = (companyName) => {
  const suppliers = getSuppliers();
  return suppliers.find(s => s.company === companyName) || null;
};

/**
 * @param {Array} suppliers 
 */
export const saveSuppliers = (suppliers) => {
  try {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
    // Dispatch custom event for cross-tab sync
    window.dispatchEvent(new CustomEvent("suppliersUpdated", { detail: suppliers }));
  } catch (error) {
    console.error("Error saving suppliers to localStorage:", error);
  }
};

/**
 * @param {Object} supplier 
 */
export const addSupplier = (supplier) => {
  const suppliers = getSuppliers();
  suppliers.push(supplier);
  saveSuppliers(suppliers);
};

/**
 * @param {string} supplierId 
 * @param {Object} updates 
 */
export const updateSupplier = (supplierId, updates) => {
  const suppliers = getSuppliers();
  const index = suppliers.findIndex(s => s.id === supplierId);
  if (index !== -1) {
    suppliers[index] = { ...suppliers[index], ...updates };
    saveSuppliers(suppliers);
  }
};

/**
 * @param {string} supplierId 
 */
export const deleteSupplier = (supplierId) => {
  const suppliers = getSuppliers();
  const filtered = suppliers.filter(s => s.id !== supplierId);
  saveSuppliers(filtered);
};

/**
 * @param {Array} defaultSuppliers - 
 */
export const initializeSuppliers = (defaultSuppliers = DEFAULT_SUPPLIERS) => {
  const existing = localStorage.getItem(SUPPLIERS_KEY);
  if (!existing) {
    saveSuppliers(defaultSuppliers);
  }
};

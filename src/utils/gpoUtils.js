

const GPOS_KEY = "tia_gpos";

// Default GPOs
const DEFAULT_GPOS = [
  {
    id: "g1",
    name: "Vizient",
    code: "VZ",
    description: "Large healthcare GPO",
    contactName: "Vizient Admin",
    contactEmail: "info@vizientinc.com",
    phone: "1-833-849-4368",
    website: "www.vizientinc.com",
    status: "Active",
  },
  {
    id: "g2",
    name: "Premier",
    code: "PR",
    description: "Healthcare GPO and Services Company",
    contactName: "Premier Admin",
    contactEmail: "info@premierinc.com",
    phone: "1-844-773-7386",
    website: "www.premierinc.com",
    status: "Active",
  },
  {
    id: "g3",
    name: "Intalere",
    code: "INT",
    description: "Healthcare GPO",
    contactName: "Intalere Admin",
    contactEmail: "info@intalere.com",
    phone: "1-866-4-INTALERE",
    website: "www.intalere.com",
    status: "Active",
  },
  {
    id: "g4",
    name: "Provista",
    code: "PV",
    description: "Healthcare GPO",
    contactName: "Provista Admin",
    contactEmail: "info@provista.com",
    phone: "1-800-PROVISTA",
    website: "www.provista.com",
    status: "Active",
  },
];

/**
 * @returns {Array} Array of GPO objects
 */
export const getGPOs = () => {
  try {
    const data = localStorage.getItem(GPOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading GPOs from localStorage:", error);
    return [];
  }
};

/**
 * @returns {Array} Array of GPO names
 */
export const getGPONames = () => {
  const gpos = getGPOs();
  return gpos
    .filter(g => g.status === "Active")
    .map(g => g.name)
    .sort();
};

/**
 * Get GPO by name
 * @param {string} name 
 * @returns {Object|null} 
 */
export const getGPOByName = (name) => {
  const gpos = getGPOs();
  return gpos.find(g => g.name === name) || null;
};

/**
 * @param {Array} gpos - Array of GPO objects
 */
export const saveGPOs = (gpos) => {
  try {
    localStorage.setItem(GPOS_KEY, JSON.stringify(gpos));
    window.dispatchEvent(new CustomEvent("gposUpdated", { detail: gpos }));
  } catch (error) {
    console.error("Error saving GPOs to localStorage:", error);
  }
};

/**
 * @param {Object} gpo 
 */
export const addGPO = (gpo) => {
  const gpos = getGPOs();
  gpos.push(gpo);
  saveGPOs(gpos);
};

/**
 * @param {string} gpoId 
 * @param {Object} updates 
 */
export const updateGPO = (gpoId, updates) => {
  const gpos = getGPOs();
  const index = gpos.findIndex(g => g.id === gpoId);
  if (index !== -1) {
    gpos[index] = { ...gpos[index], ...updates };
    saveGPOs(gpos);
  }
};

/**
 * @param {string} gpoId -
 */
export const deleteGPO = (gpoId) => {
  const gpos = getGPOs();
  const filtered = gpos.filter(g => g.id !== gpoId);
  saveGPOs(filtered);
};

/**
 * @param {Array} defaultGPOs
 */
export const initializeGPOs = (defaultGPOs = DEFAULT_GPOS) => {
  const existing = localStorage.getItem(GPOS_KEY);
  if (!existing) {
    saveGPOs(defaultGPOs);
  }
};

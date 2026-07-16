
const DEFAULT_LOCATIONS = [
  "Main Acute Care Hospital",
  "Central Warehouse & Stores",
  "Ambulatory Surgery Center",
  "Urgent Care Center",
  "Women's & Children's Hospital",
  "Core Laboratory",
  "Outpatient Imaging Center",
  "Blood Bank",
  "Retail / Discharge Pharmacy",
  "Specialty Pharmacy",
];

const DEFAULT_DEPARTMENTS = [
  "Central Store",
  "Ward / Department Store",
  "Pharmacy",
  "Operation Theater",
  "Laboratory",
  "Clinic / OPD",
];

/**
 * @returns {string[]} Array of location names
 */
export function getLocations() {
  try {
    const saved = localStorage.getItem("tia_locations");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((loc) => loc.name).filter(Boolean);
      }
    }
  } catch (e) {
    console.error("Failed to load locations from localStorage:", e);
  }
  return DEFAULT_LOCATIONS;
}

/**
 * @returns {string[]} 
 */
export function getDepartments() {
  try {
    const saved = localStorage.getItem("tia_departments");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((dept) => dept.name).filter(Boolean);
      }
    }
  } catch (e) {
    console.error("Failed to load departments from localStorage:", e);
  }
  return DEFAULT_DEPARTMENTS;
}

/**

 * @param {string} locationName - 
 * @returns {string} 
 */
export function getLocationCode(locationName) {
  const codeMap = {
    "Main Acute Care Hospital":      "MACH-01",
    "Central Warehouse & Stores":    "CWS-01",
    "Ambulatory Surgery Center":     "ASC-01",
    "Urgent Care Center":            "UCC-01",
    "Women's & Children's Hospital": "WCH-01",
    "Core Laboratory":               "CLAB-01",
    "Outpatient Imaging Center":     "OIC-01",
    "Blood Bank":                    "BB-01",
    "Retail / Discharge Pharmacy":   "RDP-01",
    "Specialty Pharmacy":            "SP-01",
  };
  return codeMap[locationName] || locationName;
}

/**
 * @param {string} code 
 * @returns {string} 
 */
export function getLocationNameFromCode(code) {
  const codeMap = {
    "MACH-01":  "Main Acute Care Hospital",
    "CWS-01":   "Central Warehouse & Stores",
    "ASC-01":   "Ambulatory Surgery Center",
    "UCC-01":   "Urgent Care Center",
    "WCH-01":   "Women's & Children's Hospital",
    "CLAB-01":  "Core Laboratory",
    "OIC-01":   "Outpatient Imaging Center",
    "BB-01":    "Blood Bank",
    "RDP-01":   "Retail / Discharge Pharmacy",
    "SP-01":    "Specialty Pharmacy",
  };
  return codeMap[code] || code;
}

/**

 * @param {string} location 
 * @returns {string} 
 */
export function normalizeLocation(location) {
  if (!location) return "";
  return getLocationNameFromCode(location) || location;
}

/**

 * @param {object} user
 * @returns {string}
 */
export function getUserLocation(user) {
  return (
    user?.locationName ||
    user?.location ||
    user?.hospitalName ||
    user?.hospital ||
    ""
  );
}

/**
 * @param {string} userLocation
 * @param {string} recordLocation
 * @returns {boolean}
 */
export function locationMatches(userLocation, recordLocation) {
  const normalizedUser = normalizeLocation(userLocation).trim().toLowerCase();
  const normalizedRecord = normalizeLocation(recordLocation).trim().toLowerCase();
  if (!normalizedUser || !normalizedRecord) return false;
  return normalizedUser === normalizedRecord;
}

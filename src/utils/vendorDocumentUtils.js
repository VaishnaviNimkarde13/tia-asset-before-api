
const VENDOR_DOCS_KEY = "tia_vendor_documents";

export const DOCUMENT_TYPES = [
  "PDF",
  "Image",
  "Excel",
  "CSV",
];

export function getVendorDocuments(vendorId, vendorType) {
  try {
    const all = JSON.parse(localStorage.getItem(VENDOR_DOCS_KEY) || "[]");
    return all.filter(
      (doc) => doc.vendorId === vendorId && doc.vendorType === vendorType
    );
  } catch {
    return [];
  }
}

export function saveVendorDocument(document) {
  try {
    const all = JSON.parse(localStorage.getItem(VENDOR_DOCS_KEY) || "[]");
    const newDoc = {
      ...document,
      id: document.id || `DOC-${Date.now()}`,
      uploadedAt: document.uploadedAt || new Date().toISOString(),
      uploadedDate: document.uploadedDate || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    all.push(newDoc);
    localStorage.setItem(VENDOR_DOCS_KEY, JSON.stringify(all));
    return newDoc;
  } catch {
    return null;
  }
}

export function updateVendorDocument(docId, updates) {
  try {
    const all = JSON.parse(localStorage.getItem(VENDOR_DOCS_KEY) || "[]");
    const idx = all.findIndex((d) => d.id === docId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      localStorage.setItem(VENDOR_DOCS_KEY, JSON.stringify(all));
      return all[idx];
    }
  } catch {
    return null;
  }
}

export function deleteVendorDocument(docId) {
  try {
    const all = JSON.parse(localStorage.getItem(VENDOR_DOCS_KEY) || "[]");
    const filtered = all.filter((d) => d.id !== docId);
    localStorage.setItem(VENDOR_DOCS_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

export function getAllVendorDocuments() {
  try {
    return JSON.parse(localStorage.getItem(VENDOR_DOCS_KEY) || "[]");
  } catch {
    return [];
  }
}

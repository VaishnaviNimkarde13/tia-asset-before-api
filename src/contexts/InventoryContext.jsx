import { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "tia_inventory";
const GRN_HISTORY_KEY = "tia_grn_history";
const STORAGE_VERSION = "v3";
const STORAGE_VERSION_KEY = "tia_inventory_version";

const HARDCODED_ITEMS = [
  {
    id: "hc_item_001",
    name: "Paracetamol 500mg Tablets",
    ndc: "12345-678-90",
    category: "Pharmaceuticals",
    subcategory: "Analgesics / Pain Management",
    location: "Main Acute Care Hospital",
    department: "Pharmacy",
    lot: "LOT-2401",
    uom: "Tablets",
    qty: 1250,
    par: 500,
    cost: 0.12,
    supplier: "Sun Pharmaceuticals",
    gpo: "Vizient",
    expiry: "Dec 31, 2025",
    expiryRaw: "2025-12-31",
    expired: false,
    status: [{ label: "In Stock", color: "success" }],
    issueUom: "Pack",
    purchaseUom: "Box",
    issueToBaseConversion: 10,
    purchaseToBaseConversion: 100,
    unitCost: 0.12,
  },
  {
    id: "hc_item_002",
    name: "Nitrile Gloves (Box of 100)",
    ndc: "98765-432-10",
    category: "PPE & Protective",
    subcategory: "Gloves",
    location: "Central Warehouse & Stores",
    department: "Central Store",
    lot: "LOT-2402",
    uom: "Pairs",
    qty: 8500,
    par: 10000,
    cost: 0.085,
    supplier: "Medline Industries",
    gpo: "Premier",
    expiry: "Jun 15, 2026",
    expiryRaw: "2026-06-15",
    expired: false,
    status: [{ label: "Low Stock", color: "warning" }],
    issueUom: "Box",
    purchaseUom: "Carton",
    issueToBaseConversion: 100,
    purchaseToBaseConversion: 1000,
    unitCost: 0.085,
  },
  {
    id: "hc_item_003",
    name: "Surgical Mask (3-ply) - Box of 50",
    ndc: "54321-987-65",
    category: "PPE & Protective",
    subcategory: "Masks & Respirators",
    location: "Main Acute Care Hospital",
    department: "Ward / Department Store",
    lot: "LOT-2403",
    uom: "Pieces",
    qty: 1600,
    par: 2500,
    cost: 0.085,
    supplier: "3M Health Care",
    gpo: "HealthTrust",
    expiry: "Apr 20, 2025",
    expiryRaw: "2025-04-20",
    expired: false,
    status: [{ label: "Expiring Soon", color: "warning" }],
    issueUom: "Box",
    purchaseUom: "Carton",
    issueToBaseConversion: 50,
    purchaseToBaseConversion: 500,
    unitCost: 0.085,
  },
  {
    id: "hc_item_004",
    name: "IV Cannula 22G - Pack of 25",
    ndc: "11122-333-44",
    category: "Surgical Supplies",
    subcategory: null,
    location: "Main Acute Care Hospital",
    department: "Operation Theater",
    lot: "LOT-2404",
    uom: "Cannulas",
    qty: 450,
    par: 750,
    cost: 0.51,
    supplier: "Becton Dickinson",
    gpo: "Vizient",
    expiry: "Aug 10, 2025",
    expiryRaw: "2025-08-10",
    expired: false,
    status: [{ label: "Low Stock", color: "warning" }],
    issueUom: "Pack",
    purchaseUom: "Box",
    issueToBaseConversion: 25,
    purchaseToBaseConversion: 250,
    unitCost: 0.51,
  },
  {
  id: "hc_item_005",
  name: "Blood Collection Tubes (EDTA) - Pack of 100",
  ndc: "99887-665-43",
  category: "Lab Reagents & Diagnostics",
  subcategory: "Blood Collection",
  location: "Core Laboratory",
  department: "Pathology Lab",
  lot: "LOT-2405",
  uom: "Tubes",
  qty: 3200,
  par: 4000,
  cost: 0.18,
  supplier: "Becton Dickinson",
  gpo: "Premier",
  expiry: "Oct 15, 2025",
  expiryRaw: "2025-10-15",
  expired: false,
  status: [{ label: "In Stock", color: "success" }],
  issueUom: "Pack",
  purchaseUom: "Carton",
  issueToBaseConversion: 100,
  purchaseToBaseConversion: 1000,
  unitCost: 0.18,
},
{
  id: "hc_item_006",
  name: "Glucometer Test Strips - Box of 50",
  ndc: "44556-123-78",
  category: "Medical Devices",
  subcategory: "Monitoring",
  location: "Main Acute Care Hospital",
  department: "Diabetes Care Center",
  lot: "LOT-2406",
  uom: "Strips",
  qty: 2800,
  par: 3000,
  cost: 0.35,
  supplier: "Roche Diagnostics",
  gpo: "HealthTrust",
  expiry: "Mar 30, 2025",
  expiryRaw: "2025-03-30",
  expired: false,
  status: [{ label: "Expiring Soon", color: "warning" }],
  issueUom: "Box",
  purchaseUom: "Carton",
  issueToBaseConversion: 50,
  purchaseToBaseConversion: 500,
  unitCost: 0.35,
},
{
  id: "hc_item_007",
  name: "Disposable Syringe 5ml - Pack of 100",
  ndc: "66789-432-11",
  category: "Consumables",
  subcategory: null,
  location: "Central Warehouse & Stores",
  department: "Central Store",
  lot: "LOT-2407",
  uom: "Syringes",
  qty: 15000,
  par: 8000,
  cost: 0.09,
  supplier: "B. Braun",
  gpo: "Premier",
  expiry: "Dec 31, 2026",
  expiryRaw: "2026-12-31",
  expired: false,
  status: [{ label: "In Stock", color: "success" }],
  issueUom: "Pack",
  purchaseUom: "Case",
  issueToBaseConversion: 100,
  purchaseToBaseConversion: 1000,
  unitCost: 0.09,
},
];

function hydrate(items) {
  return items.map((item) => ({
    ...item,
    expiryRaw: item.expiryRaw ? new Date(item.expiryRaw) : null,
  }));
}

function dehydrate(items) {
  return items.map((item) => ({
    ...item,
    expiryRaw: item.expiryRaw instanceof Date
      ? item.expiryRaw.toISOString().split("T")[0]
      : item.expiryRaw ?? null,
    status: Array.isArray(item.status)
      ? item.status.map(({ label, color }) => ({ label, color }))
      : [{ label: "In Stock", color: "success" }],
  }));
}

function loadInitialItems() {
  try {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    
  if (!raw) {
      return hydrate(HARDCODED_ITEMS);
    }
    
   
    if (storedVersion !== STORAGE_VERSION) {
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dehydrate(HARDCODED_ITEMS)));
      return hydrate(HARDCODED_ITEMS);
    }
    
    const parsed = JSON.parse(raw);
    if (parsed && parsed.length > 0) {
      return hydrate(parsed);
    }
  } catch { /* ignore */ }
  
  return hydrate(HARDCODED_ITEMS);
}

function loadGrnHistory() {
  try {
    const raw = localStorage.getItem(GRN_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dehydrate(items)));
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  } catch { /* ignore */ }
}

function saveGrnHistory(history) {
  try {
    localStorage.setItem(GRN_HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [items, setItems] = useState(loadInitialItems);
  const [grnHistory, setGrnHistory] = useState(loadGrnHistory);

  useEffect(() => { save(items); }, [items]);
  useEffect(() => { saveGrnHistory(grnHistory); }, [grnHistory]);

 const addItem = (newItem) => {

  const existingItem = items.find(
    (item) =>
      item.name && item.name.toLowerCase() === (newItem.name || "").toLowerCase() &&
      item.location === newItem.location &&
      item.department === newItem.department
  );

  
  if (existingItem) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === existingItem.id
          ? {
              ...item,
              qty: (item.qty || 0) + (newItem.qty || 0),
              status: ((item.qty || 0) + (newItem.qty || 0)) < (item.par || 0)
                ? [{ label: "Low Stock", color: "warning" }]
                : [{ label: "In Stock", color: "success" }],
            }
          : item
      )
    );
    return existingItem.id;
  }

  const newId = Date.now();
  
 
  let expiryDate = null;
  let expiryFormatted = "—";
  if (newItem.expireDate) {
    expiryDate = new Date(newItem.expireDate);
    if (!isNaN(expiryDate.getTime())) {
      expiryFormatted = expiryDate.toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
      });
    }
  }
  
  const newItemWithId = {
    ...newItem,
    id: newId,
    ndc: newItem.ndc || "",
    expiryRaw: expiryDate,
    expiry: expiryFormatted,
    status: (newItem.qty ?? 0) < (newItem.par ?? 0)
      ? [{ label: "Low Stock", color: "warning" }]
      : [{ label: "In Stock", color: "success" }],
  };
  
  setItems((prev) => [...prev, newItemWithId]);
  
  // Dispatch event for cross-component sync
  window.dispatchEvent(
    new CustomEvent("inventoryUpdated", {
      detail: { items: [...items, newItemWithId] },
    })
  );
  
  return newId;
};
 const receiveFromGRN = (grnLineItems = [], location = "", grnMeta = {}) => {
 
  const LOCATION_CODE_MAP = {
    "CS-01":   "Main Acute Care Hospital",
    "CS-02":   "Central Warehouse & Stores",
    "ICU-01":  "Main Acute Care Hospital",
    "ICU-02":  "Central Warehouse & Stores",
    "PH-01":   "Main Acute Care Hospital",
    "PH-02":   "Central Warehouse & Stores",
    "OR-01":   "Main Acute Care Hospital",
    "OR-02":   "Central Warehouse & Stores",
    "MACH-01": "Main Acute Care Hospital",
    "CWS-01":  "Central Warehouse & Stores",
    "ASC-01":  "Ambulatory Surgery Center",
    "UCC-01":  "Urgent Care Center",
    "WCH-01":  "Womens & Childrens Hospital",
    "CLAB-01": "Core Laboratory",
    "OIC-01":  "Outpatient Imaging Center",
    "BB-01":   "Blood Bank",
    "RDP-01":  "Retail Discharge Pharmacy",
    "SP-01":   "Specialty Pharmacy",
  };
  
  // Map location to default department
  const LOCATION_TO_DEPARTMENT_MAP = {
    "Main Acute Care Hospital": "Central Store",
    "Central Warehouse & Stores": "Central Store",
    "Ambulatory Surgery Center": "Central Store",
    "Urgent Care Center": "Central Store",
    "Womens & Childrens Hospital": "Central Store",
    "Core Laboratory": "Laboratory",
    "Outpatient Imaging Center": "Central Store",
    "Blood Bank": "Central Store",
    "Retail Discharge Pharmacy": "Pharmacy",
    "Specialty Pharmacy": "Pharmacy",
  };
  
  const normalizedLocation = LOCATION_CODE_MAP[location] || location;
  
  const defaultDepartment = LOCATION_TO_DEPARTMENT_MAP[normalizedLocation] || "Central Store";
  
  const grnNo = grnMeta.grnNo || `GRN-${Date.now()}`;
  const grnDate = grnMeta.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const supplier = grnMeta.supplier || "";
  const gpo = grnMeta.gpo || "";

  const newHistoryEntries = grnLineItems
    .filter((line) => line.item && parseFloat(line.rcvQty) > 0)
    .map((line) => {
      // Parse expiry date
      let expiryDate = null;
      let expiryFormatted = "—";
      if (line.expiry) {
        expiryDate = new Date(line.expiry);
        if (!isNaN(expiryDate.getTime())) {
          expiryFormatted = expiryDate.toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
          });
        }
      }
      
      return {
        id: Date.now() + Math.random(),
        grnNo,
        date: grnDate,
        supplier,
        gpo,
        itemName: line.item,
        ndc: line.ndc || line.itemCode || "",
        lotNo: line.lotNo || "",
        qtyReceived: parseFloat(line.rcvQty) || 0,
        qtyOrdered: parseFloat(line.ordQty) || parseFloat(line.rcvQty) || 0,
        unitCost: line.unitCost || 0,
        uom: line.uom || "",
        expiry: expiryFormatted,
        expiryRaw: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
        location: normalizedLocation,
        category: line.category || "",
        status: "Received",
      };
    });

  setGrnHistory((prev) => [...prev, ...newHistoryEntries]);

  setItems((prev) => {
    let updated = [...prev];

    grnLineItems.forEach((line) => {
      if (!line.item || !line.rcvQty) return;
      const rcvQty = parseFloat(line.rcvQty) || 0;
      if (rcvQty <= 0) return;

      let expiryDate = null;
      let expiryFormatted = "—";
      if (line.expiry) {
        expiryDate = new Date(line.expiry);
        if (!isNaN(expiryDate.getTime())) {
          expiryFormatted = expiryDate.toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
          });
        }
      }

      const lineDepartment = line.department || defaultDepartment;

      // First try to match by name + location + department
      let matchIdx = updated.findIndex(
        (inv) =>
          inv.name && inv.name.toLowerCase() === line.item.toLowerCase() &&
          inv.location === normalizedLocation &&
          (inv.department === lineDepartment || (!inv.department && !line.department))
      );

      // If not found and item has no department specified, try matching without department
      if (matchIdx === -1 && !line.department) {
        matchIdx = updated.findIndex(
          (inv) =>
            inv.name && inv.name.toLowerCase() === line.item.toLowerCase() &&
            inv.location === normalizedLocation &&
            (!inv.department || inv.department === "")
        );
      }

      if (matchIdx !== -1) {
        const existing = updated[matchIdx];
        const newQty = (existing.qty || 0) + rcvQty;
        const newStatus = newQty < (existing.par || 0)
          ? [{ label: "Low Stock", color: "warning" }]
          : [{ label: "In Stock", color: "success" }];

        updated[matchIdx] = {
          ...existing,
          qty: newQty,
          lot: line.lotNo || existing.lot,
          expiry: expiryFormatted !== "—" ? expiryFormatted : existing.expiry,
          expiryRaw: expiryDate || existing.expiryRaw,
          status: newStatus,
          department: existing.department || lineDepartment, // Ensure department is set
        };
      } else {
        const newQty = rcvQty;
        const par = 0;
        const newStatus = newQty < par
          ? [{ label: "Low Stock", color: "warning" }]
          : [{ label: "In Stock", color: "success" }];
        
        updated.push({
          id: Date.now() + Math.random(),
          name: line.item,
          ndc: line.ndc || line.itemCode || "",
          category: line.category || "Pharmaceuticals",
          subcategory: "",
          location: normalizedLocation || "Main Acute Care Hospital",
          department: lineDepartment,
          qty: newQty,
          par: par,
          cost: line.unitCost || 0,
          lot: line.lotNo || "",
          uom: line.uom || "",
          expiry: expiryFormatted,
          expiryRaw: expiryDate,
          supplier: supplier,
          gpo: gpo,
          status: newStatus,
          issueUom: line.issueUom || line.uom || "",
          purchaseUom: line.purchaseUom || line.uom || "",
          issueToBaseConversion: line.issueToBaseConversion || 1,
          purchaseToBaseConversion: line.purchaseToBaseConversion || 1,
          unitCost: line.unitCost || 0,
        });
      }
    });

    return updated;
  });
};

  const updateItem = (id, updated) => {
    setItems((prev) => {
      const newItems = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updated,
              expiryRaw: updated.expireDate ? new Date(updated.expireDate) : item.expiryRaw,
              expiry: updated.expireDate
                ? new Date(updated.expireDate).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })
                : item.expiry,
            }
          : item
      );
      
      window.dispatchEvent(
        new CustomEvent("inventoryUpdated", {
          detail: { items: newItems },
        })
      );
      
      return newItems;
    });
  };

  const deleteItem = (id) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      window.dispatchEvent(
        new CustomEvent("inventoryUpdated", {
          detail: { items: newItems },
        })
      );
      return newItems;
    });
  };

  const replaceItem = (oldItemId, newItemData) => {
    setItems((prev) => {
      const newItems = prev.map((item) =>
        item.id === oldItemId
          ? {
              ...item,
              ...newItemData,
              id: item.id, // Keep the same ID
            }
          : item
      );
      
      window.dispatchEvent(
        new CustomEvent("inventoryUpdated", {
          detail: { items: newItems },
        })
      );
      
      return newItems;
    });
  };

  const issueStock = (issueLineItems = []) => {
    setItems((prev) => {
      let updated = [...prev];
      issueLineItems.forEach(({ itemName, qty, fromLocation, fromDepartment, toLocation, toDepartment }) => {
        const deductQty = parseFloat(qty) || 0;
        if (deductQty <= 0 || !itemName) return;

        // Find and deduct from source (fromLocation + fromDepartment)
        const fromIdx = updated.findIndex(
          (inv) =>
            inv.name?.toLowerCase() === itemName.toLowerCase() &&
            inv.location === fromLocation &&
            inv.department === fromDepartment
        );

        if (fromIdx !== -1) {
          const existing = updated[fromIdx];
          const newQty = Math.max(0, (existing.qty || 0) - deductQty);
          updated[fromIdx] = {
            ...existing,
            qty: newQty,
            status:
              newQty < (existing.par || 0)
                ? [{ label: "Low Stock", color: "warning" }]
                : [{ label: "In Stock", color: "success" }],
          };
        }

        if (toLocation && toDepartment) {
          const toIdx = updated.findIndex(
            (inv) =>
              inv.name?.toLowerCase() === itemName.toLowerCase() &&
              inv.location === toLocation &&
              inv.department === toDepartment
          );

          if (toIdx !== -1) {
            const existing = updated[toIdx];
            const newQty = (existing.qty || 0) + deductQty;
            updated[toIdx] = {
              ...existing,
              qty: newQty,
              status:
                newQty < (existing.par || 0)
                  ? [{ label: "Low Stock", color: "warning" }]
                  : [{ label: "In Stock", color: "success" }],
            };
          } else {
            const sourceItem = updated[fromIdx];
            if (sourceItem) {
              updated.push({
                id: `item_${Date.now()}`,
                name: itemName,
                ndc: sourceItem.ndc,
                category: sourceItem.category,
                subcategory: sourceItem.subcategory,
                location: toLocation,
                department: toDepartment,
                lot: sourceItem.lot,
                uom: sourceItem.uom,
                qty: deductQty,
                par: sourceItem.par,
                cost: sourceItem.cost,
                supplier: sourceItem.supplier,
                gpo: sourceItem.gpo,
                expiry: sourceItem.expiry,
                expiryRaw: sourceItem.expiryRaw,
                expired: sourceItem.expired,
                status: [{ label: "In Stock", color: "success" }],
                issueUom: sourceItem.issueUom,
                purchaseUom: sourceItem.purchaseUom,
                issueToBaseConversion: sourceItem.issueToBaseConversion,
                purchaseToBaseConversion: sourceItem.purchaseToBaseConversion,
                unitCost: sourceItem.unitCost,
              });
            }
          }
        }
      });
      return updated;
    });
  };

  const getItemAllLocations = (itemName) => {
    return items.filter(
      (i) => i.name && i.name.toLowerCase() === itemName?.toLowerCase()
    );
  };

  const getItemAllDepartments = (itemName) => {
    return items.filter(
      (i) => i.name && i.name.toLowerCase() === itemName?.toLowerCase()
    );
  };

  const getItemGrnHistory = (itemName) => {
    return grnHistory.filter(
      (g) => g.itemName && g.itemName.toLowerCase() === itemName?.toLowerCase()
    );
  };

  const clearAllData = () => {
    setItems([]);
    setGrnHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GRN_HISTORY_KEY);
  };

  const resetToHardcoded = () => {
    setItems(hydrate(HARDCODED_ITEMS));
    setGrnHistory([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dehydrate(HARDCODED_ITEMS)));
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        grnHistory,
        addItem,
        updateItem,
        deleteItem,
        replaceItem,
        receiveFromGRN,
        issueStock,
        getItemAllLocations,
        getItemAllDepartments,
        getItemGrnHistory,
        clearAllData,
        resetToHardcoded,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
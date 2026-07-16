import { useState, useEffect } from "react";

const STORAGE_KEY = "tia_inventory";

const INITIAL_INVENTORY = [
  {
    id: 1,
    name: "Amoxicillin 500mg Capsules",
    ndc: "0093-4155-01",
    itemType: "Pharmaceuticals (Drugs)",
    category: "Rx Drugs (DSCSA Covered)",
    subcategory: "Therapeutic Class – Antibiotics",
    location: "Main Acute Care Hospital",
    qty: 200, par: 50, cost: 2.4,
    expiry: "Mar 1, 2027", expiryRaw: "2027-03-01",
    status: [{ label: "In Stock", color: "success" }, { label: "Quarantined", color: "warning" }],
  },
  {
    id: 2,
    name: "Epinephrine 1mg/mL 10mL Vial",
    ndc: "0409-7166-01",
    itemType: "Pharmaceuticals (Drugs)",
    category: "Rx Drugs (DSCSA Covered)",
    subcategory: "Therapeutic Class – Emergency/Critical Care",
    location: "Main Acute Care Hospital",
    qty: 4, par: 20, cost: 18.5,
    expiry: "Sep 15, 2026", expiryRaw: "2026-09-15",
    status: [{ label: "Low Stock", color: "warning" }],
  },
  {
    id: 3,
    name: "Sodium Chloride 0.9% IV 1L",
    ndc: "0338-0049-04",
    itemType: "Pharmaceuticals (Drugs)",
    category: "IV Solutions (DSCSA Excluded)",
    subcategory: "Certain IV fluids / electrolytes",
    location: "Main Acute Care Hospital",
    qty: 12, par: 40, cost: 3.2,
    expiry: "Jan 31, 2026", expiryRaw: "2026-01-31", expired: true,
    status: [{ label: "Low Stock", color: "warning" }],
  },
  {
    id: 4,
    name: "Morphine Sulfate 10mg/mL",
    ndc: "0641-6083-25",
    itemType: "Pharmaceuticals (Drugs)",
    category: "Rx Drugs (DSCSA Covered)",
    subcategory: "Controlled Substance – Schedule II",
    location: "Main Acute Care Hospital",
    qty: 18, par: 10, cost: 14.8,
    expiry: "Apr 15, 2026", expiryRaw: "2026-04-15", expiringSoon: true,
    status: [{ label: "In Stock", color: "success" }, { label: "Schedule II", color: "error" }],
  },
  {
    id: 5,
    name: "Nitrile Exam Gloves (L) 100/bx",
    ndc: "SKU-GLV-L",
    itemType: "Consumables",
    category: "Clinical Consumables",
    subcategory: "PPE",
    location: "Main Acute Care Hospital",
    qty: 30, par: 15, cost: 12.0,
    expiry: "Jun 1, 2028", expiryRaw: "2028-06-01",
    status: [{ label: "In Stock", color: "success" }],
  },
  {
    id: 6,
    name: "Surgical Mask ASTM Level 3",
    ndc: "SKU-MASK-L3",
    itemType: "Consumables",
    category: "Clinical Consumables",
    subcategory: "PPE",
    location: "Main Acute Care Hospital",
    qty: 450, par: 100, cost: 0.48,
    expiry: "Jan 1, 2028", expiryRaw: "2028-01-01",
    status: [{ label: "In Stock", color: "success" }],
  },
  {
    id: 7,
    name: "4×4 Gauze Pads Sterile 10/pk",
    ndc: "SKU-GAUZE-44",
    itemType: "Consumables",
    category: "Clinical Consumables",
    subcategory: "Dressings & wound care",
    location: "Main Acute Care Hospital",
    qty: 200, par: 50, cost: 2.8,
    expiry: "Jan 1, 2029", expiryRaw: "2029-01-01",
    status: [{ label: "In Stock", color: "success" }],
  },
  {
    id: 8,
    name: "BD Vacutainer EDTA 10mL",
    ndc: "SKU-BD-EDTA",
    itemType: "Lab Reagents & Diagnostics",
    category: "Specimen Collection",
    subcategory: "Consumables",
    location: "Main Acute Care Hospital",
    qty: 600, par: 150, cost: 0.35,
    expiry: "Dec 1, 2027", expiryRaw: "2027-12-01",
    status: [{ label: "In Stock", color: "success" }],
  },
  {
    id: 9,
    name: "Epinephrine 1mg/mL 10mL Vial",
    ndc: "0409-7166-01",
    itemType: "Pharmaceuticals (Drugs)",
    category: "Rx Drugs (DSCSA Covered)",
    subcategory: "Therapeutic Class – Emergency/Critical Care",
    location: "Main Acute Care Hospital",
    qty: 4, par: 10, cost: 18.5,
    expiry: "Sep 15, 2026", expiryRaw: "2026-09-15",
    status: [{ label: "Low Stock", color: "warning" }],
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
    status: (item.status || []).map(({ label, color }) => ({ label, color })),
  }));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return hydrate(JSON.parse(raw));
  } catch { /* ignore */ }
  return hydrate(INITIAL_INVENTORY);
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dehydrate(items)));
  } catch { /* ignore */ }
}

export function useInventory() {
  const [items, setItems] = useState(load);

  useEffect(() => { save(items); }, [items]);

  const addItem = (newItem) => {
    setItems((prev) => [
      ...prev,
      {
        ...newItem,
        id: Date.now(),
        expiryRaw: newItem.expireDate ? new Date(newItem.expireDate) : null,
        expiry: newItem.expireDate
          ? new Date(newItem.expireDate).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })
          : "—",
        status: (newItem.qty ?? 0) < (newItem.par ?? 0)
          ? [{ label: "Low Stock", color: "warning" }]
          : [{ label: "In Stock", color: "success" }],
      },
    ]);
  };

  const updateItem = (id, updated) => {
    setItems((prev) =>
      prev.map((item) =>
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
      )
    );
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, addItem, updateItem, deleteItem };
}

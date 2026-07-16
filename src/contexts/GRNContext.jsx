import { createContext, useContext, useState, useEffect } from "react";

const GRN_STORAGE_KEY = "grn_data";
const GRN_VERSION_KEY = "grn_data_version";
const GRN_VERSION = "v2";

const INITIAL_GRNS = [
  {
    id: "GRN-2026-0003",
    linkedPO: "PO-2026-0002",
    supplier: "Medline Industries",
    location: "Main Acute Care Hospital",
    items: 2,
    totalValue: "$696",
    receivedBy: "S. Anderson",
    date: "Mar 20, 2026",
    condition: "Good",
    status: "Completed",
    invoice: {
      status: "verified",
      number: "INV-MDL-2026-4821",
      date: "Mar 20, 2026",
      dueDate: "May 4, 2026",
      amount: 696.0,
      paymentTerms: "Net-45",
      fileName: "INV-MDL-2026-4821.pdf",
      fileSize: "184 KB",
      verifiedBy: "T. Williams",
      notes: "Invoice verified and matched with PO",
      uploadedAt: "Mar 20, 2026 14:32",
    },
  },
  {
    id: "GRN-2026-0002",
    linkedPO: "PO-2026-0004",
    supplier: "McKesson Medical-Surgical",
    location: "Main Acute Care Hospital",
    items: 1,
    totalValue: "$360",
    receivedBy: "S. Anderson",
    date: "Mar 19, 2026",
    condition: "Short Delivery",
    status: "Discrepancy",
    invoice: { status: "none" },
    lineItems: [
      {
        item: "Sterile Gauze Pads (4x4, 12-ply)",
        itemCode: "GAU-4x4-12",
        ordQty: 60,
        poQty: 60,
        rcvQty: 50,
        unitCost: 7.20,
        expiry: "Mar 2027",
        lotNo: "LOT-2026-0890",
      },
    ],
  },
  {
    id: "GRN-2026-0001",
    linkedPO: "PO-2026-0001",
    supplier: "Cardinal Health",
    location: "Central Warehouse & Stores",
    items: 5,
    totalValue: "$1,240",
    receivedBy: "T. Williams",
    date: "Mar 15, 2026",
    condition: "Good",
    status: "Pending",
    invoice: { status: "none" },
    lineItems: [
      {
        item: "Latex Examination Gloves",
        itemCode: "GLV-LAT-XL",
        ordQty: 100,
        poQty: 100,
        rcvQty: 100,
        unitCost: 5.00,
        expiry: "Mar 2028",
        lotNo: "LOT-2026-0456",
      },
      {
        item: "Surgical Masks (50/box)",
        itemCode: "MAS-SUR-50",
        ordQty: 50,
        poQty: 50,
        rcvQty: 50,
        unitCost: 12.50,
        expiry: "Dec 2027",
        lotNo: "LOT-2026-0457",
      },
    ],
  },
];

const GRNContext = createContext(null);

export function GRNProvider({ children }) {
  const [grns, setGRNs] = useState(() => {
    try {
      const version = localStorage.getItem(GRN_VERSION_KEY);
      if (version !== GRN_VERSION) {
        // Clear stale data so new location names take effect
        localStorage.removeItem(GRN_STORAGE_KEY);
        localStorage.setItem(GRN_VERSION_KEY, GRN_VERSION);
        return INITIAL_GRNS;
      }
      const saved = localStorage.getItem(GRN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load GRNs from localStorage:", e);
    }
    return INITIAL_GRNS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(GRN_STORAGE_KEY, JSON.stringify(grns));
    } catch (e) {
      console.error("Failed to save GRNs to localStorage:", e);
    }
  }, [grns]);

  const addGRN = (grn) =>
    setGRNs((prev) => [{ ...grn, invoice: grn.invoice ?? { status: "none" } }, ...prev]);

  const updateGRN = (grnId, updatedGRN) => {
    setGRNs((prev) =>
      prev.map((grn) => (grn.id === grnId ? { ...grn, ...updatedGRN } : grn))
    );
  };

  const updateGRNInvoice = (linkedPO, invoiceData) => {
    setGRNs((prev) =>
      prev.map((grn) =>
        grn.linkedPO === linkedPO
          ? {
              ...grn,
              invoice: invoiceData.pdfOnly
                ? {
                    ...grn.invoice,
                    fileName: invoiceData.file?.name || grn.invoice.fileName,
                    fileSize: invoiceData.fileSize || grn.invoice.fileSize,
                    uploadedAt: new Date().toLocaleString(),
                  }
                : {
                    status: "verified",
                    number: invoiceData.invoiceNumber,
                    date: invoiceData.invoiceDate,
                    dueDate: invoiceData.paymentDueDate,
                    amount: invoiceData.invoiceAmount,
                    paymentTerms: invoiceData.paymentTerms,
                    fileName: invoiceData.file?.name || "invoice.pdf",
                    fileSize: "184 KB",
                    verifiedBy: "Current User",
                    notes: invoiceData.notes,
                    uploadedAt: new Date().toLocaleString(),
                  },
            }
          : grn
      )
    );
  };

  const nextGRNId = () => {
    const year = new Date().getFullYear();
    return `GRN-${year}-${String(grns.length + 1).padStart(4, "0")}`;
  };

  return (
    <GRNContext.Provider value={{ grns, addGRN, updateGRN, updateGRNInvoice, nextGRNId }}>
      {children}
    </GRNContext.Provider>
  );
}

export function useGRN() {
  const ctx = useContext(GRNContext);
  if (!ctx) throw new Error("useGRN must be used within a GRNProvider");
  return ctx;
}

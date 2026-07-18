import { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  TextField,
  MenuItem,
  Select,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AddIcon from "@mui/icons-material/Add";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useInventory } from "../../contexts/InventoryContext";
import { getLocations } from "../../utils/locationUtils";
import { getSupplierNames } from "../../utils/supplierUtils";
import { getManufacturerNames } from "../../utils/manufacturerUtils";

const CONDITIONS = [
  "Good — No Issues",
  "Short Close",
  "Damaged",
  "Cold Chain Breach",
  "Wrong Item",
  "Expiry",
];

const loadPOsFromStorage = () => {
  try {
    const raw = localStorage.getItem("purchase_orders_data");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
};

const emptyLine = () => ({
  id: Date.now() + Math.random(),
  item: "",
  itemCode: "",
  ndc: "",
  category: "",
  supplier: "",
  unitCost: "",
  uom: "",
  poQty: "",
  rcvQty: "",
  condition: "Good — No Issues",
  lotNo: "",
  expiry: "",
  fromMaster: false,
  shortCloseReason: "",
});

function DateField({ value, onChange, readOnly = false }) {
  const ref = useRef(null);
  const openPicker = () => {
    if (readOnly) return;
    try {
      ref.current?.showPicker();
    } catch {
      ref.current?.click();
    }
  };
  return (
    <Box
      onClick={openPicker}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        border: readOnly ? "1px solid #e5e7eb" : "1px solid #d1d5db",
        borderRadius: "6px",
        bgcolor: readOnly ? "#f3f4f6" : "#fff",
        px: 1,
        height: 34,
        cursor: readOnly ? "default" : "pointer",
        width: "100%",
        "&:hover": { borderColor: readOnly ? "#e5e7eb" : "#9ca3af" },
        transition: "border-color 0.15s",
        boxSizing: "border-box",
        background: "#fff",
        colorScheme: "light",
      }}
    >
      <input
        onClick={(e) => e.target.showPicker()}
        ref={ref}
        type="date"
        value={value}
        min={new Date().toISOString().split("T")[0]} // ✅ Prevent past dates
        readOnly={readOnly}
        onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 12,
          color: value ? (readOnly ? "#6b7280" : "#111827") : "#9ca3af",
          flex: 1,
          cursor: readOnly ? "default" : "pointer",
          minWidth: 0,
          width: "100%",
          colorScheme: "light",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "textfield",
          backgroundImage: "none",
        }}
      />
      {readOnly ? (
        <LockOutlinedIcon
          sx={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}
        />
      ) : (
        <Box
          sx={{
            position: "absolute",
            right: 8,
            display: "flex",
            alignItems: "center",
            pointerEvents: "auto",
          }}
        />
      )}
    </Box>
  );
}

const labelSx = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  mb: 0.5,
  display: "block",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "6px",
    bgcolor: "#fff",
    "& fieldset": { borderColor: "#d1d5db" },
    "&:hover fieldset": { borderColor: "#9ca3af" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": { py: "8px", px: "12px" },
  "& .MuiInputBase-input::placeholder": { color: "#9ca3af", opacity: 1 },
};

const disabledInputSx = {
  ...inputSx,
  "& .MuiOutlinedInput-root": {
    ...inputSx["& .MuiOutlinedInput-root"],
    bgcolor: "#f9fafb",
  },
};

const selectSx = {
  fontSize: 13,
  borderRadius: "6px",
  "& fieldset": { borderColor: "#d1d5db" },
  "&:hover fieldset": { borderColor: "#9ca3af" },
  "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: "1.5px" },
  "& .MuiSelect-select": { py: "8px", px: "12px" },
};

const btnBase = {
  fontSize: 13,
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "8px",
  px: "20px",
  py: "9px",
  outline: "none",
  "&:focus": { outline: "none" },
};

const rowFieldSx = (extraInput = {}, extraRoot = {}) => ({
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "6px",
    bgcolor: "#fff",
    "& fieldset": { borderColor: "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
    ...extraRoot,
  },
  "& .MuiInputBase-input": { py: "6px", px: "8px", ...extraInput },
  "& input[type=number]": { MozAppearance: "textfield" },
  "& input::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
  "& input::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
});

function BarcodeScannerModal({ open, onClose, onResult }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setManualCode("");
    setErrorMsg("");
    setStatus("checking");
    let stopped = false;
    const startScan = async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (stopped) return;
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        setStatus("scanning");
        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (stopped || !result) return;
            stopped = true;
            try {
              reader.reset();
            } catch {}
            onResult(result.getText());
            onClose();
          },
        );
      } catch {
        if (!stopped) {
          setStatus("error");
          setErrorMsg("Camera not available. Use manual entry below.");
        }
      }
    };
    startScan();
    return () => {
      stopped = true;
      try {
        readerRef.current?.reset();
      } catch {}
    };
  }, [open]);

  const handleUse = () => {
    if (!manualCode.trim()) {
      setErrorMsg("Enter a barcode or NDC");
      return;
    }
    try {
      readerRef.current?.reset();
    } catch {}
    onResult(manualCode.trim());
    onClose();
  };

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: 420,
          maxWidth: "95vw",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path
                  d="M5.33333 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V5.33333M14 5.33333V3.33333C14 2.97971 13.8595 2.64057 13.6095 2.39052C13.3594 2.14048 13.0203 2 12.6667 2H10.6667M10.6667 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V10.6667M2 10.6667V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H5.33333"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                Barcode / QR Scanner
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                Point camera at barcode to scan automatically
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              outline: "none",
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            position: "relative",
            background: "#f1f5f9",
            height: 260,
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            muted
            playsInline
          />
          {status === "scanning" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {[
                {
                  top: "18%",
                  left: "18%",
                  borderTop: "3px solid #fff",
                  borderLeft: "3px solid #fff",
                },
                {
                  top: "18%",
                  right: "18%",
                  borderTop: "3px solid #fff",
                  borderRight: "3px solid #fff",
                },
                {
                  bottom: "18%",
                  left: "18%",
                  borderBottom: "3px solid #fff",
                  borderLeft: "3px solid #fff",
                },
                {
                  bottom: "18%",
                  right: "18%",
                  borderBottom: "3px solid #fff",
                  borderRight: "3px solid #fff",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{ position: "absolute", width: 28, height: 28, ...s }}
                />
              ))}
              {[
                {
                  top: "30%",
                  left: "30%",
                  borderTop: "2px solid #2563eb",
                  borderLeft: "2px solid #2563eb",
                },
                {
                  top: "30%",
                  right: "30%",
                  borderTop: "2px solid #2563eb",
                  borderRight: "2px solid #2563eb",
                },
                {
                  bottom: "30%",
                  left: "30%",
                  borderBottom: "2px solid #2563eb",
                  borderLeft: "2px solid #2563eb",
                },
                {
                  bottom: "30%",
                  right: "30%",
                  borderBottom: "2px solid #2563eb",
                  borderRight: "2px solid #2563eb",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{ position: "absolute", width: 18, height: 18, ...s }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: "30%",
                  right: "30%",
                  top: "50%",
                  height: 2,
                  background:
                    "linear-gradient(90deg,transparent,#2563eb,transparent)",
                  animation: "scanLine 1.5s ease-in-out infinite",
                }}
              />
            </div>
          )}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent,rgba(0,0,0,0.55))",
              padding: "20px 14px 10px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>
              {status === "checking" && "Checking camera..."}
              {status === "scanning" &&
                "📷 Point camera at barcode — scans automatically"}
              {status === "error" && "⚠ " + errorMsg}
            </span>
          </div>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Enter Barcode / NDC
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
            USB &amp; Bluetooth scanners type directly here — just scan
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value);
                setErrorMsg("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleUse()}
              placeholder="Scan or type code..."
              autoFocus
              style={{
                flex: 1,
                height: 36,
                padding: "7px 12px",
                fontSize: 13,
                background: "#f9fafb",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                outline: "none",
                color: "#111827",
              }}
            />
            <button
              onClick={handleUse}
              style={{
                height: 36,
                padding: "0 18px",
                fontSize: 13,
                fontWeight: 600,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                outline: "none",
              }}
            >
              Use
            </button>
          </div>
          {errorMsg && (
            <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>
              ⚠ {errorMsg}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes scanLine{0%{transform:translateY(-28px);opacity:0.3}50%{transform:translateY(0);opacity:1}100%{transform:translateY(28px);opacity:0.3}}`}</style>
    </div>
  );
}

export default function NewGRNDialog({
  open,
  onClose,
  onSave,
  nextId,
  linkedPO,
  draftGRN,
  existingGRNs = [],
}) {
  const today = new Date().toISOString().split("T")[0];
  const { items: inventoryItems } = useInventory();
  const [locations, setLocations] = useState(() => getLocations());

  useEffect(() => {
    if (open) {
      setLocations(getLocations());
    }
  }, [open]);

  useEffect(() => {
    const onLocationsUpdated = () => {
      if (open) {
        setLocations(getLocations());
      }
    };
    window.addEventListener("locationsUpdated", onLocationsUpdated);
    return () => {
      window.removeEventListener("locationsUpdated", onLocationsUpdated);
    };
  }, [open]);

  const [suppliers, setSuppliers] = useState(() => getSupplierNames());

  useEffect(() => {
    if (open) {
      setSuppliers(getSupplierNames());
    }
  }, [open]);

  useEffect(() => {
    const onSuppliersUpdated = () => {
      if (open) {
        setSuppliers(getSupplierNames());
      }
    };
    window.addEventListener("suppliersUpdated", onSuppliersUpdated);
    return () => {
      window.removeEventListener("suppliersUpdated", onSuppliersUpdated);
    };
  }, [open]);

  const [allPOs, setAllPOs] = useState([]);
  useEffect(() => {
    if (open) {
      setAllPOs(loadPOsFromStorage());
    }
  }, [open]);

  const po = linkedPO && typeof linkedPO === "object" ? linkedPO : null;
  const itemsList = inventoryItems.map((it) => it.name);

  // ── Build already-received quantities map ──
  const alreadyReceivedMap = (() => {
    if (!po) return {};
    const map = {};
    existingGRNs
      .filter(
        (g) =>
          g.linkedPO === po.id &&
          (g.grnType === "submitted" ||
            g.status === "Approved" ||
            g.status === "Completed" ||
            g.status === "Short Delivery") &&
          g.id !== draftGRN?.id,
      )
      .forEach((g) => {
        (g.lineItems || []).forEach((li) => {
          const key = (li.item || "").toLowerCase();
          map[key] = (map[key] || 0) + (parseFloat(li.rcvQty) || 0);
        });
      });
    return map;
  })();

  // ── FIX: Only close items from SHORT CLOSE GRNs (buyer accepted partial as final).
  //    Short Delivery GRNs mean supplier sent less THIS TIME but more is still expected.
  //    So we only use isShortClose / status === "Short Close" here — NOT isShortDelivery.
  const shortCloseClosedSet = (() => {
    if (!po) return new Set();
    const set = new Set();
    existingGRNs
      .filter(
        (g) =>
          g.linkedPO === po.id &&
          g.grnType === "submitted" &&
          (g.isShortClose || g.status === "Short Close") &&
          g.id !== draftGRN?.id,
      )
      .forEach((g) => {
        (g.lineItems || []).forEach((li) => {
          const rcv = parseFloat(li.rcvQty) || 0;
          const poQ = parseFloat(li.poQty) || 0;
          if (poQ > 0 && rcv < poQ) {
            set.add((li.item || "").toLowerCase());
          }
        });
      });
    return set;
  })();

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

 

  const fresh = () => ({
    grnNumber: nextId || "GRN-2026-0006",
    linkedPO: po?.id || "",
    supplier: po?.supplier || "",
    receiptDate: today,
    receivedBy: "Sarah Anderson",
    deliveryNote: "",
    condition: "Good — No Issues",
    location: "",
    remarks: "",
    shipmentDate: "",
    supplierInvoice: "",
    tradingPartnerLicense: "",
    tsConfirmed: false,
  });

  // Only items with an actual approved quantity (approvedQty > 0) are
  // eligible to be received against — an item that's still fully Pending
  // (never approved/rejected) has nothing cleared for receipt yet, even
  // though its overall balance is still "open" from an approval standpoint.
  const freshLines = () => {
    if (po?.lineItems?.length) {
      const eligibleItems = po.lineItems.filter(
        (item) => Number(item.approvedQty) > 0,
      );

      const lines = eligibleItems
        .map((item) => {
          const master = inventoryItems.find(
            (inv) => inv.name === item.description,
          );
          const orderedQty = parseFloat(item.quantity ?? item.qty ?? 0);
          const effectiveQty = Number(item.approvedQty);
          const alreadyRcv =
            alreadyReceivedMap[(item.description || "").toLowerCase()] || 0;
          const openQty = Math.max(0, effectiveQty - alreadyRcv);

          // ── FIX: Only check shortCloseClosedSet (not short delivery) ──
          const isShortCloseClosed = shortCloseClosedSet.has(
            (item.description || "").toLowerCase(),
          );

          return {
            id: Date.now() + Math.random(),
            item: item.description || "",
            itemCode: master?.itemCode || "",
            ndc: master?.ndc || "",
            category: master?.category || "",
            supplier: master?.supplier || "",
            unitCost:
              master?.cost != null
                ? String(master.cost)
                : String(item.unitCost ?? ""),
            uom: master?.unitOfMeasure || "",
            // ── FIX: poQty is what THIS GRN is entitled to receive right
            //    now — the remaining open balance — not the cumulative
            //    approvedQty across every approval round. Using
            //    effectiveQty here made a fully-received leftover balance
            //    look "short" (e.g. approvedQty=10 total after two rounds,
            //    but only 5 remained open — rcvQty defaulted to 5 while
            //    poQty showed 10, tripping the short-delivery flag even
            //    though the full remaining amount was being received). ──
            poQty: String(openQty),
            openQty,
            rcvQty: String(openQty),
            condition: "Good — No Issues",
            lotNo: "",
            expiry: "",
            fromMaster: !!master,
            shortCloseReason: "",
            wasPartial: effectiveQty < orderedQty,
            _isShortCloseClosed: isShortCloseClosed,
          };
        })
        // ── FIX: Filter out only SHORT CLOSE items and zero-open items.
        //    Short Delivery items still show with their remaining open qty. ──
        .filter((line) => !line._isShortCloseClosed && line.openQty > 0);

      return lines.length > 0 ? lines : [emptyLine()];
    }
    return [emptyLine()];
  };

  const [form, setForm] = useState(fresh);
  const [lines, setLines] = useState(freshLines);

  useEffect(() => {
    if (open) {
      if (draftGRN) {
        let normalizedLocation = draftGRN.location || "";
        if (normalizedLocation.startsWith("loc_")) {
          const idx = parseInt(normalizedLocation.replace("loc_", ""));
          if (!isNaN(idx) && locations[idx]) {
            normalizedLocation = locations[idx];
          }
        }

        setForm((prev) => ({
          ...fresh(),
          grnNumber: draftGRN.id || prev.grnNumber,
          linkedPO: draftGRN.linkedPO || prev.linkedPO,
          supplier: draftGRN.supplier || prev.supplier,
          location: normalizedLocation || prev.location,
          receivedBy: draftGRN.receivedBy || prev.receivedBy,
          condition: draftGRN.condition
            ? CONDITIONS.find((c) => c.startsWith(draftGRN.condition)) ||
              draftGRN.condition
            : prev.condition,
        }));
        setLines(freshLines());
      } else if (po) {
        // ── Auto-populate location when linkedPO prop is provided ──
        setForm((prev) => ({
          ...fresh(),
          linkedPO: po.id,
          supplier: po.supplier || "",
          location: po.location || "", // ── Set location from PO ──
        }));
        setLines(freshLines());
      } else {
        setForm(fresh());
        setLines(freshLines());
      }
      setSubmitAttempted(false);
    }
  }, [open, linkedPO, draftGRN]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addLine = () => setLines((l) => [...l, emptyLine()]);
  const removeLine = (id) => setLines((l) => l.filter((ln) => ln.id !== id));

  const updateLine = (id, k, v) => {
    if (k === "item") {
      const master = inventoryItems.find((inv) => inv.name === v);
      setLines((prev) =>
        prev.map((ln) =>
          ln.id === id
            ? {
                ...ln,
                item: v,
                itemCode: master?.itemCode || "",
                ndc: master?.ndc || "",
                category: master?.category || "",
                supplier: master?.supplier || "",
                unitCost: master?.cost != null ? String(master.cost) : "",
                uom: master?.unitOfMeasure || "",
                condition: "Good — No Issues",
                lotNo: "",
                expiry: "",
                fromMaster: !!master,
              }
            : ln,
        ),
      );
    } else {
      setLines((prev) =>
        prev.map((ln) => (ln.id === id ? { ...ln, [k]: v } : ln)),
      );
    }
  };

  const lineIsShort = (line) => {
    const pq = parseFloat(line.poQty);
    const rq = parseFloat(line.rcvQty);
    return !isNaN(pq) && !isNaN(rq) && pq > 0 && rq < pq;
  };

  const hasShortDelivery = lines.some(lineIsShort);

  const shortLinesWithoutReason = lines.filter(
    (ln) => lineIsShort(ln) && !ln.shortCloseReason?.trim(),
  );

  const linesWithMissingRequired = lines.filter(
    (ln) =>
      ln.item &&
      (!ln.condition?.trim() || !ln.lotNo?.trim() || !ln.expiry?.trim()),
  );

  const isSubmitDisabled =
    linesWithMissingRequired.length > 0 || shortLinesWithoutReason.length > 0;

  const shortSummary = lines.filter(lineIsShort).map((ln) => {
    const gap = parseFloat(ln.poQty) - parseFloat(ln.rcvQty);
    return `${ln.item || "Item"}: ${gap} unit${gap !== 1 ? "s" : ""} short`;
  });

  // ── FIX: Build a Short CLOSE closed set for a given PO id (not short delivery) ──
  const buildShortCloseClosedSetForPO = (poId) => {
    const set = new Set();
    existingGRNs
      .filter(
        (g) =>
          g.linkedPO === poId &&
          g.grnType === "submitted" &&
          (g.isShortClose || g.status === "Short Close"),
      )
      .forEach((g) => {
        (g.lineItems || []).forEach((li) => {
          const rcv = parseFloat(li.rcvQty) || 0;
          const poQ = parseFloat(li.poQty) || 0;
          if (poQ > 0 && rcv < poQ) {
            set.add((li.item || "").toLowerCase());
          }
        });
      });
    return set;
  };

  const handlePOChange = (poId) => {
    setField("linkedPO", poId);
    const selectedPO = allPOs.find((p) => p.id === poId);
    if (!selectedPO) return;

    setField("supplier", selectedPO.supplier || "");

    if (!form.location && selectedPO.location) {
      let normalizedLocation = selectedPO.location;
      if (normalizedLocation.startsWith("loc_")) {
        const idx = parseInt(normalizedLocation.replace("loc_", ""));
        if (!isNaN(idx) && locations[idx]) {
          normalizedLocation = locations[idx];
        }
      }
      setField("location", normalizedLocation);
    }

    if (selectedPO.lineItems?.length) {
      // ── FIX: Use Short Close closed set (not short delivery) ──
      const scClosedSet = buildShortCloseClosedSetForPO(poId);

      // ── Build already-received map for this PO ──
      const alreadyRcvMap = {};
      existingGRNs
        .filter(
          (g) =>
            g.linkedPO === poId &&
            (g.grnType === "submitted" ||
              g.status === "Approved" ||
              g.status === "Completed" ||
              g.status === "Short Delivery"),
        )
        .forEach((grn) => {
          (grn.lineItems || []).forEach((lineItem) => {
            const key = (lineItem.item || "").toLowerCase();
            alreadyRcvMap[key] =
              (alreadyRcvMap[key] || 0) + (parseFloat(lineItem.rcvQty) || 0);
          });
        });

      // Only items with an approved quantity (approvedQty > 0) are eligible
      // — items still fully Pending have nothing cleared to receive yet.
      const newLines = selectedPO.lineItems
        .filter((item) => Number(item.approvedQty) > 0)
        .map((item) => {
          const master = inventoryItems.find(
            (inv) =>
              inv.name?.toLowerCase().trim() ===
              (item.description || "").toLowerCase().trim(),
          );
          const effectiveQty = Number(item.approvedQty);
          const alreadyReceivedQty =
            alreadyRcvMap[(item.description || "").toLowerCase()] || 0;
          const remainingQty = Math.max(0, effectiveQty - alreadyReceivedQty);

          // ── FIX: Only flag items closed by Short Close (not short delivery) ──
          const isSCClosed = scClosedSet.has(
            (item.description || "").toLowerCase(),
          );

          return {
            id: Date.now() + Math.random(),
            item: item.description || "",
            itemCode: master?.itemCode || "",
            ndc: master?.ndc || "",
            category: master?.category || "",
            supplier: selectedPO.supplier || "",
            unitCost:
              master?.cost != null
                ? String(master.cost)
                : String(item.unitCost ?? ""),
            uom: master?.uom || master?.unitOfMeasure || "",
            // ── FIX: same reasoning as freshLines() above — poQty must be
            //    the remaining open balance for this GRN, not the
            //    cumulative approvedQty across all approval rounds. ──
            poQty: String(remainingQty),
            openQty: remainingQty,
            rcvQty: String(remainingQty),
            condition: "Good — No Issues",
            lotNo: "",
            expiry: "",
            fromMaster: !!master,
            shortCloseReason: "",
            _isShortCloseClosed: isSCClosed,
          };
        })
        // ── FIX: Filter out only Short Close items and zero-open items.
        //    Short Delivery items still appear with remaining qty. ──
        .filter((line) => !line._isShortCloseClosed && line.openQty > 0);

      setLines(newLines.length > 0 ? newLines : [emptyLine()]);
    } else {
      setLines([emptyLine()]);
    }
  };

  const calcTotal = () =>
    lines
      .filter((l) => l.item)
      .reduce(
        (sum, l) =>
          sum + (parseFloat(l.rcvQty) || 0) * (parseFloat(l.unitCost) || 0),
        0,
      );

  const buildGRN = (status) => {
    const total = calcTotal();
    const shortCloseReasons = lines
      .filter(lineIsShort)
      .map((ln) => ln.shortCloseReason?.trim())
      .filter(Boolean);

    return {
      id: form.grnNumber,
      linkedPO: form.linkedPO,
      supplier: form.supplier,
      location: form.location,
      items: lines.filter((l) => l.item).length || 1,
      totalValue: `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      receivedBy: form.receivedBy,
      receivedQty: lines.reduce((s, l) => s + (parseFloat(l.rcvQty) || 0), 0),
      date: new Date(form.receiptDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      condition: form.condition.startsWith("Good")
        ? "Good"
        : form.condition.split(" — ")[0],
      status,
      remarks: form.remarks,
      deliveryNote: form.deliveryNote,
      supplierInvoice: form.supplierInvoice,
      lineItems: lines
        .filter((l) => l.item)
        .map((l) => ({
          item: l.item,
          itemCode: l.itemCode,
          ndc: l.ndc,
          category: l.category,
          uom: l.uom,
          unitCost: parseFloat(l.unitCost) || 0,
          poQty: parseFloat(l.poQty) || 0,
          rcvQty: parseFloat(l.rcvQty) || 0,
          condition: l.condition,
          lotNo: l.lotNo,
          expiry: l.expiry,
          shortCloseReason: l.shortCloseReason || "",
        })),
      isShortDelivery: hasShortDelivery,
      shortCloseReasons,
    };
  };

  const resetAndClose = () => {
    setForm(fresh());
    setLines(freshLines());
    setSubmitAttempted(false);
    onClose();
  };

  const handleDraft = () => {
    onSave({ ...buildGRN("Pending"), grnType: "draft" });
    resetAndClose();
  };

  const updatePOAfterGRNSubmission = (poId, grnsCreated = []) => {
    try {
      const pos = JSON.parse(
        localStorage.getItem("purchase_orders_data") || "[]",
      );
      const po = pos.find((p) => p.id === poId);
      if (!po) return;

      const relevantGRNs = [
        ...existingGRNs.filter(
          (g) =>
            g.linkedPO === poId &&
            (g.grnType === "submitted" ||
              g.status === "Approved" ||
              g.status === "Completed" ||
              g.status === "Short Delivery"),
        ),
        ...grnsCreated.filter((g) => g.linkedPO === poId),
      ];

      const receivedByItem = {};
      relevantGRNs.forEach((grn) => {
        (grn.lineItems || []).forEach((li) => {
          const key = (li.item || "").toLowerCase();
          if (!key) return;
          receivedByItem[key] =
            (receivedByItem[key] || 0) + (parseFloat(li.rcvQty) || 0);
        });
      });

      // ── FIX: Only close items from Short Close GRNs, not Short Delivery ──
      const scClosedForUpdate = new Set();
      relevantGRNs
        .filter((g) => g.isShortClose || g.status === "Short Close")
        .forEach((g) => {
          (g.lineItems || []).forEach((li) => {
            const rcv = parseFloat(li.rcvQty) || 0;
            const poQ = parseFloat(li.poQty) || 0;
            if (poQ > 0 && rcv < poQ) {
              scClosedForUpdate.add((li.item || "").toLowerCase());
            }
          });
        });

      // ── FIX: Do NOT overwrite the PO line's original `quantity`/`qty`
      //    (the fixed ordered amount). Previously this block replaced
      //    quantity/qty with the *remaining* balance after every GRN
      //    submission, which corrupted every downstream calculation that
      //    treats `quantity` as the fixed ordered amount (getLineBalance,
      //    the approval modal, computePOStatus). That's what caused the
      //    "last unit disappears" bug: after approving 9 of 10 and
      //    submitting a GRN, quantity got overwritten to 1, so
      //    approvedQty(9) - quantity(1) went negative, balance clamped to
      //    0, and the item silently looked fully resolved — no more
      //    Approve/Reject buttons and no eligibility for a new GRN on the
      //    true leftover unit. We only track derived received/open fields
      //    here; `quantity`/`qty` stay exactly as originally ordered. ──
      const lineItems = (po.lineItems || []).map((poItem) => {
        const key = (poItem.description || poItem.item || "").toLowerCase();
        const orderedQty = parseFloat(poItem.quantity ?? poItem.qty ?? 0) || 0;
        const receivedQty = receivedByItem[key] || 0;
        // ── FIX: Only treat balance as 0 for Short Close items ──
        const openQty = scClosedForUpdate.has(key)
          ? 0
          : Math.max(0, orderedQty - receivedQty);

        return {
          ...poItem,
          receivedQty,
          balanceQty: openQty,
          openQty,
        };
      });

      const orderedTotal = lineItems.reduce(
        (sum, item) => sum + (parseFloat(item.quantity ?? item.qty ?? 0) || 0),
        0,
      );
      const receivedTotal = lineItems.reduce(
        (sum, item) => sum + (parseFloat(item.receivedQty) || 0),
        0,
      );
      const nextStatus =
        orderedTotal > 0 && receivedTotal > 0 && receivedTotal < orderedTotal
          ? "Partially Received"
          : po.status;

      const updatedPO = {
        ...po,
        lineItems,
        status: nextStatus,
        receivedQty: receivedTotal,
        balanceQty: Math.max(0, orderedTotal - receivedTotal),
      };

      localStorage.setItem(
        "purchase_orders_data",
        JSON.stringify(pos.map((p) => (p.id === poId ? updatedPO : p))),
      );
      window.dispatchEvent(new Event("purchaseOrdersUpdated"));
    } catch (err) {
      console.error("Failed to update PO balances:", err);
    }
  };

  const handleConfirm = () => {
    if (!form.linkedPO || !form.location) {
      setSubmitAttempted(true);
      return;
    }

    if (!form.tsConfirmed) {
      setSubmitAttempted(true);
      return;
    }

    setSubmitAttempted(true);
    if (shortLinesWithoutReason.length > 0) return;

    const discrepancyConditions = [
      "Damaged",
      "Cold Chain Breach",
      "Wrong Item",
      "Expiry",
    ];
    const goodLines = lines.filter(
      (l) => l.item && (!l.condition || l.condition === "Good — No Issues"),
    );
    const shortCloseLines = lines.filter(
      (l) => l.item && l.condition === "Short Close",
    );
    const discrepancyLines = lines.filter(
      (l) =>
        l.item &&
        l.condition &&
        discrepancyConditions.some((cond) => l.condition.includes(cond)),
    );

    const grnsToSave = [];

    // GRN for good items (received quantity)
    if (goodLines.length > 0) {
      const goodTotal = goodLines.reduce(
        (s, l) =>
          s + (parseFloat(l.rcvQty) || 0) * (parseFloat(l.unitCost) || 0),
        0,
      );

      const hasShortDeliveryLines = goodLines.some((l) => lineIsShort(l));
      const grnStatus = hasShortDeliveryLines ? "Short Delivery" : "Pending";

      const goodGRN = {
        id: form.grnNumber,
        linkedPO: form.linkedPO,
        supplier: form.supplier,
        location: form.location,
        items: goodLines.length,
        totalValue: `$${goodTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        receivedBy: form.receivedBy,
        receivedQty: goodLines.reduce(
          (s, l) => s + (parseFloat(l.rcvQty) || 0),
          0,
        ),
        date: new Date(form.receiptDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        condition: "Good",
        status: grnStatus,
        remarks: form.remarks,
        deliveryNote: form.deliveryNote,
        supplierInvoice: form.supplierInvoice,
        lineItems: goodLines.map((l) => ({
          item: l.item,
          itemCode: l.itemCode,
          ndc: l.ndc,
          category: l.category,
          uom: l.uom,
          unitCost: parseFloat(l.unitCost) || 0,
          poQty: parseFloat(l.poQty) || 0,
          rcvQty: parseFloat(l.rcvQty) || 0,
          condition: l.condition,
          lotNo: l.lotNo,
          expiry: l.expiry,
          shortCloseReason: l.shortCloseReason || "",
        })),
        // ── FIX: isShortDelivery only true when short lines exist; isShortClose is false ──
        isShortDelivery: hasShortDeliveryLines,
        isShortClose: false,
        shortCloseReasons: goodLines
          .filter(lineIsShort)
          .map((ln) => ln.shortCloseReason?.trim())
          .filter(Boolean),
        grnType: "submitted",
      };
      grnsToSave.push(goodGRN);
    }

    // SHORT CLOSE GRN
    if (shortCloseLines.length > 0) {
      const shortCloseTotal = shortCloseLines.reduce(
        (s, l) =>
          s + (parseFloat(l.rcvQty) || 0) * (parseFloat(l.unitCost) || 0),
        0,
      );
      const shortCloseReasons = shortCloseLines
        .map((ln) => ln.shortCloseReason?.trim())
        .filter(Boolean);

      const shortCloseGRN = {
        id: `${form.grnNumber}-SC`,
        linkedPO: form.linkedPO,
        supplier: form.supplier,
        location: form.location,
        items: shortCloseLines.length,
        totalValue: `$${shortCloseTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        receivedBy: form.receivedBy,
        receivedQty: shortCloseLines.reduce(
          (s, l) => s + (parseFloat(l.rcvQty) || 0),
          0,
        ),
        date: new Date(form.receiptDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        condition: "Short Close",
        status: "Short Close",
        remarks: form.remarks,
        deliveryNote: form.deliveryNote,
        supplierInvoice: form.supplierInvoice,
        lineItems: shortCloseLines.map((l) => ({
          item: l.item,
          itemCode: l.itemCode,
          ndc: l.ndc,
          category: l.category,
          uom: l.uom,
          unitCost: parseFloat(l.unitCost) || 0,
          poQty: parseFloat(l.poQty) || 0,
          rcvQty: parseFloat(l.rcvQty) || 0,
          condition: l.condition,
          lotNo: l.lotNo,
          expiry: l.expiry,
          shortCloseReason: l.shortCloseReason || "",
        })),
        // ── isShortClose: true marks this as buyer-accepted-final ──
        isShortClose: true,
        isShortDelivery: false,
        shortCloseReasons: shortCloseReasons,
        poStatus: "Short Close",
        grnType: "submitted",
      };
      grnsToSave.push(shortCloseGRN);
    }

    // DISCREPANCY GRN
    if (discrepancyLines.length > 0) {
      const discrepancyTotal = discrepancyLines.reduce(
        (s, l) =>
          s + (parseFloat(l.rcvQty) || 0) * (parseFloat(l.unitCost) || 0),
        0,
      );

      const conditionPriority = {
        Expiry: 6,
        "Cold Chain Breach": 5,
        Damaged: 4,
        "Wrong Item": 3,
        "Short Close": 2,
        "Good — No Issues": 1,
      };

      const worstCondition = discrepancyLines.reduce((worst, line) => {
        const lineCond = line.condition || "Good — No Issues";
        const condKey = lineCond.split(" — ")[0];
        const priority = conditionPriority[condKey] || 0;
        const worstPriority = conditionPriority[worst.split(" — ")[0]] || 0;
        return priority > worstPriority ? lineCond : worst;
      }, "Good — No Issues");

      const displayCondition = worstCondition.startsWith("Good")
        ? "Good"
        : worstCondition.split(" — ")[0];

      const discrepancyGRN = {
        id: `${form.grnNumber}-D`,
        linkedPO: form.linkedPO,
        supplier: form.supplier,
        location: form.location,
        items: discrepancyLines.length,
        totalValue: `$${discrepancyTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        receivedBy: form.receivedBy,
        receivedQty: discrepancyLines.reduce(
          (s, l) => s + (parseFloat(l.rcvQty) || 0),
          0,
        ),
        date: new Date(form.receiptDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        condition: displayCondition,
        status: "Discrepancy",
        remarks: form.remarks,
        deliveryNote: form.deliveryNote,
        supplierInvoice: form.supplierInvoice,
        lineItems: discrepancyLines.map((l) => ({
          item: l.item,
          itemCode: l.itemCode,
          ndc: l.ndc,
          category: l.category,
          uom: l.uom,
          unitCost: parseFloat(l.unitCost) || 0,
          poQty: parseFloat(l.poQty) || 0,
          rcvQty: parseFloat(l.rcvQty) || 0,
          condition: l.condition,
          lotNo: l.lotNo,
          expiry: l.expiry,
          shortCloseReason: l.shortCloseReason || "",
        })),
        isShortClose: discrepancyLines.some(lineIsShort),
        isShortDelivery: false,
        shortCloseReasons: discrepancyLines
          .filter(lineIsShort)
          .map((ln) => ln.shortCloseReason?.trim())
          .filter(Boolean),
        grnType: "submitted",
      };

      grnsToSave.push(discrepancyGRN);
      createReplacementRequestsFromGRN(discrepancyGRN);
    }

    updatePOAfterGRNSubmission(form.linkedPO, grnsToSave);
    grnsToSave.forEach((grn) => onSave(grn));
    resetAndClose();
  };

  const createReplacementRequestsFromGRN = (grnData) => {
    try {
      const replacementRequests = JSON.parse(
        localStorage.getItem("replacement_data") || "[]",
      );

      const conditionToReason = {
        Damaged: "Damaged",
        "Cold Chain Breach": "Cold Chain Breach",
        "Wrong Item": "Wrong Item",
        Expiry: "Expired",
      };

      const reason =
        Object.entries(conditionToReason).find(([key]) =>
          grnData.condition.includes(key),
        )?.[1] || "Damaged";

      grnData.lineItems?.forEach((item) => {
        const year = new Date().getFullYear();
        const replacementRequestId = `RPL-${year}-${String(replacementRequests.length + 1).padStart(3, "0")}`;
        const today = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        const newRequest = {
          id: replacementRequestId,
          item: item.item,
          location: grnData.location,
          reason: reason,
          urgency:
            reason === "Damaged" || reason === "Cold Chain Breach"
              ? "Critical"
              : "High",
          disposed: 0,
          replaceQty: item.rcvQty || item.poQty,
          substitute: "Same item",
          linkedPO: "-",
          raisedBy: "System (GRN)",
          date: today,
          status: "Open",
          linkedGRN: grnData.id,
          notes: `Auto-created from GRN ${grnData.id} - ${grnData.condition}`,
        };

        replacementRequests.push(newRequest);
      });

      localStorage.setItem(
        "replacement_data",
        JSON.stringify(replacementRequests),
      );
    } catch (error) {
      console.error("Error creating replacement requests from GRN:", error);
    }
  };

  const handleScanResult = (code) => {
    const master = inventoryItems.find(
      (inv) =>
        inv.ndc?.toLowerCase() === code.toLowerCase() ||
        inv.name?.toLowerCase() === code.toLowerCase(),
    );
    if (master) {
      setLines((prev) => {
        const emptyIdx = prev.findIndex((l) => !l.item);
        const newLine = {
          id: Date.now() + Math.random(),
          item: master.name,
          itemCode: master.itemCode || "",
          ndc: master.ndc || "",
          category: master.category || "",
          supplier: master.supplier || "",
          unitCost: master.cost != null ? String(master.cost) : "",
          uom: master.uom || "",
          poQty: "",
          openQty: null,
          rcvQty: "1",
          condition: "Good — No Issues",
          lotNo: "",
          expiry: "",
          fromMaster: true,
          shortCloseReason: "",
        };
        if (emptyIdx >= 0) {
          return prev.map((l, i) => (i === emptyIdx ? newLine : l));
        }
        return [...prev, newLine];
      });
    } else {
      setLines((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          item: code,
          itemCode: "",
          ndc: code,
          category: "",
          supplier: "",
          unitCost: "",
          uom: "",
          poQty: "",
          openQty: null,
          rcvQty: "1",
          condition: "Good — No Issues",
          lotNo: "",
          expiry: "",
          fromMaster: false,
          shortCloseReason: "",
        },
      ]);
    }
  };

  return (
    <>
      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onResult={handleScanResult}
      />
      <Dialog
        open={open}
        onClose={resetAndClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            px: "20px",
            pt: "16px",
            pb: "12px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderBottom: "1px solid #f3f4f6",
            flexShrink: 0,
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LocalShippingOutlinedIcon
                sx={{ fontSize: 20, color: "#2563eb" }}
              />
            </Box>
            <Box>
              <Typography
                sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}
              >
                Goods Receipt Note
              </Typography>
          
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={resetAndClose}
            disableRipple
            sx={{
              color: "#9ca3af",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              width: 30,
              height: 30,
              outline: "none",
              "&:hover": { background: "#f3f4f6", color: "#374151" },
              "&:focus": { outline: "none" },
            }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        {/* ── Short Delivery banner ── */}
        {hasShortDelivery && (
          <Box
            sx={{
              px: "24px",
              py: "10px",
              bgcolor: "#fff7ed",
              borderBottom: "1px solid #fed7aa",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            <WarningAmberIcon
              sx={{ fontSize: 16, color: "#ea580c", mt: "1px", flexShrink: 0 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  mb: "2px",
                }}
              >
                <Typography
                  sx={{ fontSize: 12, fontWeight: 700, color: "#c2410c" }}
                >
                  Short Delivery — received less than PO quantity
                </Typography>
                <Tooltip
                  title={
                    <Box sx={{ p: "2px 0" }}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          mb: "4px",
                        }}
                      >
                        What is a Short Delivery?
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.9)",
                          lineHeight: 1.5,
                        }}
                      >
                        A Short Delivery is raised when the supplier delivers
                        fewer units than ordered. A reason is required per
                        affected line before submitting the GRN. The remaining
                        quantity will still be available for future GRNs.
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: "#7c2d12",
                        "& .MuiTooltip-arrow": { color: "#7c2d12" },
                        borderRadius: "8px",
                        px: "12px",
                        py: "10px",
                        maxWidth: 260,
                      },
                    },
                  }}
                >
                  <InfoOutlinedIcon
                    sx={{
                      fontSize: 14,
                      color: "#ea580c",
                      cursor: "pointer",
                      opacity: 0.8,
                      "&:hover": { opacity: 1 },
                    }}
                  />
                </Tooltip>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {shortSummary.map((s, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      px: "8px",
                      py: "2px",
                      borderRadius: "20px",
                      bgcolor: "#ffedd5",
                      border: "1px solid #fed7aa",
                    }}
                  >
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        bgcolor: "#ea580c",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{ fontSize: 11, color: "#9a3412", fontWeight: 600 }}
                    >
                      {s}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* ── Scrollable body ── */}
        <DialogContent
          sx={{
            px: "20px",
            py: "14px",
            overflowY: "auto",
            flex: 1,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "#d1d5db",
              borderRadius: 4,
            },
            "&::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db transparent",
          }}
        >
          {/* Row 1 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              mb: "12px",
            }}
          >
            <Box>
              <Typography sx={labelSx}>GRN Number</Typography>
              <TextField
                fullWidth
                size="small"
                value={form.grnNumber}
                disabled
                sx={disabledInputSx}
                inputProps={{ style: { color: "#9ca3af" } }}
              />
            </Box>
            <Box>
              <Typography sx={labelSx}>
                Linked PO <span style={{ color: "#ef4444" }}>*</span>
              </Typography>
              {po ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    p: "8px 12px",
                    borderRadius: "6px",
                    border: "1.5px solid #bfdbfe",
                    bgcolor: "#eff6ff",
                    height: 34,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#22c55e",
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}
                  >
                    {po.id}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11, color: "#9ca3af", ml: "auto" }}
                  >
                    Auto-linked
                  </Typography>
                </Box>
              ) : (
                <>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={form.linkedPO}
                    onChange={(e) => handlePOChange(e.target.value)}
                    sx={{
                      ...selectSx,
                      "& fieldset": {
                        borderColor:
                          submitAttempted && !form.linkedPO
                            ? "#ef4444"
                            : "#d1d5db",
                      },
                    }}
                    renderValue={(v) =>
                      v ? (
                        v
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>
                          Select approved PO...
                        </span>
                      )
                    }
                  >
                    {allPOs.length === 0 ? (
                      <MenuItem
                        disabled
                        sx={{ fontSize: 13, color: "#9ca3af" }}
                      >
                        No purchase orders found
                      </MenuItem>
                    ) : (
                      allPOs.map((p) => (
                        <MenuItem key={p.id} value={p.id} sx={{ fontSize: 13 }}>
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#111827",
                              }}
                            >
                              {p.id}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                              {p.supplier} · {p.lines} item
                              {p.lines !== 1 ? "s" : ""}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {submitAttempted && !form.linkedPO ? (
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#ef4444",
                        fontWeight: 500,
                        mt: "4px",
                      }}
                    >
                      A linked PO is required before submitting
                    </Typography>
                  ) : null}
                </>
              )}
            </Box>
          </Box>

          {/* Row 2 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              mb: "12px",
            }}
          >
            <Box>
              <Typography sx={labelSx}>Supplier</Typography>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={form.supplier}
                onChange={(e) => setField("supplier", e.target.value)}
                sx={selectSx}
                renderValue={(v) =>
                  v ? (
                    v
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 13 }}>
                      Select supplier...
                    </span>
                  )
                }
              >
                {suppliers.length === 0 ? (
                  <MenuItem disabled sx={{ fontSize: 13, color: "#9ca3af" }}>
                    No suppliers found
                  </MenuItem>
                ) : (
                  suppliers.map((supplier) => (
                    <MenuItem
                      key={supplier}
                      value={supplier}
                      sx={{ fontSize: 13 }}
                    >
                      {supplier}
                    </MenuItem>
                  ))
                )}
              </Select>
            </Box>
            <Box>
              <Typography sx={labelSx}>Receipt Date</Typography>
              <DateField
                value={form.receiptDate}
                onChange={(v) => setField("receiptDate", v)}
              />
            </Box>
          </Box>

          {/* Row 3 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              mb: "12px",
            }}
          >
            <Box>
              <Typography sx={labelSx}>Received By</Typography>
              <TextField
                fullWidth
                size="small"
                value={form.receivedBy}
                onChange={(e) => setField("receivedBy", e.target.value)}
                sx={inputSx}
              />
            </Box>
            <Box>
              <Typography sx={labelSx}>Delivery Note #</Typography>
              <TextField
                fullWidth
                size="small"
                value={form.deliveryNote}
                onChange={(e) => setField("deliveryNote", e.target.value)}
                placeholder="e.g. DN-2026-0482"
                sx={inputSx}
              />
            </Box>
          </Box>

          {/* Row 4 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "12px",
              mb: "14px",
            }}
          >
            <Box>
              <Typography sx={labelSx}>
                Store To (Location) <span style={{ color: "#ef4444" }}>*</span>
              </Typography>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                sx={selectSx}
                renderValue={(v) =>
                  v ? (
                    v
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 13 }}>
                      Select...
                    </span>
                  )
                }
              >
                {locations.map((l) => (
                  <MenuItem key={l} value={l} sx={{ fontSize: 13 }}>
                    {l}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* Items Received */}
          <Box sx={{ mb: "12px" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: "12px",
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#2563eb",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Items Received
              </Typography>
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 30,
                  padding: "0 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  borderRadius: 8,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M5.33333 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V5.33333M14 5.33333V3.33333C14 2.97971 13.8595 2.64057 13.6095 2.39052C13.3594 2.14048 13.0203 2 12.6667 2H10.6667M10.6667 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V10.6667M2 10.6667V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H5.33333"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Scan Barcode
              </button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0,2fr) 44px 58px 74px minmax(0,96px) 80px 28px",
                gap: "6px",
                mb: "6px",
                px: "10px",
              }}
            >
              {[
                "ITEM",
                "PO QTY",
                "RCV QTY",
                "LOT NO",
                "EXPIRY",
                "CONDITION",
                "",
              ].map((h) => (
                <Typography
                  key={h}
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#9ca3af",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {lines.map((line) => {
                const isShort = lineIsShort(line);
                const missingReason =
                  isShort && submitAttempted && !line.shortCloseReason?.trim();

                return (
                  <Box key={line.id}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(0,2fr) 44px 58px 74px minmax(0,96px) 80px 28px",
                        gap: "6px",
                        alignItems: "center",
                        p: "10px",
                        borderRadius: isShort ? "8px 8px 0 0" : "8px",
                        border: isShort
                          ? "1px solid #fed7aa"
                          : "1px solid #e5e7eb",
                        borderBottom: isShort ? "none" : undefined,
                        bgcolor: isShort ? "#fffbf5" : "#fff",
                        "&:hover": {
                          borderColor: isShort ? "#fb923c" : "#c7d2fe",
                          bgcolor: isShort ? "#fff7ed" : "#f8f7ff",
                        },
                        transition: "all 0.15s",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            height: 34,
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            bgcolor: line.item ? "#f8faff" : "#f9fafb",
                            display: "flex",
                            alignItems: "center",
                            px: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: line.item ? 600 : 400,
                              color: line.item ? "#111827" : "#9ca3af",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {line.item || "—"}
                          </Typography>
                        </Box>
                        {line.wasPartial && (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              mt: "2px",
                              px: "6px",
                              py: "1px",
                              borderRadius: "4px",
                              bgcolor: "#fffbeb",
                              border: "1px solid #fde68a",
                            }}
                          >
                            <Box
                              sx={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                bgcolor: "#f59e0b",
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#92400e",
                              }}
                            >
                              Partial Approved
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box
                        sx={{
                          height: 34,
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          bgcolor: "#f3f4f6",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: line.poQty ? "#374151" : "#9ca3af",
                            lineHeight: 1,
                          }}
                        >
                          {line.poQty || "—"}
                        </Typography>
                        {line.openQty != null &&
                          line.openQty < parseFloat(line.poQty || 0) && (
                            <Typography
                              sx={{
                                fontSize: 9,
                                color: "#7c3aed",
                                lineHeight: 1,
                                mt: "2px",
                              }}
                            >
                              open: {line.openQty}
                            </Typography>
                          )}
                      </Box>

                      <TextField
                        size="small"
                        type="number"
                        value={line.rcvQty}
                        onChange={(e) => {
                          const maxQty =
                            line.openQty != null
                              ? line.openQty
                              : parseFloat(line.poQty || 0);
                          const raw = Number(e.target.value) || 0;
                          const capped = Math.max(0, Math.min(raw, maxQty));
                          updateLine(line.id, "rcvQty", String(capped));
                        }}
                        inputProps={{
                          min: 0,
                          max: line.openQty != null ? line.openQty : undefined,
                        }}
                        sx={rowFieldSx(
                          { textAlign: "center" },
                          isShort
                            ? {
                                "& fieldset": {
                                  borderColor: "#f97316 !important",
                                },
                                bgcolor: "#fff7ed",
                              }
                            : {},
                        )}
                      />

                      <TextField
                        size="small"
                        value={line.lotNo}
                        placeholder="Lot #"
                        onChange={(e) =>
                          updateLine(line.id, "lotNo", e.target.value)
                        }
                        error={
                          submitAttempted && line.item && !line.lotNo?.trim()
                        }
                        sx={rowFieldSx(
                          {},
                          submitAttempted && line.item && !line.lotNo?.trim()
                            ? {
                                "& fieldset": {
                                  borderColor: "#ef4444 !important",
                                },
                                bgcolor: "#fef2f2",
                              }
                            : {},
                        )}
                      />

                      <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                        <DateField
                          value={line.expiry}
                          onChange={(v) => updateLine(line.id, "expiry", v)}
                          readOnly={false}
                        />
                      </Box>

                      <Select
                        size="small"
                        value={line.condition || "Good — No Issues"}
                        onChange={(e) =>
                          updateLine(line.id, "condition", e.target.value)
                        }
                        sx={{
                          fontSize: 12,
                          borderRadius: "6px",
                          "& fieldset": { borderColor: "#d1d5db" },
                          "&:hover fieldset": { borderColor: "#9ca3af" },
                          "&.Mui-focused fieldset": {
                            borderColor: "#6366f1",
                          },
                          "& .MuiSelect-select": {
                            py: "6px",
                            px: "8px",
                            fontSize: 12,
                          },
                        }}
                      >
                        {CONDITIONS.map((c) => (
                          <MenuItem key={c} value={c} sx={{ fontSize: 12 }}>
                            {c}
                          </MenuItem>
                        ))}
                      </Select>

                      <IconButton
                        size="small"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length === 1}
                        sx={{
                          color: "#ef4444",
                          border: "1px solid #fca5a5",
                          borderRadius: "6px",
                          width: 28,
                          height: 28,
                          bgcolor: "#fff",
                          outline: "none",
                          flexShrink: 0,
                          "&:hover": { bgcolor: "#fef2f2" },
                          "&:focus": { outline: "none" },
                          "&.Mui-disabled": {
                            borderColor: "#e5e7eb",
                            color: "#d1d5db",
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>

                    

                      {line.item && (
                        <Box
                          sx={{
                            gridColumn: "1 / -1",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                            mt: "4px",
                            pt: "8px",
                            borderTop: "1px dashed #e5e7eb",
                          }}
                        >
                          {(() => {
                            const qty = parseFloat(line.rcvQty) || 0;
                            const purchaseUom = line.uom || "EA";
                            const baseUom = line.uom || "EA";
                            const conversionFactor = 1;
                            const convertedQty = qty * conversionFactor;
                            const conversionDisplay =
                              qty > 0 && purchaseUom !== baseUom
                                ? `${qty} ${purchaseUom} = ${convertedQty} ${baseUom}`
                                : "";

                            return conversionDisplay ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  px: "8px",
                                  py: "3px",
                                  borderRadius: "20px",
                                  bgcolor: "#f0fdf4",
                                  border: "1px solid #bbf7d0",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 10,
                                    color: "#16a34a",
                                    fontWeight: 700,
                                  }}
                                >
                                  → {conversionDisplay}
                                </Typography>
                              </Box>
                            ) : null;
                          })()}
                        </Box>
                      )}

                      {submitAttempted && line.item && (
                        <Box
                          sx={{
                            gridColumn: "1 / -1",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            mt: "6px",
                            pt: "6px",
                            borderTop: "1px dashed #e5e7eb",
                          }}
                        >
                          {!line.lotNo?.trim() && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                px: "8px",
                                py: "3px",
                                borderRadius: "4px",
                                bgcolor: "#fef2f2",
                                border: "1px solid #fecaca",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: "50%",
                                  bgcolor: "#ef4444",
                                  flexShrink: 0,
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: 10,
                                  color: "#991b1b",
                                  fontWeight: 600,
                                }}
                              >
                                Lot # required
                              </Typography>
                            </Box>
                          )}
                          {!line.expiry?.trim() && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                px: "8px",
                                py: "3px",
                                borderRadius: "4px",
                                bgcolor: "#fef2f2",
                                border: "1px solid #fecaca",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: "50%",
                                  bgcolor: "#ef4444",
                                  flexShrink: 0,
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: 10,
                                  color: "#991b1b",
                                  fontWeight: 600,
                                }}
                              >
                                Expiry date required
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* Short Delivery reason row */}
                    {isShort && (
                      <Box
                        sx={{
                          px: "10px",
                          py: "8px",
                          border: "1px solid #fed7aa",
                          borderTop: "1px dashed #fdba74",
                          borderRadius: "0 0 8px 8px",
                          bgcolor: "#fff7ed",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                        }}
                      >
                        <WarningAmberIcon
                          sx={{
                            fontSize: 14,
                            color: "#ea580c",
                            mt: "8px",
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              mb: "5px",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#c2410c",
                              }}
                            >
                              Short Delivery: receiving{" "}
                              <span style={{ color: "#9a3412" }}>
                                {line.rcvQty}
                              </span>{" "}
                              of{" "}
                              <span style={{ color: "#9a3412" }}>
                                {line.poQty}
                              </span>{" "}
                              —{" "}
                              {parseFloat(line.poQty) - parseFloat(line.rcvQty)}{" "}
                              unit
                              {parseFloat(line.poQty) -
                                parseFloat(line.rcvQty) !==
                              1
                                ? "s"
                                : ""}{" "}
                              short
                            </Typography>
                          </Box>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Reason for short delivery (required) *"
                            value={line.shortCloseReason || ""}
                            onChange={(e) =>
                              updateLine(
                                line.id,
                                "shortCloseReason",
                                e.target.value,
                              )
                            }
                            error={missingReason}
                            helperText={
                              missingReason
                                ? "A reason is required for short delivery lines"
                                : ""
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                fontSize: 12,
                                borderRadius: "6px",
                                bgcolor: "#fff",
                                "& fieldset": {
                                  borderColor: missingReason
                                    ? "#ef4444"
                                    : "#fdba74",
                                },
                                "&:hover fieldset": {
                                  borderColor: missingReason
                                    ? "#dc2626"
                                    : "#fb923c",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: missingReason
                                    ? "#dc2626"
                                    : "#f97316",
                                  borderWidth: "1.5px",
                                },
                              },
                              "& .MuiInputBase-input": {
                                py: "6px",
                                px: "10px",
                              },
                              "& .MuiInputBase-input::placeholder": {
                                color: "#9ca3af",
                                opacity: 1,
                              },
                              "& .MuiFormHelperText-root": {
                                fontSize: 10,
                                color: "#ef4444",
                                mt: "2px",
                                mx: 0,
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

            <Button
              onClick={addLine}
              fullWidth
              disableRipple
              sx={{
                mt: "10px",
                border: "1.5px dashed #bfdbfe",
                borderRadius: "8px",
                py: "8px",
                fontSize: 12,
                fontWeight: 600,
                color: "#2563eb",
                textTransform: "none",
                background: "transparent",
                outline: "none",
                "&:hover": { background: "#eff6ff", borderColor: "#93c5fd" },
                "&:focus": { outline: "none" },
              }}
            >
              <AddIcon sx={{ fontSize: 14, mr: 0.5 }} /> Add Line
            </Button>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                mt: "12px",
                pt: "12px",
                borderTop: "1px dashed #e5e7eb",
              }}
            >
              <Typography sx={{ fontSize: 13, color: "#6b7280", mr: 1 }}>
                Total Received Value:
              </Typography>
              <Typography
                sx={{ fontSize: 20, fontWeight: 800, color: "#111827" }}
              >
                $
                {calcTotal().toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Box>
          </Box>

          {/* Remarks */}
          <Box sx={{ mb: "12px" }}>
            <Typography sx={labelSx}>Remarks / Discrepancy Notes</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              value={form.remarks}
              onChange={(e) => setField("remarks", e.target.value)}
              placeholder="Note short shipments, damage, cold-chain issues..."
              sx={{
                ...inputSx,
                "& .MuiInputBase-input": {
                  py: "8px",
                  px: "12px",
                  fontSize: 13,
                },
              }}
            />
          </Box>

          {/* DSCSA */}
          <Box>
            <Typography sx={{ ...labelSx, color: "#2563eb", mb: "12px" }}>
              DSCSA Transaction Information (TI) — Required
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                mb: "12px",
              }}
            >
              <Box>
                <Typography sx={labelSx}>Shipment Date</Typography>
                <DateField
                  value={form.shipmentDate}
                  onChange={(v) => setField("shipmentDate", v)}
                />
              </Box>
              <Box>
                <Typography sx={labelSx}>Supplier Invoice No.</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={form.supplierInvoice}
                  onChange={(e) => setField("supplierInvoice", e.target.value)}
                  placeholder="e.g. INV-2026-0482"
                  sx={inputSx}
                />
              </Box>
            </Box>
            <Box sx={{ mb: "12px" }}>
              <Typography sx={labelSx}>
                Trading Partner License / DEA No.
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={form.tradingPartnerLicense}
                onChange={(e) =>
                  setField("tradingPartnerLicense", e.target.value)
                }
                placeholder="e.g. DEA Lic. BA1234567 or State Lic."
                sx={inputSx}
              />
            </Box>
            <Box
              sx={{
                p: 2,
                border: "1px solid #e0e7ff",
                borderRadius: "10px",
                bgcolor: "#f5f3ff",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.tsConfirmed}
                    onChange={(e) => setField("tsConfirmed", e.target.checked)}
                    size="small"
                    sx={{
                      color: "#c4b5fd",
                      pt: 0,
                      "&.Mui-checked": { color: "#6366f1" },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}
                  >
                    I confirm this Transaction Statement (TS): The entity
                    transferring ownership is an authorised trading partner, is
                    not known to deal in suspect or illegitimate product, and
                    the product has been handled in a compliant manner.{" "}
                    <em style={{ color: "#9ca3af" }}></em>
                  </Typography>
                }
                sx={{ alignItems: "flex-start", m: 0 }}
              />
            </Box>
            {submitAttempted && !form.tsConfirmed ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  mt: "8px",
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: "#ef4444",
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{ fontSize: 11, color: "#ef4444", fontWeight: 500 }}
                >
                  You must confirm the Transaction Statement before submitting
                </Typography>
              </Box>
            ) : null}
          </Box>
        </DialogContent>

        {/* ── Footer ── */}
        <Box
          sx={{
            px: "20px",
            py: "12px",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            bgcolor: "#fff",
            flexShrink: 0,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {submitAttempted && linesWithMissingRequired.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <WarningAmberIcon
                  sx={{ fontSize: 13, color: "#ef4444", flexShrink: 0 }}
                />
                <Typography
                  sx={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}
                >
                  {linesWithMissingRequired.length} line
                  {linesWithMissingRequired.length !== 1 ? "s" : ""} missing
                  required fields (Lot #, Expiry)
                </Typography>
              </Box>
            )}
            {submitAttempted && shortLinesWithoutReason.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <WarningAmberIcon
                  sx={{ fontSize: 13, color: "#ef4444", flexShrink: 0 }}
                />
                <Typography
                  sx={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}
                >
                  Reason required for {shortLinesWithoutReason.length} short
                  delivery line
                  {shortLinesWithoutReason.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
            )}
            {(linesWithMissingRequired.length > 0 || hasShortDelivery) &&
              !submitAttempted && (
                <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <InfoOutlinedIcon
                    sx={{ fontSize: 13, color: "#ea580c", flexShrink: 0 }}
                  />
                  <Typography
                    sx={{ fontSize: 11, color: "#9a3412", fontWeight: 500 }}
                  >
                    {linesWithMissingRequired.length > 0
                      ? "Fill in all required fields (Lot #, Expiry) "
                      : ""}
                    {hasShortDelivery
                      ? "and short delivery reason(s) before submitting"
                      : "before submitting"}
                  </Typography>
                </Box>
              )}
          </Box>

          <Box sx={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <Button
              onClick={resetAndClose}
              disableRipple
              sx={{
                ...btnBase,
                color: "#374151",
                border: "1px solid #e5e7eb",
                bgcolor: "#fff",
                "&:hover": { bgcolor: "#f9fafb" },
              }}
            >
              Cancel
            </Button>
            <Button
              startIcon={<BookmarkBorderIcon sx={{ fontSize: 15 }} />}
              onClick={handleDraft}
              disableRipple
              sx={{
                ...btnBase,
                color: "#374151",
                border: "1px solid #e5e7eb",
                bgcolor: "#fff",
                "&:hover": { bgcolor: "#f9fafb" },
              }}
            >
              Draft
            </Button>
            <Button
              startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 15 }} />}
              onClick={handleConfirm}
              disabled={isSubmitDisabled}
              disableRipple
              sx={{
                ...btnBase,
                fontWeight: 700,
                color: "#fff",
                bgcolor: isSubmitDisabled
                  ? "#d1d5db"
                  : hasShortDelivery
                    ? "#ea580c"
                    : "#10b981",
                boxShadow: isSubmitDisabled
                  ? "none"
                  : hasShortDelivery
                    ? "0 2px 8px rgba(234,88,12,0.3)"
                    : "0 2px 8px rgba(16,185,129,0.3)",
                cursor: isSubmitDisabled ? "not-allowed" : "pointer",
                "&:hover": {
                  bgcolor: isSubmitDisabled
                    ? "#d1d5db"
                    : hasShortDelivery
                      ? "#c2410c"
                      : "#059669",
                },
              }}
            >
              {hasShortDelivery ? "Submit Short Delivery" : "Submit GRN"}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

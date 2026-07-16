import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Snackbar, Alert } from "@mui/material";
import { useInventory } from "../../contexts/InventoryContext";
import { getLocations, getDepartments } from "../../utils/locationUtils";
import { getSupplierNames, getSupplierByName } from "../../utils/supplierUtils";
import { getManufacturerNames } from "../../utils/manufacturerUtils";
import { getGPONames } from "../../utils/gpoUtils";

// Manufacturer options - hardcoded as requested
const MANUFACTURER_OPTIONS = [
  "Roche Diagnostics",
  "B. Braun",
  "GE HealthCare",
  "Philips",
  "Cardinal Health",
  "Siemens Healthineers",
  "Baxter",
  "McKesson",
  "BD",
];

function buildDynamicCatalog() {
  try {
    const catsRaw = localStorage.getItem("tia_cats_v7");
    const typesRaw = localStorage.getItem("tia_itypes_v1");
    if (!catsRaw || !typesRaw) return null;
    const cats = JSON.parse(catsRaw);
    const types = JSON.parse(typesRaw);
    if (!cats?.length || !types?.length) return null;

    const catalog = {};
    types.forEach((t) => {
      const typeCats = cats.filter(
        (c) => c.itemType === t.key && c.status === "Active",
      );
      const categories = {};
      typeCats.forEach((cat) => {
        categories[cat.name] = {
          code: cat.code,
          subcategories: (cat.subcategories || [])
            .filter((s) => s.status === "Active")
            .map((s) => ({ name: s.name, code: s.code })),
        };
      });
      catalog[t.label] = {
        code: t.code || t.key,
        icon: "📦",
        key: t.key,
        categories,
      };
    });
    return Object.keys(catalog).length > 0 ? catalog : null;
  } catch {
    return null;
  }
}

function useDynamicCatalog() {
  const [catalog, setCatalog] = useState(
    () => buildDynamicCatalog() || ITEM_TYPE_CATALOG,
  );

  useEffect(() => {
    const refresh = () => {
      const dynamic = buildDynamicCatalog();
      if (dynamic) setCatalog(dynamic);
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("categoriesUpdated", refresh);
    const interval = setInterval(refresh, 2000);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("categoriesUpdated", refresh);
      clearInterval(interval);
    };
  }, []);

  return catalog;
}

const ITEM_TYPE_CATALOG = {
  "Pharmaceuticals (Drugs)": {
    code: "IT-PHAR",
    icon: "💊",
    categories: {
      "Rx Drugs (DSCSA Covered)": {
        code: "IT-PHAR-RXDRUGS",
        subcategories: [
          {
            name: "Controlled Substance – Schedule II",
            code: "IT-PHAR-RXDRUGS-CONTROLLEDSUBSTANCES",
          },
          {
            name: "Controlled Substance – Schedule III–V",
            code: "IT-PHAR-RXDRUGS-CONTROLLEDSUBSTANCES2",
          },
          {
            name: "Dosage Form – IV Infusion / Bag",
            code: "IT-PHAR-RXDRUGS-DOSAGEFORMIVINFUSIO",
          },
          {
            name: "Dosage Form – Inhalation",
            code: "IT-PHAR-RXDRUGS-DOSAGEFORMINHALATION",
          },
          {
            name: "Dosage Form – Injectable (Vial/Ampoule)",
            code: "IT-PHAR-RXDRUGS-DOSAGEFORMINJECTABLE",
          },
          {
            name: "Dosage Form – Nasal",
            code: "IT-PHAR-RXDRUGS-DOSAGEFORMNASAL",
          },
          {
            name: "Dosage Form – Ophthalmic/Otic",
            code: "IT-PHAR-RXDRUGS-DOSAGEFORMOPHTHALMIC",
          },
          {
            name: "Dosage Form – Oral Liquid",
            code: "IT-PHAR-RXDRUGS-DOSAGEFORMORALLIQUI",
          },
          {
            name: "Dosage Form – Oral Solid",
            code: "IT-PHAR-RXDRUGS-DOSAGEFORMORALSOLID",
          },
          {
            name: "Dosage Form – Topical",
            code: "IT-PHAR-RXDRUGS-DOSAGEFORMTOPICAL",
          },
          {
            name: "Dosage Form – Transdermal",
            code: "IT-PHAR-RXDRUGS-DOSAGEFORMTRANSDERMA",
          },
          {
            name: "Therapeutic Class – Antibiotics",
            code: "IT-PHAR-RXDRUGS-THERAPEUTICCLASSANTI",
          },
          {
            name: "Therapeutic Class – Cardiovascular",
            code: "IT-PHAR-RXDRUGS-THERAPEUTICCLASSCARD",
          },
          {
            name: "Therapeutic Class – Emergency/Critical Care",
            code: "IT-PHAR-RXDRUGS-THERAPEUTICCLASSEMER",
          },
          {
            name: "Therapeutic Class – Endocrine & Diabetes",
            code: "IT-PHAR-RXDRUGS-THERAPEUTICCLASSENDO",
          },
          {
            name: "Therapeutic Class – Gastrointestinal",
            code: "IT-PHAR-RXDRUGS-THERAPEUTICCLASSGAST",
          },
          {
            name: "Therapeutic Class – Immunology & Biologics",
            code: "IT-PHAR-RXDRUGS-THERAPEUTICCLASSIMMU",
          },
          {
            name: "Therapeutic Class – Oncology (Hazardous)",
            code: "IT-PHAR-RXDRUGS-THERAPEUTICCLASSONCO",
          },
          {
            name: "Therapeutic Class – Respiratory",
            code: "IT-PHAR-RXDRUGS-THERAPEUTICCLASSRESP",
          },
          {
            name: "Therapeutic Class – Vaccines",
            code: "IT-PHAR-RXDRUGS-THERAPEUTICCLASSVACC",
          },
        ],
      },
      "OTC Drugs (DSCSA Excluded)": {
        code: "IT-PHAR-OTCDRUGS",
        subcategories: [
          {
            name: "Dosage Form – Inhalation",
            code: "IT-PHAR-OTCDRUGS-DOSAGEFORMINHALATION",
          },
          {
            name: "Dosage Form – Nasal",
            code: "IT-PHAR-OTCDRUGS-DOSAGEFORMNASAL",
          },
          {
            name: "Dosage Form – Ophthalmic/Otic",
            code: "IT-PHAR-OTCDRUGS-DOSAGEFORMOPHTHALMIC",
          },
          {
            name: "Dosage Form – Oral Liquid",
            code: "IT-PHAR-OTCDRUGS-DOSAGEFORMORALLIQUI",
          },
          {
            name: "Dosage Form – Oral Solid",
            code: "IT-PHAR-OTCDRUGS-DOSAGEFORMORALSOLID",
          },
          {
            name: "Dosage Form – Topical",
            code: "IT-PHAR-OTCDRUGS-DOSAGEFORMTOPICAL",
          },
          { name: "OTC – Analgesics", code: "IT-PHAR-OTCDRUGS-OTCANALGESICS" },
          {
            name: "OTC – Vitamins & Supplements",
            code: "IT-PHAR-OTCDRUGS-OTCVITAMINSSUPPLEMEN",
          },
        ],
      },
      "IV Solutions (DSCSA Excluded)": {
        code: "IT-PHAR-IVSOLUTIONS",
        subcategories: [
          {
            name: "Certain IV fluids / electrolytes",
            code: "IT-PHAR-IVSOLUTIONS-CERTAINIVFLUIDSELEC",
          },
        ],
      },
      "Compounded Drugs (DSCSA Excluded)": {
        code: "IT-PHAR-COMPOUNDEDDRUGS",
        subcategories: [
          {
            name: "Dosage Form – Non-sterile Oral (Compounded)",
            code: "IT-PHAR-COMPOUNDEDDRUGS-DOSAGEFORMNONSTERIL",
          },
          {
            name: "Dosage Form – Sterile Injectable/IV (Compounded)",
            code: "IT-PHAR-COMPOUNDEDDRUGS-DOSAGEFORMSTERILEIN",
          },
          {
            name: "Dosage Form – Topical (Compounded)",
            code: "IT-PHAR-COMPOUNDEDDRUGS-DOSAGEFORMTOPICAL",
          },
        ],
      },
      "Blood & Blood Components (DSCSA Excluded)": {
        code: "IT-PHAR-BLOODBLOODCOMPON",
        subcategories: [
          {
            name: "Blood products",
            code: "IT-PHAR-BLOODBLOODCOMPON-BLOODPRODUCTS",
          },
        ],
      },
      "Medical Gases (DSCSA Excluded)": {
        code: "IT-PHAR-MEDICALGASES",
        subcategories: [
          {
            name: "Cylinders & gas supplies",
            code: "IT-PHAR-MEDICALGASES-CYLINDERSGASSUPPLIES",
          },
        ],
      },
      "Homeopathic Drugs (DSCSA Excluded)": {
        code: "IT-PHAR-HOMEOPATHICDRUGS",
        subcategories: [
          {
            name: "Homeopathic products",
            code: "IT-PHAR-HOMEOPATHICDRUGS-HOMEOPATHICPRODUCTS",
          },
        ],
      },
      "Imaging/Radiopharmaceutical (DSCSA Excluded)": {
        code: "IT-PHAR-IMAGINGRADIOPHARM",
        subcategories: [
          {
            name: "Imaging drugs / radioactive drugs",
            code: "IT-PHAR-IMAGINGRADIOPHARM-IMAGINGDRUGSRADIOACT",
          },
        ],
      },
    },
  },

  Consumables: {
    code: "IT-CONS",
    icon: "🩹",
    categories: {
      "Clinical Consumables": {
        code: "IT-CONS-CLINICALCONSUMABL",
        subcategories: [
          {
            name: "Dressings & wound care",
            code: "IT-CONS-CLINICALCONSUMABL-DRESSINGSWOUNDCARE",
          },
          {
            name: "IV sets / tubing",
            code: "IT-CONS-CLINICALCONSUMABL-IVSETSTUBING",
          },
          { name: "PPE", code: "IT-CONS-CLINICALCONSUMABL-PPE" },
          {
            name: "Syringes/needles",
            code: "IT-CONS-CLINICALCONSUMABL-SYRINGESNEEDLES",
          },
        ],
      },
    },
  },

  "Medical Devices": {
    code: "IT-MDEV",
    icon: "🩺",
    categories: {
      "UDI Devices": {
        code: "IT-MDEV-UDIDEVICES",
        subcategories: [
          {
            name: "Implantable devices",
            code: "IT-MDEV-UDIDEVICES-IMPLANTABLEDEVICES",
          },
          {
            name: "Single-use sterile devices",
            code: "IT-MDEV-UDIDEVICES-SINGLEUSESTERILEDEV",
          },
        ],
      },
      "Non-UDI / Low-risk devices": {
        code: "IT-MDEV-NONUDILOWRISKD",
        subcategories: [
          {
            name: "Accessories & low-risk items",
            code: "IT-MDEV-NONUDILOWRISKD-ACCESSORIESLOWRISKI",
          },
        ],
      },
    },
  },

  "Assets (Equipment/Machines)": {
    code: "IT-ASST",
    icon: "🖥️",
    categories: {
      "Medical Equipment": {
        code: "IT-ASST-MEDICALEQUIPMENT",
        subcategories: [
          {
            name: "Infusion & patient care devices",
            code: "IT-ASST-MEDICALEQUIPMENT-INFUSIONPATIENTCARE",
          },
        ],
      },
      "Imaging Equipment": {
        code: "IT-ASST-IMAGINGEQUIPMENT",
        subcategories: [
          {
            name: "Radiology machines",
            code: "IT-ASST-IMAGINGEQUIPMENT-RADIOLOGYMACHINES",
          },
        ],
      },
      "Lab Equipment": {
        code: "IT-ASST-LABEQUIPMENT",
        subcategories: [
          { name: "Analyzers", code: "IT-ASST-LABEQUIPMENT-ANALYZERS" },
        ],
      },
      "IT Assets": {
        code: "IT-ASST-ITASSETS",
        subcategories: [
          {
            name: "Computers & scanners",
            code: "IT-ASST-ITASSETS-COMPUTERSSCANNERS",
          },
        ],
      },
      "Facility Equipment": {
        code: "IT-ASST-FACILITYEQUIPMENT",
        subcategories: [
          { name: "Utilities", code: "IT-ASST-FACILITYEQUIPMENT-UTILITIES" },
        ],
      },
    },
  },

  "Lab Reagents & Diagnostics": {
    code: "IT-LABS",
    icon: "🧪",
    categories: {
      Reagents: {
        code: "IT-LABS-REAGENTS",
        subcategories: [
          {
            name: "Chemistry reagents",
            code: "IT-LABS-REAGENTS-CHEMISTRYREAGENTS",
          },
        ],
      },
      "Test Kits": {
        code: "IT-LABS-TESTKITS",
        subcategories: [
          {
            name: "Rapid tests / assay kits",
            code: "IT-LABS-TESTKITS-RAPIDTESTSASSAYKITS",
          },
        ],
      },
      "Controls & Calibrators": {
        code: "IT-LABS-CONTROLSCALIBRATO",
        subcategories: [
          { name: "QC controls", code: "IT-LABS-CONTROLSCALIBRATO-QCCONTROLS" },
        ],
      },
      "Specimen Collection": {
        code: "IT-LABS-SPECIMENCOLLECTIO",
        subcategories: [
          {
            name: "Consumables",
            code: "IT-LABS-SPECIMENCOLLECTIO-CONSUMABLES",
          },
        ],
      },
      "Lab Consumables": {
        code: "IT-LABS-LABCONSUMABLES",
        subcategories: [
          {
            name: "Pipette tips & plastics",
            code: "IT-LABS-LABCONSUMABLES-PIPETTETIPSPLASTICS",
          },
        ],
      },
    },
  },

  "Housekeeping & Sanitation": {
    code: "IT-HSKP",
    icon: "🧹",
    categories: {
      "Cleaning Chemicals": {
        code: "IT-HSKP-CLEANINGCHEMICALS",
        subcategories: [
          {
            name: "Detergents & floor care",
            code: "IT-HSKP-CLEANINGCHEMICALS-DETERGENTSFLOORCARE",
          },
          {
            name: "Disinfectants",
            code: "IT-HSKP-CLEANINGCHEMICALS-DISINFECTANTS",
          },
        ],
      },
      "Waste Management": {
        code: "IT-HSKP-WASTEMANAGEMENT",
        subcategories: [
          {
            name: "Bags & sharps containers",
            code: "IT-HSKP-WASTEMANAGEMENT-BAGSSHARPSCONTAINERS",
          },
        ],
      },
      "Housekeeping PPE": {
        code: "IT-HSKP-HOUSEKEEPINGPPE",
        subcategories: [{ name: "PPE", code: "IT-HSKP-HOUSEKEEPINGPPE-PPE" }],
      },
    },
  },

  "Maintenance Spares (MRO)": {
    code: "IT-MRO",
    icon: "🔧",
    categories: {
      "Biomedical Spares": {
        code: "IT-MRO-BIOMEDICALSPARES",
        subcategories: [
          {
            name: "Equipment parts",
            code: "IT-MRO-BIOMEDICALSPARES-EQUIPMENTPARTS",
          },
        ],
      },
      "Electrical Spares": {
        code: "IT-MRO-ELECTRICALSPARES",
        subcategories: [
          {
            name: "Switches & breakers",
            code: "IT-MRO-ELECTRICALSPARES-SWITCHESBREAKERS",
          },
        ],
      },
      HVAC: {
        code: "IT-MRO-HVAC",
        subcategories: [
          { name: "Filters & belts", code: "IT-MRO-HVAC-FILTERSBELTS" },
        ],
      },
      "Lubricants & Consumable spares": {
        code: "IT-MRO-LUBRICANTSCONSUMA",
        subcategories: [
          { name: "Oils/grease", code: "IT-MRO-LUBRICANTSCONSUMA-OILSGREASE" },
        ],
      },
      "Plumbing Spares": {
        code: "IT-MRO-PLUMBINGSPARES",
        subcategories: [
          {
            name: "Pipes & fittings",
            code: "IT-MRO-PLUMBINGSPARES-PIPESFITTINGS",
          },
        ],
      },
    },
  },

  "Stationery / Office Supplies": {
    code: "IT-STAT",
    icon: "📎",
    categories: {
      "Paper Products": {
        code: "IT-STAT-PAPERPRODUCTS",
        subcategories: [
          {
            name: "Printing paper & forms",
            code: "IT-STAT-PAPERPRODUCTS-PRINTINGPAPERFORMS",
          },
        ],
      },
      "Printing Supplies": {
        code: "IT-STAT-PRINTINGSUPPLIES",
        subcategories: [
          { name: "Toner/ink", code: "IT-STAT-PRINTINGSUPPLIES-TONERINK" },
        ],
      },
      "Labels & Consumables": {
        code: "IT-STAT-LABELSCONSUMABLES",
        subcategories: [
          {
            name: "Barcode labels",
            code: "IT-STAT-LABELSCONSUMABLES-BARCODELABELS",
          },
        ],
      },
      "Writing Supplies": {
        code: "IT-STAT-WRITINGSUPPLIES",
        subcategories: [
          {
            name: "Pens/pencils/markers",
            code: "IT-STAT-WRITINGSUPPLIES-PENSPENCILSMARKERS",
          },
        ],
      },
    },
  },
};

function getItemTypesList(catalog) {
  return Object.entries(catalog).map(([key, val]) => ({
    key,
    label: key,
    icon: val.icon,
    code: val.code,
  }));
}

function getCategoriesForType(type, catalog) {
  const typeData = catalog[type];
  if (!typeData) return [];
  return Object.entries(typeData.categories).map(([name, val]) => ({
    name,
    code: val.code,
    subcategories: val.subcategories,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG / Icon helpers
// ─────────────────────────────────────────────────────────────────────────────
function BackArrow() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="15"
        height="31"
        viewBox="0 0 20 35"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.7886 2L2.78857 16.7115L17.7886 32.8942"
          stroke="#015DFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.41667 0.75V3.41667M4.08333 0.75V3.41667M0.75 6.08333H12.75M2.08333 2.08333H11.4167C12.153 2.08333 12.75 2.68029 12.75 3.41667V12.75C12.75 13.4864 12.153 14.0833 11.4167 14.0833H2.08333C1.34695 14.0833 0.75 13.4864 0.75 12.75V3.41667C0.75 2.68029 1.34695 2.08333 2.08333 2.08333Z"
        stroke="#8F9098"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives - reduced padding/margin for compact layout
// ─────────────────────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#2F3036",
        marginBottom: 2,
        display: "block",
      }}
    >
      {children}
      {required && <span style={{ color: "#ef4444" }}> *</span>}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  height: 32,
  padding: "4px 10px",
  fontSize: 12,
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  outline: "none",
  boxSizing: "border-box",
  background: "#f9fafb",
  colorScheme: "light",
  transition: "border-color 0.15s",
};

function TextInput({
  placeholder,
  value,
  onChange,
  icon,
  onScan,
  disabled,
  style: extraStyle,
}) {
  const fileRef = useRef(null);
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...inputStyle,
          padding: icon ? "4px 32px 4px 10px" : "4px 10px",
          ...extraStyle,
        }}
      />
      {icon && (
        <span
          onClick={() => fileRef.current?.click()}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          {icon}
        </span>
      )}
      {onScan && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={onScan}
        />
      )}
    </div>
  );
}

function DateInput({ value, onChange, min, max }) {
  const inputRef = useRef(null);
  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        style={{
          ...inputStyle,
          padding: "4px 36px 4px 12px",
          cursor: "pointer",
          color: value ? "#111827" : "#9ca3af",
          WebkitAppearance: "none",
          appearance: "none",
        }}
      />
      <style>{`input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; width: 36px; height: 100%; cursor: pointer; }`}</style>
      <span
        onClick={() => inputRef.current?.showPicker?.()}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <CalendarIcon />
      </span>
    </div>
  );
}

function SelectInput({ placeholder, value, onChange, options = [], onFocus }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        style={{
          ...inputStyle,
          padding: "4px 32px 4px 10px",
          appearance: "none",
          cursor: "pointer",
          color: value ? "#111827" : "#9ca3af",
        }}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} style={{ color: "#111827" }}>
            {o}
          </option>
        ))}
      </select>
      <KeyboardArrowDownIcon
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#9ca3af",
          pointerEvents: "none",
          fontSize: 18,
        }}
      />
    </div>
  );
}

function NumberSpinInput({ value, onChange, placeholder, step = 1, min = 0 }) {
  const num = parseFloat(value) || 0;
  const inc = () =>
    onChange({
      target: { value: String(parseFloat((num + step).toFixed(2))) },
    });
  const dec = () =>
    onChange({
      target: {
        value: String(parseFloat(Math.max(min, num - step).toFixed(2))),
      },
    });
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...inputStyle, padding: "4px 36px 4px 12px" }}
      />
      <div
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          type="button"
          onClick={inc}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: "#9ca3af",
            display: "flex",
            outline: "none",
          }}
        >
          <KeyboardArrowUpIcon style={{ fontSize: 14 }} />
        </button>
        <button
          type="button"
          onClick={dec}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: "#9ca3af",
            display: "flex",
            outline: "none",
          }}
        >
          <KeyboardArrowDownIcon style={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "#2563eb",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
      </div>
      {children}
    </div>
  );
}

function Row({ children, cols = 3 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 10,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

const UOM_CLASS_OPTIONS = ["Volume", "Weight", "Quantity", "Length", "Area"];
const UOM_OPTIONS_BY_CLASS = {
  Volume: ["mL", "L", "Vial"],
  Weight: ["g", "kg", "mg", "mcg"],
  Quantity: [
    "Each (EA)",
    "Tablet",
    "Capsule",
    "Pcs",
    "Pair",
    "Set",
    "Unit",
    "Pack",
    "Box",
  ],
  Length: ["mm", "cm", "m", "inch", "ft"],
  Area: ["cm²", "m²", "in²"],
};
const ALL_UOM_OPTIONS = [
  "Each (EA)",
  "Box",
  "Vial",
  "mL",
  "L",
  "Tablet",
  "Capsule",
  "Pack",
  "Set",
  "Unit",
  "Caps",
  "Bag",
  "Pcs",
  "Pair",
  "Kg",
  "g",
  "mg",
  "Ltr",
];

function UomSection({ form, set }) {
  const baseUomOptions = form.uomClass
    ? UOM_OPTIONS_BY_CLASS[form.uomClass] || ALL_UOM_OPTIONS
    : ALL_UOM_OPTIONS;
  const issueConversion =
    form.baseUom &&
    form.issueUom &&
    form.issueUom !== form.baseUom &&
    form.issueToBaseConversion
      ? `1 ${form.issueUom} = ${form.issueToBaseConversion} ${form.baseUom}`
      : null;
  const purchaseConversion =
    form.baseUom &&
    form.purchaseUom &&
    form.purchaseUom !== form.baseUom &&
    form.purchaseToBaseConversion
      ? `1 ${form.purchaseUom} = ${form.purchaseToBaseConversion} ${form.baseUom}`
      : null;

  return (
    <SectionCard title="UNIT & PACKING (UOM)">
      <Row cols={2}>
        <div>
          <Label>UOM Class</Label>
          <SelectInput
            placeholder="Select UOM class..."
            value={form.uomClass}
            onChange={(e) => {
              set("uomClass")(e);
              set("baseUom")({ target: { value: "" } });
              set("issueUom")({ target: { value: "" } });
              set("purchaseUom")({ target: { value: "" } });
              set("issueToBaseConversion")({ target: { value: "" } });
              set("purchaseToBaseConversion")({ target: { value: "" } });
            }}
            options={UOM_CLASS_OPTIONS}
          />
        </div>
        <div>
          <Label required>Base UOM</Label>
          {form.issueUom ? (
            <div
              style={{
                ...inputStyle,
                display: "flex",
                alignItems: "center",
                background: "#f3f4f6",
                color: "#6B7280",
                fontWeight: 600,
              }}
            >
              {form.baseUom || "—"}
            </div>
          ) : (
            <SelectInput
              placeholder={
                form.uomClass
                  ? "Select base unit..."
                  : "Select UOM class first..."
              }
              value={form.baseUom}
              onChange={set("baseUom")}
              options={baseUomOptions}
            />
          )}
          <span
            style={{
              fontSize: 10,
              color: "#6B7280",
              marginTop: 2,
              display: "block",
            }}
          >
            Smallest unit for inventory tracking
          </span>
        </div>
      </Row>
      <Row cols={2}>
        <div>
          <Label>Issue UOM</Label>
          <SelectInput
            placeholder="Select issue unit..."
            value={form.issueUom}
            onChange={(e) => {
              set("issueUom")(e);
              if (e.target.value === form.baseUom)
                set("issueToBaseConversion")({ target: { value: "" } });
            }}
            options={baseUomOptions}
          />
          <span
            style={{
              fontSize: 10,
              color: "#6B7280",
              marginTop: 2,
              display: "block",
            }}
          >
            Unit used when issuing to departments
          </span>
        </div>
        <div>
          <Label>Purchase UOM</Label>
          <SelectInput
            placeholder="Select purchase unit..."
            value={form.purchaseUom}
            onChange={(e) => {
              set("purchaseUom")(e);
              if (e.target.value === form.baseUom)
                set("purchaseToBaseConversion")({ target: { value: "" } });
            }}
            options={[
              "Box",
              "Carton",
              "Case",
              "Pack",
              "Vial",
              "Bag",
              "Tray",
              "Drum",
              "Each (EA)",
              ...baseUomOptions.filter(
                (u) =>
                  ![
                    "Box",
                    "Carton",
                    "Case",
                    "Pack",
                    "Vial",
                    "Bag",
                    "Tray",
                    "Drum",
                    "Each (EA)",
                  ].includes(u),
              ),
            ]}
          />
          <span
            style={{
              fontSize: 10,
              color: "#6B7280",
              marginTop: 2,
              display: "block",
            }}
          >
            Unit used when purchasing from suppliers
          </span>
        </div>
      </Row>
      {form.baseUom &&
        (form.issueUom || form.purchaseUom) &&
        (form.issueUom !== form.baseUom ||
          form.purchaseUom !== form.baseUom) && (
          <div
            style={{
              background: "#F0F9FF",
              border: "1px solid #BAE6FD",
              borderRadius: 6,
              padding: "8px 12px",
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#0369A1",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              UOM Conversions
            </div>
            <Row cols={2}>
              {form.issueUom && form.issueUom !== form.baseUom && (
                <div>
                  <Label>Issue to Base Conversion</Label>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        whiteSpace: "nowrap",
                      }}
                    >
                      1 {form.issueUom} =
                    </span>
                    <NumberSpinInput
                      value={form.issueToBaseConversion}
                      onChange={set("issueToBaseConversion")}
                      placeholder="0"
                      step={1}
                      min={1}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {form.baseUom}
                    </span>
                  </div>
                  {issueConversion && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#0369A1",
                        fontWeight: 600,
                        marginTop: 3,
                        display: "block",
                      }}
                    >
                      ✓ {issueConversion}
                    </span>
                  )}
                </div>
              )}
              {form.purchaseUom && form.purchaseUom !== form.baseUom && (
                <div>
                  <Label>Purchase to Base Conversion</Label>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        whiteSpace: "nowrap",
                      }}
                    >
                      1 {form.purchaseUom} =
                    </span>
                    <NumberSpinInput
                      value={form.purchaseToBaseConversion}
                      onChange={set("purchaseToBaseConversion")}
                      placeholder="0"
                      step={1}
                      min={1}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {form.baseUom}
                    </span>
                  </div>
                  {purchaseConversion && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#0369A1",
                        fontWeight: 600,
                        marginTop: 3,
                        display: "block",
                      }}
                    >
                      ✓ {purchaseConversion}
                    </span>
                  )}
                </div>
              )}
            </Row>
          </div>
        )}

      {form.baseUom &&
        form.issueUom &&
        form.baseUom !== form.issueUom &&
        !form.issueToBaseConversion && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 6,
              padding: "6px 10px",
              marginTop: 4,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M12 9v4M12 17h.01"
                stroke="#D97706"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#D97706"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ fontSize: 11, color: "#92400E" }}>
              <strong>Warning:</strong> Issue UOM differs from Base UOM. Please
              set the conversion factor above.
            </span>
          </div>
        )}
    </SectionCard>
  );
}

function ToggleSwitch({ value, onChange }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}
    >
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: value ? "#2563eb" : "#D1D5DB",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2.5,
            left: value ? 21 : 2.5,
            width: 17,
            height: 17,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left 0.2s",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: value ? "#1D4ED8" : "#6B7280",
        }}
      >
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

function StorageHandlingSection({ form, set }) {
  const coldChainActive = form.coldChain === true || form.coldChain === "true";
  const hazardousActive = form.hazardous === true || form.hazardous === "true";
  const highValueActive =
    form.highValueFlag === true || form.highValueFlag === "true";

  return (
    <SectionCard title="STORAGE & HANDLING">
      <Row cols={2}>
        <div>
          <Label>Storage Class</Label>
          <SelectInput
            placeholder="Select storage class..."
            value={form.storageClass}
            onChange={set("storageClass")}
            options={[
              "Room Temperature",
              "Refrigerated (2°C – 8°C)",
              "Frozen (−20°C)",
              "Deep Frozen (−80°C)",
              "Controlled Room Temp (15°C–25°C)",
              "HazMat",
              "Flammable",
              "Corrosive",
              "Secure / Controlled",
            ]}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2F3036",
              marginBottom: 2,
              display: "block",
            }}
          >
            Cold Chain
          </label>
          <ToggleSwitch
            value={coldChainActive}
            onChange={(val) => set("coldChain")({ target: { value: val } })}
          />
          <span
            style={{
              fontSize: 10,
              color: "#6B7280",
              marginTop: 2,
              display: "block",
            }}
          >
            Temperature-controlled storage required
          </span>
        </div>
      </Row>
      <Row cols={2}>
        <div
          style={{
            opacity: coldChainActive ? 1 : 0.45,
            transition: "opacity 0.2s",
          }}
        >
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2F3036",
              marginBottom: 2,
              display: "block",
            }}
          >
            Temperature Min (°C)
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={form.tempMin}
              onChange={set("tempMin")}
              placeholder="e.g. 2"
              disabled={!coldChainActive}
              style={{
                ...inputStyle,
                paddingRight: 36,
                color: coldChainActive ? "#111827" : "#9CA3AF",
                cursor: coldChainActive ? "text" : "not-allowed",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11,
                color: "#9CA3AF",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              °C
            </span>
          </div>
        </div>
        <div
          style={{
            opacity: coldChainActive ? 1 : 0.45,
            transition: "opacity 0.2s",
          }}
        >
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2F3036",
              marginBottom: 2,
              display: "block",
            }}
          >
            Temperature Max (°C)
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={form.tempMax}
              onChange={set("tempMax")}
              placeholder="e.g. 8"
              disabled={!coldChainActive}
              style={{
                ...inputStyle,
                paddingRight: 36,
                color: coldChainActive ? "#111827" : "#9CA3AF",
                cursor: coldChainActive ? "text" : "not-allowed",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11,
                color: "#9CA3AF",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              °C
            </span>
          </div>
        </div>
      </Row>
      <Row cols={2}>
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2F3036",
              marginBottom: 2,
              display: "block",
            }}
          >
            Hazardous
          </label>
          <ToggleSwitch
            value={hazardousActive}
            onChange={(val) => set("hazardous")({ target: { value: val } })}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2F3036",
              marginBottom: 2,
              display: "block",
            }}
          >
            High Value Flag
          </label>
          <ToggleSwitch
            value={highValueActive}
            onChange={(val) => set("highValueFlag")({ target: { value: val } })}
          />
        </div>
      </Row>
      <div
        style={{
          opacity: hazardousActive ? 1 : 0.45,
          transition: "opacity 0.2s",
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#2F3036",
            marginBottom: 3,
            display: "block",
          }}
        >
          Hazard Notes
        </label>
        <textarea
          value={form.hazardNotes}
          onChange={set("hazardNotes")}
          disabled={!hazardousActive}
          placeholder={
            hazardousActive
              ? "Describe hazard class, handling precautions, PPE required..."
              : "Enable Hazardous toggle to add notes"
          }
          rows={2}
          style={{
            width: "100%",
            padding: "5px 10px",
            fontSize: 12,
            border: "1px solid #d1d5db",
            borderRadius: 6,
            outline: "none",
            resize: "vertical",
            color: hazardousActive ? "#111827" : "#9CA3AF",
            backgroundColor: hazardousActive ? "#f9fafb" : "#F3F4F6",
            boxSizing: "border-box",
            cursor: hazardousActive ? "text" : "not-allowed",
          }}
        />
      </div>
    </SectionCard>
  );
}

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
            if (stopped) return;
            if (result) {
              stopped = true;
              try {
                reader.reset();
              } catch {}
              onResult(result.getText());
              onClose();
            }
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
            padding: "14px 18px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            Barcode / QR Scanner
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              width: 28,
              height: 28,
              cursor: "pointer",
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
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
        </div>
        <div style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>
            USB &amp; Bluetooth scanners type directly here — just scan
          </div>
          <div style={{ display: "flex", gap: 6 }}>
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
                height: 34,
                padding: "5px 10px",
                fontSize: 12,
                background: "#f9fafb",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                outline: "none",
                color: "#111827",
              }}
            />
            <button
              onClick={handleUse}
              style={{
                height: 34,
                padding: "0 16px",
                fontSize: 12,
                fontWeight: 600,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                outline: "none",
              }}
            >
              Use
            </button>
          </div>
          {errorMsg && (
            <div style={{ fontSize: 10, color: "#ef4444", marginTop: 5 }}>
              ⚠ {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generateItemCode(type = "", catalog = ITEM_TYPE_CATALOG) {
  const entry = catalog[type];
  const prefix = entry ? (entry.code || "").split("-")[1] || "ITM" : "ITM";
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `${prefix}-${ts}${rand}`;
}

const isDuplicateItem = (itemName, excludeId = null) => {
  try {
    const existingItems = JSON.parse(
      localStorage.getItem("tia_inventory") || "[]",
    );
    return existingItems.some(
      (item) =>
        item.name?.toLowerCase() === itemName.toLowerCase() &&
        (excludeId === null || item.id !== excludeId),
    );
  } catch {
    return false;
  }
};

const EMPTY_FORM = {
  itemCode: "",
  itemName: "",
  ndc: "",
  category: "",
  categoryCode: "",
  subcategory: "",
  subcategoryCode: "",
  manufacturer: "",
  unitOfMeasure: "",
  uomClass: "",
  baseUom: "",
  issueUom: "",
  purchaseUom: "",
  issueToBaseConversion: "",
  purchaseToBaseConversion: "",
  packSize: "",
  qtyInHand: "",
  parLevel: "",
  unitCost: "",
  brand: "",
  supplier: "",
  supplierOrderId: "",
  location: "Central Store",
  lotNumber: "",
  expireDate: "",
  notes: "",
  modelNo: "",
  serialNo: "",
  purchaseDate: "",
  warrantyExpiry: "",
  nextServiceDue: "",
  calibrationDue: "",
  condition: "Good",
  itemStatus: "Active",
  deaSchedule: "None — Not Controlled",
  gpo: "",
  gpoContractId: "",
  supplierQuotationId: "",
  assetLotTag: "",
  department: "",
  manufacturerPartNumber: "",
  udi: "",
  storageClass: "",
  coldChain: false,
  tempMin: "",
  tempMax: "",
  hazardous: false,
  hazardNotes: "",
  highValueFlag: false,
};

export default function AddItem() {
  const navigate = useNavigate();
  const { items: inventoryItems, addItem, updateItem } = useInventory();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("id");
  const isEdit = searchParams.get("edit") === "true" && editId;

  const catalog = useDynamicCatalog();
  const itemTypesList = getItemTypesList(catalog);

  const [itemType, setItemType] = useState(() => {
    const defaultType = Object.keys(
      buildDynamicCatalog() || ITEM_TYPE_CATALOG,
    )[0];
    if (isEdit && editId) {
      const existing = inventoryItems.find(
        (i) => String(i.id) === String(editId),
      );
      if (existing && existing.itemType) return existing.itemType;
    }
    return defaultType;
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [manufacturerOptions, setManufacturerOptions] =
    useState(MANUFACTURER_OPTIONS);
  const [gpoOptions, setGpoOptions] = useState([]);
  const [locationsList, setLocationsList] = useState(() => getLocations());
  const [departmentsList, setDepartmentsList] = useState(() =>
    getDepartments(),
  );

  // Catalog-derived helpers
  const activeCats = getCategoriesForType(itemType, catalog);
  const categoryNames = activeCats.map((c) => c.name);

  const getCategoryCode = (categoryName) =>
    activeCats.find((c) => c.name === categoryName)?.code ?? "";

  const getSubcategoryNames = (categoryName) =>
    activeCats
      .find((c) => c.name === categoryName)
      ?.subcategories.map((s) => s.name) ?? [];

  const getSubcategoryCode = (categoryName, subcategoryName) =>
    activeCats
      .find((c) => c.name === categoryName)
      ?.subcategories.find((s) => s.name === subcategoryName)?.code ?? "";

  // Load suppliers
  useEffect(() => {
    setSupplierOptions(getSupplierNames());
  }, []);

  useEffect(() => {
    const handler = () => setSupplierOptions(getSupplierNames());
    window.addEventListener("suppliersUpdated", handler);
    return () => window.removeEventListener("suppliersUpdated", handler);
  }, []);

  useEffect(() => {
    const handler = () => setGpoOptions(getGPONames());
    window.addEventListener("gposUpdated", handler);
    return () => window.removeEventListener("gposUpdated", handler);
  }, []);

  useEffect(() => {
    const refresh = () => {
      setLocationsList(getLocations());
      setDepartmentsList(getDepartments());
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("locationsUpdated", refresh);
    window.addEventListener("departmentsUpdated", refresh);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("locationsUpdated", refresh);
      window.removeEventListener("departmentsUpdated", refresh);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isEdit) {
      const existing = inventoryItems.find(
        (i) => String(i.id) === String(editId),
      );
      if (existing) {
        const storedType = existing.itemType || Object.keys(catalog)[0];
        setItemType(storedType);
        const cats = getCategoriesForType(storedType, catalog);
        const catCode =
          cats.find((c) => c.name === existing.category)?.code ?? "";
        const subCode =
          cats
            .find((c) => c.name === existing.category)
            ?.subcategories.find((s) => s.name === existing.subcategory)
            ?.code ?? "";
        setForm({
          ...EMPTY_FORM,
          itemName: existing.name || "",
          ndc: existing.ndc || "",
          category: existing.category || "",
          categoryCode: catCode,
          subcategory: existing.subcategory || "",
          subcategoryCode: subCode,
          location: existing.location || "Central Store",
          qtyInHand: String(existing.qty ?? ""),
          parLevel: String(existing.par ?? ""),
          unitCost: String(existing.cost ?? ""),
          lotNumber: existing.lot || "",
          expireDate: existing.expiryRaw
            ? existing.expiryRaw instanceof Date
              ? existing.expiryRaw.toISOString().split("T")[0]
              : existing.expiryRaw
            : "",
          uomClass: existing.uomClass || "",
          baseUom: existing.baseUom || "",
          issueUom: existing.issueUom || "",
          purchaseUom: existing.purchaseUom || "",
          issueToBaseConversion: String(existing.issueToBaseConversion ?? ""),
          purchaseToBaseConversion: String(
            existing.purchaseToBaseConversion ?? "",
          ),
          packSize: String(existing.packSize ?? ""),
          brand: existing.brand || "",
          manufacturer: existing.manufacturer || "",
          manufacturerPartNumber: existing.manufacturerPartNumber || "",
          udi: existing.udi || "",
          storageClass: existing.storageClass || "",
          coldChain: existing.coldChain || false,
          tempMin:
            existing.tempMin !== null && existing.tempMin !== undefined
              ? String(existing.tempMin)
              : "",
          tempMax:
            existing.tempMax !== null && existing.tempMax !== undefined
              ? String(existing.tempMax)
              : "",
          hazardous: existing.hazardous || false,
          hazardNotes: existing.hazardNotes || "",
          highValueFlag: existing.highValueFlag || false,
        });
      }
    } else {
      setForm(EMPTY_FORM);
      // Reset item type to default when not editing
      setItemType(Object.keys(buildDynamicCatalog() || ITEM_TYPE_CATALOG)[0]);
    }
  }, [editId, isEdit, inventoryItems]);

  // Auto-generate item code when type changes (add mode only)
  useEffect(() => {
    if (!isEdit) {
      setForm((f) => ({ ...f, itemCode: generateItemCode(itemType, catalog) }));
    }
  }, [itemType, isEdit, catalog]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => {
      const n = { ...er };
      delete n[key];
      return n;
    });
  };

  const isAsset = itemType === "Assets (Equipment/Machines)";
  const isMedDevice = itemType === "Medical Devices";
  const isEquipmentOrDevice = isAsset || isMedDevice;
  const isConsumable = !isEquipmentOrDevice;
  const today = new Date().toISOString().split("T")[0];

  const validate = () => {
    const errs = {};
    if (!form.itemName.trim()) errs.itemName = true;
    if (!form.ndc.trim()) errs.ndc = true;
    if (!form.category) errs.category = true;
    if (!form.location) errs.location = true;
    if (!form.manufacturer) errs.manufacturer = true;
    if (form.qtyInHand === "" || form.qtyInHand === undefined)
      errs.qtyInHand = true;
    if (isConsumable && !form.expireDate) errs.expireDate = true;
    if (isEquipmentOrDevice) {
      if (!form.purchaseDate) errs.purchaseDate = true;
      if (!form.warrantyExpiry) errs.warrantyExpiry = true;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (isDuplicateItem(form.itemName, isEdit ? Number(editId) : null)) {
      setToast({
        open: true,
        message: `❌ Duplicate! "${form.itemName}" already exists.`,
        severity: "error",
      });
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const payload = {
      itemCode: form.itemCode,
      itemType,
      name: form.itemName,
      ndc: form.ndc,
      category: form.category,
      categoryCode: form.categoryCode,
      subcategory: form.subcategory,
      subcategoryCode: form.subcategoryCode,
      location: form.location,
      qty: parseFloat(form.qtyInHand) || 0,
      par: parseFloat(form.parLevel) || 0,
      cost: parseFloat(form.unitCost) || 0,
      lot: form.lotNumber,
      uom: form.baseUom || form.unitOfMeasure,
      uomClass: form.uomClass,
      baseUom: form.baseUom,
      issueUom: form.issueUom,
      purchaseUom: form.purchaseUom,
      issueToBaseConversion: parseFloat(form.issueToBaseConversion) || null,
      purchaseToBaseConversion:
        parseFloat(form.purchaseToBaseConversion) || null,
      packSize: parseFloat(form.packSize) || null,
      expireDate: form.expireDate,
      notes: form.notes,
      brand: form.brand,
      manufacturer: form.manufacturer,
      supplier: form.supplier,
      supplierOrderId: form.supplierOrderId,
      gpo: form.gpo,
      gpoContractId: form.gpoContractId,
      supplierQuotationId: form.supplierQuotationId,
      department: form.department,
      manufacturerPartNumber: form.manufacturerPartNumber,
      udi: form.udi,
      storageClass: form.storageClass,
      coldChain: form.coldChain === true || form.coldChain === "true",
      tempMin: form.tempMin !== "" ? parseFloat(form.tempMin) : null,
      tempMax: form.tempMax !== "" ? parseFloat(form.tempMax) : null,
      hazardous: form.hazardous === true || form.hazardous === "true",
      hazardNotes: form.hazardNotes,
      highValueFlag:
        form.highValueFlag === true || form.highValueFlag === "true",
    };
    if (isEdit) {
      updateItem(Number(editId), payload);
      setToast({
        open: true,
        message: (
          <span>
            ✅ <strong>"{form.itemName}"</strong> updated!{" "}
            <a
              href="/admin/inventory/items"
              style={{
                color: "#fff",
                textDecoration: "underline",
                fontWeight: 600,
              }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/admin/inventory/items");
              }}
            >
              View Inventory
            </a>
          </span>
        ),
        severity: "success",
      });
    } else {
      addItem(payload);
      setToast({
        open: true,
        message: (
          <span>
            ✅ <strong>"{form.itemName}"</strong> saved!{" "}
            <a
              href="/admin/inventory/items"
              style={{
                color: "#fff",
                textDecoration: "underline",
                fontWeight: 600,
              }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/admin/inventory/items");
              }}
            >
              View Inventory
            </a>
          </span>
        ),
        severity: "success",
      });
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <button
          onClick={() => navigate("/admin/inventory/items")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            outline: "none",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 6L9 12L15 18"
              stroke="#2563eb"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            {isEdit ? "Edit Item" : "Add to Inventory"}
          </h2>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          padding: "16px 20px",
          marginBottom: 14,
        }}
      >
        {/* ── ITEM DETAILS ────────────────────────────────────────────────── */}
        <SectionCard title="ITEM DETAILS">
          <Row cols={3}>
            <div>
              <Label required>Item Type</Label>
              <SelectInput
                placeholder="Select item type..."
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value);
                  setForm((f) => ({
                    ...f,
                    category: "",
                    categoryCode: "",
                    subcategory: "",
                    subcategoryCode: "",
                  }));
                }}
                options={itemTypesList.map((t) => t.label)}
                disabled={isEdit}
              />
              {isEdit && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#9ca3af",
                    marginTop: 2,
                    display: "block",
                  }}
                >
                  Item type cannot be changed after creation
                </span>
              )}
              {errors.itemType && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#ef4444",
                    marginTop: 2,
                    display: "block",
                  }}
                >
                  Item Type is required
                </span>
              )}
            </div>
            <div>
              <Label required>Item Code</Label>
              <input
                readOnly
                value={form.itemCode}
                style={{
                  ...inputStyle,
                  background: "#F3F4F6",
                  color: "#6B7280",
                  cursor: "not-allowed",
                  fontFamily: "monospace",
                  letterSpacing: "0.05em",
                  fontSize: 11,
                }}
              />
            </div>
            <div>
              <Label required>Name</Label>
              <TextInput
                placeholder="e.g. Amoxicillin 500mg Capsules"
                value={form.itemName}
                onChange={set("itemName")}
              />
              {errors.itemName && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#ef4444",
                    marginTop: 2,
                    display: "block",
                  }}
                >
                  Name is required
                </span>
              )}
            </div>
          </Row>

          <Row cols={3}>
            <div>
              <Label required>NDC / SKU / Barcode</Label>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <TextInput
                    placeholder="e.g. 0093-4155-01"
                    value={form.ndc}
                    onChange={set("ndc")}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    height: 32,
                    padding: "0 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Scan
                </button>
              </div>
              {errors.ndc && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#ef4444",
                    marginTop: 2,
                    display: "block",
                  }}
                >
                  NDC / SKU / Barcode is required
                </span>
              )}
            </div>
            <div>
              <Label required>Category</Label>
              <SelectInput
                placeholder="Select category..."
                value={form.category}
                onChange={(e) => {
                  const catName = e.target.value;
                  const catCode = getCategoryCode(catName);
                  setForm((f) => ({
                    ...f,
                    category: catName,
                    categoryCode: catCode,
                    subcategory: "",
                    subcategoryCode: "",
                  }));
                  setErrors((er) => {
                    const n = { ...er };
                    delete n.category;
                    return n;
                  });
                }}
                options={categoryNames}
              />
              {errors.category && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#ef4444",
                    marginTop: 2,
                    display: "block",
                  }}
                >
                  Category is required
                </span>
              )}
            </div>
            <div>
              <Label>Category Code</Label>
              <input
                readOnly
                value={form.categoryCode}
                style={{
                  ...inputStyle,
                  background: "#F3F4F6",
                  color: "#6B7280",
                  cursor: "not-allowed",
                  fontFamily: "monospace",
                  fontSize: 11,
                }}
              />
            </div>
          </Row>

          <Row cols={3}>
            <div>
              <Label>Subcategory</Label>
              <SelectInput
                placeholder={
                  form.category
                    ? "Select subcategory..."
                    : "Select a category first..."
                }
                value={form.subcategory}
                onChange={(e) => {
                  const subName = e.target.value;
                  const subCode = getSubcategoryCode(form.category, subName);
                  setForm((f) => ({
                    ...f,
                    subcategory: subName,
                    subcategoryCode: subCode,
                  }));
                }}
                options={getSubcategoryNames(form.category)}
              />
            </div>
            <div>
              <Label>Subcategory Code</Label>
              <input
                readOnly
                value={form.subcategoryCode}
                style={{
                  ...inputStyle,
                  background: "#F3F4F6",
                  color: "#6B7280",
                  cursor: "not-allowed",
                  fontFamily: "monospace",
                  fontSize: 11,
                }}
              />
            </div>
            <div>
              <Label required>Manufacturer</Label>
              <SelectInput
                placeholder="Select manufacturer..."
                value={form.manufacturer}
                onChange={set("manufacturer")}
                options={MANUFACTURER_OPTIONS}
              />
              {errors.manufacturer && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#ef4444",
                    marginTop: 2,
                    display: "block",
                  }}
                >
                  Manufacturer is required
                </span>
              )}
            </div>
          </Row>

          {isConsumable && (
            <Row cols={3}>
              <div>
                <Label>Lot No.</Label>
                <TextInput
                  placeholder="e.g. LOT2025A"
                  value={form.lotNumber}
                  onChange={set("lotNumber")}
                />
              </div>
              <div>
                <Label>Item Status</Label>
                <SelectInput
                  placeholder="Active"
                  value={form.itemStatus}
                  onChange={set("itemStatus")}
                  options={["Active", "Inactive", "Discontinued", "On Hold"]}
                />
              </div>
            </Row>
          )}
        </SectionCard>

        {/* ── UOM ─────────────────────────────────────────────────────────── */}
        <UomSection form={form} set={set} />

        {/* ── STORAGE & HANDLING ──────────────────────────────────────────── */}
        <StorageHandlingSection form={form} set={set} />

        {/* ── EQUIPMENT / DEVICE DETAILS ──────────────────────────────────── */}
        {isEquipmentOrDevice && !isEdit && (
          <SectionCard title={isAsset ? "EQUIPMENT DETAILS" : "DEVICE DETAILS"}>
            <Row cols={3}>
              <div>
                <Label>Model No.</Label>
                <TextInput
                  placeholder="e.g. BeneVision N15"
                  value={form.modelNo}
                  onChange={set("modelNo")}
                />
              </div>
              <div>
                <Label>Serial No.</Label>
                <TextInput
                  placeholder="e.g. MR2024-0012"
                  value={form.serialNo}
                  onChange={set("serialNo")}
                />
              </div>
              <div>
                <Label>DEA Schedule</Label>
                <SelectInput
                  placeholder="None — Not Controlled"
                  value={form.deaSchedule}
                  onChange={set("deaSchedule")}
                  options={[
                    "None — Not Controlled",
                    "Schedule I",
                    "Schedule II",
                    "Schedule III",
                    "Schedule IV",
                    "Schedule V",
                  ]}
                />
              </div>
            </Row>
            <Row cols={3}>
              <div>
                <Label>Manufacturer Part Number</Label>
                <TextInput
                  placeholder="e.g. MPN-2024-001"
                  value={form.manufacturerPartNumber}
                  onChange={set("manufacturerPartNumber")}
                />
              </div>
              <div>
                <Label>UDI</Label>
                <TextInput
                  placeholder="e.g. (01)05412345000014"
                  value={form.udi}
                  onChange={set("udi")}
                />
              </div>
            </Row>
            <Row cols={4}>
              <div>
                <Label required>Purchase Date</Label>
                <DateInput
                  value={form.purchaseDate}
                  onChange={set("purchaseDate")}
                  max={today}
                />
                {errors.purchaseDate && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#ef4444",
                      marginTop: 2,
                      display: "block",
                    }}
                  >
                    Purchase Date is required
                  </span>
                )}
              </div>
              <div>
                <Label required>Warranty Expiry</Label>
                <DateInput
                  value={form.warrantyExpiry}
                  onChange={set("warrantyExpiry")}
                  min={today}
                />
                {errors.warrantyExpiry && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#ef4444",
                      marginTop: 2,
                      display: "block",
                    }}
                  >
                    Warranty Expiry is required
                  </span>
                )}
              </div>
              <div>
                <Label>Next Service Due</Label>
                <DateInput
                  value={form.nextServiceDue}
                  onChange={set("nextServiceDue")}
                  min={today}
                />
              </div>
              <div>
                <Label>Calibration Due</Label>
                <DateInput
                  value={form.calibrationDue}
                  onChange={set("calibrationDue")}
                  min={today}
                />
              </div>
            </Row>
            <Row cols={2}>
              <div>
                <Label>Condition</Label>
                <SelectInput
                  placeholder="Good"
                  value={form.condition}
                  onChange={set("condition")}
                  options={[
                    "Good",
                    "Fair",
                    "Poor",
                    "Need Attention",
                    "Under Repair",
                  ]}
                />
              </div>
              <div>
                <Label>Item Status</Label>
                <SelectInput
                  placeholder="Active"
                  value={form.itemStatus}
                  onChange={set("itemStatus")}
                  options={["Active", "Quarantined", "Recalled", "Disposed"]}
                />
              </div>
            </Row>
          </SectionCard>
        )}

        {/* ── SUPPLIER & PROCUREMENT ──────────────────────────────────────── */}
        {!isEdit && (
          <SectionCard title="SUPPLIER & PROCUREMENT">
            <Row cols={3}>
              <div>
                <Label>Brand</Label>
                <TextInput
                  placeholder="e.g. Pfizer, Abbott, 3M..."
                  value={form.brand}
                  onChange={set("brand")}
                />
              </div>
              <div>
                <Label>Supplier</Label>
                <SelectInput
                  placeholder="Select supplier..."
                  value={form.supplier}
                  onChange={set("supplier")}
                  options={
                    supplierOptions.length > 0
                      ? supplierOptions
                      : [
                          "Cardinal Health",
                          "McKesson",
                          "Medline",
                          "Owens & Minor",
                          "Henry Schein",
                        ]
                  }
                />
              </div>
              <div>
                <Label>GPO</Label>
                <SelectInput
                  placeholder="Select GPO..."
                  value={form.gpo}
                  onChange={set("gpo")}
                  options={
                    gpoOptions.length > 0
                      ? gpoOptions
                      : [
                          "Vizient",
                          "Premier",
                          "HealthTrust (HPG)",
                          "Intalere",
                          "Provista",
                          "MedAssets",
                        ]
                  }
                />
              </div>
            </Row>
            {(form.gpo || form.supplier) && (
              <Row cols={2}>
                {form.gpo ? (
                  <div>
                    <Label>GPO Contract ID</Label>
                    <TextInput
                      placeholder="e.g. VIZ-2025-00123"
                      value={form.gpoContractId}
                      onChange={set("gpoContractId")}
                    />
                  </div>
                ) : form.supplier?.includes("Amazon") ? (
                  <div>
                    <Label>Amazon Order ID</Label>
                    <TextInput
                      placeholder="e.g. AMA-2025-00001"
                      value={form.supplierOrderId}
                      onChange={set("supplierOrderId")}
                    />
                  </div>
                ) : form.supplier ? (
                  <div>
                    <Label>Supplier Quotation ID</Label>
                    <TextInput
                      placeholder="e.g. QUO-2025-00789"
                      value={form.supplierQuotationId}
                      onChange={set("supplierQuotationId")}
                    />
                  </div>
                ) : null}
              </Row>
            )}
          </SectionCard>
        )}

        {/* ── STOCK & PRICING ─────────────────────────────────────────────── */}
        <SectionCard title="STOCK & PRICING">
          {isEquipmentOrDevice ? (
            <>
              <Row cols={3}>
                <div>
                  <Label required>Quantity (Units)</Label>
                  <NumberSpinInput
                    value={form.qtyInHand}
                    onChange={set("qtyInHand")}
                    placeholder="0"
                    step={1}
                  />
                  {errors.qtyInHand && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#ef4444",
                        marginTop: 2,
                        display: "block",
                      }}
                    >
                      Quantity is required
                    </span>
                  )}
                </div>
                <div>
                  <Label>Min. QTY Required</Label>
                  <NumberSpinInput
                    value={form.parLevel}
                    onChange={set("parLevel")}
                    placeholder="0"
                    step={1}
                  />
                </div>
                <div>
                  <Label>Unit Cost ($)</Label>
                  <NumberSpinInput
                    value={form.unitCost}
                    onChange={set("unitCost")}
                    placeholder="0.00"
                    step={0.01}
                  />
                </div>
              </Row>
              <Row cols={2}>
                <div>
                  <Label required>Location</Label>
                  <SelectInput
                    placeholder="Select..."
                    value={form.location}
                    onChange={set("location")}
                    options={locationsList}
                  />
                  {errors.location && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#ef4444",
                        marginTop: 2,
                        display: "block",
                      }}
                    >
                      Location is required
                    </span>
                  )}
                </div>
                <div>
                  <Label>Department</Label>
                  <SelectInput
                    placeholder="Select department..."
                    value={form.department}
                    onChange={set("department")}
                    options={departmentsList}
                  />
                </div>
              </Row>
            </>
          ) : (
            <>
              <Row cols={3}>
                <div>
                  <Label required>QTY in Hand</Label>
                  <NumberSpinInput
                    value={form.qtyInHand}
                    onChange={set("qtyInHand")}
                    placeholder="0"
                    step={1}
                  />
                  {errors.qtyInHand && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#ef4444",
                        marginTop: 2,
                        display: "block",
                      }}
                    >
                      QTY in Hand is required
                    </span>
                  )}
                </div>
                <div>
                  <Label>PAR Level</Label>
                  <NumberSpinInput
                    value={form.parLevel}
                    onChange={set("parLevel")}
                    placeholder="0"
                    step={1}
                  />
                </div>
                <div>
                  <Label>Unit Cost ($)</Label>
                  <NumberSpinInput
                    value={form.unitCost}
                    onChange={set("unitCost")}
                    placeholder="0.00"
                    step={0.01}
                  />
                </div>
              </Row>
              <Row cols={2}>
                <div>
                  <Label required>Location</Label>
                  <SelectInput
                    placeholder="Select..."
                    value={form.location}
                    onChange={set("location")}
                    options={locationsList}
                  />
                  {errors.location && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#ef4444",
                        marginTop: 2,
                        display: "block",
                      }}
                    >
                      Location is required
                    </span>
                  )}
                </div>
                <div>
                  <Label>Department</Label>
                  <SelectInput
                    placeholder="Select department..."
                    value={form.department}
                    onChange={set("department")}
                    options={departmentsList}
                  />
                </div>
              </Row>
            </>
          )}
        </SectionCard>

        {/* ── LOT & EXPIRY (consumables only) ─────────────────────────────── */}
        {isConsumable && (
          <SectionCard title="LOT & EXPIRY">
            <Row cols={2}>
              <div>
                <Label required>Expire Date</Label>
                <DateInput
                  value={form.expireDate}
                  onChange={set("expireDate")}
                  min={today}
                />
                {errors.expireDate && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#ef4444",
                      marginTop: 2,
                      display: "block",
                    }}
                  >
                    Expire Date is required
                  </span>
                )}
              </div>
              <div>
                <Label>Notes</Label>
                <textarea
                  value={form.notes}
                  onChange={set("notes")}
                  placeholder="Type here"
                  rows={1}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    fontSize: 12,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    outline: "none",
                    resize: "vertical",
                    color: "#111827",
                    backgroundColor: "#f9fafb",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </Row>
          </SectionCard>
        )}

        {/* ── ASSET INFO (equipment/device only) ──────────────────────────── */}
        {isEquipmentOrDevice && !isEdit && (
          <SectionCard title="ASSET INFO">
            <Row cols={2}>
              <div>
                <Label>Asset / Lot Tag</Label>
                <TextInput
                  placeholder="LOT2025A"
                  value={form.assetLotTag}
                  onChange={set("assetLotTag")}
                />
              </div>
              <div>
                <Label>Warranty Expiry</Label>
                <DateInput
                  value={form.warrantyExpiry}
                  onChange={set("warrantyExpiry")}
                  min={today}
                />
              </div>
            </Row>
            <div>
              <Label>Notes</Label>
              <textarea
                value={form.notes}
                onChange={set("notes")}
                placeholder="Special handling, storage, usage notes..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "5px 10px",
                  fontSize: 12,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  outline: "none",
                  resize: "vertical",
                  color: "#111827",
                  backgroundColor: "#f9fafb",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </SectionCard>
        )}
      </div>

      {/* Footer buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          paddingBottom: 14,
        }}
      >
        <button
          onClick={() => navigate("/admin/inventory/items")}
          style={{
            height: 34,
            padding: "6px 18px",
            fontSize: 12,
            fontWeight: 600,
            border: "1px solid #3182CE",
            borderRadius: 6,
            background: "#fff",
            color: "#3182CE",
            cursor: "pointer",
            outline: "none",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            height: 34,
            padding: "6px 18px",
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            borderRadius: 6,
            background: saving ? "#93c5fd" : "#2563eb",
            color: "#fff",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
            outline: "none",
          }}
        >
          {saving ? "Saving…" : isEdit ? "Update Item" : "Save Item"}
        </button>
      </div>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onResult={(code) => {
          setForm((f) => ({ ...f, ndc: code }));
          setErrors((er) => {
            const n = { ...er };
            delete n.ndc;
            return n;
          });
          setToast({
            open: true,
            message: `Scanned: ${code}`,
            severity: "success",
          });
        }}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

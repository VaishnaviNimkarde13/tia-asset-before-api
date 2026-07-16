
import { useState } from "react";

// ─── Icon library ─────────────────────────────────────────────────────────────
const IC = {
  asset:        (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  consumable:   (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6l1 7H8L9 2z"/><path d="M8 9a4 4 0 0 0 8 0"/><rect x="6" y="16" width="12" height="6" rx="1"/></svg>,
  housekeeping: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  lab:          (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v8l-3 9a1 1 0 0 0 .9 1.4h10.2a1 1 0 0 0 .9-1.4L15 10V2"/><line x1="9" y1="6" x2="15" y2="6"/></svg>,
  mro:          (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  device:       (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  pharma:       (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>,
  stationery:   (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  custom:       (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  plus:    (c="#fff") => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:    ()        => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ban:     ()        => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  check:   ()        => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  close:   ()        => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevron: (open)    => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.18s" }}><polyline points="6 9 12 15 18 9"/></svg>,
  tag:     (c)       => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
};

// ─── Icon options for item type picker ────────────────────────────────────────
const ICON_CHOICES = [
  { key:"asset",        label:"Briefcase"  },
  { key:"consumable",   label:"Bottle"     },
  { key:"housekeeping", label:"Home"       },
  { key:"lab",          label:"Flask"      },
  { key:"mro",          label:"Wrench"     },
  { key:"device",       label:"Monitor"    },
  { key:"pharma",       label:"Pill"       },
  { key:"stationery",   label:"Pen"        },
  { key:"custom",       label:"Grid"       },
  { key:"tag",          label:"Tag"        },
];

// ─── Color palette for item type picker ───────────────────────────────────────
const COLOR_PALETTE = [
  { color:"#0369A1", bg:"#F0F9FF", activeBg:"#BAE6FD", border:"#7DD3FC", label:"Blue"    },
  { color:"#065F46", bg:"#ECFDF5", activeBg:"#A7F3D0", border:"#6EE7B7", label:"Green"   },
  { color:"#6D28D9", bg:"#F5F3FF", activeBg:"#DDD6FE", border:"#C4B5FD", label:"Purple"  },
  { color:"#92400E", bg:"#FFFBEB", activeBg:"#FDE68A", border:"#FCD34D", label:"Amber"   },
  { color:"#9F1239", bg:"#FFF1F2", activeBg:"#FECDD3", border:"#FDA4AF", label:"Rose"    },
  { color:"#1E40AF", bg:"#EFF6FF", activeBg:"#BFDBFE", border:"#93C5FD", label:"Indigo"  },
  { color:"#0E7490", bg:"#ECFEFF", activeBg:"#A5F3FC", border:"#67E8F9", label:"Cyan"    },
  { color:"#5B21B6", bg:"#F5F3FF", activeBg:"#DDD6FE", border:"#A78BFA", label:"Violet"  },
  { color:"#B45309", bg:"#FFF7ED", activeBg:"#FED7AA", border:"#FDBA74", label:"Orange"  },
  { color:"#047857", bg:"#F0FDF4", activeBg:"#BBF7D0", border:"#86EFAC", label:"Emerald" },
  { color:"#be185d", bg:"#FDF2F8", activeBg:"#F9A8D4", border:"#F472B6", label:"Pink"    },
  { color:"#334155", bg:"#F8FAFC", activeBg:"#E2E8F0", border:"#CBD5E1", label:"Slate"   },
];

// ─── Default item types ───────────────────────────────────────────────────────
const DEFAULT_ITEM_TYPES = [
  { key:"asset",        label:"Assets (Equipment/Machines)", iconKey:"asset",        color:"#0369A1", bg:"#F0F9FF", activeBg:"#BAE6FD", border:"#7DD3FC", isDefault:true },
  { key:"consumable",   label:"Consumables",                 iconKey:"consumable",   color:"#065F46", bg:"#ECFDF5", activeBg:"#A7F3D0", border:"#6EE7B7", isDefault:true },
  { key:"housekeeping", label:"Housekeeping & Sanitation",   iconKey:"housekeeping", color:"#6D28D9", bg:"#F5F3FF", activeBg:"#DDD6FE", border:"#C4B5FD", isDefault:true },
  { key:"lab",          label:"Lab Reagents & Diagnostics",  iconKey:"lab",          color:"#92400E", bg:"#FFFBEB", activeBg:"#FDE68A", border:"#FCD34D", isDefault:true },
  { key:"mro",          label:"Maintenance Spares (MRO)",    iconKey:"mro",          color:"#9F1239", bg:"#FFF1F2", activeBg:"#FECDD3", border:"#FDA4AF", isDefault:true },
  { key:"device",       label:"Medical Devices",             iconKey:"device",       color:"#1E40AF", bg:"#EFF6FF", activeBg:"#BFDBFE", border:"#93C5FD", isDefault:true },
  { key:"pharma",       label:"Pharmaceuticals (Drugs)",     iconKey:"pharma",       color:"#0E7490", bg:"#ECFEFF", activeBg:"#A5F3FC", border:"#67E8F9", isDefault:true },
  { key:"stationery",   label:"Stationery",                  iconKey:"stationery",   color:"#5B21B6", bg:"#F5F3FF", activeBg:"#DDD6FE", border:"#A78BFA", isDefault:true },
];

// ─── Initial categories ───────────────────────────────────────────────────────
const initialCategories = [
  { id:"c01", name:"Facility Equipment",   code:"IT-ASST-FACILITYEQUIPMENT",   desc:"Utilities & infrastructure assets",      status:"Active", itemType:"asset",        subcategories:[{ id:"s01a", name:"Utilities",                       code:"IT-ASST-FACILITYEQUIPMENT-UTILITIES",           description:"Generators, boilers, power systems",          status:"Active" }]},
  { id:"c02", name:"Imaging Equipment",    code:"IT-ASST-IMAGINGEQUIPMENT",    desc:"Radiology & diagnostic imaging",          status:"Active", itemType:"asset",        subcategories:[{ id:"s02a", name:"Radiology machines",              code:"IT-ASST-IMAGINGEQUIPMENT-RADIOLOGYMACHINES",    description:"CT, MRI, X-Ray, Mammography",                  status:"Active" }]},
  { id:"c03", name:"IT Assets",            code:"IT-ASST-ITASSETS",            desc:"Computers, scanners & IT hardware",       status:"Active", itemType:"asset",        subcategories:[{ id:"s03a", name:"Computers & scanners",            code:"IT-ASST-ITASSETS-COMPUTERSSCANNERS",            description:"Workstations, laptops, barcode scanners",       status:"Active" }]},
  { id:"c04", name:"Lab Equipment",        code:"IT-ASST-LABEQUIPMENT",        desc:"Laboratory analyzers & instruments",      status:"Active", itemType:"asset",        subcategories:[{ id:"s04a", name:"Analyzers",                       code:"IT-ASST-LABEQUIPMENT-ANALYZERS",                description:"Hematology, chemistry, immunoassay analyzers", status:"Active" }]},
  { id:"c05", name:"Medical Equipment",    code:"IT-ASST-MEDICALEQUIPMENT",    desc:"Patient care & infusion devices",         status:"Active", itemType:"asset",        subcategories:[{ id:"s05a", name:"Infusion & patient care devices", code:"IT-ASST-MEDICALEQUIPMENT-INFUSIONPATIENTCARE",  description:"Infusion pumps, monitors, ventilators",         status:"Active" }]},
  { id:"c06", name:"Clinical Consumables", code:"IT-CONS-CLINICALCONSUMABL",   desc:"Everyday clinical supplies",              status:"Active", itemType:"consumable",   subcategories:[
    { id:"s06a", name:"Dressings & wound care", code:"IT-CONS-CLINICALCONSUMABL-DRESSINGSWOUNDCARE",  description:"Wound dressings, bandages",         status:"Active" },
    { id:"s06b", name:"IV sets / tubing",       code:"IT-CONS-CLINICALCONSUMABL-IVSETSTUBING",        description:"IV administration sets, tubing",    status:"Active" },
    { id:"s06c", name:"PPE",                    code:"IT-CONS-CLINICALCONSUMABL-PPE",                 description:"Gloves, masks, gowns, face shields", status:"Active" },
    { id:"s06d", name:"Syringes/needles",       code:"IT-CONS-CLINICALCONSUMABL-SYRINGESNEEDLES",     description:"Injection syringes and needles",    status:"Active" }]},
  { id:"c07", name:"Cleaning Chemicals",   code:"IT-HSKP-CLEANINGCHEMICALS",   desc:"Disinfectants & floor care products",     status:"Active", itemType:"housekeeping", subcategories:[
    { id:"s07a", name:"Detergents & floor care", code:"IT-HSKP-CLEANINGCHEMICALS-DETERGENTSFLOORCARE", description:"Detergents, mops, floor care",          status:"Active" },
    { id:"s07b", name:"Disinfectants",           code:"IT-HSKP-CLEANINGCHEMICALS-DISINFECTANTS",       description:"Surface & instrument disinfectants",     status:"Active" }]},
  { id:"c08", name:"Housekeeping PPE",     code:"IT-HSKP-HOUSEKEEPINGPPE",     desc:"Protective equipment for housekeeping",   status:"Active", itemType:"housekeeping", subcategories:[{ id:"s08a", name:"PPE",                      code:"IT-HSKP-HOUSEKEEPINGPPE-PPE",                   description:"Gloves, aprons, boots, goggles",                status:"Active" }]},
  { id:"c09", name:"Waste Management",     code:"IT-HSKP-WASTEMANAGEMENT",     desc:"Waste disposal & sharps containers",      status:"Active", itemType:"housekeeping", subcategories:[{ id:"s09a", name:"Bags & sharps containers", code:"IT-HSKP-WASTEMANAGEMENT-BAGSSHARPSCONTAINERS",  description:"Biohazard bags, sharps bins",                   status:"Active" }]},
  { id:"c10", name:"Controls & Calibrators",code:"IT-LABS-CONTROLSCALIBRATO",  desc:"QC controls and calibrators",             status:"Active", itemType:"lab",          subcategories:[{ id:"s10a", name:"QC controls",             code:"IT-LABS-CONTROLSCALIBRATO-QCCONTROLS",          description:"Chemistry, hematology QC controls",             status:"Active" }]},
  { id:"c11", name:"Lab Consumables",      code:"IT-LABS-LABCONSUMABLES",      desc:"Pipette tips & lab plastics",             status:"Active", itemType:"lab",          subcategories:[{ id:"s11a", name:"Pipette tips & plastics", code:"IT-LABS-LABCONSUMABLES-PIPETTETIPSPLASTICS",    description:"Pipette tips, microcentrifuge tubes, plates",   status:"Active" }]},
  { id:"c12", name:"Reagents",             code:"IT-LABS-REAGENTS",            desc:"Chemical reagents for lab testing",       status:"Active", itemType:"lab",          subcategories:[{ id:"s12a", name:"Chemistry reagents",      code:"IT-LABS-REAGENTS-CHEMISTRYREAGENTS",            description:"Clinical chemistry reagents",                   status:"Active" }]},
  { id:"c13", name:"Specimen Collection",  code:"IT-LABS-SPECIMENCOLLECTIO",   desc:"Collection tubes and consumables",        status:"Active", itemType:"lab",          subcategories:[{ id:"s13a", name:"Consumables",             code:"IT-LABS-SPECIMENCOLLECTIO-CONSUMABLES",         description:"Collection tubes, swabs, containers",           status:"Active" }]},
  { id:"c14", name:"Test Kits",            code:"IT-LABS-TESTKITS",            desc:"Rapid diagnostic test kits",              status:"Active", itemType:"lab",          subcategories:[{ id:"s14a", name:"Rapid tests / assay kits", code:"IT-LABS-TESTKITS-RAPIDTESTSASSAYKITS",          description:"Point-of-care and rapid test kits",             status:"Active" }]},
  { id:"c15", name:"Biomedical Spares",    code:"IT-MRO-BIOMEDICALSPARES",     desc:"Spare parts for medical equipment",       status:"Active", itemType:"mro",          subcategories:[{ id:"s15a", name:"Equipment parts",        code:"IT-MRO-BIOMEDICALSPARES-EQUIPMENTPARTS",        description:"Replacement parts for biomedical devices",      status:"Active" }]},
  { id:"c16", name:"Electrical Spares",    code:"IT-MRO-ELECTRICALSPARES",     desc:"Electrical components & breakers",        status:"Active", itemType:"mro",          subcategories:[{ id:"s16a", name:"Switches & breakers",    code:"IT-MRO-ELECTRICALSPARES-SWITCHESBREAKERS",      description:"Circuit breakers, switches, fuses",             status:"Active" }]},
  { id:"c17", name:"HVAC",                 code:"IT-MRO-HVAC",                 desc:"HVAC filters, belts and components",      status:"Active", itemType:"mro",          subcategories:[{ id:"s17a", name:"Filters & belts",        code:"IT-MRO-HVAC-FILTERSBELTS",                      description:"Air filters, belts, coils",                     status:"Active" }]},
  { id:"c18", name:"Lubricants & Consumable spares",code:"IT-MRO-LUBRICANTSCONSUMA",desc:"Oils, grease and lubricants",         status:"Active", itemType:"mro",          subcategories:[{ id:"s18a", name:"Oils/grease",             code:"IT-MRO-LUBRICANTSCONSUMA-OILSGREASE",           description:"Compressor oil, hydraulic oil, grease",         status:"Active" }]},
  { id:"c19", name:"Plumbing Spares",      code:"IT-MRO-PLUMBINGSPARES",       desc:"Pipes, fittings and plumbing parts",      status:"Active", itemType:"mro",          subcategories:[{ id:"s19a", name:"Pipes & fittings",       code:"IT-MRO-PLUMBINGSPARES-PIPESFITTINGS",           description:"Copper elbows, ball valves, PVC fittings",      status:"Active" }]},
  { id:"c20", name:"Non-UDI / Low-risk devices",code:"IT-MDEV-NONUDILOWRISKD",  desc:"Accessories and low-risk items",          status:"Active", itemType:"device",       subcategories:[{ id:"s20a", name:"Accessories & low-risk items",code:"IT-MDEV-NONUDILOWRISKD-ACCESSORIESLOWRISKI",    description:"Low-risk accessories & ancillaries",            status:"Active" }]},
  { id:"c21", name:"UDI Devices",          code:"IT-MDEV-UDIDEVICES",          desc:"UDI-tracked sterile & implantable",       status:"Active", itemType:"device",       subcategories:[
    { id:"s21a", name:"Implantable devices",        code:"IT-MDEV-UDIDEVICES-IMPLANTABLEDEVICES",         description:"Stents, implants, pacemakers",                  status:"Active" },
    { id:"s21b", name:"Single-use sterile devices", code:"IT-MDEV-UDIDEVICES-SINGLEUSESTERILEDEV",        description:"Single-use sterile surgical devices",           status:"Active" }]},
  { id:"c22", name:"Blood & Blood Components (DSCSA Excluded)",code:"IT-PHAR-BLOODBLOODCOMPON",desc:"Blood products",          status:"Active", itemType:"pharma",       subcategories:[{ id:"s22a", name:"Blood products",          code:"IT-PHAR-BLOODBLOODCOMPON-BLOODPRODUCTS",        description:"PRBC, platelets, FFP, cryoprecipitate",         status:"Active" }]},
  { id:"c23", name:"Compounded Drugs (DSCSA Excluded)",code:"IT-PHAR-COMPOUNDEDDRUGS",desc:"Compounded non-sterile, sterile, topical",status:"Active", itemType:"pharma",subcategories:[
    { id:"s23a", name:"Dosage Form – Non-sterile Oral",     code:"IT-PHAR-COMPOUNDEDDRUGS-DOSAGEFORMNONSTERIL",   description:"Compounded oral suspensions",                   status:"Active" },
    { id:"s23b", name:"Dosage Form – Sterile Injectable/IV",code:"IT-PHAR-COMPOUNDEDDRUGS-DOSAGEFORMSTERILEIN",   description:"Compounded IV admixtures, TPN",                 status:"Active" },
    { id:"s23c", name:"Dosage Form – Topical",              code:"IT-PHAR-COMPOUNDEDDRUGS-DOSAGEFORMTOPICAL",     description:"Compounded creams, ointments",                  status:"Active" }]},
  { id:"c24", name:"Homeopathic Drugs (DSCSA Excluded)",code:"IT-PHAR-HOMEOPATHICDRUGS",desc:"Homeopathic products",          status:"Active", itemType:"pharma",       subcategories:[{ id:"s24a", name:"Homeopathic products",    code:"IT-PHAR-HOMEOPATHICDRUGS-HOMEOPATHICPRODUCTS",  description:"Arnica, oscillococcinum, nux vomica",           status:"Active" }]},
  { id:"c25", name:"IV Solutions (DSCSA Excluded)",code:"IT-PHAR-IVSOLUTIONS",    desc:"IV fluids & electrolytes",                status:"Active", itemType:"pharma",       subcategories:[{ id:"s25a", name:"Certain IV fluids / electrolytes",code:"IT-PHAR-IVSOLUTIONS-CERTAINIVFLUIDSELEC",       description:"NS, LR, D5W and electrolyte solutions",         status:"Active" }]},
  { id:"c26", name:"Imaging/Radiopharmaceutical (DSCSA Excluded)",code:"IT-PHAR-IMAGINGRADIOPHARM",desc:"Imaging drugs / radioactive drugs",status:"Active",itemType:"pharma",subcategories:[{ id:"s26a", name:"Imaging drugs / radioactive drugs",code:"IT-PHAR-IMAGINGRADIOPHARM-IMAGINGDRUGSRADIOACT",description:"Tc-99m kits, contrast media, F18",              status:"Active" }]},
  { id:"c27", name:"Medical Gases (DSCSA Excluded)",code:"IT-PHAR-MEDICALGASES",   desc:"Cylinders & gas supplies",                status:"Active", itemType:"pharma",       subcategories:[{ id:"s27a", name:"Cylinders & gas supplies",code:"IT-PHAR-MEDICALGASES-CYLINDERSGASSUPPLIES",     description:"Medical O2, nitrous oxide, CO2, air cylinders", status:"Active" }]},
  { id:"c28", name:"OTC Drugs (DSCSA Excluded)",code:"IT-PHAR-OTCDRUGS",           desc:"Over the counter drugs",                  status:"Active", itemType:"pharma",       subcategories:[
    { id:"s28a", name:"Dosage Form – Inhalation",     code:"IT-PHAR-OTCDRUGS-DOSAGEFORMINHALATION", description:"OTC inhalers",                                  status:"Active" },
    { id:"s28b", name:"Dosage Form – Oral Solid",     code:"IT-PHAR-OTCDRUGS-DOSAGEFORMORALSOLID",  description:"OTC tablets, capsules",                         status:"Active" },
    { id:"s28c", name:"OTC – Analgesics",             code:"IT-PHAR-OTCDRUGS-OTCANALGESICS",         description:"Acetaminophen, ibuprofen, aspirin",             status:"Active" },
    { id:"s28d", name:"OTC – Vitamins & Supplements", code:"IT-PHAR-OTCDRUGS-OTCVITAMINSSUPPLEMEN",  description:"Vitamins, prenatal, mineral supplements",       status:"Active" }]},
  { id:"c29", name:"Rx Drugs (DSCSA Covered)",code:"IT-PHAR-RXDRUGS",             desc:"Prescription drugs covered by DSCSA",     status:"Active", itemType:"pharma",       subcategories:[
    { id:"s29a", name:"Controlled Substance – Schedule II",    code:"IT-PHAR-RXDRUGS-CONTROLLEDSUBSTANCES",    description:"DEA Sch II narcotics & stimulants",             status:"Active" },
    { id:"s29b", name:"Controlled Substance – Schedule III–V", code:"IT-PHAR-RXDRUGS-CONTROLLEDSUBSTANCES2",   description:"DEA Sch III-V controlled substances",           status:"Active" },
    { id:"s29c", name:"Dosage Form – IV Infusion / Bag",       code:"IT-PHAR-RXDRUGS-DOSAGEFORMIVINFUSIO",     description:"Rx premix IV bags",                             status:"Active" },
    { id:"s29d", name:"Dosage Form – Injectable",              code:"IT-PHAR-RXDRUGS-DOSAGEFORMINJECTABLE",    description:"Rx vials and ampoules",                         status:"Active" },
    { id:"s29e", name:"Dosage Form – Oral Solid",              code:"IT-PHAR-RXDRUGS-DOSAGEFORMORALSOLID",     description:"Rx tablets, capsules",                          status:"Active" },
    { id:"s29f", name:"Therapeutic Class – Antibiotics",       code:"IT-PHAR-RXDRUGS-THERAPEUTICCLASSANTI",   description:"Antimicrobials and antibiotics",                status:"Active" },
    { id:"s29g", name:"Therapeutic Class – Oncology (Hazardous)",code:"IT-PHAR-RXDRUGS-THERAPEUTICCLASSONCO", description:"Hazardous chemotherapy drugs",                  status:"Active" },
    { id:"s29h", name:"Therapeutic Class – Vaccines",          code:"IT-PHAR-RXDRUGS-THERAPEUTICCLASSVACC",   description:"Vaccines and immunizations",                    status:"Active" }]},
  { id:"c30", name:"Labels & Consumables",   code:"IT-STAT-LABELSCONSUMABLES",    desc:"Barcode labels and label consumables",    status:"Active", itemType:"stationery",   subcategories:[{ id:"s30a", name:"Barcode labels",          code:"IT-STAT-LABELSCONSUMABLES-BARCODELABELS",        description:"Thermal barcode labels and ribbons",            status:"Active" }]},
  { id:"c31", name:"Paper Products",         code:"IT-STAT-PAPERPRODUCTS",        desc:"Printing paper and forms",                status:"Active", itemType:"stationery",   subcategories:[{ id:"s31a", name:"Printing paper & forms", code:"IT-STAT-PAPERPRODUCTS-PRINTINGPAPERFORMS",       description:"A4/Letter paper, prescription forms",           status:"Active" }]},
  { id:"c32", name:"Printing Supplies",      code:"IT-STAT-PRINTINGSUPPLIES",     desc:"Toner, ink and printer consumables",      status:"Active", itemType:"stationery",   subcategories:[{ id:"s32a", name:"Toner/ink",               code:"IT-STAT-PRINTINGSUPPLIES-TONERINK",              description:"Laser toner cartridges and inkjet ink",         status:"Active" }]},
  { id:"c33", name:"Writing Supplies",       code:"IT-STAT-WRITINGSUPPLIES",      desc:"Pens, pencils and markers",               status:"Active", itemType:"stationery",   subcategories:[{ id:"s33a", name:"Pens/pencils/markers",   code:"IT-STAT-WRITINGSUPPLIES-PENSPENCILSMARKERS",    description:"Ballpoints, markers, highlighters",             status:"Active" }]},
];

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

// ─── Atoms ────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:600, whiteSpace:"nowrap", background:status==="Active"?"#DCFCE7":"#F1F5F9", color:status==="Active"?"#15803D":"#64748B", border:`1px solid ${status==="Active"?"#86EFAC":"#E2E8F0"}` }}>
    <span style={{ width:6, height:6, borderRadius:"50%", background:status==="Active"?"#22C55E":"#94A3B8", flexShrink:0 }}/>
    {status}
  </span>
);

const ActionBtn = ({ onClick, title, variant="edit", children }) => {
  const [hov, setHov] = useState(false);
  const S = { edit:{ border:"1px solid #FDE68A", bg:"#FFFBEB", bgH:"#FEF3C7" }, ban:{ border:"1px solid #FECACA", bg:"#FFF5F5", bgH:"#FEE2E2" }, sub:{ border:"1px solid #BFDBFE", bg:"#EFF6FF", bgH:"#DBEAFE" } };
  const s = S[variant]||S.edit;
  return (
    <button onClick={onClick} title={title} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ height:28, minWidth:28, padding:"0 8px", borderRadius:7, border:s.border, background:hov?s.bgH:s.bg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4, flexShrink:0, transition:"background 0.12s", fontSize:11.5, fontWeight:600, color:"#374151" }}>
      {children}
    </button>
  );
};

const CloseBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    title="Close"
    style={{
      width: 24,
      height: 24,
      borderRadius: 8,
      border: "1.5px solid #94A3B8",
      background: "#E2E8F0",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      fontSize: 16,
      fontWeight: 300,
      lineHeight: 1,
      color: "#1E293B",
      fontFamily: "system-ui, sans-serif",
      padding: 0,
      userSelect: "none",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "#CBD5E1"; e.currentTarget.style.borderColor = "#475569"; e.currentTarget.style.color = "#0F172A"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "#E2E8F0"; e.currentTarget.style.borderColor = "#94A3B8"; e.currentTarget.style.color = "#1E293B"; }}
  >
    ✕
  </button>
);



const FLabel = ({ text, required }) => (
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#64748B", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:5 }}>
    {text}{required && <span style={{ color:"#EF4444", marginLeft:2 }}>*</span>}
  </label>
);

const inputBase = { width:"100%", padding:"8px 11px", border:"1.5px solid #E2E8F0", borderRadius:8, fontSize:13, outline:"none", color:"#0F172A", background:"#FAFAFA", boxSizing:"border-box", fontFamily:"inherit" };

// ─── Add Item Type Modal ──────────────────────────────────────────────────────
const DEFAULT_PALETTE = COLOR_PALETTE[0];

function ItemTypeModal({ editItemType, allItemTypes, onClose, onSave }) {
  const isEdit = !!editItemType;

  const pickPalette = () => {
    const usedColors = (allItemTypes||[]).map(it=>it.color);
    return COLOR_PALETTE.find(p=>!usedColors.includes(p.color)) || COLOR_PALETTE[0];
  };

  const [label,  setLabel]  = useState(editItemType?.label || "");
  const [code,   setCode]   = useState(editItemType?.code  || "");
  const [desc,   setDesc]   = useState(editItemType?.desc  || "");
  const [errors, setErrors] = useState({});

  const handleLabel = (val) => {
    setLabel(val);
    if (!isEdit && !code) setCode(slugify(val).slice(0,20));
  };

  const submit = () => {
    const e={};
    if (!label.trim()) e.label="Name is required";
    if (!code.trim())  e.code="Code is required";
    if (Object.keys(e).length) { setErrors(e); return; }
    const palette = isEdit
      ? (COLOR_PALETTE.find(p=>p.color===editItemType.color)||DEFAULT_PALETTE)
      : pickPalette();
    onSave({
      ...palette,
      label:   label.trim(),
      code:    code.trim(),
      iconKey: "custom",
      desc:    desc.trim(),
    });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:420, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.22)" }}>

        {/* Header */}
        <div style={{ padding:"18px 22px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:12, flexShrink:0, justifyContent:"space-between", position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"#EFF6FF", border:"1.5px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {IC.tag("#2563EB")}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#0F172A" }}>{isEdit?"Edit Item Type":"New Item Type"}</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Appears as a tab in the category filter</div>
            </div>
          </div>
          <div style={{ position:"absolute", right:"18px", top:"50%", transform:"translateY(-50%)" }}>
            <CloseBtn onClick={onClose}/>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>

          {/* Name */}
          <div>
            <FLabel text="Item Type Name" required/>
            <input
              value={label}
              onChange={e=>{ handleLabel(e.target.value); setErrors(p=>({...p,label:null})); }}
              placeholder="e.g. Surgical Supplies"
              style={{ ...inputBase, borderColor:errors.label?"#FCA5A5":"#E2E8F0" }}
            />
            {errors.label&&<div style={{ color:"#EF4444", fontSize:11, marginTop:3 }}>{errors.label}</div>}
          </div>

          {/* Code */}
          <div>
            <FLabel text="Code" required/>
            <input
              value={code}
              onChange={e=>{ setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,20)); setErrors(p=>({...p,code:null})); }}
              placeholder="e.g. surgical"
              style={{ ...inputBase, fontFamily:"monospace", borderColor:errors.code?"#FCA5A5":"#E2E8F0" }}
              maxLength={20}
            />
            {errors.code&&<div style={{ color:"#EF4444", fontSize:11, marginTop:3 }}>{errors.code}</div>}
          </div>

          {/* Description */}
          <div>
            <FLabel text="Description"/>
            <textarea
              value={desc}
              onChange={e=>setDesc(e.target.value)}
              placeholder="Brief description of this item type…"
              rows={3}
              style={{ ...inputBase, resize:"vertical", lineHeight:1.5 }}
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding:"14px 22px", borderTop:"1px solid #F1F5F9", display:"flex", gap:8, justifyContent:"flex-end", flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:"8px 18px", border:"1.5px solid #E2E8F0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:"#374151" }}>
            Cancel
          </button>
          <button onClick={submit} style={{ padding:"8px 22px", border:"none", borderRadius:8, background:"#2563EB", cursor:"pointer", fontSize:13, fontWeight:700, color:"#fff" }}>
            {isEdit?"Save changes":"Create Item Type"}
          </button>
        </div>
      </div>
    </div>
  );
}


function CategoryModal({ mode, prefillParent, prefillItemType, editItem, categories, itemTypes, onClose, onSave }) {
  const isEdit  = mode.startsWith("edit");
  const initSub = mode==="add-subcategory"||mode==="edit-subcategory";
  const [kind,     setKind]     = useState(initSub?"sub":"cat");
  const [itemType, setItemType] = useState(editItem?.itemType||prefillItemType||itemTypes[0]?.key||"asset");
  const [parentId, setParentId] = useState(editItem?._catId||prefillParent||"");
  const [name,     setName]     = useState(editItem?.name||"");
  const [code,     setCode]     = useState(editItem?.code||"");
  const [desc,     setDesc]     = useState(editItem?.description||editItem?.desc||"");
  const [errors,   setErrors]   = useState({});

  const isSub = kind==="sub";
  const t     = itemTypes.find(x=>x.key===itemType)||itemTypes[0];
  const title = isEdit?(isSub?"Edit Subcategory":"Edit Category"):(isSub?"New Subcategory":"New Category");
  const parentOpts = categories.filter(c=>c.itemType===itemType);

  const handleName = (val) => {
    setName(val);
    if (!isEdit&&!code) {
      const w=val.trim().split(/\s+/);
      setCode(w.length>=2?(w[0][0]+w[1][0]).toUpperCase():val.slice(0,2).toUpperCase());
    }
  };

  const submit = () => {
    const e={};
    if (!name.trim()) e.name="Name is required";
    if (isSub&&!parentId) e.parent="Select a parent category";
    if (Object.keys(e).length){setErrors(e);return;}
    onSave({ kind, parentId, itemType, name:name.trim(), code:code.trim().toUpperCase(), description:desc.trim(), status:"Active" });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:520, maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.22)" }}>

        {/* Header */}
        <div style={{ padding:"18px 22px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:12, flexShrink:0, justifyContent:"space-between", position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:t?.bg||"#EFF6FF", border:`1.5px solid ${t?.border||"#BFDBFE"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {(IC[t?.iconKey||"custom"]||IC.custom)(t?.color||"#2563EB")}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#0F172A" }}>{title}</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{isSub?"Belongs under a parent category":"Top-level grouping for items"}</div>
            </div>
          </div>
          <div style={{ position:"absolute", right:"18px", top:"50%", transform:"translateY(-50%)" }}>
            <CloseBtn onClick={onClose}/>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"18px 22px", overflowY:"auto", display:"flex", flexDirection:"column", gap:16, flex:1 }}>

          {/* Type toggle */}
          <div>
            <FLabel text="Type"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[{v:"cat",l:"Category",d:"Top-level group"},{v:"sub",l:"Subcategory",d:"Under a category"}].map(o=>(
                <button key={o.v} type="button" onClick={()=>{setKind(o.v);setErrors({});setParentId("");}}
                  style={{ padding:"10px 14px", borderRadius:9, cursor:"pointer", textAlign:"left", background:kind===o.v?"#EFF6FF":"#F8FAFC", border:`2px solid ${kind===o.v?"#93C5FD":"#E2E8F0"}`, outline:"none" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:kind===o.v?"#1D4ED8":"#374151" }}>{o.l}</div>
                  <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{o.d}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Item Type chips */}
          <div>
            <FLabel text="Item Type" required/>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, maxHeight:220, overflowY:"auto", paddingRight:2 }}>
              {itemTypes.map(it=>{
                const active = itemType === it.key;
                return (
                  <button key={it.key} type="button"
                    onClick={()=>{setItemType(it.key);setParentId("");setErrors(p=>({...p,parent:null}));}}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"10px 4px 8px", borderRadius:9, cursor:"pointer", background:active?it.activeBg:"#F8FAFC", border:`2px solid ${active?it.border:"#E2E8F0"}`, outline:"none", transition:"all 0.12s", minHeight:78 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:active?it.bg:"#EFEFEF", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {(IC[it.iconKey||"custom"]||IC.custom)(active?it.color:"#9CA3AF")}
                    </div>
                    <span style={{ fontSize:9.5, fontWeight:700, color:active?it.color:"#6B7280", textAlign:"center", lineHeight:1.25, wordBreak:"break-word", padding:"0 2px" }}>{it.label}</span>
                    {active&&<div style={{ width:14, height:14, borderRadius:"50%", background:it.color, display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parent */}
          {isSub&&(
            <div>
              <FLabel text="Parent Category" required/>
              <select value={parentId} onChange={e=>{setParentId(e.target.value);setErrors(p=>({...p,parent:null}));}}
                style={{ ...inputBase, appearance:"none", borderColor:errors.parent?"#FCA5A5":"#E2E8F0", cursor:"pointer" }}>
                <option value="">Select parent category…</option>
                {parentOpts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.parent&&<div style={{ color:"#EF4444", fontSize:11, marginTop:3 }}>{errors.parent}</div>}
            </div>
          )}

          {/* Name & Code */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 140px", gap:12, alignItems:"start" }}>
            <div>
              <FLabel text="Name" required/>
              <input value={name} onChange={e=>{handleName(e.target.value);setErrors(p=>({...p,name:null}));}}
                placeholder="e.g. Rx Drugs (DSCSA Covered)"
                style={{ ...inputBase, borderColor:errors.name?"#FCA5A5":"#E2E8F0" }}/>
              {errors.name&&<div style={{ color:"#EF4444", fontSize:11, marginTop:3 }}>{errors.name}</div>}
            </div>
            <div>
              <FLabel text="Code"/>
              <input value={code} onChange={e=>setCode(e.target.value.toUpperCase().slice(0,40))}
                placeholder="IT-PHAR-RX" style={{ ...inputBase, fontFamily:"monospace" }} maxLength={40}/>
            </div>
          </div>

          {/* Description */}
          <div>
            <FLabel text="Description"/>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief description…" rows={2}
              style={{ ...inputBase, resize:"vertical", lineHeight:1.5 }}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 22px", borderTop:"1px solid #F1F5F9", display:"flex", gap:8, justifyContent:"flex-end", flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:"8px 18px", border:"1.5px solid #E2E8F0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:"#374151" }}>Cancel</button>
          <button onClick={submit}  style={{ padding:"8px 22px", border:"none", borderRadius:8, background:"#2563EB", cursor:"pointer", fontSize:13, fontWeight:700, color:"#fff" }}>{isEdit?"Save changes":"Create"}</button>
        </div>
      </div>
    </div>
  );
}

const Toast = ({ msg }) => (
  <div style={{ position:"fixed", top:20, right:24, zIndex:2000, background:"#F0FDF4", color:"#15803D", border:"1px solid #86EFAC", borderRadius:10, padding:"10px 16px", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
    {IC.check()} {msg}
  </div>
);

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({ cat, t, expanded, onToggle, onToggleStatus, onSetModal }) {
  const iconFn = IC[t?.iconKey||"custom"]||IC.custom;
  return (
    <div style={{ background:"#fff", borderRadius:12, border:`1.5px solid ${expanded?t.border:"#E5E7EB"}`, overflow:"hidden", transition:"border-color 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
      <div onClick={()=>onToggle(cat.id)}
        style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", background:expanded?t.bg:"#fff", transition:"background 0.15s", userSelect:"none" }}>
        <div style={{ width:36, height:36, borderRadius:9, background:expanded?t.activeBg:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1px solid ${expanded?t.border:"#E5E7EB"}` }}>
          {iconFn(expanded?t.color:"#9CA3AF")}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0F172A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{cat.name}</div>
          <div style={{ fontSize:11.5, color:"#94A3B8", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {cat.desc}&nbsp;·&nbsp;{cat.subcategories.length} subcategor{cat.subcategories.length===1?"y":"ies"}
          </div>
        </div>
        <code style={{ fontSize:10, padding:"3px 8px", borderRadius:6, background:"#EFF6FF", color:"#1D4ED8", border:"1px solid #BFDBFE", fontFamily:"monospace", flexShrink:0, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {cat.code}
        </code>
        <StatusBadge status={cat.status}/>
        <div style={{ display:"flex", gap:5, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          <ActionBtn variant="sub" onClick={()=>onSetModal({mode:"add-subcategory",prefillParent:cat.id,prefillItemType:cat.itemType})} title="Add subcategory">
            {IC.plus("#1D4ED8")}<span>Sub</span>
          </ActionBtn>
          <ActionBtn variant="edit" onClick={()=>onSetModal({mode:"edit-category",editItem:{...cat,_isSub:false}})} title="Edit category">
            {IC.edit()}
          </ActionBtn>
          <ActionBtn variant="ban" onClick={()=>onToggleStatus(cat.id,null)} title={cat.status==="Active"?"Deactivate":"Activate"}>
            {IC.ban()}
          </ActionBtn>
        </div>
        {IC.chevron(expanded)}
      </div>

      {expanded&&(
        <div style={{ borderTop:`1px solid ${t.border}` }}>
          <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,1.5fr) 90px 68px", gap:8, padding:"6px 14px 6px 58px", background:"#F9FAFB", borderBottom:"1px solid #F1F5F9" }}>
            {["Subcategory","Code","Description","Status","Actions"].map((h,i)=>(
              <div key={i} style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.07em", textTransform:"uppercase" }}>{h}</div>
            ))}
          </div>

          {cat.subcategories.length===0&&(
            <div style={{ padding:"14px 14px 14px 58px", fontSize:12.5, color:"#94A3B8" }}>
              No subcategories yet.{" "}
              <button onClick={()=>onSetModal({mode:"add-subcategory",prefillParent:cat.id,prefillItemType:cat.itemType})}
                style={{ border:"none", background:"none", color:"#2563EB", cursor:"pointer", fontSize:12.5, fontWeight:600, padding:0 }}>+ Add one</button>
            </div>
          )}

          {cat.subcategories.map((sub,idx)=>(
            <div key={sub.id}
              style={{ display:"grid", gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,1.5fr) 90px 68px", gap:8, alignItems:"center", padding:"9px 14px 9px 12px", background:"#fff", borderBottom:idx<cat.subcategories.length-1?"1px solid #F9FAFB":"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                <div style={{ width:22, height:22, borderRadius:5, background:t.activeBg, border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {iconFn(t.color)}
                </div>
                <span style={{ fontSize:12.5, fontWeight:600, color:"#0F172A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sub.name}</span>
              </div>
              <code style={{ fontSize:10, padding:"2px 6px", borderRadius:5, background:"#EFF6FF", color:"#1D4ED8", border:"1px solid #BFDBFE", fontFamily:"monospace", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"block" }}>{sub.code}</code>
              <span style={{ fontSize:12, color:"#64748B", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sub.description}</span>
              <StatusBadge status={sub.status}/>
              <div style={{ display:"flex", gap:4 }}>
                <ActionBtn variant="edit" onClick={()=>onSetModal({mode:"edit-subcategory",editItem:{...sub,_isSub:true,_catId:cat.id}})} title="Edit subcategory">{IC.edit()}</ActionBtn>
                <ActionBtn variant="ban"  onClick={()=>onToggleStatus(cat.id,sub.id)} title={sub.status==="Active"?"Deactivate":"Activate"}>{IC.ban()}</ActionBtn>
              </div>
            </div>
          ))}

          {cat.subcategories.length>0&&(
            <div style={{ padding:"8px 14px 10px 58px" }}>
              <button onClick={()=>onSetModal({mode:"add-subcategory",prefillParent:cat.id,prefillItemType:cat.itemType})}
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", border:"1.5px dashed #CBD5E1", borderRadius:7, background:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"#64748B" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563EB";e.currentTarget.style.color="#2563EB";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#CBD5E1";e.currentTarget.style.color="#64748B";}}>
                {IC.plus("#64748B")} Add subcategory
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Categories() {
  const [cats, setCats] = useState(()=>{
    try { const s=localStorage.getItem("tia_cats_v7");if(s){const p=JSON.parse(s);if(p?.length)return p;} }catch{}
    return initialCategories;
  });

  const [itemTypes, setItemTypes] = useState(()=>{
    try { const s=localStorage.getItem("tia_itypes_v1");if(s){const p=JSON.parse(s);if(p?.length)return p;} }catch{}
    return DEFAULT_ITEM_TYPES;
  });

  const [activeTab,      setActiveTab]      = useState("asset");
  const [modal,          setModal]          = useState(null);
  const [itemTypeModal,  setItemTypeModal]  = useState(null);
  const [toast,          setToast]          = useState(null);
  const [expanded,       setExpanded]       = useState({});

  const persistCats  = (next) => { try{localStorage.setItem("tia_cats_v7",JSON.stringify(next));window.dispatchEvent(new Event("storage"));window.dispatchEvent(new Event("categoriesUpdated"));}catch{} };
  const persistTypes = (next) => { try{localStorage.setItem("tia_itypes_v1",JSON.stringify(next));window.dispatchEvent(new Event("storage"));window.dispatchEvent(new Event("categoriesUpdated"));}catch{} };

  const updCats  = (fn) => setCats(prev=>{const next=fn(prev);persistCats(next);return next;});
  const showToast= (msg)=> {setToast(msg);setTimeout(()=>setToast(null),2800);};
  const togExp   = (id) => setExpanded(p=>({...p,[id]:!p[id]}));

  const toggleStatus = (catId,subId) => updCats(prev=>prev.map(cat=>{
    if(cat.id!==catId) return cat;
    if(subId) return{...cat,subcategories:cat.subcategories.map(s=>s.id===subId?{...s,status:s.status==="Active"?"Inactive":"Active"}:s)};
    return{...cat,status:cat.status==="Active"?"Inactive":"Active"};
  }));

  const handleSaveItemType = (data) => {
    const editing = itemTypeModal?.editItemType;
    if (editing) {
      const updated = itemTypes.map(it=>it.key===editing.key?{...it,...data,key:editing.key}:it);
      setItemTypes(updated);
      persistTypes(updated);
      showToast(`Item type "${data.label}" updated`);
    } else {
      const baseKey = data.code || slugify(data.label) || uid();
      const existingKeys = itemTypes.map(it => it.key);
      let key = baseKey;
      let suffix = 2;
      while (existingKeys.includes(key)) {
        key = `${baseKey}-${suffix++}`;
      }
      const newType = { ...data, key, iconKey: data.iconKey || "custom", isDefault: false };
      const updated = [...itemTypes, newType];
      setItemTypes(updated);
      persistTypes(updated);
      setActiveTab(key);
      showToast(`Item type "${data.label}" created`);
    }
    setItemTypeModal(null);
  };

  const handleSave = ({kind,parentId,itemType,name,code,description})=>{
    const editItem=modal?.editItem;
    if(editItem){
      if(editItem._isSub){
        updCats(prev=>prev.map(c=>c.id!==editItem._catId?c:{...c,subcategories:c.subcategories.map(s=>s.id===editItem.id?{...s,name,code,description}:s)}));
      }else{
        updCats(prev=>prev.map(c=>c.id===editItem.id?{...c,name,code,desc:description,itemType}:c));
      }
      showToast(`"${name}" updated`);
    }else if(kind==="cat"){
      updCats(prev=>[...prev,{id:uid(),name,code,desc:description,status:"Active",itemType,subcategories:[]}]);
      setActiveTab(itemType);
      showToast(`Category "${name}" created`);
    }else{
      updCats(prev=>prev.map(c=>c.id===parentId?{...c,subcategories:[...c.subcategories,{id:uid(),name,code,description,status:"Active"}]}:c));
      setExpanded(p=>({...p,[parentId]:true}));
      showToast(`Subcategory "${name}" created`);
    }
    setModal(null);
  };

  const typeCats  = cats.filter(c=>c.itemType===activeTab);
  const t         = itemTypes.find(x=>x.key===activeTab);
  const totalSubs = cats.reduce((a,c)=>a+c.subcategories.length,0);

  return (
    <div style={{ fontFamily:"'Inter','DM Sans',system-ui,sans-serif" }}>
  <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;}
  *:focus{outline:none!important;}
  *:focus-visible{outline:none!important;box-shadow:none!important;}
  button:focus,button:focus-visible,button:active{outline:none!important;box-shadow:none!important;}
  input:focus,select:focus,textarea:focus{border-color:#93C5FD!important;box-shadow:0 0 0 3px rgba(59,130,246,0.12);}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:99px;}
`}</style>

      {toast&&<Toast msg={toast}/>}

      {/* Item Type Modal */}
      {itemTypeModal&&(
        <ItemTypeModal
          editItemType={itemTypeModal?.editItemType||null}
          onClose={()=>setItemTypeModal(null)}
          onSave={handleSaveItemType}
        />
      )}

      {/* Category / Subcategory Modal */}
      {modal&&(
        <CategoryModal
          mode={modal.mode}
          prefillParent={modal.prefillParent||""}
          prefillItemType={modal.prefillItemType||activeTab}
          editItem={modal.editItem||null}
          categories={cats}
          itemTypes={itemTypes}
          onClose={()=>setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* ── Page Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#0F172A", margin:0, letterSpacing:-0.3 }}>Categories & Subcategories</h1>

         
        </div>

        {/* ── Buttons: Add Item Type → Add Category → Add Subcategory ── */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
          <button onClick={()=>setItemTypeModal({editItemType:null})}
            style={{ display:"flex", alignItems:"center", gap:6, height:36, padding:"0 14px", border:"none", borderRadius:10, background:"#2563EB", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            {IC.plus()} Add Item Type
          </button>
          <button onClick={()=>setModal({mode:"add-category",prefillParent:"",prefillItemType:activeTab})}
            style={{ display:"flex", alignItems:"center", gap:6, height:36, padding:"0 14px", border:"1.5px solid #2563EB", borderRadius:10, background:"#fff", color:"#2563EB", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            {IC.plus("#2563EB")} Add Category
          </button>
          <button onClick={()=>setModal({mode:"add-subcategory",prefillParent:"",prefillItemType:activeTab})}
            style={{ display:"flex", alignItems:"center", gap:6, height:36, padding:"0 14px", border:"1.5px solid #64748B", borderRadius:10, background:"#fff", color:"#374151", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            {IC.plus("#374151")} Add Subcategory
          </button>
        </div>
      </div>

      {/* ── Item Type filter tabs ── */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #F1F5F9", marginBottom:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ padding:"10px 16px 6px", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:10.5, fontWeight:700, color:"#CBD5E1", letterSpacing:"0.1em", textTransform:"uppercase" }}>Filter by item type</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, padding:"10px 12px 12px" }}>
          {itemTypes.map(it=>{
            const tc=cats.filter(c=>c.itemType===it.key);
            const ts=tc.reduce((a,c)=>a+c.subcategories.length,0);
            const on=activeTab===it.key;
            const iconFn=IC[it.iconKey||"custom"]||IC.custom;
            return(
              <div key={it.key} style={{ position:"relative" }}>
                <button type="button" onClick={()=>setActiveTab(it.key)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:`1.5px solid ${on?it.border:"#F1F5F9"}`, background:on?it.bg:"#FAFAFA", cursor:"pointer", textAlign:"left", transition:"all 0.14s", outline:"none", boxShadow:on?`0 0 0 1px ${it.border}`:"none" }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:on?it.activeBg:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1px solid ${on?it.border:"#E5E7EB"}` }}>
                    {iconFn(on?it.color:"#9CA3AF")}
                  </div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:on?it.color:"#374151", lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.label}</div>
                    <div style={{ fontSize:11, color:on?it.color:"#9CA3AF", marginTop:2 }}>{tc.length} cat · {ts} sub</div>
                  </div>
                  {!it.isDefault&&(
                    <button
                      onClick={e=>{e.stopPropagation();setItemTypeModal({editItemType:it});}}
                      title="Edit item type"
                      style={{ width:20, height:20, borderRadius:5, border:"1px solid #FDE68A", background:"#FFFBEB", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  )}
                </button>
              </div>
            );
          })}

          {/* "+ Add Item Type" inline tile */}
          <button type="button" onClick={()=>setItemTypeModal({editItemType:null})}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 12px", borderRadius:10, border:"1.5px dashed #CBD5E1", background:"#FAFAFA", cursor:"pointer", textAlign:"center", outline:"none", minHeight:58, color:"#64748B", fontSize:12, fontWeight:600 }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563EB";e.currentTarget.style.color="#2563EB";e.currentTarget.style.background="#EFF6FF";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#CBD5E1";e.currentTarget.style.color="#64748B";e.currentTarget.style.background="#FAFAFA";}}>
            {IC.plus("#94A3B8")}
            <span>Add Item Type</span>
          </button>
        </div>
      </div>

      {/* ── Section bar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:t?.activeBg||"#F3F4F6", border:`1px solid ${t?.border||"#E5E7EB"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {(IC[t?.iconKey||"custom"]||IC.custom)(t?.color||"#374151")}
          </div>
          <span style={{ fontSize:13.5, fontWeight:700, color:"#0F172A" }}>{t?.label||activeTab}</span>
        </div>
        <button onClick={()=>setExpanded(Object.fromEntries(typeCats.map(c=>[c.id,true])))}
          style={{ fontSize:12, color:"#64748B", background:"none", border:"1px solid #E2E8F0", borderRadius:7, cursor:"pointer", padding:"4px 10px" }}>
          Expand all
        </button>
      </div>

      {/* ── Category list ── */}
      {typeCats.length===0?(
        <div style={{ textAlign:"center", padding:"60px 20px", background:"#fff", borderRadius:14, border:"1.5px dashed #E2E8F0" }}>
          <div style={{ width:52, height:52, borderRadius:14, background:t?.bg||"#F8FAFC", border:`1px solid ${t?.border||"#E2E8F0"}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
            {(IC[t?.iconKey||"custom"]||IC.custom)(t?.color||"#94A3B8")}
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:"#374151", marginBottom:6 }}>No {t?.label} categories yet</div>
          <div style={{ fontSize:13, color:"#94A3B8", marginBottom:16 }}>Create your first category to get started.</div>
          <button onClick={()=>setModal({mode:"add-category",prefillItemType:activeTab})}
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", border:"none", borderRadius:9, background:"#2563EB", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            {IC.plus()} Add Category
          </button>
        </div>
      ):(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {typeCats.map(cat=>(
            <CategoryCard key={cat.id} cat={cat} t={t} expanded={!!expanded[cat.id]}
              onToggle={togExp} onToggleStatus={toggleStatus} onSetModal={setModal}/>
          ))}
        </div>
      )}
    </div>
  );
}

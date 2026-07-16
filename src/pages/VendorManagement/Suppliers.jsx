import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Button,
  useMediaQuery,
  useTheme,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Tooltip,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import DownloadIcon from "@mui/icons-material/Download";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SupplierModal from './SupplierModal'; // Import the separate modal
import { getSuppliers, saveSuppliers, initializeSuppliers } from '../../utils/supplierUtils';

// Add this color object right after your imports or at the top of the component
const C = {
  bg:            "#F8FAFC",
  border:        "#E5E7EB",
  textPrimary:   "#111827",
  textSecondary: "#6B7280",
  primary:       "#1976D2",
};

const Suppliers = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isSmallTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLargeTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Initialize suppliers from localStorage on component mount
  useEffect(() => {
    initializeSuppliers(); // Will use DEFAULT_SUPPLIERS from utils
    const loadedSuppliers = getSuppliers();
    setSuppliers(loadedSuppliers);
  }, []);

  const stats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.status === "Active").length,
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setModalOpen(true);
  };

  const handleToggleStatus = (id) => {
    const updatedSuppliers = suppliers.map(s => 
      s.id === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s
    );
    setSuppliers(updatedSuppliers);
    saveSuppliers(updatedSuppliers);
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setModalOpen(true);
  };

  const handleSaveSupplier = (supplierData) => {
    if (selectedSupplier) {
      const updatedSuppliers = suppliers.map(s => 
        s.id === selectedSupplier.id ? { ...s, ...supplierData, manufacturers: supplierData.manufacturers || [] } : s
      );
      setSuppliers(updatedSuppliers);
      saveSuppliers(updatedSuppliers);
    } else {
      const newSupplier = {
        id: `s${suppliers.length + 1}`,
        ...supplierData,
        manufacturers: supplierData.manufacturers || [],
      };
      const updatedSuppliers = [...suppliers, newSupplier];
      setSuppliers(updatedSuppliers);
      saveSuppliers(updatedSuppliers);
    }
    setModalOpen(false);
    setSelectedSupplier(null);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDownloadDocs = (supplier) => {
    try {
      const all = JSON.parse(localStorage.getItem("tia_vendor_documents") || "[]");
      const docs = all.filter((d) => d.vendorId === supplier.id && d.vendorType === "supplier");
      if (!docs.length) { alert("No documents uploaded for this supplier."); return; }
      docs.forEach((doc) => {
        if (!doc.fileData) return;
        const a = document.createElement("a");
        a.href = doc.fileData;
        a.download = doc.fileName || "document";
        a.click();
      });
    } catch { alert("Failed to download documents."); }
  };

  const handleAddManufacturer = () => {
    setModalOpen(false);
  };

  // Mobile card view
  const MobileSupplierCard = ({ supplier }) => {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 1.5,
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          backgroundColor: '#ffffff',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
              {supplier.company}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#64748b', mt: 0.25 }}>
              {supplier.location}
            </Typography>
          </Box>
          <Chip 
            label={supplier.status} 
            size="small" 
            sx={{ 
              backgroundColor: supplier.status === "Active" ? '#e8f5e9' : '#ffebee',
              color: supplier.status === "Active" ? '#2e7d32' : '#d32f2f',
              fontSize: '0.65rem',
              height: '22px'
            }} 
          />
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
              CONTACT
            </Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{supplier.contactName}</Typography>
            <Typography sx={{ fontSize: 10, color: '#64748b' }}>{supplier.contactEmail}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
              PHONE
            </Typography>
            <Typography sx={{ fontSize: 11 }}>{supplier.phone}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
              GPO
            </Typography>
            <Chip 
              label={supplier.gpo} 
              size="small" 
              sx={{ 
                backgroundColor: '#e3f2fd', 
                color: '#1976d2', 
                fontSize: '10px',
                height: '22px'
              }} 
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
              TERMS
            </Typography>
            <Typography sx={{ fontSize: 11 }}>{supplier.terms} / {supplier.leadTime}</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 10, color: '#64748b', fontWeight: 600, mb: 0.5 }}>
            CONTRACT #
          </Typography>
          <Typography sx={{ fontSize: 11 }}>{supplier.contractNumber}</Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 10, color: '#64748b', fontWeight: 600, mb: 0.5 }}>
            MANUFACTURERS
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {supplier.manufacturers.map(man => (
              <Chip 
                key={man} 
                label={man} 
                size="small" 
                sx={{ 
                  backgroundColor: '#e0f2fe', 
                  color: '#0284c7', 
                  fontSize: '10px',
                  height: '22px'
                }} 
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(supplier)} sx={{ color: '#f59e0b', p: 0.5 }}>
              <EditIcon sx={{ fontSize: '0.875rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={supplier.status === "Active" ? "Deactivate" : "Activate"}>
            <IconButton size="small" onClick={() => handleToggleStatus(supplier.id)} sx={{ color: supplier.status === "Active" ? '#ef4444' : '#10b981', p: 0.5 }}>
              <DeleteIcon sx={{ fontSize: '0.875rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    );
  };

  // Get table columns based on screen size
  const getColumns = () => {
    if (isSmallTablet) {
      return [
        { id: 'company', label: 'Company', minWidth: 100, render: (row) => (
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{row.company}</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }}>{row.location}</Typography>
          </Box>
        )},
        { id: 'contact', label: 'Contact', minWidth: 80, render: (row) => (
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{row.contactName}</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }}>{row.contactEmail}</Typography>
          </Box>
        )},
        { id: 'gpo', label: 'GPO', minWidth: 60, render: (row) => (
          <Chip label={row.gpo} size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontSize: '0.6rem', height: '20px' }} />
        )},
        { id: 'status', label: 'Status', minWidth: 60, render: (row) => (
          <Chip label={row.status} size="small" sx={{ 
            backgroundColor: row.status === "Active" ? '#e8f5e9' : '#ffebee',
            color: row.status === "Active" ? '#2e7d32' : '#d32f2f',
            fontSize: '0.6rem', height: '20px' 
          }} />
        )},
        {
          id: 'actions',
          label: 'Actions',
          minWidth: 60,
          align: 'right',
          render: (row) => (
            <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
              <Tooltip title="Download Documents">
                <IconButton size="small" onClick={() => handleDownloadDocs(row)} sx={{ color: '#2563eb', p: 0.25 }}>
                  <DownloadIcon sx={{ fontSize: '0.7rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleEdit(row)} sx={{ color: '#f59e0b', p: 0.25 }}>
                  <EditIcon sx={{ fontSize: '0.7rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={row.status === "Active" ? "Deactivate" : "Activate"}>
                <IconButton size="small" onClick={() => handleToggleStatus(row.id)} sx={{ color: row.status === "Active" ? '#ef4444' : '#10b981', p: 0.25 }}>
                  <DeleteIcon sx={{ fontSize: '0.7rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
          ),
        },
      ];
    } else if (isLargeTablet) {
      return [
        { id: 'company', label: 'Company', minWidth: 120, render: (row) => (
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{row.company}</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }}>{row.location}</Typography>
          </Box>
        )},
        { id: 'contact', label: 'Contact', minWidth: 100, render: (row) => (
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{row.contactName}</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }}>{row.contactEmail}</Typography>
          </Box>
        )},
        { id: 'phone', label: 'Phone', minWidth: 80, render: (row) => (
          <Typography sx={{ fontSize: '0.7rem' }}>{row.phone}</Typography>
        )},
        { id: 'gpo', label: 'GPO', minWidth: 70, render: (row) => (
          <Chip label={row.gpo} size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontSize: '0.65rem', height: '22px' }} />
        )},
        { id: 'terms', label: 'Terms', minWidth: 70, render: (row) => (
          <Typography sx={{ fontSize: '0.7rem' }}>{row.terms} / {row.leadTime}</Typography>
        )},
        { id: 'status', label: 'Status', minWidth: 70, render: (row) => (
          <Chip label={row.status} size="small" sx={{ 
            backgroundColor: row.status === "Active" ? '#e8f5e9' : '#ffebee',
            color: row.status === "Active" ? '#2e7d32' : '#d32f2f',
            fontSize: '0.65rem', height: '22px' 
          }} />
        )},
        {
          id: 'actions',
          label: 'Actions',
          minWidth: 70,
          align: 'right',
          render: (row) => (
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
              <Tooltip title="Download Documents">
                <IconButton size="small" onClick={() => handleDownloadDocs(row)} sx={{ color: '#2563eb' }}>
                  <DownloadIcon sx={{ fontSize: '0.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleEdit(row)} sx={{ color: '#f59e0b' }}>
                  <EditIcon sx={{ fontSize: '0.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={row.status === "Active" ? "Deactivate" : "Activate"}>
                <IconButton size="small" onClick={() => handleToggleStatus(row.id)} sx={{ color: row.status === "Active" ? '#ef4444' : '#10b981' }}>
                  <DeleteIcon sx={{ fontSize: '0.75rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
          ),
        },
      ];
    } else {
      return [
        { id: 'company', label: 'Company', minWidth: 150, render: (row) => (
          <Box>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{row.company}</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>{row.location}</Typography>
          </Box>
        )},
        { id: 'contact', label: 'Contact', minWidth: 120, render: (row) => (
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{row.contactName}</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>{row.contactEmail}</Typography>
          </Box>
        )},
        { id: 'phone', label: 'Phone', minWidth: 100, render: (row) => (
          <Typography sx={{ fontSize: '0.75rem' }}>{row.phone}</Typography>
        )},
        { id: 'gpo', label: 'GPO', minWidth: 80, render: (row) => (
          <Chip label={row.gpo} size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontSize: '0.7rem' }} />
        )},
        { id: 'contract', label: 'Contract #', minWidth: 100, render: (row) => (
          <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>{row.contractNumber}</Typography>
        )},
        { id: 'terms', label: 'Terms', minWidth: 80, render: (row) => (
          <Typography sx={{ fontSize: '0.7rem' }}>{row.terms}</Typography>
        )},
        { id: 'lead', label: 'Lead', minWidth: 60, render: (row) => (
          <Typography sx={{ fontSize: '0.7rem' }}>{row.leadTime}</Typography>
        )},
        { id: 'manufacturers', label: 'Manufacturers', minWidth: 120, render: (row) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(row.manufacturers || []).map(man => (
              <Chip key={man} label={man} size="small" sx={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '0.6rem', height: '20px' }} />
            ))}
          </Box>
        )},
        { id: 'instruments', label: 'Instruments / Devices', minWidth: 120, render: (row) => (
          <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>—</Typography>
        )},
        { id: 'status', label: 'Status', minWidth: 80, render: (row) => (
          <Chip label={row.status} size="small" sx={{ 
            backgroundColor: row.status === "Active" ? '#e8f5e9' : '#ffebee',
            color: row.status === "Active" ? '#2e7d32' : '#d32f2f',
            fontSize: '0.7rem' 
          }} />
        )},
        {
          id: 'actions',
          label: 'Actions',
          minWidth: 80,
          align: 'right',
          render: (row) => (
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
              <Tooltip title="Download Documents">
                <IconButton size="small" onClick={() => handleDownloadDocs(row)} sx={{ color: '#2563eb' }}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleEdit(row)} sx={{ color: '#f59e0b' }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={row.status === "Active" ? "Deactivate" : "Activate"}>
                <IconButton size="small" onClick={() => handleToggleStatus(row.id)} sx={{ color: row.status === "Active" ? '#ef4444' : '#10b981' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ),
        },
      ];
    }
  };

  return (
    <Box >
      {/* Page Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 },
        mb: { xs: 2, sm: 3 },
      }}>
       

        <Box>
  <Typography
    sx={{
      fontWeight: 700,
      fontSize: 22,
      color: C.textPrimary,
      letterSpacing: -0.3,
    }}
  >
    Suppliers
  </Typography>

  <Typography
    sx={{
      fontSize: 13,
      color: C.textSecondary,
      mt: 0.3,
    }}
  >
    Approved vendor master — {stats.activeSuppliers} active
  </Typography>
</Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleAddSupplier}
            sx={{
           display: 'inline-flex',
           alignItems: 'center',
           justifyContent: 'center',
           gap: '6px',
           background: '#2563eb',
           color: '#fff',
           borderRadius: '12px',        
           px: '15px',                  
           py: '8px',                 
          fontSize: '12px',            
          fontWeight: 500,             
          textTransform: 'none',
          lineHeight: 1,
          boxShadow: '0 1px 4px rgba(37,99,235,0.25)',
          '&:hover': {
          background: '#1d4ed8',
          boxShadow: '0 2px 6px rgba(37,99,235,0.3)', 
   },
 }}
        >
          Add Supplier
        </Button>
      </Box>

   
        <CardContent sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } },
        }}>
          {isMobile ? (
            <Box>
              {suppliers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((supplier) => (
                  <MobileSupplierCard key={supplier.id} supplier={supplier} />
                ))}
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 2,
                px: 1,
              }}>
                <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                  {suppliers.length} total
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                  >
                    Prev
                  </Button>
                  <Typography sx={{ fontSize: 13 }}>
                    {page + 1} / {Math.ceil(suppliers.length / rowsPerPage)}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={page >= Math.ceil(suppliers.length / rowsPerPage) - 1}
                    onClick={() => setPage(page + 1)}
                    sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            <>
              <TableContainer 
                component={Paper} 
                elevation={0}
                sx={{ 
                  width: '100%',
                  overflowX: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  '&::-webkit-scrollbar': {
                    height: '6px',
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f5f9',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#cbd5e1',
                    borderRadius: '3px',
                    '&:hover': {
                      background: '#94a3b8',
                    },
                  },
                }}
              >
                <Table 
                  size="small"
                  sx={{ 
                    tableLayout: 'auto',
                    width: '100%',
                    minWidth: isSmallTablet ? 500 : (isLargeTablet ? 650 : 1000),
                  }}
                >
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      {getColumns().map((column) => (
                        <TableCell
                          key={column.id}
                          align={column.align || 'left'}
                          sx={{ 
                            minWidth: column.minWidth,
                            fontWeight: 600,
                            backgroundColor: '#f8fafc',
                            whiteSpace: 'nowrap',
                            fontSize: '0.8rem',
                            py: 1.5,
                            px: isTablet ? 1.5 : 2,
                            color: '#475569',
                          }}
                        >
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suppliers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <TableRow hover key={row.id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                          {getColumns().map((column) => {
                            const value = column.render(row);
                            return (
                              <TableCell 
                                key={column.id} 
                                align={column.align || 'left'}
                                sx={{ 
                                  whiteSpace: 'nowrap',
                                  py: 1.5,
                                  px: isTablet ? 1.5 : 2,
                                  borderBottom: '1px solid #f1f5f9',
                                }}
                              >
                                {value}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
             
            </>
          )}
        </CardContent>
    

      {/* Supplier Modal - Imported from separate file */}
      <SupplierModal
        open={modalOpen}
        onClose={() => {
            setModalOpen(false);
            setSelectedSupplier(null);
        }}
        onSave={handleSaveSupplier}
        supplier={selectedSupplier}
        onAddManufacturer={handleAddManufacturer}
      />
    </Box>
  );
};

export default Suppliers;
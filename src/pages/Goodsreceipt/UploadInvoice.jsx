import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import dayjs from 'dayjs';


const labelSx = {
  fontSize: 11, fontWeight: 700, color: '#6b7280',
  letterSpacing: '0.06em', textTransform: 'uppercase',
  mb: 0.5, display: 'block',
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    fontSize: 13, borderRadius: '6px', bgcolor: '#fff',
    '& fieldset': { borderColor: '#d1d5db' },
    '&:hover fieldset': { borderColor: '#9ca3af' },
    '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '1.5px' },
  },
  '& .MuiInputBase-input': { py: '8px', px: '12px' },
  '& .MuiInputBase-input::placeholder': { color: '#9ca3af', opacity: 1 },
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
  '& input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
};

const disabledInputSx = {
  ...inputSx,
  '& .MuiOutlinedInput-root': {
    ...inputSx['& .MuiOutlinedInput-root'],
    bgcolor: '#f9fafb',
  },
};

const selectSx = {
  fontSize: 13, borderRadius: '6px',
  '& fieldset': { borderColor: '#d1d5db' },
  '&:hover fieldset': { borderColor: '#9ca3af' },
  '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '1.5px' },
  '& .MuiSelect-select': { py: '8px', px: '12px' },
};

const btnBase = {
  fontSize: 13, fontWeight: 600, textTransform: 'none', borderRadius: '8px',
  px: '20px', py: '9px', outline: 'none',
  '&:focus': { outline: 'none' },
};

const sectionTitleSx = {
  fontSize: 12, fontWeight: 700, color: '#2563eb',
  letterSpacing: '0.05em', textTransform: 'uppercase', mb: '8px',
};

// â”€â”€ Date field (matches GRN DateField) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DateField({ value, onChange }) {
  const ref = useRef(null);
  const openPicker = () => {
    try { ref.current?.showPicker(); } catch { ref.current?.click(); }
  };
  return (
    <Box
      onClick={openPicker}
      sx={{
        display: 'flex', alignItems: 'center', border: '1px solid #d1d5db',
        borderRadius: '6px', bgcolor: '#fff', px: 1, height: 32,
        cursor: 'pointer', width: '100%',
        '&:hover': { borderColor: '#9ca3af' },
        '&:focus-within': { borderColor: '#2563eb', outline: '2px solid #dbeafe', outlineOffset: '-1px' },
        transition: 'border-color 0.15s', boxSizing: 'border-box',
      }}
    >
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontSize: 12, color: value ? '#111827' : '#9ca3af',
          flex: 1, cursor: 'pointer', minWidth: 0, WebkitAppearance: 'none',
          width: '100%',
        }}
      />
      <CalendarTodayOutlinedIcon
        sx={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}
        onClick={(e) => { e.stopPropagation(); openPicker(); }}
      />
    </Box>
  );
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const UploadInvoice = ({ open, onClose, onSave, poData, updatePdfOnly = false }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: dayjs().format('YYYY-MM-DD'),
    paymentTerms: 'Net-30',
    paymentDueDate: '',
    invoiceAmount: '',
    tax: '',
    discount: '',
    grandTotal: 0,
    invoiceStatus: 'Pending',
    verifiedBy: '',
    notes: '',
    file: null,
  });

  const [ocrStatus, setOcrStatus] = useState('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [variance, setVariance] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && poData) {
      setFormData({
        invoiceNumber: '', invoiceDate: dayjs().format('YYYY-MM-DD'),
        paymentTerms: 'Net-30', paymentDueDate: '',
        invoiceAmount: '', tax: '', discount: '', grandTotal: 0,
        invoiceStatus: 'Pending', verifiedBy: '', notes: '', file: null,
      });
      setUploadedFile(null);
      setOcrStatus('idle');
      setVariance(null);
    }
  }, [open, poData]);

  useEffect(() => {
    const amount = parseFloat(formData.invoiceAmount) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const grandTotal = amount + tax - discount;
    setFormData(prev => ({ ...prev, grandTotal }));

    if (poData && poData.total && grandTotal > 0) {
      const difference = Math.abs(grandTotal - poData.total);
      if (difference > 0.01) {
        setVariance({ difference, poTotal: poData.total, invoiceTotal: grandTotal });
      } else {
        setVariance(null);
      }
    }
  }, [formData.invoiceAmount, formData.tax, formData.discount, poData]);

  const setField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleChange = (field) => (event) => setField(field, event.target.value);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setField('file', file);
      setOcrStatus('scanning');
      setOcrProgress(0);

      const steps = [
        { progress: 25 }, { progress: 50 }, { progress: 75 }, { progress: 100 },
      ];

      steps.forEach((step, index) => {
        setTimeout(() => {
          setOcrProgress(step.progress);
          if (step.progress === 100) {
            setFormData(prev => ({
              ...prev,
              invoiceNumber: 'INV-MCK-2026-00482',
              invoiceDate: dayjs().format('YYYY-MM-DD'),
              invoiceAmount: '850.00',
              tax: '0.00',
              discount: '0.00',
            }));
            setOcrStatus('done');
          }
        }, (index + 1) * 1500);
      });
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
      handleFileUpload({ target: { files: [file] } });
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setField('file', null);
    setOcrStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (updatePdfOnly) {
      if (!uploadedFile) { alert('Please select a PDF file to upload'); return; }
      onSave({ poNumber: poData?.id, file: uploadedFile, fileSize: uploadedFile ? `${Math.round(uploadedFile.size / 1024)} KB` : '', pdfOnly: true });
      onClose();
      return;
    }
    if (!formData.invoiceNumber) { alert('Please enter supplier invoice number'); return; }
    if (!formData.invoiceAmount) { alert('Please enter invoice amount'); return; }
    onSave({ ...formData, poNumber: poData?.id, poTotal: poData?.total });
    onClose();
  };

  const paymentTerms = ['Net-30', 'Net-45', 'Net-60', 'Net-15', 'Immediate / COD'];
  const invoiceStatuses = [
    { value: 'Pending', label: 'Pending Awaiting Review' },
    { value: 'Verified', label: 'Verified Amounts Match' },
    { value: 'Disputed', label: 'Disputed  Discrepancy Found' },
    { value: 'Paid', label: 'Paid  Payment Processed' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          maxHeight: '85vh',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* â”€â”€ Header â”€â”€ */}
      <Box sx={{
        px: '20px', pt: '16px', pb: '12px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        borderBottom: '1px solid #f3f4f6', flexShrink: 0, bgcolor: '#fff',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: '10px', background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ReceiptOutlinedIcon sx={{ fontSize: 18, color: '#2563eb' }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
              {updatePdfOnly ? 'Update Invoice PDF' : 'Upload Invoice'}
            </Typography>
            {poData && (
              <Typography sx={{ fontSize: 12, color: '#9ca3af', mt: '1px' }}>
                {poData.id} {poData.supplier}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disableRipple
          sx={{
            color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: '8px',
            width: 30, height: 30, outline: 'none',
            '&:hover': { background: '#f3f4f6', color: '#374151' },
            '&:focus': { outline: 'none' },
          }}
        >
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      {/* â”€â”€ Scrollable body â”€â”€ */}
      <DialogContent sx={{
        px: '20px', py: '14px', overflowY: 'auto', flex: 1,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: '#d1d5db', borderRadius: 4 },
        '&::-webkit-scrollbar-thumb:hover': { background: '#a1a1aa' },
        scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent',
      }}>

        {!updatePdfOnly && poData && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            gap: '8px', mb: '14px',
            p: '14px', borderRadius: '10px',
            border: '1px solid #e5e7eb', bgcolor: '#f9fafb',
          }}>
            <Box>
              <Typography sx={labelSx}>PO Number</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>{poData.id}</Typography>
            </Box>
            <Box>
              <Typography sx={labelSx}>Supplier</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{poData.supplier}</Typography>
            </Box>
            <Box>
              <Typography sx={labelSx}>PO Total</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                ${poData.total?.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography sx={labelSx}>PO Status</Typography>
              <Chip
                label={poData.status}
                size="small"
                sx={{
                  backgroundColor: poData.status === 'Approved' ? '#e0f2fe' : '#f3f4f6',
                  color: poData.status === 'Approved' ? '#0f766e' : '#6b7280',
                  fontSize: 11, height: 22,
                }}
              />
            </Box>
          </Box>
        )}

        {/* â”€â”€ Invoice File â”€â”€ */}
        <Box sx={{ mb: '14px' }}>
          <Typography sx={sectionTitleSx}>Invoice File</Typography>

          {ocrStatus === 'idle' && !uploadedFile && (
            <Box
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              sx={{
                border: '1.5px dashed #bfdbfe', borderRadius: '10px',
                p: '24px', textAlign: 'center', cursor: 'pointer',
                bgcolor: '#f8faff', transition: 'all 0.2s',
                '&:hover': { borderColor: '#93c5fd', bgcolor: '#eff6ff' },
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                style={{ display: 'none' }}
              />
              <CloudUploadIcon sx={{ fontSize: 30, color: '#93c5fd', mb: 1 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
                Click to browse or drag & drop
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#9ca3af', mt: 0.5 }}>
                PDF, PNG, JPG 
              </Typography>
            </Box>
          )}

          {ocrStatus === 'scanning' && (
            <Box sx={{
              p: '20px', textAlign: 'center', borderRadius: '10px',
              border: '1px solid #e5e7eb', bgcolor: '#f9fafb',
            }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827', mb: 0.5 }}>
                ðŸ” Reading invoice with AI OCRâ€¦
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#9ca3af', mb: 2 }}>
                Extracting invoice number, amounts, dates and supplier details
              </Typography>
              <LinearProgress
                variant="determinate"
                value={ocrProgress}
                sx={{
                  height: 6, borderRadius: 3,
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#2563eb' },
                }}
              />
              <Typography sx={{ fontSize: 11, color: '#9ca3af', mt: 1 }}>
                {ocrProgress}% complete
              </Typography>
            </Box>
          )}

          {ocrStatus === 'done' && uploadedFile && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: '8px',
              p: '14px', borderRadius: '10px',
              border: '1px solid #bbf7d0', bgcolor: '#f0fdf4',
            }}>
              <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 18 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>
                  Invoice read successfully
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#9ca3af', mt: '2px' }}>
                  Extracted: Invoice #, Amount, Date
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={clearFile}
                disableRipple
                sx={{ fontSize: 11, color: '#6b7280', textTransform: 'none', '&:focus': { outline: 'none' } }}
              >
                Change file
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: '14px' }} />

        {/* â”€â”€ Invoice Details â”€â”€ */}
        {!updatePdfOnly && (
        <Box sx={{ mb: '14px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: '8px' }}>
            <Typography sx={sectionTitleSx} style={{ marginBottom: 0 }}>Invoice Details</Typography>
            {ocrStatus === 'done' && (
              <Chip
                label="âœ¨ AI filled"
                size="small"
                sx={{ backgroundColor: '#e0f2fe', color: '#0f766e', fontSize: 11, height: 20 }}
              />
            )}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', mb: '12px' }}>
            <Box>
              <Typography sx={labelSx}>Supplier Invoice # <span style={{ color: '#ef4444' }}>*</span></Typography>
              <TextField
                fullWidth size="small"
                value={formData.invoiceNumber}
                onChange={handleChange('invoiceNumber')}
                sx={inputSx}
              />
            </Box>
            <Box>
              <Typography sx={labelSx}>Invoice Date</Typography>
              <DateField value={formData.invoiceDate} onChange={(v) => setField('invoiceDate', v)} />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Box>
              <Typography sx={labelSx}>Payment Terms</Typography>
              <Select
                fullWidth size="small"
                value={formData.paymentTerms}
                onChange={handleChange('paymentTerms')}
                sx={selectSx}
              >
                {paymentTerms.map(term => (
                  <MenuItem key={term} value={term} sx={{ fontSize: 13 }}>{term}</MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Typography sx={labelSx}>Payment Due Date</Typography>
              <DateField value={formData.paymentDueDate} onChange={(v) => setField('paymentDueDate', v)} />
            </Box>
          </Box>
        </Box>
        )}

        {!updatePdfOnly && <Divider sx={{ mb: '14px' }} />}

        {/* â”€â”€ Amounts â”€â”€ */}
        {!updatePdfOnly && (
        <Box sx={{ mb: '14px' }}>
          <Typography sx={sectionTitleSx}>Amounts</Typography>

          <Box sx={{ mb: '12px' }}>
            <Typography sx={labelSx}>Invoice Amount ($) <span style={{ color: '#ef4444' }}>*</span></Typography>
            <TextField
              fullWidth size="small" type="number"
              value={formData.invoiceAmount}
              onChange={handleChange('invoiceAmount')}
              inputProps={{ step: 0.01 }}
              sx={inputSx}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', mb: '8px' }}>
            <Box>
              <Typography sx={labelSx}>Tax / VAT ($)</Typography>
              <TextField
                fullWidth size="small" type="number"
                value={formData.tax}
                onChange={handleChange('tax')}
                inputProps={{ step: 0.01 }}
                sx={inputSx}
              />
            </Box>
            <Box>
              <Typography sx={labelSx}>Discount ($)</Typography>
              <TextField
                fullWidth size="small" type="number"
                value={formData.discount}
                onChange={handleChange('discount')}
                inputProps={{ step: 0.01 }}
                sx={inputSx}
              />
            </Box>
          </Box>

          {/* Grand Total */}
          <Box sx={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            pt: '12px', borderTop: '1px dashed #e5e7eb',
          }}>
            <Typography sx={{ fontSize: 13, color: '#6b7280', mr: 1 }}>
              Grand Total:
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>
              ${formData.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>

          {variance && (
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ mt: '12px', borderRadius: '8px', '& .MuiAlert-message': { fontSize: 12 } }}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                Invoice amount differs from PO total
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#a16207', mt: 0.5 }}>
                PO Total: ${variance.poTotal.toLocaleString()} | Invoice Total: ${variance.invoiceTotal.toLocaleString()} | Difference: ${variance.difference.toLocaleString()}
              </Typography>
            </Alert>
          )}
        </Box>
        )}

        {!updatePdfOnly && <Divider sx={{ mb: '14px' }} />}

        {/* â”€â”€ Verification â”€â”€ */}
        {!updatePdfOnly && (
        <Box>
          <Typography sx={sectionTitleSx}>Verification</Typography>

          <Box sx={{ mb: '12px' }}>
            <Typography sx={labelSx}>Invoice Status</Typography>
            <Select
              fullWidth size="small"
              value={formData.invoiceStatus}
              onChange={handleChange('invoiceStatus')}
              sx={selectSx}
            >
              {invoiceStatuses.map(s => (
                <MenuItem key={s.value} value={s.value} sx={{ fontSize: 13 }}>{s.label}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ mb: '12px' }}>
            <Typography sx={labelSx}>Verified / Reviewed By</Typography>
            <TextField
              fullWidth size="small"
              placeholder="e.g. S. Anderson"
              value={formData.verifiedBy}
              onChange={handleChange('verifiedBy')}
              sx={inputSx}
            />
          </Box>

          <Box>
            <Typography sx={labelSx}>Notes / Remarks</Typography>
            <TextField
              fullWidth multiline rows={2} size="small"
              placeholder="Payment instructions, discrepancy notes, approvalsâ€¦"
              value={formData.notes}
              onChange={handleChange('notes')}
              sx={{ ...inputSx, '& .MuiInputBase-input': { py: '8px', px: '12px', fontSize: 13 } }}
            />
          </Box>
        </Box>
        )}
      </DialogContent>

      {/* â”€â”€ Footer â”€â”€ */}
      <Box sx={{
        px: '20px', py: '12px', borderTop: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: '10px', bgcolor: '#fff', flexShrink: 0,
      }}>
        <Button
          onClick={onClose}
          disableRipple
          sx={{ ...btnBase, color: '#374151', border: '1px solid #e5e7eb', bgcolor: '#fff', '&:hover': { bgcolor: '#f9fafb' } }}
        >
          Cancel
        </Button>
        <Button
          startIcon={<AttachFileIcon sx={{ fontSize: 15 }} />}
          onClick={handleSubmit}
          disableRipple
          sx={{
            ...btnBase, fontWeight: 700, color: '#fff', bgcolor: '#2563eb',
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          {updatePdfOnly ? 'Update PDF' : 'Save Invoice'}
        </Button>
      </Box>
    </Dialog>
  );
};

export default UploadInvoice;

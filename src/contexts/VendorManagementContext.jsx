import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSuppliers, getSupplierNames } from '../utils/supplierUtils';
import { getManufacturers, getManufacturerNames } from '../utils/manufacturerUtils';

const VendorManagementContext = createContext();


export const VendorManagementProvider = ({ children }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierNames, setSupplierNames] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [manufacturerNames, setManufacturerNames] = useState([]);

  useEffect(() => {
    const loadVendorData = () => {
      setSuppliers(getSuppliers());
      setSupplierNames(getSupplierNames());
      setManufacturers(getManufacturers());
      setManufacturerNames(getManufacturerNames());
    };

    loadVendorData();
  }, []);

  useEffect(() => {
    const handleSuppliersUpdated = () => {
      setSuppliers(getSuppliers());
      setSupplierNames(getSupplierNames());
    };

    window.addEventListener('suppliersUpdated', handleSuppliersUpdated);
    return () => {
      window.removeEventListener('suppliersUpdated', handleSuppliersUpdated);
    };
  }, []);

  useEffect(() => {
    const handleManufacturersUpdated = () => {
      setManufacturers(getManufacturers());
      setManufacturerNames(getManufacturerNames());
    };

    window.addEventListener('manufacturersUpdated', handleManufacturersUpdated);
    return () => {
      window.removeEventListener('manufacturersUpdated', handleManufacturersUpdated);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSuppliers = getSuppliers();
      const newSupplierNames = getSupplierNames();
      const newManufacturers = getManufacturers();
      const newManufacturerNames = getManufacturerNames();

      // Only update state if data has changed
      if (JSON.stringify(newSuppliers) !== JSON.stringify(suppliers)) {
        setSuppliers(newSuppliers);
        setSupplierNames(newSupplierNames);
      }

      if (JSON.stringify(newManufacturers) !== JSON.stringify(manufacturers)) {
        setManufacturers(newManufacturers);
        setManufacturerNames(newManufacturerNames);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [suppliers, manufacturers]);

  const value = {
    suppliers,
    supplierNames,
    manufacturers,
    manufacturerNames,
    refreshVendorData: useCallback(() => {
      setSuppliers(getSuppliers());
      setSupplierNames(getSupplierNames());
      setManufacturers(getManufacturers());
      setManufacturerNames(getManufacturerNames());
    }, []),
  };

  return (
    <VendorManagementContext.Provider value={value}>
      {children}
    </VendorManagementContext.Provider>
  );
};

/**
 * @returns {Object} 
 */
export const useVendorManagement = () => {
  const context = useContext(VendorManagementContext);
  if (!context) {
    throw new Error('useVendorManagement must be used within VendorManagementProvider');
  }
  return context;
};

export default VendorManagementContext;

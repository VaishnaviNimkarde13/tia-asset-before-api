
/**
 * @param {Object} item 
 * @returns {Object} 
 */
export const getItemUomData = (item) => {
  if (!item) return null;

  return {
    baseUom: item.baseUom || item.uom || "EA",
    issueUom: item.issueUom || item.baseUom || item.uom || "EA",
    purchaseUom: item.purchaseUom || item.baseUom || item.uom || "EA",
    issueToBaseConversion: item.issueToBaseConversion || 1,
    purchaseToBaseConversion: item.purchaseToBaseConversion || 1,
    baseStock: item.qty || 0,
  };
};

/**

 * @param {number} baseStock 
 * @param {number} issueConversion 
 * @returns {number} 
 */
export const convertBaseToIssueUom = (baseStock, issueConversion) => {
  if (!baseStock || !issueConversion || issueConversion === 0) return 0;
  return baseStock / issueConversion;
};

/**
 * @param {number} issueQty 
 * @param {number} issueConversion 
 * @returns {number} Quantity in base UOM
 */
export const convertIssueToBaseUom = (issueQty, issueConversion) => {
  if (!issueQty || !issueConversion) return 0;
  return issueQty * issueConversion;
};

/**
 * @param {number} purchaseQty 
 * @param {number} purchaseConversion
 * @returns {number} 
 */
export const convertPurchaseToBaseUom = (purchaseQty, purchaseConversion) => {
  if (!purchaseQty || !purchaseConversion) return 0;
  return purchaseQty * purchaseConversion;
};

/**
 * @param {number} baseStock 
 * @param {string} baseUom 
 * @param {string} issueUom 
 * @param {number} issueConversion 
 * @returns {string}
 */
export const formatAvailableQty = (baseStock, baseUom, issueUom, issueConversion) => {
  if (!baseStock || baseStock === 0) return "0 " + (issueUom || baseUom);

  if (issueUom === baseUom || !issueConversion || issueConversion === 1) {
    return `${baseStock} ${baseUom}`;
  }

  const issueQty = convertBaseToIssueUom(baseStock, issueConversion);
  const issueQtyRounded = Math.floor(issueQty * 100) / 100; 

  return `${issueQtyRounded} ${issueUom} (${baseStock} ${baseUom})`;
};

/**
 * @param {number} qty
 * @param {string} fromUom 
 * @param {string} toUom - Base UOM
 * @param {number} conversionFactor - 
 * @returns {string} 
 */
export const formatConversionDisplay = (qty, fromUom, toUom, conversionFactor) => {
  if (!qty || !fromUom || !toUom || !conversionFactor || conversionFactor === 0) return "";
  
  const convertedQty = qty * conversionFactor;
  return `${qty} ${fromUom} = ${convertedQty} ${toUom}`;
};

/**
 * Get conversion info for display
 * @param {number} qty - Quantity entered
 * @param {string} uomType - Type of UOM ("issue" or "purchase")
 * @param {Object} itemData - Item data from Item Master
 * @returns {Object} Conversion info with display string and converted quantity
 */
export const getConversionInfo = (qty, uomType, itemData) => {
  if (!qty || !itemData) return { display: "", convertedQty: 0 };

  if (uomType === "issue") {
    const display = formatConversionDisplay(
      qty,
      itemData.issueUom || itemData.baseUom,
      itemData.baseUom,
      itemData.issueToBaseConversion || 1
    );
    const convertedQty = qty * (itemData.issueToBaseConversion || 1);
    return { display, convertedQty };
  }

  if (uomType === "purchase") {
    const display = formatConversionDisplay(
      qty,
      itemData.purchaseUom || itemData.baseUom,
      itemData.baseUom,
      itemData.purchaseToBaseConversion || 1
    );
    const convertedQty = qty * (itemData.purchaseToBaseConversion || 1);
    return { display, convertedQty };
  }

  return { display: "", convertedQty: 0 };
};

/**
 * Validate quantity conversion
 * @param {number} issueQty - Quantity in issue UOM
 * @param {number} issueConversion - Conversion factor
 * @param {number} availableBaseStock - Available stock in base UOM
 * @returns {Object} Validation result with isValid flag and message
 */
export const validateQuantityConversion = (issueQty, issueConversion, availableBaseStock) => {
  if (!issueQty || issueQty <= 0) {
    return { isValid: false, message: "Quantity must be greater than 0" };
  }

  const requiredBaseQty = convertIssueToBaseUom(issueQty, issueConversion);

  if (requiredBaseQty > availableBaseStock) {
    return {
      isValid: false,
      message: `Insufficient stock. Required: ${requiredBaseQty}, Available: ${availableBaseStock}`,
    };
  }

  return { isValid: true, message: "" };
};

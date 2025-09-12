import { axiosPost } from "./axios-config/requestClient";
import { getJWTToken, getUserDetailsObj } from "../utils/loginUtil";

// 1. Get Invoices by Vendor ID, PO ID and Date Range
export async function getInvoicesByFilterService(startDate, endDate, vendorId = 0, poId = 0) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId
        },
        startDate,
        endDate,
        vendorId,
        poId
      };

      const response = await axiosPost("/invoice/listAllInvoices", requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data?.message || "Failed to fetch invoice list");
      }

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add or update an invoice
 * - If `invoice_id` is present, it updates
 * - Otherwise, creates a new one
 */
export async function saveOrUpdateInvoiceService(invoiceDTO) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId
        },
        ...invoiceDTO,
        createdBy: user?.userId,
        userId: user?.userId
      };

      const response = await axiosPost('/invoice/addInvoice', requestBody);

      if (response?.status && response?.data?.success) {
        resolve(response.data.data); // invoice object returned
      } else {
        reject(response?.data?.message || "Failed to save invoice");
      }

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Sync invoice payments
 * If payments are added/updated/deleted, send full list for a given invoiceId
 */
export async function syncInvoicePaymentsService(invoiceId, vendorId, totalAmountAsPerInvoice, paymentList = [], invoiceNumber) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId,
        },
        invoiceId,
        vendorId,
        paymentList,
        totalAmountAsPerInvoice,
        updatedBy: user?.userId,
        invoiceNumber
      };

      const response = await axiosPost("/invoice/managePayments", requestBody);

      if (response?.status && response?.data?.success) {
        resolve(response.data.message || "Payments synced successfully");
      } else {
        reject(response?.data?.message || "Failed to sync payments");
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get all payments for a given invoice ID
 */
export async function getPaymentsByInvoiceIdService(invoiceId) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId,
        },
        invoiceId,
      };

      const response = await axiosPost("/invoice/getAllPayments", requestBody);

      if (response?.status && response?.data?.success) {
        resolve(response.data.data || []);
      } else {
        reject(response?.data?.message || "Failed to fetch payments");
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get all payments grouped by invoice for a given PO ID
 */
export async function getPaymentsGroupedByInvoiceService(poId) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId,
        },
        poId,
      };

      const response = await axiosPost("/invoice/getPaymentsGroupedByInvoice", requestBody);

      if (response?.status && response?.data?.success) {
        resolve(response.data.data || []);
      } else {
        reject(response?.data?.message || "Failed to fetch grouped payments");
      }
    } catch (error) {
      reject(error);
    }
  });
}



/**
 * Get invoice details with items by invoiceId
 */
export async function getInvoiceWithItemsService(invoiceId) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId,
        },
        invoiceId,
      };

      // API endpoint that should return invoice + item details
      const response = await axiosPost("/invoice/getInvoiceWithItems", requestBody);

      if (response?.status && response?.data) {
        resolve(response.data.responseObject || {}); // return full invoice with items
      } else {
        reject(response?.data?.message || "Failed to fetch invoice with items");
      }
    } catch (error) {
      reject(error);
    }
  });
}



/**
 * Add a new cash entry
 */
export async function addCashEntryService(entry) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId,
        },
        ...entry, // { entry_date, description, amount, entry_type }
      };

      const response = await axiosPost("/invoice/createCashEntry", requestBody);

      if (response?.status && response?.data?.id) {
        resolve(response.data || {});
      } else {
        reject(response?.data?.message || "Failed to add cash entry");
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Update an existing cash entry
 */
export async function updateCashEntryService(id, entry) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId,
        },
        id,
        ...entry,
      };

      const response = await axiosPost("/invoice/editCashEntry", requestBody);

      if (response?.status && response?.data?.success) {
        resolve(response.data.data || {});
      } else {
        reject(response?.data?.message || "Failed to update cash entry");
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Delete a cash entry
 */
export async function deleteCashEntryService(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId,
        },
        id,
      };

      const response = await axiosPost("/invoice/removeCashEntry", requestBody);

      if (response?.status && response?.data?.success) {
        resolve(response.data.message || "Cash entry deleted successfully");
      } else {
        reject(response?.data?.message || "Failed to delete cash entry");
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get cash entries with optional date range
 */
export async function getCashEntriesService(startDate, endDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      // API expects query params for startDate and endDate
      const queryParams = `?startDate=${startDate || ""}&endDate=${endDate || ""}`;

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId,
        },
      };

      const response = await axiosPost(`/invoice/listCashEntries${queryParams}`, requestBody);
      console.log(response)
      if (response?.status && response?.data) {
        resolve(response.data || []);
      } else {
        reject(response?.data?.message || "Failed to fetch cash entries");
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get current cash balance
 */
export async function getCashBalanceService() {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId,
        },
      };

      const response = await axiosPost("/invoice/fetchCashBalance", requestBody);

      if (response?.status && response?.data) {
        resolve(response?.data?.balance || 0);
      } else {
        reject(response?.data?.message || "Failed to fetch cash balance");
      }
    } catch (error) {
      reject(error);
    }
  });
}

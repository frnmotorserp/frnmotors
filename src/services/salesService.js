import { axiosPost } from "./axios-config/requestClient";
import { getJWTToken, getUserDetailsObj } from "../utils/loginUtil";

// 1. List All Sales Orders
export async function listAllSalesOrdersService(startDate, endDate, partyId) {
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
        partyId // Can be customerId or dealerId depending on order_type
      };

      const response = await axiosPost('/sales/listAllSalesOrders', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}

// 2. Save or Update Sales Order
export async function saveOrUpdateSalesOrderService(orderData, items) {
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
        ...orderData,
        items,
        userId: user?.userId,
        createdBy: user?.userId
      };

      const response = await axiosPost('/sales/saveOrUpdateSalesOrder', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}

// 3. Get Sales Order Summary
export async function getSalesOrderSummaryService() {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId
        }
      };

      const response = await axiosPost('/sales/getSalesOrderSummary', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}

// 4. Get Sales Order Items by ID
export async function getSalesOrderItemsService(salesOrderId) {
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
        salesOrderId
      };

      const response = await axiosPost('/sales/getSalesOrderItems', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}

// 5. Update Sales Order Status
export async function updateSalesOrderStatusService(salesOrderId, newStatus) {
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
        salesOrderId,
        status: newStatus,
        updatedBy: user?.userId
      };

      const response = await axiosPost('/sales/updateSalesOrderStatus', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data?.message || "Failed to update sales order status");
      }
    } catch (error) {
      reject(error);
    }
  });
}

// 6. Get Sales Orders by Customer or Dealer
export async function getSalesOrdersByPartyService(partyId) {
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
        partyId
      };

      const response = await axiosPost('/sales/getSalesOrdersByParty', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}


export async function listAllAvailableSalebleItems(locationId) {
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
        locationId
      };

      const response = await axiosPost('/sales/listAllAvailableSalebleItems', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}



export async function saveOrUpdateOrderPaymentService(paymentData) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const { userId, loginId } = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId,
          userName: loginId
        },
        ...paymentData,
        userId,
        createdBy: userId
      };

      const response = await axiosPost('/sales/saveOrUpdateOrderPayment', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}


export async function getPaymentsBySalesOrderIdService(salesOrderId) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const { userId, loginId } = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId,
          userName: loginId
        },
        salesOrderId
      };

      const response = await axiosPost('/sales/getPaymentsBySalesOrderId', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}


export async function deletePaymentService(paymentId, salesOrderId) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const { userId, loginId } = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId,
          userName: loginId
        },
        paymentId,
        salesOrderId
      };

      const response = await axiosPost('/sales/deletePayment', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}


// Get Sales Orders with Payment Details
export async function getSalesOrdersWithPaymentsService(startDate, endDate, customerId, dealerId) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const user = getUserDetailsObj();

      // Request body matches backend controller expectations
      const requestBody = {
        token,
        dataAccessDTO: {
          userId: user?.userId,
          userName: user?.loginId
        },
        startDate,
        endDate,
        customerId: customerId || null,
        dealerId: dealerId || null
      };
      console.log(requestBody)

      const response = await axiosPost('/sales/getSalesOrdersWithPayments', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}



export async function getMonthlySalesReportService(year, month) {
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
        year,
        month
      };

      const response = await axiosPost('/sales/getMonthlySalesReport', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Get Yearly Sales Report (month-wise + totals)
export async function getYearlySalesReportService(year) {
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
        year
      };

      const response = await axiosPost('/sales/getYearlySalesReport', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data);
      }
    } catch (error) {
      reject(error);
    }
  });
}



// Cancel Sales Order
export async function cancelSalesOrderService(salesOrderId, cancellationReason) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getJWTToken();
      const { userId, loginId } = getUserDetailsObj();

      const requestBody = {
        token,
        dataAccessDTO: {
          userId,
          userName: loginId
        },
        salesOrderId,
        cancelledBy: userId,
        cancellationReason: cancellationReason || null
      };

      const response = await axiosPost('/sales/cancelSalesOrder', requestBody);

      if (response?.status && response?.data?.status) {
        resolve(response.data.responseObject);
      } else {
        reject(response?.data?.message || "Failed to cancel sales order");
      }
    } catch (error) {
      reject(error);
    }
  });
}


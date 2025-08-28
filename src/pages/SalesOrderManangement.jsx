import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import PageWrapper from '../layouts/PageWrapper';
import { useUI } from '../context/UIContext';
import { getAcceessMatrix } from '../utils/loginUtil';
import { getAllCustomersService } from '../services/customerService';
import CreateOrEditSalesOrderForm from '../features/sales-order/CreateOrEditSalesOrderForm';
import { getAllCompanyDetailsService } from '../services/locationService';
import {  listAllSalesOrdersService,
  updateSalesOrderStatusService, getSalesOrderItemsService } from '../services/salesService';
import {getStateListService} from '../services/stateServices'
import { getAllDealersService } from '../services/dealerService';
import { getAllLocationListService } from '../services/locationService';
import { fetchUserListService } from '../services/userServices';
import SalesOrderCard from '../features/sales-order/SalesOrderCard';
import ViewDownloadInvoice from '../features/sales-order/ViewDownloadInvoice';
import PaymentHistoryDialog from '../features/sales-order/PaymentHistoryDialog';
import CancelSalesOrderDialog from '../features/sales-order/CancelSalesOrderDialog';


const getStatusColor = (status) => {
  switch (status) {
    case 'DRAFT': return 'warning';
    case 'CONFIRMED': return 'primary';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const statusTabs = [
  'ALL',
  'CONFIRMED',
  'CANCELLED',
];

const SalesOrderManangement = () => {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [salesList, setSalesList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const [filters, setFilters] = useState({
    customerId: '',
    customerName: '',
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
  });
  const [accessMatrix, setAccessMatrix] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [mode, setMode] = useState('create');
  const [selectedTab, setSelectedTab] = useState('ALL');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyList, setCompanyList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [dealerList, setDealerList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [userIDUserNameMap, setUserIDUserNameMap] = useState({});
  const [customerIDNameMap, setCustomerIDNameMap] = useState({});
  const [dealerIDNameMap, setDealerIDNameMap] = useState({});
  const [userList, setUserList] = useState([]);
  const [salesOrderItems, setSalesOrderItems] = useState([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);



    // Consolidated data fetching function
  const fetchAllInitialData = async () => {
    // Show a single loader for all requests
    showLoader();
    setError(''); // Clear any previous errors

    try {
      // Use Promise.all to fetch all data concurrently
      const [
        dealers,
        customers,
        companyDetails,
        states,
        locations,
        usersRes
      ] = await Promise.all([
        getAllDealersService(),
        getAllCustomersService(),
        getAllCompanyDetailsService(),
        getStateListService(),
        getAllLocationListService(),
        fetchUserListService()
      ]);

      // Update state with results
      setDealerList(dealers || []);
      setCustomerList(customers || []);
      setCompanyList(companyDetails || []);
      setStateList(states || []);
      setLocationList(locations || []);
      setUserList(usersRes?.responseObject || []);

      if(usersRes?.responseObject){
        const users = usersRes?.responseObject
        const userMap = {};

        users.forEach(user => {
          const fullName = [user.userFirstname, user.userMiddlename, user.userLastname]
            .filter(Boolean) // removes empty string
            .join(' ');
          userMap[user.userId] = `${fullName} - ${user.loginId}`;
        });
        //console.log(userMap, "userMap")
        setUserIDUserNameMap(userMap)
      }

      if(customers && customers?.length > 0){
        const customerMap = {};

        customers.forEach(customer => {
          const fullName = [customer.customerName]
          customerMap[customer.customerId] = fullName ;
        });
       
        setCustomerIDNameMap(customerMap)
      }

      
      if(dealers && dealers?.length > 0){
        const dealerMap = {};

        dealers.forEach(dealer => {
          const fullName = [dealer.dealerName]
          dealerMap[dealer.dealerId] = fullName ;
        });
       
        setDealerIDNameMap(dealerMap)
      }


      // Show a single success message
      showSnackbar('Initial data loaded successfully!', 'success');
    } catch (err) {
      console.error('Error fetching initial data:', err);
      // Clear all state on failure
      setDealerList([]);
      setCustomerList([]);
      setCompanyList([]);
      setStateList([]);
      setLocationList([]);
      // Show a single error message
      showSnackbar('Failed to load initial data. Please try again.', 'error');
    } finally {
      // Hide the loader once all promises are settled
      hideLoader();
    }
  };


  useEffect(() => {
    fetchAllInitialData();

    const access = getAcceessMatrix('Sales', 'Order Management');
    setAccessMatrix(access);
  }, []); 


  const fetchSalesOrders = async (hideSnackbar) => {
    if (!filters.startDate || !filters.endDate) {
      setError('Start Date and End Date are required.');
      setSalesList([]);
      return;
    }
    if (dayjs(filters.endDate).isBefore(dayjs(filters.startDate))) {
      setError('End Date cannot be earlier than Start Date.');
      setSalesList([]);
      return;
    }

    setError('');
    showLoader();
    try {
      const res = await listAllSalesOrdersService(
        filters.startDate,
        filters.endDate,
        filters.customerId
      );
      setSalesList(res || []);
      !hideSnackbar && showSnackbar(res?.length ? 'Sales orders fetched!' : 'No sales orders found!', res?.length ? 'success' : 'warning');
    } catch (err) {
      console.error('Error fetching sales orders:', err);
      setSalesList([]);
      !hideSnackbar && showSnackbar('Failed to fetch sales orders', 'error');
    } finally {
      hideLoader();
    }
  };


  const fetchSalesOrderItems = async (salesOrderId, hideSnackbar) => {
  if (!salesOrderId) {
    setError('Sales Order ID is required.');
    setSalesOrderItems([]);
    return;
  }

  setError('');
  showLoader();
  try {
    const res = await getSalesOrderItemsService(salesOrderId);
    console.log(res)
    setSalesOrderItems(res || []);
    !hideSnackbar &&
      showSnackbar(
        res?.length ? 'Sales order items fetched!' : 'No items found for this order!',
        res?.length ? 'success' : 'warning'
      );
  } catch (err) {
    console.error('Error fetching sales order items:', err);
    setSalesOrderItems([]);
    !hideSnackbar && showSnackbar('Failed to fetch sales order items', 'error');
  } finally {
    hideLoader();
  }
};

  // Example of a re-usable fetch function
  const fetchCustomers = async (hideSnackbar) => {
    showLoader();
    try {
        const res = await getAllCustomersService();
        setCustomerList(res || []);
        !hideSnackbar && showSnackbar(res?.length ? 'Customers fetched!' : 'No customers found!', res?.length ? 'success' : 'warning');
    } catch (err) {
        console.error('Error fetching customers:', err);
        setCustomerList([]);
        !hideSnackbar && showSnackbar('Failed to fetch customers', 'error');
    } finally {
        hideLoader();
    }
  };

  // useEffect(() => {
  //   fetchDealers()
  //   fetchCustomers(true);
  //   fetchSalesOrders();
  //   fetchCompanyDetails(true)
  //   getStateListAPICall(true)
  //   getLocationListAPICall(true)
    
  //   const access = getAcceessMatrix('Sales', 'Order Management');
  //   setAccessMatrix(access);
  // }, []);

  //   const fetchDealers = async () => {
  //     try {
  //       const res = await getAllDealersService();
  //       setDealerList(res);
  //     } catch (err) {
  //       showSnackbar('Error fetching dealers', 'error');
  //     }
  //   };

  // const getStateListAPICall = (hideSnackbar) => {
  //       showLoader()
  //       getStateListService().then(res => {
  //         if(res){
  //           setStateList(res)
  //           !hideSnackbar && showSnackbar('State list fetched successfully!', 'success' )
  //         }
  //         else{
            
  //           !hideSnackbar && showSnackbar('State List is Empty!', 'warning' )
  //           setStateList([])
  //         }
  //         hideLoader()
  //       }).catch(error => {
  //         console.log("Error in Fetching State List!", error);
  //         hideLoader();
  //         setStateList([])
  //         !hideSnackbar && showSnackbar('Failed to fetch state list!', 'error' )
  //       })
  
  //     }

  //   const getLocationListAPICall = (hideSnackbar) => {
  //     showLoader();
  //     getAllLocationListService()
  //       .then(res => {
  //         if (res && res.length > 0) {
  //           setLocationList(res);
  //           !hideSnackbar && showSnackbar('Locations fetched successfully!', 'success');
  //         } else {
  //           setLocationList([]);
  //           !hideSnackbar && showSnackbar('No Locations found!', 'warning');
  //         }
  //         hideLoader();
  //       })
  //       .catch(error => {
  //         console.error('Error fetching Locations!', error);
  //         setLocationList([]);
  //         hideLoader();
  //         !hideSnackbar && showSnackbar('Failed to fetch Locations!', 'error');
  //       });
  //   };

  // const fetchCompanyDetails = (hideSnackbar = false) => {
  // // 1. Show a loading indicator to the user
  // showLoader();

  // // 2. Call the service function
  //   getAllCompanyDetailsService()
  //     .then(response => {
  //       // 3. On success, update the component's state
  //       setCompanyList(response || []); // Use empty array as a fallback

  //       // 4. Show a success or warning notification
  //       const message = response?.length ? 'Company details fetched!' : 'No companies found!';
  //       const severity = response?.length ? 'success' : 'warning';
  //       !hideSnackbar && showSnackbar(message, severity);
  //     })
  //     .catch(error => {
  //       // 5. On failure, log the error and clear the state
  //       console.error('Error fetching company details:', error);
  //       setCompanyList([]);

  //       // 6. Show an error notification
  //       !hideSnackbar && showSnackbar('Failed to fetch company details', 'error');
  //     })
  //     .finally(() => {
  //       // 7. In either case, hide the loading indicator
  //       hideLoader();
  //     });
  // };
  // const fetchCustomers = (hideSnackbar) => {
  //   showLoader();
  //   getAllCustomersService()
  //     .then(res => {
  //       setCustomerList(res || []);
  //       !hideSnackbar && showSnackbar(res?.length ? 'Customers fetched!' : 'No customers found!', res?.length ? 'success' : 'warning');
  //     })
  //     .catch(err => {
  //       console.error('Error fetching customers:', err);
  //       setCustomerList([]);
  //       !hideSnackbar && showSnackbar('Failed to fetch customers', 'error');
  //     })
  //     .finally(() => hideLoader());
  // };

  // const fetchSalesOrders = (hideSnackbar) => {
  //   if (!filters.startDate || !filters.endDate) {
  //     setError('Start Date and End Date are required.');
  //     setSalesList([]);
  //     return;
  //   }
  //   // if (!filters.customerId) {
  //   //   setError('Customer is required. Please select a customer!');
  //   //   setSalesList([]);
  //   //   return;
  //   // }
  //   if (dayjs(filters.endDate).isBefore(dayjs(filters.startDate))) {
  //     setError('End Date cannot be earlier than Start Date.');
  //     setSalesList([]);
  //     return;
  //   }

  //   setError('');
  //   showLoader();
  //   listAllSalesOrdersService(filters.startDate, filters.endDate, filters.customerId)
  //     .then(res => {
  //       setSalesList(res || []);
  //       !hideSnackbar && showSnackbar(res?.length ? 'Sales orders fetched!' : 'No sales orders found!', res?.length ? 'success' : 'warning');
  //     })
  //     .catch(err => {
  //       console.error('Error fetching sales orders:', err);
  //       setSalesList([]);
  //       !hideSnackbar && showSnackbar('Failed to fetch sales orders', 'error');
  //     })
  //     .finally(() => hideLoader());
  // };

  const updateStatus = (id, newStatus) => {
    if (!id || !newStatus) {
      showSnackbar('Invalid order or status!', 'error');
      return;
    }
    showLoader();
    updateSalesOrderStatusService(id, newStatus)
      .then(() => {
        showSnackbar('Sales order status updated!', 'success');
        fetchSalesOrders(true);
      })
      .catch(err => {
        console.error('Status update failed:', err);
        showSnackbar('Failed to update status', 'error');
      })
      .finally(() => hideLoader());
  };

  const handleCancelOrderDialogOpen = (so = null, currMode = 'create') => {
    setViewData(so);
    //setMode(currMode);
    setCancelDialogOpen(true);
  };

    const handleDialogOpen = (so = null, currMode = 'create') => {
    setEditData(so);
    setMode(currMode);
    setOpenDialog(true);
  };


  const handleDialogClose = () => {
    setEditData(null);
    setOpenDialog(false);
  };

     const handleViewDialogOpen = (itemData) => {
    setViewData(itemData || {})
    setOpenViewDialog(true);
  };

  const handlePaymentDialogOpen = (itemData) => {
    setViewData(itemData || {})
    setPaymentDialogOpen(true);
  };

   const handlePaymentDialogClose = () => {
    setViewData(null)
    setPaymentDialogOpen(false);
  };
   const handleViewDialogClose = () => {
    setViewData(null)
    setOpenViewDialog(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: 'Create Sales Order',
      buttonCallback: () => handleDialogOpen(),
      buttonIcon: <AddIcon fontSize='small' />,
      access: accessMatrix?.create ?? false,
    }
  ];


  

  return (
    <PageWrapper title="Sales Order Management" actionButtons={ActionButtonsArr}>
      <Box>
        <Stack direction="row" spacing={2} my={2} flexWrap="wrap" justifyContent="center">
          {/* <Autocomplete
            size="small"
            options={customerList}
            getOptionLabel={(opt) => opt.customerName || ''}
            value={customerList.find(c => c.customerId === filters.customerId) || null}
            onChange={(e, newVal) => {
              setFilters(prev => ({
                ...prev,
                customerId: newVal?.customerId || '',
                customerName: newVal?.customerName || ''
              }));
              setSalesList([]);
            }}
            renderInput={(params) => <TextField {...params} label="Customer" size="small" />}
            isOptionEqualToValue={(opt, val) => opt.customerId === val.customerId}
            sx={{ minWidth: 180 }}
          /> */}

          <TextField
            label="Start Date"
            type="date"
            size="small"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            size="small"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={() => fetchSalesOrders()}>
            Get Orders
          </Button>
        </Stack>

        {error && (
          <Box display="flex" justifyContent="center">
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          </Box>
        )}

        <Box sx={{ borderRadius: 2, backgroundColor: '#fff', p: 1, mb: 1 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, val) => setSelectedTab(val)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {statusTabs.map(status => (
              <Tab key={status} label={status} value={status}
                sx={{
                  textTransform: 'none', fontWeight: 500, borderRadius: 8,
                  minWidth: 120, color: selectedTab === status ? 'primary.main' : 'text.secondary'
                }}
              />
            ))}
          </Tabs>
        </Box>

        {salesList?.filter(o => selectedTab === 'ALL' || o.status === selectedTab)?.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'end', pr: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search Order No"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ minWidth: 200 }}
            />
          </Box>
        )}
        <Box m={2}>
               <Grid container spacing={3} mb={3}>
          {salesList
            ?.filter(o => selectedTab === 'ALL' || o.status === selectedTab)
            ?.filter(o =>  !searchQuery || o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()))
            ?.map((o, index) => (
             <SalesOrderCard  
             o={o} 
             index={index} 
             key={index}
             fetchSalesOrderItems={fetchSalesOrderItems} 
             getStatusColor={getStatusColor} 
             userIDUserNameMap={userIDUserNameMap} 
             dealerIDNameMap={dealerIDNameMap} 
             customerIDNameMap={customerIDNameMap} 
             handlePaymentDialogOpen={handlePaymentDialogOpen}
             handleViewDialogOpen = {handleViewDialogOpen}
             handleCancelOrderDialogOpen={handleCancelOrderDialogOpen}
             />
            ))}
        </Grid>

        </Box>
   

        <CreateOrEditSalesOrderForm
          open={openDialog}
          handleClose={handleDialogClose}
          mode={mode}
          editData={editData}
          companyList={companyList || []}
          customerList={customerList || []}
          stateList={stateList || []}
          dealerList={dealerList || []}
          locationList={locationList || []}
          userList={userList || []}
          onSuccess={() => fetchSalesOrders(true)}

        />
           <ViewDownloadInvoice
          open={openViewDialog}
          handleClose={handleViewDialogClose}
          salesOrder={viewData}
          items={salesOrderItems || []}
          companyList={companyList || []}
           customerList={customerList || []}
       
          dealerList={dealerList || []}

        />

        <CancelSalesOrderDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        salesOrderId={viewData?.sales_order_id}
        onCancelled={() => {fetchSalesOrders(true)}} 
        salesOrderCode={viewData?.sales_order_code}

      />
        <PaymentHistoryDialog open={paymentDialogOpen} 
        onClose={handlePaymentDialogClose} 
        salesOrderId={viewData?.sales_order_id} 
        orderAmount={viewData?.grand_total}  
        salesOrderCode={viewData?.sales_order_code}
        orderStatus ={viewData?.status}
        />
        
      </Box>
    </PageWrapper>
  );
};

export default SalesOrderManangement;

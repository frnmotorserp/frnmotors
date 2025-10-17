import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions, Button, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Stack, Tabs, Tab, IconButton,
  MenuItem, Chip
} from '@mui/material';
import PageWrapper from '../layouts/PageWrapper';
import { useUI } from '../context/UIContext';
import { getAcceessMatrix } from '../utils/loginUtil';

import { Add, Edit, Delete, Visibility, Search } from '@mui/icons-material';
import { getAllVendorsService, saveOrUpdateVendorService } from '../services/vendorService';

import { getStateListService } from '../services/stateServices'
import { getVendorInvoicesWithPaymentsFYService } from '../services/invoicePaymentsService';
import InvoicePaymentSummaryDialog from '../features/purchase-invoice/InvoicePaymentSummaryDialog';
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";


const initialVendorState = {
  vendorId: null,
  vendorCode: '',
  vendorName: '',
  vendorType: '',
  gstin: '',
  pan: '',
  email: '',
  phone: '',
  website: '',
  status: true,
  addresses: [],
  contacts: [],
  bankDetails: []
};

const vendorAddressTypes = [
  { id: 'PRIMARY ADDRESS', label: 'PRIMARY ADDRESS' },
  { id: 'REGISTERED OFFICE ADDRESS', label: 'REGISTERED OFFICE ADDRESS' },
  { id: 'BILLING ADDRESS', label: 'BILLING ADDRESS' },
  { id: 'REMITTANCE ADDRESS', label: 'REMITTANCE ADDRESS' },
  { id: 'SHIPPING FROM ADDRESS', label: 'SHIPPING FROM ADDRESS' },
  { id: 'RETURN ADDRESS', label: 'RETURN ADDRESS' },
  { id: 'BRANCH ADDRESS', label: 'BRANCH ADDRESS' },
  { id: 'CUSTOMER SERVICE CONTACT ADDRESS', label: 'CUSTOMER SERVICE CONTACT ADDRESS' },
  { id: 'OTHER ADDRESS', label: 'OTHER ADDRESS' },
];


export default function VendorManagementPage() {
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [vendors, setVendors] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialVendorState);
  const [activeTab, setActiveTab] = useState(0);
  const [isViewMode, setIsViewMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [accessMatrix, setAccessMatrix] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [districtList, setDistrictList] = useState([]);
  const [filteredDistrictList, setFilteredDistrictList] = useState([]);
  const [stateDropDown, setStateDropDown] = useState([]);
  const [selectedState, setSelectedState] = useState(null);

  const [invoiceAndPayments, setInvoiceAndPayments] = useState([])
  const [vendorBuyerName, setVendorBuyerName] = useState('')

  // function to open summary dialog
  const handleOpenSummaryDialog = (vendor) => {
    //console.log(vendor)
    getInvoiceAndPayments(vendor?.vendorId)
    setOpenSummaryDialog(true);
    setVendorBuyerName(vendor?.vendorName)
  };

  //  function to close summary dialog
  const handleCloseSummaryDialog = () => {
    setOpenSummaryDialog(false);
    setVendorBuyerName('')
   
  };

  const getInvoiceAndPayments = (vendorId) => {
    showLoader()
    getVendorInvoicesWithPaymentsFYService(vendorId)
      .then((res) => {
        if (res?.data) {
          setInvoiceAndPayments(res?.data || [])
          showSnackbar('Invoices and Payments loaded!', 'success');
        }
        else {
          showSnackbar('No invoices found', 'warning');
          setInvoiceAndPayments([])
        }
       

      })
      .catch(() => {
        setInvoiceAndPayments([])
        showSnackbar('Failed to fetch invoices', 'error')

      })
      .finally(() => hideLoader());
  }


  const getStateAndDistrictListAPICall = (hideSnackbar = false) => {
    showLoader();

    Promise.all([getStateListService()])
      .then(([stateRes]) => {
        if (stateRes) {
          let dropdownArray = [];
          stateRes.forEach(x => {
            dropdownArray.push({ label: x.stateName, id: x.stateId });
          });
          setStateDropDown(dropdownArray);
        } else {
          !hideSnackbar && showSnackbar('Failed to fetch state list!', 'error');
          setStateDropDown([]);
        }

        // --- Handle Districts ---
        // if (districtResponse) {
        //    let districtRes = [];
        //   districtResponse.forEach(x => {
        //     districtRes.push({ label: x.districtName, id: x.districtId, stateId: x.stateId });
        //   });
        //   setDistrictList(districtRes);
        //   if (selectedState?.id === 0) {
        //     setFilteredDistrictList(districtRes);
        //   } else {
        //     const filtered = districtRes.filter(x => x.stateId === selectedState?.id);
        //     setFilteredDistrictList(filtered);
        //   }
        //   !hideSnackbar && showSnackbar('District list fetched successfully!', 'success');
        // } else {
        //   !hideSnackbar && showSnackbar('District List is Empty!', 'warning');
        //   setDistrictList([]);
        //   setFilteredDistrictList([]);
        // }

        hideLoader();
      })
      .catch(error => {
        console.error("Error in Fetching State/District List!", error);
        setStateDropDown([]);
        setDistrictList([]);
        setFilteredDistrictList([]);
        hideLoader();
        !hideSnackbar && showSnackbar('Failed to fetch state or district list!', 'error');
      });
  };



  const fetchVendors = (hideSnackbar) => {
    showLoader();

    getAllVendorsService()
      .then((res) => {
        if (res && res.length > 0) {
          setVendors(res);
          !hideSnackbar && showSnackbar('Vendor list fetched successfully!', 'success');
        } else {
          setVendors([]);
          !hideSnackbar && showSnackbar('Vendor list is empty!', 'warning');
        }
      })
      .catch((error) => {
        console.error('Error fetching vendors:', error);
        setVendors([]);
        !hideSnackbar && showSnackbar('Failed to fetch vendors!', 'error');
      })
      .finally(() => {
        hideLoader();
      });
  };


  useEffect(() => {
    fetchVendors();
    getStateAndDistrictListAPICall(true)
    const access = getAcceessMatrix('Inventory Management', 'Vendor');
    setAccessMatrix(access);
  }, []);

  const handleOpenDialog = (vendor = initialVendorState, viewOnly = false) => {
    
    setFormData({ ...initialVendorState, ...vendor });
    setIsViewMode(viewOnly);
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setFormData(initialVendorState);
    setOpenDialog(false);
    setActiveTab(0);
    setIsViewMode(false);
    setErrors({});
  };

  const handleChange = (e) => {
    if (!isViewMode) {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleNestedChange = (section, index, key, value) => {
    if (!isViewMode) {
      const updated = [...formData[section]];
      updated[index][key] = value;
      setFormData((prev) => ({ ...prev, [section]: updated }));
    }
  };

  const handleAddSectionItem = (section, newItem) => {
    if (!isViewMode) {
      setFormData((prev) => ({ ...prev, [section]: [...prev[section], newItem] }));
    }
  };

  const handleRemoveSectionItem = (section, index) => {
    if (!isViewMode) {
      const updated = [...formData[section]];
      updated.splice(index, 1);
      setFormData((prev) => ({ ...prev, [section]: updated }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.vendorCode?.trim()) newErrors.vendorCode = 'Vendor Code is required';
    if (!formData.vendorName?.trim()) newErrors.vendorName = 'Vendor Name is required';
    if (!formData.gstin?.trim() && !formData.pan?.trim()) newErrors.gstin = 'Either GSTIN or PAN is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Vendor details are missing, please validate!', 'error');
      return
    };

    showLoader();
    console.log(formData)

    try {
      const res = await saveOrUpdateVendorService(formData);
      if (res?.success) {
        showSnackbar('Vendor saved successfully!', 'success');
        handleCloseDialog();
        fetchVendors(true); // Pass true to hide "fetch success" snackbar
      } else {
        showSnackbar('Something went wrong while saving vendor.', 'warning');
      }
    } catch (error) {
      console.error('Save failed:', error);
      showSnackbar('Failed to save vendor!', 'error');
    } finally {
      hideLoader();
    }
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: 'Add Vendor',
      buttonCallback: () => { handleOpenDialog() },
      buttonIcon: <Add fontSize='small' />,
      access: accessMatrix?.create ?? false,
    }
  ];


  return (
    <PageWrapper title={"Vendor Management"} actionButtons={ActionButtonsArr} >
      <Box p={3}>
        {/* <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Vendor Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Vendor
        </Button>
      </Box> */}

        {/* <Grid container spacing={2}>
        {vendors.map((vendor) => (
          <Grid item xs={12} sm={6} md={4} key={vendor.vendorId}>
            <Card>
              <CardContent>
                <Typography variant="h6">{vendor.vendorName}</Typography>
                <Typography variant="body2">Code: {vendor.vendorCode}</Typography>
                <Typography variant="body2">Type: {vendor.vendorType}</Typography>
                <Typography variant="body2">Phone: {vendor.phone}</Typography>
                <Typography variant="body2">Email: {vendor.email}</Typography>
              </CardContent>
              <CardActions>
                <Button startIcon={<Edit />} onClick={() => handleOpenDialog(vendor, false)}>Edit</Button>
                <Button startIcon={<Visibility />} onClick={() => handleOpenDialog(vendor, true)}>View</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid> */}
        <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2} gap={1}>
          <Box sx={{ p: 0.5, backgroundColor: 'primary.light', borderRadius: 2, display: 'flex', alignItems: 'center' }}  >
            <Search size='small' />
          </Box>

          <TextField
            size="small"
            placeholder="Search by name or code"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 300 }}
          />
        </Box>

        <Grid container spacing={3}>
          {vendors?.filter(
            (v) =>
              v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase())
          )
            ?.map((vendor, index) => (
              <Grid item xs={12} sm={6} md={4} key={vendor.vendorId}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
                    border: '1px solid #c8e6c9',
                    borderRadius: 3,
                    boxShadow: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="overline" color="text.secondary">
                        #{index + 1}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          backgroundColor: '#a5d6a7',
                          color: '#1b5e20',
                          borderRadius: 1,
                          fontWeight: 600,
                        }}
                      >
                        {vendor.vendorCode}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                        {vendor.vendorName}
                      </Typography>
                      <Chip size='small' color={vendor.status === true ? 'primary' : 'error'} sx={{ fontSize: '0.6rem' }} label={vendor.status === true ? "Active" : "In-Active"}></Chip>
                    </Box>


                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      <strong>Description:</strong> {vendor.vendorType || '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      <strong>Phone:</strong> {vendor.phone || '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      <strong>Email:</strong> {vendor.email || '—'}
                    </Typography>

                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end', flexDirection: 'column', gap: 1, alignItems: 'end', px: 2, pb: 2 }}>
                    <Box>
                      <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(vendor, false)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<Visibility />}
                      onClick={() => handleOpenDialog(vendor, true)}
                    >
                      View
                    </Button>

                    </Box>
                    

                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<AccountBalanceWalletIcon />}
                      onClick={() => handleOpenSummaryDialog(vendor)}
                    >
                      Invoice & Payments
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
        </Grid>




        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
          <DialogTitle>{isViewMode ? 'View Vendor' : formData.vendorId ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          <DialogContent>
            {/* <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab label="Basic Info" />
            <Tab label="Addresses" />
            <Tab label="Contacts" />
            <Tab label="Bank Details" />
          </Tabs> */}
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 2,
                px: 1,
                py: 1,
                backgroundColor: (theme) => theme.palette.primary.light, // teal[100]
                borderRadius: 2,
                minHeight: 48,
                '& .MuiTab-root': {
                  fontWeight: 500,
                  color: (theme) => theme.palette.primary.dark, // teal[800]
                  textTransform: 'none',
                  borderRadius: 6,
                  minHeight: 40,
                  minWidth: 120,
                  mx: 0.5,

                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.primary.accordian, // teal[400]
                    color: '#fff',
                  },
                },
                '& .Mui-selected': {
                  backgroundColor: (theme) => theme.palette.primary.tab, // teal[600]
                  color: (theme) => theme.palette.primary.contrastText,

                },
                '& .MuiTabs-indicator': {
                  height: 0,
                  backgroundColor: (theme) => theme.palette.primary.dark,
                  borderRadius: 3,
                },
              }}
            >
              <Tab label="Basic Info" />
              <Tab label="Addresses" />
              <Tab label="Contacts" />
              <Tab label="Bank Details" />
            </Tabs>




            <Box m={2}>
              {activeTab === 0 && (
                <Stack spacing={2} mt={2}>
                  <TextField
                    label="Vendor Code"
                    name="vendorCode"
                    value={formData.vendorCode}
                    onChange={handleChange}
                    fullWidth
                    disabled={isViewMode}
                    error={!!errors.vendorCode}
                    helperText={errors.vendorCode}
                    size={'small'}
                  />
                  <TextField
                    label="Vendor Name"
                    name="vendorName"
                    value={formData.vendorName}
                    onChange={handleChange}
                    fullWidth
                    disabled={isViewMode}
                    error={!!errors.vendorName}
                    helperText={errors.vendorName}
                    size={'small'}
                  />
                  <TextField
                    label="Vendor Description"
                    name="vendorType"
                    value={formData.vendorType}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    minRows={3}
                    disabled={isViewMode}
                    size={'small'}
                  />
                  <TextField
                    label="GSTIN"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    fullWidth
                    disabled={isViewMode}
                    error={!!errors.gstin}
                    helperText={errors.gstin && 'Either GSTIN or PAN is required'}
                    size={'small'}
                  />
                  <TextField
                    label="PAN"
                    name="pan"
                    value={formData.pan}
                    onChange={handleChange}
                    fullWidth
                    disabled={isViewMode}
                    size={'small'}
                  />
                  <TextField size={'small'} label="Email" name="email" value={formData.email} onChange={handleChange} fullWidth disabled={isViewMode} />
                  <TextField size={'small'} label="Phone" name="phone" value={formData.phone} onChange={handleChange} fullWidth disabled={isViewMode} />
                  <TextField size={'small'} label="Website" name="website" value={formData.website} onChange={handleChange} fullWidth disabled={isViewMode} />
                  <TextField select size={'small'} label="Status" name="status" value={formData.status} onChange={handleChange} fullWidth disabled={isViewMode} >
                    <MenuItem key={1} value={true}>Active</MenuItem>
                    <MenuItem key={2} value={false}>In-Active</MenuItem>
                  </TextField>
                </Stack>
              )}

              {activeTab === 1 && (
                <Stack spacing={2} mt={2}>
                  {formData.addresses.map((addr, idx) => (
                    <Stack spacing={1} key={idx} direction="row" flexWrap="wrap">
                      <Box sx={{ border: '1px solid green', width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }} p={4}>
                        <Box mb={2} display={'flex'} width={'100%'} justifyContent={'space-between'} alignItems={'center'}>
                          <Typography sx={{ p: 1, backgroundColor: 'primary.main', color: 'white', borderRadius: 2 }}>{`Address ${idx + 1}`}</Typography>
                          {!isViewMode && <IconButton onClick={() => handleRemoveSectionItem('addresses', idx)}><Delete color={'error'} /></IconButton>}
                        </Box>
                        <TextField size={'small'} select disabled={isViewMode} label="Type" value={addr.addressType} onChange={(e) => handleNestedChange('addresses', idx, 'addressType', e.target.value)} fullWidth >
                          {vendorAddressTypes.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                              {option.label}
                            </MenuItem>
                          ))}

                        </TextField>
                        <TextField size={'small'} disabled={isViewMode} label="Line 1" value={addr.addressLine1} onChange={(e) => handleNestedChange('addresses', idx, 'addressLine1', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="Line 2" value={addr.addressLine2} onChange={(e) => handleNestedChange('addresses', idx, 'addressLine2', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="City" value={addr.city} onChange={(e) => handleNestedChange('addresses', idx, 'city', e.target.value)} fullWidth />
                        <TextField select size={'small'} disabled={isViewMode} label="State" value={addr.state} onChange={(e) => {
                          const selected = stateDropDown.find(s => s.id === e.target.value);
                          handleNestedChange('addresses', idx, 'state', e.target.value)
                          handleNestedChange('addresses', idx, 'stateName', selected?.label || '')
                        }} fullWidth >
                          {
                            stateDropDown?.map(state => {
                              //console.log(state)
                              return <MenuItem key={state.id} value={state.id}>{state.label}</MenuItem>
                            })
                          }
                        </TextField>


                        <TextField size={'small'} disabled={isViewMode} label="District" value={addr.district} onChange={(e) => {

                          handleNestedChange('addresses', idx, 'district', e.target.value)
                        }} fullWidth >

                        </TextField>
                        <TextField size={'small'} disabled={isViewMode} label="Pincode" value={addr.pincode} onChange={(e) => handleNestedChange('addresses', idx, 'pincode', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="Country" value={addr.country} onChange={(e) => handleNestedChange('addresses', idx, 'country', e.target.value)} fullWidth />

                      </Box>
                    </Stack>
                  ))}
                  {!isViewMode && <Button onClick={() => handleAddSectionItem('addresses', { addressType: '', addressLine1: '', addressLine2: '', city: '', district: '', state: '', stateName: '', pincode: '', country: '', isPrimary: true })}>
                    + Add Address
                  </Button>}
                </Stack>
              )}

              {activeTab === 2 && (
                <Stack spacing={2} mt={2}>

                  {formData.contacts.map((contact, idx) => (
                    <Stack key={idx} direction="row" flexWrap="wrap">

                      <Box sx={{ border: '1px solid green', width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }} p={4}>
                        <Box mb={2} display={'flex'} width={'100%'} justifyContent={'space-between'} alignItems={'center'}>
                          <Typography sx={{ p: 1, backgroundColor: 'primary.main', color: 'white', borderRadius: 2 }}>{`Contact ${idx + 1}`}</Typography>
                          {!isViewMode && <IconButton onClick={() => handleRemoveSectionItem('contacts', idx)}><Delete color={'error'} /></IconButton>}
                        </Box>

                        <TextField size={'small'} disabled={isViewMode} label="Name" value={contact.contactName} onChange={(e) => handleNestedChange('contacts', idx, 'contactName', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="Designation" value={contact.designation} onChange={(e) => handleNestedChange('contacts', idx, 'designation', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="Email" value={contact.email} onChange={(e) => handleNestedChange('contacts', idx, 'email', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="Phone" value={contact.phone} onChange={(e) => handleNestedChange('contacts', idx, 'phone', e.target.value)} fullWidth />




                      </Box>
                    </Stack>
                  ))}


                  {!isViewMode && <Button onClick={() => handleAddSectionItem('contacts', { contactName: '', designation: '', email: '', phone: '', isPrimary: false })}>
                    + Add Contact
                  </Button>}
                </Stack>
              )}

              {activeTab === 3 && (
                <Stack spacing={2} mt={2}>

                  {formData.bankDetails.map((bank, idx) => (
                    <Stack spacing={1} key={idx} direction="row" flexWrap="wrap">
                      <Box sx={{ border: '1px solid green', width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }} p={4}>
                        <Box mb={2} display={'flex'} width={'100%'} justifyContent={'space-between'} alignItems={'center'}>
                          <Typography sx={{ p: 1, backgroundColor: 'primary.main', color: 'white', borderRadius: 2 }}>{`Bank Info ${idx + 1}`}</Typography>
                          {!isViewMode && <IconButton onClick={() => handleRemoveSectionItem('bankDetails', idx)}><Delete color={'error'} /></IconButton>}
                        </Box>
                        <TextField size={'small'} disabled={isViewMode} label="Account Holder" value={bank.accountHolderName} onChange={(e) => handleNestedChange('bankDetails', idx, 'accountHolderName', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="Account Number" value={bank.accountNumber} onChange={(e) => handleNestedChange('bankDetails', idx, 'accountNumber', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="IFSC" value={bank.ifscCode} onChange={(e) => handleNestedChange('bankDetails', idx, 'ifscCode', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="Bank Name" value={bank.bankName} onChange={(e) => handleNestedChange('bankDetails', idx, 'bankName', e.target.value)} fullWidth />
                        <TextField size={'small'} disabled={isViewMode} label="Branch" value={bank.branchName} onChange={(e) => handleNestedChange('bankDetails', idx, 'branchName', e.target.value)} fullWidth />

                      </Box>
                    </Stack>
                  ))}
                  {!isViewMode && <Button onClick={() => handleAddSectionItem('bankDetails', { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '', isPrimary: true })}>
                    + Add Bank Detail
                  </Button>}
                </Stack>
              )}

            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            {!isViewMode && <Button variant="contained" onClick={handleSubmit}>Save</Button>}
          </DialogActions>
        </Dialog>
        <InvoicePaymentSummaryDialog open={openSummaryDialog}
        onClose={handleCloseSummaryDialog}
        data={invoiceAndPayments || []}
        buyerName={vendorBuyerName}
        />
      </Box>
    </PageWrapper>

  );
}
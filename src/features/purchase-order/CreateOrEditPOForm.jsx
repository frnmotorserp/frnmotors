import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import FormHelperText from '@mui/material/FormHelperText';
import { saveOrUpdatePOService, getPOItemsByPOIdService } from '../../services/purchaseOrderService';
import { SelectedVendorDetails } from './SelectedVendorDetails';
import PurchaseOrderItemManager from './PurchaseOrderItemManager';
import { useUI } from '../../context/UIContext'
import POA4View from './POA4View';
import Fab from '@mui/material/Fab';
import GetAppIcon from '@mui/icons-material/GetApp';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';

const paymentTermsOptions = [
  { label: 'Advance Payment', value: 'Advance Payment' },
  { label: 'Cash on Delivery', value: 'Cash on Delivery' },
  { label: 'Net 15 Days', value: 'Net 15 Days' },
  { label: 'Net 30 Days', value: 'Net 30 Days' },
  { label: 'Net 45 Days', value: 'Net 45 Days' },
  { label: 'Net 60 Days', value: 'Net 60 Days' },
  { label: 'Letter of Credit', value: 'Letter of Credit' },
  { label: 'Partial Advance, Balance on Delivery', value: 'Partial Advance, Balance on Delivery' },
  { label: 'Cash Against Delivery', value: 'Cash Against Delivery' },
];

const deliveryTerms = [
  { value: 'FOR – Destination', label: 'FOR – Destination' },
  { value: 'Ex-Factory', label: 'Ex-Factory' },
  { value: 'Door Delivery', label: 'Door Delivery' },
  { value: 'Delivery at Site (DAS)', label: 'Delivery at Site (DAS)' },
  { value: 'Transporter Delivery', label: 'Transporter Delivery' },
  { value: 'Self Pickup', label: 'Self Pickup' },
  { value: 'Ex Works (EXW)', label: 'Ex Works (EXW)' },
  { value: 'Free on Board (FOB)', label: 'Free on Board (FOB)' },
  { value: 'Cost, Insurance & Freight (CIF)', label: 'Cost, Insurance & Freight (CIF)' },
  { value: 'Delivered Duty Paid (DDP)', label: 'Delivered Duty Paid (DDP)' },
];

const getFormattedAddress = (addr) => {
  if (!addr) return '';
  const {
    addressLine1,
    addressLine2,
    district,
    stateName,
    pincode,
    country
  } = addr;

  return `${addressLine1}${addressLine2 ? `, ${addressLine2}` : ''}, ${district}, ${stateName} - ${pincode}, ${country}`;
};

const getFormattedLocationAddress = (addr) => {
  if (!addr) return '';
  const {
    locationName,
    address,
    districtName,
    stateName,
    pincode
  } = addr;

  return `${locationName}, ${address}, ${districtName}, ${stateName} - ${pincode}, India`;
};




const CreateOrEditPOForm = ({ mode = '', editData, onClose, onSuccess, vendorList, locationList, productList, filters, companyDetails= null }) => {
  const printRef = useRef(null);
  const [formData, setFormData] = useState({
    poId: '',
    vendorId: '',
    branchId: '',
    poDate: '',
    poItems: [],
    billingAddressId: '',
    deliveryAddressId: '',
    paymentTerm: '',
    deliveryTerm: '',
    expectedDeliveryDate: '',
    poNumber: ''
  });
  const { showSnackbar, showLoader, hideLoader } = useUI();

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedDeliveryLocation, setSelectedDeliveryLocation] = useState(null);
  const [selectedBillingLocation, setSelectedBillingLocation] = useState(null);
  const [poItems, setPoItems] = useState([])

  const [poViewData, setPOViewData] = useState({})

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: formData?.poNumber || 'PurchaseOrder',
    
    
    removeAfterPrint: true,
  });

  const handleChange = (key, val) => {
    setFormData({ ...formData, [key]: val });

    if (key === 'vendorId') {
      const vendor = vendorList.find(v => v.vendorId === val);
      setSelectedVendor(vendor);
      setFormData((prev) => ({ ...prev, billingAddressId: '' }));
    }
  };

  useEffect(() => {
    if (open && !editData) {
      const generatePONumber = () => {
        const date = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const po = `PO${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        return po;
      };

      setFormData((prev) => ({
        ...prev,
        poNumber: generatePONumber(),
      }));

    }

  }, [open]);

  useEffect(() => {
    if (open && editData) {
      setFormData({
        poId: editData.po_id,
        poNumber: editData.po_number,
        vendorId: editData.vendor_id,
        poDate: editData.po_date && dayjs(editData.po_date).format('YYYY-MM-DD'),
        expectedDeliveryDate: editData.expected_delivery_date && dayjs(editData.expected_delivery_date).format('YYYY-MM-DD'),
        billingAddressId: editData.vendor_location_id,
        deliveryAddressId: editData.delivery_location_id,
        billingAddress: editData.billing_address,
        deliveryAddress: editData.shipping_address,
        paymentTerm: editData.payment_terms,
        deliveryTerm: editData.delivery_terms,
        taxType: editData.tax_type,
        cgstAmount: parseFloat(editData.cgst_amount || 0),
        sgstAmount: parseFloat(editData.sgst_amount || 0),
        igstAmount: parseFloat(editData.igst_amount || 0),
        totalAmount: parseFloat(editData.total_amount || 0),
      });

      if (editData.po_id) {
        showLoader()
        getPOItemsByPOIdService(editData.po_id)
          .then((items) => {
            //setPoItems(items); // You must have a useState for `poItems`

            const mappedItems = items?.map(item => ({

              productId: item.product_id,
              pName: item.product_name,
              quantity: parseFloat(item.quantity || 0),
              unitPrice: parseFloat(item.unit_price || 0),
              uom: item.uom,
              cgstPercent: parseFloat(item.cgst_percent || 0),
              sgstPercent: parseFloat(item.sgst_percent || 0),
              igstPercent: parseFloat(item.igst_percent || 0),
              cgstAmount: parseFloat(item.cgst_amount || 0),
              sgstAmount: parseFloat(item.sgst_amount || 0),
              igstAmount: parseFloat(item.igst_amount || 0),
              totalAmount: parseFloat(item.total_amount || 0),
              productDescription: item.product_description || '',
            })) || [];
            setPoItems(mappedItems)
            console.log(mappedItems)
            showSnackbar("Available PO Items fetched!", "success");
          })
          .catch((error) => {
            console.error("Failed to load PO items", error);
            showSnackbar("Failed to load PO items", "error");
            setPoItems([])
          }).finally(() => {
            hideLoader()
          });
      }

      const vendor = vendorList.find(v => v.vendorId === editData.vendor_id);
      if (vendor) {
        setSelectedVendor(vendor);
        const billingAddr = vendor.addresses?.find(addr => addr.addressId === editData.vendor_location_id);
        if (billingAddr) setSelectedBillingLocation(billingAddr);
      }

      const deliveryLoc = locationList.find(loc => loc.locationId === editData.delivery_location_id);
      if (deliveryLoc) setSelectedDeliveryLocation(deliveryLoc);
    }
  }, [editData, vendorList, locationList]);




  useEffect(() => {
    //console.log("C")
    if ((selectedBillingLocation?.state && selectedDeliveryLocation?.stateId)) {
      let type = (selectedBillingLocation?.state == selectedDeliveryLocation?.stateId) ? 'INTRA' : 'INTER'
      setFormData(prev => {
        return {
          ...prev,
          taxType: type || ''
        }
      })
    }
    else {
      setFormData(prev => {
        return {
          ...prev,
          taxType: ''
        }
      })
    }

  }, [selectedDeliveryLocation, selectedBillingLocation])


  useEffect(() => {
    if (mode != 'view' || !selectedVendor || !formData || !poItems?.length) return;


    // const summary = poItems.reduce((acc, item) => {
    //   acc.totalAmount += item.totalAmount || 0;
    //   acc.cgstAmount += item.cgstAmount || 0;
    //   acc.sgstAmount += item.sgstAmount || 0;
    //   acc.igstAmount += item.igstAmount || 0;
    //   return acc;
    // }, {
    //   totalAmount: 0,
    //   cgstAmount: 0,
    //   sgstAmount: 0,
    //   igstAmount: 0
    // });

    // summary.grandTotal = summary.totalAmount + summary.cgstAmount + summary.sgstAmount + summary.igstAmount;

    const dataForView = {
      vendorDetails: {
        name: selectedVendor?.vendorName || '-',
        gst: selectedVendor?.gstin || '-',
        pan: selectedVendor?.pan || '-',
        mobile: selectedVendor?.phone || '-',
        email: selectedVendor?.email || '-',
        billingAddress: formData?.billingAddress,
      },
      paymentTerm: formData?.paymentTerm,
      deliveryTerm: formData?.deliveryTerm,
      deliveryAddress: formData?.deliveryAddress,
      poDetails: {
        poNumber: formData.poNumber || '-',
        poDate: formData.poDate || '-',
      },
      items: poItems.map(item => ({
        productName: item.pName,
        hsn: item.hsnCode,
        qty: item.quantity,
        uom: item.uom,
        rate: item.unitPrice || 0,
        totalAmount: item.totalAmount || 0,
        cgstPercent: item.cgstPercent || 0,
        sgstPercent: item.sgstPercent || 0,
        igstPercent: item.igstPercent || 0,
        cgstAmount: item.cgstAmount || 0,
        sgstAmount: item.sgstAmount || 0,
        igstAmount: item.igstAmount || 0,
      })),
      totalAmount: formData.totalAmount || 0,
      cgstAmount: formData.cgstAmount || 0,
      sgstAmount: formData.sgstAmount || 0,
      igstAmount: formData.igstAmount || 0,
    };

    console.log("Prepared POViewData:", dataForView, formData);
    setPOViewData(dataForView);

  }, [selectedVendor, formData, poItems]);


  const handleSubmit = async () => {
    console.log("Form", formData)

    // Validate Vendor
    if (!formData.vendorId) {
      showSnackbar('Please select a vendor!', 'error');
      return;
    }

    // Validate PO Date
    if (!formData.poDate) {
      showSnackbar('Please enter the Purchase Order date!', 'error');
      return;
    }

    // Validate Billing Address
    if (!formData.billingAddressId) {
      showSnackbar('Please select a billing address!', 'error');
      return;
    }

    // Validate Delivery Address
    if (!formData.deliveryAddressId) {
      showSnackbar('Please select a delivery address!', 'error');
      return;
    }



    // Validate Tax Type
    if (!formData.taxType) {
      showSnackbar('Please specify the tax type (INTRA/INTER) before adding items!', 'error');
      return;
    }




    // Validate PO Items
    if (!poItems.length) {
      showSnackbar('Please add at least one item to the Purchase Order!', 'error');
      return;
    }

    // Validate PO Number (should be auto-generated)
    if (!formData.poNumber) {
      showSnackbar('PO number is missing. Please try refreshing or reloading.', 'error');
      return;
    }

    // Validate Payment Terms
    if (!formData.paymentTerm) {
      showSnackbar('Please select payment terms!', 'error');
      return;
    }

    // Optional: Validate Delivery Terms
    if (!formData.deliveryTerm) {
      showSnackbar('Please select delivery terms!', 'error');
      return;
    }
    if (!selectedDeliveryLocation) {
      showSnackbar('Please select delivery location!', 'error');
      return;
    }
    if (!selectedBillingLocation) {
      showSnackbar('Please select vendor address!', 'error');
      return;
    }

    const invalidItems = poItems.filter((item) => {
      if (formData.taxType === 'INTRA') {
        return item.igstPercent > 0 || item.igstValue > 0;
      }
      if (formData.taxType === 'INTER') {
        return (
          item.cgstPercent > 0 || item.cgstValue > 0 ||
          item.sgstPercent > 0 || item.sgstValue > 0
        );
      }
      return false;
    });

    if (invalidItems.length) {
      const sqNos = invalidItems.map((_, idx) => idx + 1).join(', ');
      showSnackbar(
        `Invalid tax values for tax type ${formData.taxType === "INTER" ? "IGST" : "CGST + SGST"}. Please correct items at S/N: ${sqNos}`,
        'error'
      );
      return;
    }

    // Optional: Validate Expected Delivery Date
    /*if (!formData.expectedDeliveryDate) {
      showSnackbar('Please select expected delivery date!', 'error');
      return;
    }*/


    let totalAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    //  Calculate totals
    poItems.forEach(item => {
      totalAmount += Number(item.totalAmount || 0);
      cgstAmount += Number(item.cgstAmount || 0);
      sgstAmount += Number(item.sgstAmount || 0);
      igstAmount += Number(item.igstAmount || 0);
    });



    const poForm = {
      poId: formData.poId || null,
      poNumber: formData.poNumber,
      vendorId: formData.vendorId,
      poDate: formData.poDate,
      expectedDeliveryDate: formData.expectedDeliveryDate,
      shippingAddress: getFormattedLocationAddress(selectedDeliveryLocation || {}),
      billingAddress: getFormattedAddress(selectedBillingLocation || {}),
      paymentTerms: formData.paymentTerm,
      deliveryTerms: formData.deliveryTerm,
      taxType: formData.taxType || '',
      status: 'DRAFT',
      remarks: 'Please deliver on time',
      totalAmount: totalAmount,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      igstAmount: igstAmount,

      vendorLocationId: formData.billingAddressId || 0,
      deliveryLocationId: formData.deliveryAddressId || 0,
      poItems: poItems || []
    };


    showLoader()
    saveOrUpdatePOService(poForm)
      .then((response) => {
        showSnackbar('Purchase Order saved successfully! Please fetch the updated PO List!', 'success');
        // Optionally, reset the form or navigate
        // resetForm();
        // navigate('/po-list');
         hideLoader()
        if(filters.vendorId === poForm.vendorId){
          onSuccess();
        }

        onClose();
      })
      .catch((error) => {
        console.error('Error saving PO:', error);
        showSnackbar('Failed to save Purchase Order. Please try again.', 'error');
         hideLoader()
      }).finally(() => {
       
      });
    // onSuccess();

  };

  return (
    <Box>



      {
        mode === 'view' ? <Box sx={{ position: 'relative' }}>
          <Fab
            color="warning"
            aria-label="download"
            sx={{
              position: 'fixed', bottom: 16,
              right: 16,
              zIndex: 1300
            }}
            onClick={() => handlePrint()}
          >
            <GetAppIcon />
          </Fab>
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Box sx={{ width: 'fit-content', mx: 'auto' }}>
              <POA4View ref={printRef} poData={poViewData} companyDetails={companyDetails} />
            </Box>
          </Box>
        </Box>

          :
          <Box mt={2}>
            <Grid container spacing={2}>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="PO Number"
                  size="small"
                  value={formData.poNumber}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    value={formData.vendorId}
                    label="Vendor"
                    onChange={(e) => {
                      handleChange('vendorId', e.target.value)
                      //handleChange('taxType', '')
                      setSelectedBillingLocation(null)
                    }}
                  >
                    {vendorList.map((v) => (
                      <MenuItem key={v.vendorId} value={v.vendorId} sx={{ color: v.status === true ? 'primary.main' : 'error.main', fontWeight: 500 }}> {v.vendorName}  </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="PO Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.poDate}
                  onChange={(e) => handleChange('poDate', e.target.value)}
                />
              </Grid>
            </Grid>

            <Box mt={3}>
              <SelectedVendorDetails vendor={selectedVendor} />

            </Box>

            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Select Vendor Address</Typography>
              {selectedVendor?.addresses?.length > 0 ? (<Grid container spacing={2}>
                {selectedVendor?.addresses?.map((addr) => (
                  <Grid item xs={12} md={6} key={addr.addressId}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor: formData.billingAddressId === addr.addressId ? 'primary.main' : 'grey.300',
                        backgroundColor: formData.billingAddressId === addr.addressId ? 'primary.lighter' : '#fff',
                      }}
                    >
                      <FormControlLabel
                        value={addr.addressId}
                        control={
                          <Radio
                            checked={formData.billingAddressId === addr.addressId}
                            onChange={() => {
                              handleChange('billingAddressId', addr.addressId)
                              setSelectedBillingLocation(addr)
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight={600}>{addr.addressType}</Typography>
                            <Typography variant="body2">
                              {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}
                              {addr.district}, {addr.stateName} - {addr.pincode}, {addr.country}
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>) : <Typography color='error' variant='caption' >No address available. Make sure you have selected a valid vendor/supplier.</Typography>}
            </Box>


            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Select Delivery Address</Typography>
              {locationList?.length > 0 ? (<Grid container spacing={2}>
                {locationList?.map((addr) => (
                  <Grid item xs={12} md={6} key={addr.locationId}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor: formData.deliveryAddressId === addr.locationId ? 'primary.main' : 'grey.300',
                        backgroundColor: formData.deliveryAddressId === addr.locationId ? 'primary.lighter' : '#fff',
                      }}
                    >
                      <FormControlLabel
                        value={addr.addressId}
                        control={
                          <Radio
                            checked={formData.deliveryAddressId === addr.locationId}
                            onChange={() => {
                              setSelectedDeliveryLocation(addr)
                              handleChange('deliveryAddressId', addr.locationId)
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight={600}>{addr.locationName}</Typography>
                            <Typography variant="body2">
                              {addr.address}, {addr.districtName}, {addr.stateName} - {addr.pincode}, {"India"}
                            </Typography>
                            {addr?.locationTypeNames?.map(lt => <Chip key={lt} size="small" label={lt} sx={{ mr: 1, mt: 1 }} />)}
                          </Box>
                        }
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>) : <Typography color='error' variant='caption' >No address available</Typography>}
            </Box>
            <Box mt={3}>
              <FormControl fullWidth size="small" >
                <InputLabel id="payment-term-label">Payment Term</InputLabel>
                <Select
                  labelId="payment-term-label"
                  id="payment-term"
                  value={formData.paymentTerm || ''}
                  label="Payment Term"
                  onChange={(e) => handleChange("paymentTerm", e.target.value)}
                >
                  {paymentTermsOptions.map((term) => (
                    <MenuItem key={term.value} value={term.value}>
                      {term.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box mt={3}>
              <TextField
                fullWidth
                type="date"
                label="Expected Delivery Date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={formData.expectedDeliveryDate}
                onChange={(e) => handleChange('expectedDeliveryDate', e.target.value)}
              />
            </Box>
            <Box mt={3}>
              <FormControl fullWidth size="small" >
                <InputLabel id="delivery-term-label">Delivery Term</InputLabel>
                <Select
                  labelId="delivery-term-label"
                  id="delivery-term"
                  value={formData.deliveryTerm || ''}
                  label="Delivery Term"
                  onChange={(e) => handleChange("deliveryTerm", e.target.value)}
                >
                  {deliveryTerms.map((term) => (
                    <MenuItem key={term.value} value={term.value}>
                      {term.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box mt={3}>
              <FormControl fullWidth size="small" >
                <InputLabel id="delivery-term-label">Tax Type</InputLabel>
                {

                  <Select
                    labelId="tax-type-label"
                    id="tax-type"
                    value={formData.taxType || ''}
                    label="Tax Type"
                    disabled={(!selectedBillingLocation?.state || !selectedDeliveryLocation?.stateId)}
                    onChange={(e) => handleChange("taxType", e.target.value)}
                  >
                    <MenuItem key={1} value={"INTRA"}>
                      CGST + SGST
                    </MenuItem>
                    <MenuItem key={2} value={"INTER"}>
                      IGST
                    </MenuItem>

                  </Select>
                }
                {(!selectedBillingLocation || !selectedDeliveryLocation) && <FormHelperText sx={{ color: 'error.main' }}>
                  Please select vendor address and delivery address to get Tax Type
                </FormHelperText>}
                {selectedBillingLocation?.state && selectedDeliveryLocation?.stateId && <FormHelperText sx={{ color: 'primary.main' }}>
                  {selectedBillingLocation?.state == selectedDeliveryLocation?.stateId ? 'CGST + SGST' : 'IGST'} - this is auto-calculated based on vendor and delivery location. Please be careful if you are manually selecting it.
                </FormHelperText>}

              </FormControl>



            </Box>
            <Box mt={3}>
              <PurchaseOrderItemManager productList={productList} taxType={formData.taxType || null} poItems={poItems} setPoItems={setPoItems} />
            </Box>


            <Box mt={3}>
              <Button variant="contained" onClick={handleSubmit}>
                {editData ? 'Update PO' : 'Create PO'}
              </Button>
            </Box>
          </Box>
      }




    </Box>


  );
};

export default CreateOrEditPOForm;
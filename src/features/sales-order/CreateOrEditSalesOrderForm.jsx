import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Autocomplete,
  Button,
  TextField,
  Box,
  Grid,
  Typography,
  MenuItem,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  FormControl,
  Alert,
  AlertTitle,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FiberPinIcon from "@mui/icons-material/FiberPin";
import dayjs from "dayjs";
import { useUI } from "../../context/UIContext";
import { useNavigate } from "react-router-dom";

import HomeIcon from "@mui/icons-material/Home";
import AddIcon from "@mui/icons-material/Add";
import StoreIcon from "@mui/icons-material/Store";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PlaceIcon from "@mui/icons-material/Place";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import GavelIcon from "@mui/icons-material/Gavel";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SalesOrderItemManager from "./SalesOrderItemManager";
import OrderSummary from "./OrderSummery";
import LockPersonIcon from "@mui/icons-material/LockPerson";

import {
  saveOrUpdateSalesOrderService,
  listAllAvailableSalebleItems,
} from "../../services/salesService";

const paymentTermsOptions = [
  { label: "Advance Payment", value: "Advance Payment" },
  { label: "Cash on Delivery", value: "Cash on Delivery" },
  { label: "Net 15 Days", value: "Net 15 Days" },
  { label: "Net 30 Days", value: "Net 30 Days" },
  { label: "Net 45 Days", value: "Net 45 Days" },
  { label: "Net 60 Days", value: "Net 60 Days" },
  { label: "Letter of Credit", value: "Letter of Credit" },
  {
    label: "Partial Advance, Balance on Delivery",
    value: "Partial Advance, Balance on Delivery",
  },
  { label: "Cash Against Delivery", value: "Cash Against Delivery" },
  { label: "Payment On Receive Product", value: "Payment On Receive Product" },
];

const paymentStatusOptions = [
  { label: "Unpaid", value: "UNPAID" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" },
  { label: "Paid", value: "PAID" },
];

function formatSalesOrderForAPI(data) {
  const apiOrder = [
    "salesOrderId",
    "salesOrderCode",
    "orderDate",
    "orderType",
    "expectedDeliveryDate",
    "dispatchMode",
    "bookedByUserId",
    "customerId",
    "dealerId",
    "companyId",
    "companyAddress",
    "billingAddress",
    "shippingAddress",
    "companyStateCode",
    "billingStateCode",
    "shippingStateCode",
    "transportMode",
    "distanceKm",
    "paymentTerms",
    "remarks",
    "subtotal",
    "discountAmount",
    "taxableAmount",
    "taxType",
    "cgstAmount",
    "sgstAmount",
    "igstAmount",
    "totalTax",
    "grandTotal",
    "status",
    "paymentStatus",
    "salesLocationId",
    "createdBy",
    "updatedBy",
    "irn",
    "ackNo",
    "ackDate",
    "signedQrCode",
    "cancelledAt",
    "cancellationReason",
    "transporterName",
    "vehicleNo",
  ];

  const formatted = {};
  apiOrder.forEach((key) => {
    formatted[key] = data[key] !== undefined ? data[key] : null;
  });

  return formatted;
}

const CreateOrEditSalesOrderForm = ({
  open,
  handleClose,
  mode,
  editData,
  onSuccess,
  companyList,
  customerList,
  stateList,
  dealerList,
  locationList,
  userList,
}) => {
  const navigate = useNavigate();
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [saleableItemsList, setSaleableItemsList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orderData, setOrderData] = useState({
    salesOrderId: null,
    salesOrderCode: "",

    orderDate: dayjs().format("YYYY-MM-DD") || null,
    orderType: "",
    expectedDeliveryDate: null,
    dispatchMode: "",
    bookedByUserId: "",
    customerId: "",
    dealerId: "",
    companyId: "",
    salesLocationId: "",
    companyAddress: "",
    billingAddress: "",
    shippingAddress: "",
    companyStateCode: "",
    billingStateCode: "",
    shippingStateCode: "",
    transportMode: "",
    distanceKm: "",
    paymentTerms: "",
    remarks: "",
    subtotal: 0,
    discountAmount: 0,
    taxableAmount: 0,
    taxType: "",
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTax: 0,
    grandTotal: 0,
    status: "CONFIRMED",
    paymentStatus: "UNPAID",
    createdBy: "",
    updatedBy: "",
    irn: "",
    ackNo: "",
    ackDate: "",
    signedQrCode: "",
    cancelledAt: "",
    cancellationReason: "",
    transporterName: "",
    vehicleNo: "",
    billingPincode: "",
    shippingPincode: "",
  });

  const [items, setItems] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [deliveryApplicable, setDeliveryApplicable] = useState("No");

  useEffect(() => {
    if (orderData.companyStateCode && orderData.billingStateCode) {
      const taxType =
        orderData.companyStateCode === orderData.billingStateCode
          ? "INTRA"
          : "INTER";
      handleFieldChange("taxType", taxType);
    } else {
      handleFieldChange("taxType", null);
    }
  }, [orderData.companyStateCode, orderData.billingStateCode]);

  useEffect(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    items?.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const discount = parseFloat(item.discountAmount) || 0;

      const lineTotal = qty * price;
      subtotal += lineTotal;
      discountAmount += discount;

      const lineTaxable = lineTotal - discount;
      taxableAmount += lineTaxable;

      cgstAmount += parseFloat(item.cgstAmount) || 0;
      sgstAmount += parseFloat(item.sgstAmount) || 0;
      igstAmount += parseFloat(item.igstAmount) || 0;
    });

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = taxableAmount + totalTax;

    setOrderData((prev) => {
      return {
        ...prev,
        subtotal,
        discountAmount,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalTax,
        grandTotal,
      };
    });
  }, [items]);

  const fetchAvailableSaleableItems = async (
    locationId,
    hideSnackbar = false
  ) => {
    // If no locationId is provided, clear the list and return
    if (!locationId) {
      setSaleableItemsList([]);
      !hideSnackbar && showSnackbar("Please select a location.", "warning");
      return;
    }

    showLoader();
    try {
      // Call the service with the locationId
      const res = await listAllAvailableSalebleItems(locationId);

      // Update the state with the fetched items
      setSaleableItemsList(res || []);

      // Show appropriate snackbar message
      !hideSnackbar &&
        showSnackbar(
          res?.length
            ? "Saleable items fetched!"
            : "No items found for this location.",
          res?.length ? "success" : "warning"
        );
    } catch (err) {
      console.error("Error fetching saleable items:", err);
      setSaleableItemsList([]);
      !hideSnackbar && showSnackbar("Failed to fetch saleable items", "error");
    } finally {
      hideLoader();
    }
  };

  // Generate code: OD + DateTime + random 4 digits
  const generateOrderCode = () => {
    const now = dayjs().format("YYYY-MM-DD");
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit
    return `FRN-${now}-${randomNum}`;
  };

  const copyAddressToClipboard = (addr) => {
    const addressParts = [
      addr.addressLine1,
      addr.addressLine2,
      addr.city,
      addr.district,
      addr.pincode,
      addr.stateName,
      addr.country,
    ].filter(Boolean); // Removes undefined/empty fields

    const addressString = addressParts.join(", ");
    navigator.clipboard.writeText(addressString);
  };

  useEffect(() => {
    /* getAllProductsService()
       .then(setProducts)
       .catch(() => setProducts([]));
     */

    if (mode === "edit" && editData) {
      setOrderData((prev) => ({ ...prev, ...editData }));
      setItems(editData.sales_items || []);
    } else {
      if (open) {
        setOrderData((prev) => ({
          ...prev,
          salesOrderId: null,
          salesOrderCode: generateOrderCode(),
          //salesInvoiceNo: `FRN/${dayjs().format("YYYY/MM/DD")}/`,
          orderDate: dayjs().format("YYYY-MM-DD"),

          status: "CONFIRMED",
        }));
        setItems([]);
      }
    }
  }, [mode, editData, open]);

  const handleFieldChange = (key, value) => {
    setOrderData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log("orderData:", orderData);
    console.log("items:", items);

    let errors = [];

    // Validation rules
    if (!orderData.customerId && !orderData.dealerId) {
      errors.push("Customer or Dealer is required!");
    }

    if (!orderData.companyId) {
      errors.push("Company must be selected!");
    }
    if (deliveryApplicable === "Yes" && !orderData.shippingAddress) {
      errors.push("Shipping address is required!");
    }
    if (deliveryApplicable === "Yes" && !orderData.shippingPincode) {
      errors.push("Shipping pincode is required!");
    }
    if (deliveryApplicable === "Yes" && !orderData.shippingStateCode) {
      errors.push("Shipping state is required!");
    }

    if (!orderData.billingAddress) {
      errors.push("Billing address is required!");
    }

    if (!orderData.billingPincode) {
      errors.push("Billing Pincode is required!");
    }

    if (!orderData.billingStateCode) {
      errors.push("Billing State is required!");
    }

    if (!items || items.length === 0) {
      errors.push("At least one product must be added!");
    }

    // Group items by productId
    const grouped = {};
    for (const item of items) {
      if (!grouped[item.productId]) {
        grouped[item.productId] = { qty: 0, serials: [] };
      }
      grouped[item.productId].qty += Number(item.quantity);
      let allSerials = item.serialNumbers?.map((x) => x.serial_number) || [];
      if (allSerials?.length > 0) {
        grouped[item.productId].serials.push(...allSerials);
      }
    }

    // Check validations
    for (const productId in grouped) {
      const stock = saleableItemsList?.find((s) => s.productId == productId);
      if (!stock) {
        errors.push(`Product ${productId} not found in stock`);
        continue;
      }

      // 1. Quantity check
      if (grouped[productId].qty > Number(stock.availableQuantity)) {
        errors.push(
          `Product ${stock.productName}: Ordered qty ${grouped[productId].qty} exceeds available ${stock.availableQuantity}`
        );
      }

      // 2. Serial duplicate check
      if (stock.serialNoApplicable) {
        const serials = grouped[productId].serials;
        const dupes = serials.filter((s, i) => serials.indexOf(s) !== i);
        if (dupes.length > 0) {
          errors.push(
            `Product ${stock.productName}: Duplicate serials ${[
              ...new Set(dupes),
            ].join(", ")}`
          );
        }
      }
    }

    // If errors exist → show them and stop
    if (errors.length > 0) {
      showSnackbar(errors, "error"); // You can also format with "\n" for multi-line
      return;
    }

    let formatedOrderDataForAPI = {
      salesOrderId: parseInt(orderData?.salesOrderId || null),
      salesOrderCode: orderData?.salesOrderCode || null,
      orderDate: orderData?.orderDate || null,
      orderType: orderData?.orderType || null,
      expectedDeliveryDate: orderData?.expectedDeliveryDate || null,
      dispatchMode: orderData?.dispatchMode || null,
      bookedByUserId: parseInt(orderData?.bookedByUserId) || null,
      customerId: parseInt(orderData?.customerId) || null,
      dealerId: parseInt(orderData?.dealerId) || null,
      companyId: parseInt(orderData?.companyId) || null,
      companyAddress: orderData?.companyAddress || null,
      billingAddress: orderData?.billingAddress || null,
      shippingAddress: orderData?.shippingAddress || null,
      companyStateCode: parseInt(orderData?.companyStateCode) || null,
      billingStateCode: parseInt(orderData?.billingStateCode) || null,
      shippingStateCode: parseInt(orderData?.shippingStateCode) || null,
      transportMode: orderData?.transportMode || null,
      distanceKm: parseFloat(orderData?.distanceKm || 0),
      paymentTerms: orderData?.paymentTerms || null,
      remarks: orderData?.remarks || null,
      subtotal: parseFloat(orderData?.subtotal || 0),
      discountAmount: parseFloat(orderData?.discountAmount || 0),
      taxableAmount: parseFloat(orderData?.taxableAmount || 0),
      taxType: orderData?.taxType || null,
      cgstAmount: parseFloat(orderData?.cgstAmount || 0),
      sgstAmount: parseFloat(orderData?.sgstAmount || 0),
      igstAmount: parseFloat(orderData?.igstAmount || 0),
      totalTax: parseFloat(orderData?.totalTax || 0),
      grandTotal: parseFloat(orderData?.grandTotal || 0),
      status: orderData?.status || null,
      paymentStatus: orderData?.paymentStatus || null,
      salesLocationId: orderData?.salesLocationId || null,
      createdBy: null,
      updatedBy: null,
      irn: orderData?.irn || null,
      ackNo: orderData?.ackNo || null,
      ackDate: orderData?.ackDate || null,
      signedQrCode: orderData?.signedQrCode || null,
      cancelledAt: orderData?.cancelledAt || null,
      cancellationReason: orderData?.cancellationReason || null,
      transporterName: orderData?.transporterName || null,
      vehicleNo: orderData?.vehicleNo || null,
      shippingPincode: orderData?.shippingPincode || null,
      billingPincode: orderData?.billingPincode || null,
    };

    let convertItemsForAPI = items?.map((item) => ({
      productId: item.productId,
      hsnCode: item.hsnCode,
      uom: item.uom,
      batchNo: null, // no data in source, so null
      //serialNo: null,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      discount: parseFloat(item.discountAmount) || 0,
      taxableValue:
        parseFloat(item.unitPrice) * parseFloat(item.quantity) -
        (parseFloat(item.discountAmount) || 0),
      cgstPercentage: parseFloat(item.cgstPercent) || 0,
      cgstAmount: parseFloat(item.cgstAmount) || 0,
      sgstPercentage: parseFloat(item.sgstPercent) || 0,
      sgstAmount: parseFloat(item.sgstAmount) || 0,
      igstPercentage: parseFloat(item.igstPercent) || 0,
      igstAmount: parseFloat(item.igstAmount) || 0,
      lineTotal: parseFloat(item.totalAmount) || 0,
      discountPercentage: parseFloat(item.discountPercent) || 0,
      serialNo: item.serialNoApplicable
        ? item.serialNumbers?.map((s) => s.serial_number)?.join(", ")
        : null,
      productSerialIds: item.serialNumbers?.map((s) => s.id) || [],
      serialNoApplicable: item.serialNoApplicable || false,
      chasisNo: item?.chasisNo || null,
      motorNo: item?.motorNo || null,
      controllerNo: item?.controllerNo || null,

      productColor: item?.productColor || null,

      charger: item?.charger || null,
      chargerSlNo: item?.chargerSlNo || null,
      battery: item?.battery || null,
      batterySlNo: item?.batterySlNo || null,
    }));

    showLoader();
    saveOrUpdateSalesOrderService(formatedOrderDataForAPI, convertItemsForAPI)
      .then(() => {
        showSnackbar("Sales Order saved successfully!", "success");
        handleClose();
        onSuccess && onSuccess();
        setOrderData({
          salesOrderId: null,
          salesOrderCode: "",
          //salesInvoiceNo: `FRN-${dayjs().format("YYYY-MM")}-`,
          orderDate: dayjs().format("YYYY-MM-DD") || null,
          orderType: "",
          expectedDeliveryDate: null,
          dispatchMode: "",
          bookedByUserId: "",
          customerId: "",
          dealerId: "",
          companyId: "",
          salesLocationId: "",
          companyAddress: "",
          billingAddress: "",
          shippingAddress: "",
          companyStateCode: "",
          billingStateCode: "",
          shippingStateCode: "",
          transportMode: "",
          distanceKm: "",
          paymentTerms: "",
          remarks: "",
          subtotal: 0,
          discountAmount: 0,
          taxableAmount: 0,
          taxType: "",
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTax: 0,
          grandTotal: 0,
          status: "CONFIRMED",
          paymentStatus: "UNPAID",
          createdBy: "",
          updatedBy: "",
          irn: "",
          ackNo: "",
          ackDate: "",
          signedQrCode: "",
          cancelledAt: "",
          cancellationReason: "",
          transporterName: "",
          vehicleNo: "",
          billingPincode: "",
          shippingPincode: "",
        });
      })
      .catch((err) => {
        console.error("Failed to save sales order:", err);
        showSnackbar("Failed to save sales order!", "error");
      })
      .finally(() => hideLoader());
  };

  const handleCompanySelect = (event, companyId) => {
    if (!companyId) return; // prevent deselection
    const selectedCompany = companyList.find((c) => c.companyId === companyId);
    if (selectedCompany) {
      handleFieldChange("companyId", selectedCompany.companyId);
      handleFieldChange("companyAddress", selectedCompany.address);
      handleFieldChange("companyStateCode", selectedCompany.stateId);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      fullScreen
      maxWidth="lg"
    >
      <DialogTitle>
        {mode === "edit" ? "Edit Sales Order" : "Create Sales Order"}
      </DialogTitle>
      <DialogContent dividers style={{ maxHeight: "80vh" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Order Code"
              value={orderData.salesOrderCode}
              size="small"
              fullWidth
              disabled
            />
          </Grid>
          {/* <Grid item xs={12} md={6}>
            <TextField
              label="Incoice Number"
              value={orderData.salesInvoiceNo}
              onChange={(e) =>
                handleFieldChange("salesInvoiceNo", e.target.value)
              }
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
            />
          </Grid> */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Order Date"
              type="date"
              value={orderData.orderDate}
              onChange={(e) => handleFieldChange("orderDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Select Company
            </Typography>
            <ToggleButtonGroup
              value={orderData.companyId || null}
              exclusive
              onChange={handleCompanySelect}
              fullWidth
              sx={{ flexWrap: "wrap", gap: 1 }}
            >
              {companyList?.map((company) => (
                <ToggleButton
                  key={company.companyId}
                  value={company.companyId}
                  sx={{
                    flex: "1 1 calc(50% - 8px)",
                    textAlign: "left",
                    justifyContent: "flex-start",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: "8px !important",
                    p: 2,
                    "&.Mui-selected": {
                      backgroundColor: "#1976d2",
                      color: "#fff",
                      "& .MuiSvgIcon-root": { color: "#fff" },
                      "&:hover": { backgroundColor: "#115293" },
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" width="100%">
                    <Box display="flex" alignItems="center" mb={1}>
                      <BusinessIcon
                        sx={{
                          mr: 1,
                          color:
                            orderData.companyId === company.companyId
                              ? "#fff"
                              : "#1976d2",
                        }}
                      />
                      <Typography variant="subtitle1" fontWeight={600}>
                        {company.businessName}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      GSTIN: {company.gstin}
                    </Typography>
                    <Typography variant="body2">{company.address}</Typography>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={12}>
            <FormLabel component="legend" sx={{ fontSize: 12, mb: 1 }}>
              Buyer Type
            </FormLabel>
            <ToggleButtonGroup
              color="primary"
              value={orderData.orderType}
              exclusive
              onChange={(e, newValue) => {
                if (newValue !== null) handleFieldChange("orderType", newValue);
                setSelectedCustomer(null);
                setSelectedDealer(null);
                if (newValue === "DEALER") {
                  handleFieldChange("customerId", "");
                } else {
                  handleFieldChange("dealerId", "");
                }

                handleFieldChange("billingStateCode", "");
                handleFieldChange("shippingAddress", "");
                handleFieldChange("shippingStateCode", "");
                handleFieldChange("billingAddress", "");
                handleFieldChange("shippingPincode", "");
                handleFieldChange("billingPincode", "");
              }}
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  border: "1px solid rgba(0,0,0,0.15)",
                  flex: 1,
                  py: 1,
                  transition: "0.3s",
                },
                "& .Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
              }}
            >
              <ToggleButton value="CUSTOMER">
                <PersonIcon sx={{ mr: 1 }} /> Customer
              </ToggleButton>
              <ToggleButton value="DEALER">
                <StoreIcon sx={{ mr: 1 }} /> Dealer
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {orderData.orderType === "CUSTOMER" && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Customer
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={9} md={10}>
                  <Autocomplete
                    options={customerList}
                    getOptionLabel={(option) => option.customerName || ""}
                    value={
                      customerList.find(
                        (c) => c.customerId === orderData.customerId
                      ) || null
                    }
                    onChange={(e, newValue) => {
                      handleFieldChange(
                        "customerId",
                        newValue ? newValue.customerId : ""
                      );
                      setSelectedCustomer(
                        customerList.find(
                          (c) => c.customerId === newValue.customerId
                        ) || null
                      );
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.customerId}>
                        {option.customerName}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer"
                        size="small"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={3} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    fullWidth
                    onClick={() => {
                      navigate("/dealer-customer/customerManagement");
                    }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          )}

          {orderData.customerId && selectedCustomer && (
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  boxShadow: 1,
                  backgroundColor: "#fafafa",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Customer Details
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    rowGap: 1.5,
                    columnGap: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PersonIcon
                      sx={{ fontSize: 18, color: "primary.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Name:</strong> {selectedCustomer?.customerName}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <BadgeIcon
                      sx={{ fontSize: 18, color: "text.secondary", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Code:</strong> {selectedCustomer?.customerCode}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PhoneIcon
                      sx={{ fontSize: 18, color: "success.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedCustomer?.phone}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <EmailIcon
                      sx={{ fontSize: 18, color: "info.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedCustomer?.email}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <GavelIcon
                      sx={{ fontSize: 18, color: "warning.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>GSTIN:</strong> {selectedCustomer?.gstin}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CreditCardIcon
                      sx={{ fontSize: 18, color: "secondary.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>PAN:</strong> {selectedCustomer?.pan}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <LockPersonIcon
                      sx={{ fontSize: 18, color: "secondary.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Aadhar No.:</strong> {selectedCustomer?.aadhar}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {selectedCustomer?.status === "true" ? (
                      <CheckCircleIcon
                        sx={{ fontSize: 18, color: "success.main", mr: 1 }}
                      />
                    ) : (
                      <CancelIcon
                        sx={{ fontSize: 18, color: "error.main", mr: 1 }}
                      />
                    )}
                    <Typography variant="body2">
                      <strong>Status:</strong>{" "}
                      {selectedCustomer?.status === "true"
                        ? "Active"
                        : "Inactive"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  boxShadow: 1,
                  backgroundColor: "#fafafa",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <LocationOnIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Billing Information
                  </Typography>
                </Box>

                <TextField
                  label="Billing Address"
                  value={orderData.billingAddress}
                  onChange={(e) =>
                    handleFieldChange("billingAddress", e.target.value)
                  }
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Billing Pincode"
                  value={orderData.billingPincode}
                  onChange={(e) =>
                    handleFieldChange("billingPincode", e.target.value)
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <FiberPinIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  }}
                />
                <TextField
                  select
                  label="Billing State"
                  value={orderData.billingStateCode}
                  onChange={(e) =>
                    handleFieldChange("billingStateCode", e.target.value)
                  }
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <PlaceIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  }}
                >
                  <MenuItem value="">Select State</MenuItem>
                  {stateList.map((state) => (
                    <MenuItem key={state.stateId} value={state.stateId}>
                      {state.stateName}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {deliveryApplicable === "Yes" && (
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    boxShadow: 1,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <LocalShippingIcon
                      sx={{ mr: 1, color: "secondary.main" }}
                    />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Delivery Information
                    </Typography>
                  </Box>

                  <TextField
                    label="Shipping Address"
                    value={orderData.shippingAddress}
                    onChange={(e) =>
                      handleFieldChange("shippingAddress", e.target.value)
                    }
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    label="Shipping Pincode"
                    value={orderData.shippingPincode}
                    onChange={(e) =>
                      handleFieldChange("shippingPincode", e.target.value)
                    }
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <FiberPinIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                      ),
                    }}
                  ></TextField>
                  <TextField
                    select
                    label="Shipping State"
                    value={orderData.shippingStateCode}
                    onChange={(e) =>
                      handleFieldChange("shippingStateCode", e.target.value)
                    }
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <PlaceIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                      ),
                    }}
                  >
                    <MenuItem value="">Select State</MenuItem>
                    {stateList.map((state) => (
                      <MenuItem key={state.stateId} value={state.stateId}>
                        {state.stateName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              )}
            </Grid>
          )}

          {orderData.orderType === "DEALER" && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Dealer
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={9} md={10}>
                  <Autocomplete
                    options={dealerList}
                    getOptionLabel={(option) => option.dealerName || ""}
                    value={
                      dealerList.find(
                        (d) => d.dealerId === orderData.dealerId
                      ) || null
                    }
                    onChange={(e, newValue) => {
                      handleFieldChange(
                        "dealerId",
                        newValue ? newValue.dealerId : ""
                      );
                      setSelectedDealer(
                        dealerList.find(
                          (d) => d.dealerId === newValue?.dealerId
                        ) || null
                      );
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.dealerId}>
                        {option.dealerName}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Dealer"
                        size="small"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={3} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    fullWidth
                    onClick={() => {
                      navigate("/dealer-customer/dealerManagement");
                    }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          )}

          {orderData.dealerId && selectedDealer && (
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  boxShadow: 1,
                  backgroundColor: "#fafafa",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Dealer Details
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    rowGap: 1.5,
                    columnGap: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PersonIcon
                      sx={{ fontSize: 18, color: "primary.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Name:</strong> {selectedDealer?.dealerName}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <BadgeIcon
                      sx={{ fontSize: 18, color: "text.secondary", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Code:</strong> {selectedDealer?.dealerCode}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PhoneIcon
                      sx={{ fontSize: 18, color: "success.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedDealer?.phone}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <EmailIcon
                      sx={{ fontSize: 18, color: "info.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedDealer?.email}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <GavelIcon
                      sx={{ fontSize: 18, color: "warning.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>GSTIN:</strong> {selectedDealer?.gstin}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CreditCardIcon
                      sx={{ fontSize: 18, color: "secondary.main", mr: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>PAN:</strong> {selectedDealer?.pan}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {selectedDealer?.status ? (
                      <CheckCircleIcon
                        sx={{ fontSize: 18, color: "success.main", mr: 1 }}
                      />
                    ) : (
                      <CancelIcon
                        sx={{ fontSize: 18, color: "error.main", mr: 1 }}
                      />
                    )}
                    <Typography variant="body2">
                      <strong>Status:</strong>{" "}
                      {selectedDealer?.status ? "Active" : "Inactive"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {selectedDealer?.addresses?.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    boxShadow: 2,
                    backgroundColor: "#f9f9f9",
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <HomeIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ flexGrow: 1 }}
                    >
                      Saved Addresses
                    </Typography>
                  </Box>

                  {selectedDealer.addresses.map((addr, index) => (
                    <Box
                      key={addr.addressId}
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                        backgroundColor: "#ffffff",
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 2,
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          <strong>Type:</strong> {addr.addressType}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Primary:</strong>{" "}
                          {addr.isPrimary ? "Yes" : "No"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>State:</strong> {addr.stateName}
                        </Typography>

                        <Typography variant="body2">
                          <strong>District:</strong> {addr.district}
                        </Typography>
                        <Typography variant="body2">
                          <strong>City:</strong> {addr.city}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Country:</strong> {addr.country}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ gridColumn: "span 3" }}
                        >
                          <strong>Address:</strong> {addr.addressLine1},{" "}
                          {addr.addressLine2}
                        </Typography>

                        <Typography variant="body2">
                          <strong>Pincode:</strong> {addr.pincode}
                        </Typography>
                      </Box>

                      <Tooltip title="Copy Address">
                        <IconButton
                          onClick={() => copyAddressToClipboard(addr)}
                          size="small"
                          sx={{ position: "absolute", top: 10, right: 10 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Billing Info */}
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  boxShadow: 1,
                  backgroundColor: "#fafafa",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <LocationOnIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Billing Information
                  </Typography>
                </Box>

                <TextField
                  label="Billing Address"
                  value={orderData.billingAddress}
                  onChange={(e) =>
                    handleFieldChange("billingAddress", e.target.value)
                  }
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Billing Pincode"
                  value={orderData.billingPincode}
                  onChange={(e) =>
                    handleFieldChange("billingPincode", e.target.value)
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <FiberPinIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  }}
                />

                <TextField
                  select
                  label="Billing State"
                  value={orderData.billingStateCode}
                  onChange={(e) =>
                    handleFieldChange("billingStateCode", e.target.value)
                  }
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <PlaceIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  }}
                >
                  <MenuItem value="">Select State</MenuItem>
                  {stateList.map((state) => (
                    <MenuItem key={state.stateId} value={state.stateId}>
                      {state.stateName}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Shipping Info */}
              {deliveryApplicable === "Yes" && (
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    boxShadow: 1,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <LocalShippingIcon
                      sx={{ mr: 1, color: "secondary.main" }}
                    />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Delivery Information
                    </Typography>
                  </Box>

                  <TextField
                    label="Shipping Address"
                    value={orderData.shippingAddress}
                    onChange={(e) =>
                      handleFieldChange("shippingAddress", e.target.value)
                    }
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Shipping Pincode"
                    value={orderData.shippingPincode}
                    onChange={(e) =>
                      handleFieldChange("shippingPincode", e.target.value)
                    }
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <FiberPinIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                      ),
                    }}
                    sx={{ mb: 2 }}
                  ></TextField>
                  <TextField
                    select
                    label="Shipping State"
                    value={orderData.shippingStateCode}
                    onChange={(e) =>
                      handleFieldChange("shippingStateCode", e.target.value)
                    }
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <PlaceIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                      ),
                    }}
                  >
                    <MenuItem value="">Select State</MenuItem>
                    {stateList.map((state) => (
                      <MenuItem key={state.stateId} value={state.stateId}>
                        {state.stateName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              )}
            </Grid>
          )}

          {(orderData?.customerId || orderData?.dealerId) &&
            deliveryApplicable === "Yes" && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Transport Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Transport Mode"
                        name="transportMode"
                        value={orderData?.transportMode || ""}
                        onChange={(e) =>
                          handleFieldChange("transportMode", e.target.value)
                        }
                      >
                        <option value="Road">Road</option>
                        <option value="Rail">Rail</option>
                        <option value="Air">Air</option>
                        <option value="Ship">Ship</option>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Distance (in KM)"
                        name="distanceKm"
                        type="number"
                        value={orderData?.distanceKm}
                        onChange={(e) =>
                          handleFieldChange("distanceKm", e.target.value)
                        }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Transporter Name"
                        name="transporterName"
                        value={orderData?.transporterName}
                        onChange={(e) =>
                          handleFieldChange("transporterName", e.target.value)
                        }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Vehicle Number"
                        name="vehicleNo"
                        value={orderData?.vehicleNo}
                        onChange={(e) =>
                          handleFieldChange("vehicleNo", e.target.value)
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}

          {(orderData?.customerId || orderData?.dealerId) && (
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">
                    Is Delivery Applicable?
                  </FormLabel>
                  <RadioGroup
                    row
                    name="deliveryApplicable"
                    value={deliveryApplicable}
                    onChange={(e) => {
                      if (e.target.value === "No") {
                        console.log("e.target.value", e.target.value);
                        handleFieldChange("shippingAddress", "");
                        handleFieldChange("shippingStateCode", "");
                        handleFieldChange("shippingPincode", "");
                        handleFieldChange("vehicleNo", "");
                        handleFieldChange("transporterName", "");
                        handleFieldChange("distanceKm", "");
                        handleFieldChange("transportMode", "");
                      }
                      setDeliveryApplicable(e.target.value);
                    }}
                  >
                    <FormControlLabel
                      value={"Yes"}
                      control={<Radio />}
                      label="Yes"
                    />
                    <FormControlLabel
                      value={"No"}
                      control={<Radio />}
                      label="No"
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
            </Grid>
          )}

          {(orderData?.customerId || orderData?.dealerId) && (
            <Grid item xs={12} md={6}>
              <TextField
                select
                size="small"
                fullWidth
                label="Sales Point"
                name="salesLocationId"
                value={orderData?.salesLocationId}
                onChange={(e) => {
                  handleFieldChange("salesLocationId", e.target.value);
                  e.target.value && fetchAvailableSaleableItems(e.target.value);
                }}
              >
                {locationList?.map((loc) => (
                  <MenuItem key={loc.locationId} value={loc.locationId}>
                    {loc.locationName} — {loc.address}, {loc.districtName},{" "}
                    {loc.stateName} - {loc.pincode}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          {(orderData?.customerId || orderData?.dealerId) && (
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Salesperson who brought the customer"
                name="bookedByUserId"
                value={orderData?.bookedByUserId}
                onChange={(e) =>
                  handleFieldChange("bookedByUserId", e.target.value)
                }
              >
                {userList?.map((user) => (
                  <MenuItem key={user.userId} value={user.userId}>
                    {[
                      user.userFirstname,
                      user.userMiddlename,
                      user.userLastname,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {(orderData?.customerId || orderData?.dealerId) && (
            <Grid item xs={12} md={6}>
              <TextField
                select
                size="small"
                fullWidth
                label="Payment Terms"
                name="paymentTerms"
                value={orderData?.paymentTerms}
                onChange={(e) =>
                  handleFieldChange("paymentTerms", e.target.value)
                }
              >
                {paymentTermsOptions?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {(orderData?.customerId || orderData?.dealerId) && (
            <Grid item xs={12} md={6}>
              <TextField
                select
                size="small"
                fullWidth
                label="Payment Status"
                name="paymentStatus"
                value={orderData?.paymentStatus}
                onChange={(e) =>
                  handleFieldChange("paymentStatus", e.target.value)
                }
              >
                {paymentStatusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {(orderData?.customerId || orderData?.dealerId) && (
            <Grid item xs={12} md={12}>
              <FormLabel component="legend" sx={{ fontSize: 12, mb: 1 }}>
                Tax Type (Auto Calculated)
              </FormLabel>
              <ToggleButtonGroup
                color="primary"
                value={orderData.taxType}
                exclusive
                fullWidth
                sx={{
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    border: "1px solid rgba(0,0,0,0.15)",
                    flex: 1,
                    py: 1,
                    transition: "0.3s",
                  },
                  "& .Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  },
                }}
              >
                <ToggleButton value="INTRA" disabled>
                  CGST + SGST
                </ToggleButton>
                <ToggleButton value="INTER" disabled>
                  IGST
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography
                variant="caption"
                sx={{ color: "error.main", mt: 1, ml: 1 }}
              >
                <strong>Note:</strong> Provide both the <strong>Company</strong>{" "}
                and the{" "}
                <strong>
                  Customer's or Dealer's Billing Address with State
                </strong>{" "}
                to auto-calculate the Tax Type.
              </Typography>
            </Grid>
          )}

          <Grid item xs={12} md={12}>
            <TextField
              multiline
              minRows={3}
              size="small"
              fullWidth
              label="Remarks"
              name="remarks"
              value={orderData?.remarks}
              onChange={(e) => {
                handleFieldChange("remarks", e.target.value);
              }}
            ></TextField>
          </Grid>
        </Grid>

        {orderData?.salesLocationId &&
        saleableItemsList?.length > 0 &&
        orderData?.taxType ? (
          <>
            <SalesOrderItemManager
              locationId={orderData?.salesLocationId}
              productList={saleableItemsList || []}
              taxType={orderData?.taxType || []}
              poItems={items}
              setPoItems={setItems}
            />
            <OrderSummary orderData={orderData || {}} />
          </>
        ) : (
          <Alert
            severity="warning"
            sx={{
              mt: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: "#fff8e1",
              border: "1px solid #ffe082",
              color: "#795548",
              fontWeight: 500,
            }}
          >
            <AlertTitle>Action Required</AlertTitle>

            {!orderData?.salesLocationId && (
              <div>
                📍 Please select a <strong>Location</strong> you are selling
                form.
              </div>
            )}

            {orderData?.salesLocationId && !saleableItemsList?.length && (
              <div>
                🚫 No saleable products available for the selected location.
              </div>
            )}

            {!orderData?.taxType && (
              <div>
                🧾 Tax type not calculated — please select the{" "}
                <strong>Company</strong> and
                <strong> Billing Address</strong> of the Customer/Dealer to get
                the tax type.
              </div>
            )}

            <div
              style={{ marginTop: 6, fontStyle: "italic", fontSize: "0.85em" }}
            >
              Once all the above are resolved, you can add order items.
            </div>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => {
            handleClose();
            setOrderData({
              salesOrderId: null,
              salesOrderCode: "",
              orderDate: dayjs().format("YYYY-MM-DD") || null,
              orderType: "",
              expectedDeliveryDate: null,
              dispatchMode: "",
              bookedByUserId: "",
              customerId: "",
              dealerId: "",
              companyId: "",
              salesLocationId: "",
              companyAddress: "",
              billingAddress: "",
              shippingAddress: "",
              companyStateCode: "",
              billingStateCode: "",
              shippingStateCode: "",
              transportMode: "",
              distanceKm: "",
              paymentTerms: "",
              remarks: "",
              subtotal: 0,
              discountAmount: 0,
              taxableAmount: 0,
              taxType: "",
              cgstAmount: 0,
              sgstAmount: 0,
              igstAmount: 0,
              totalTax: 0,
              grandTotal: 0,
              status: "CONFIRMED",
              paymentStatus: "UNPAID",
              createdBy: "",
              updatedBy: "",
              irn: "",
              ackNo: "",
              ackDate: "",
              signedQrCode: "",
              cancelledAt: "",
              cancellationReason: "",
              transporterName: "",
              vehicleNo: "",
              billingPincode: "",
              shippingPincode: "",
            });
          }}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave}>
          {mode === "edit" ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrEditSalesOrderForm;

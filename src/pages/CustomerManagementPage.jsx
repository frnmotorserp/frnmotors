import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add, Edit, Delete, Visibility, Search } from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import BadgeIcon from "@mui/icons-material/Badge";
import OrderPaymentHistoryDialog from "../features/sales-order/OrderPaymentHistoryDialog";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

import PageWrapper from "../layouts/PageWrapper";
import {
  getAllCustomersService,
  saveOrUpdateCustomerService,
} from "../services/customerService";
import { useUI } from "../context/UIContext";
import { getAcceessMatrix } from "../utils/loginUtil";

const defaultCustomer = {
  customerId: null,
  customerName: "",
  customerCode: "",
  email: "",
  phone: "",
  pan: "",
  gstin: "",
  aadhar: "",
  addressline1: "",
  addressline2: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  country: "",
};

export default function CustomerManagementPage() {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [customers, setCustomers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(defaultCustomer);
  const [accessMatrix, setAccessMatrix] = useState({});
  const [openOrderPaymentDialog, setOpenOrderPaymentDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;

    const query = customerSearch.toLowerCase();

    return customers.filter(
      (c) =>
        c.customerName?.toLowerCase().includes(query) ||
        c.customerCode?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
    );
  }, [customers, customerSearch]);

  useEffect(() => {
    fetchCustomers();
    const access = getAcceessMatrix(
      "Dealer and Customer Management",
      "Customer Management"
    );
    setAccessMatrix(access);
  }, []);

  const fetchCustomers = async () => {
    showLoader();
    try {
      const data = await getAllCustomersService();
      setCustomers(data);
    } catch (err) {
      showSnackbar("Failed to fetch customers", "error");
    }
    hideLoader();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { customerName, customerCode, email, phone, pan, gstin, aadhar } =
      formData;

    // Validation
    if (!customerName || !customerCode || !phone) {
      return showSnackbar(
        "All fields are required except PAN/GST/Aadhar and email.",
        "warning"
      );
    }
    if (!pan && !gstin && !aadhar) {
      return showSnackbar(
        "Either Aadhar or PAN or GSTIN is required.",
        "warning"
      );
    }

    showLoader();
    try {
      await saveOrUpdateCustomerService(formData);
      showSnackbar("Customer saved successfully", "success");
      setOpenDialog(false);
      fetchCustomers();
    } catch (err) {
      showSnackbar("Error saving customer", "error");
    }
    hideLoader();
  };

  const handleAdd = () => {
    setFormData(defaultCustomer);
    setOpenDialog(true);
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: "Add Customer",
      buttonCallback: () => {
        handleAdd();
      },
      buttonIcon: <Add fontSize="small" />,
      access: accessMatrix?.create ?? false,
    },
  ];

  return (
    <PageWrapper title="Customer Management" actionButtons={ActionButtonsArr}>
      <Box m={2} mb={3} display="flex" justifyContent="flex-end">
        <TextField
          size="small"
          placeholder="Search by name, code, phone, email..."
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search fontSize="small" sx={{ mr: 1 }} />,
          }}
          sx={{ width: 300 }}
        />
      </Box>

      <Box m={2}>
        <Grid container spacing={3}>
          {filteredCustomers?.map((customer) => (
            <Grid item xs={12} sm={6} md={3} key={customer.customerId}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 8,
                  },
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* Card Header */}
                <Box
                  sx={{
                    background: "linear-gradient(135deg, #025f21, #2dbd10)",
                    color: "#fff",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "1.25rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {customer.customerName?.charAt(0) || "?"}
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {customer.customerName}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Code: {customer.customerCode}
                    </Typography>
                  </Box>
                </Box>

                {/* Card Content */}
                <CardContent
                  sx={{ p: 2, flexGrow: 1, backgroundColor: "#fafafa" }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PhoneIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body2">
                        {customer.phone || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <EmailIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body2">
                        {customer.email || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CreditCardIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body2">
                        PAN: {customer.pan || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <BadgeIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body2">
                        GSTIN: {customer.gstin || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PersonIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body2">
                        Aadhar: {customer.aadhar || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                {/* Actions */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    p: 2,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: "none" }}
                    onClick={() => {
                      setFormData(customer);
                      setOpenDialog(true);
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AccountBalanceWalletIcon />}
                    onClick={() => {
                      setFormData(customer);
                      setOpenOrderPaymentDialog(true);
                    }}
                  >
                    Orders & Payments
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {formData.customerId ? "Edit Customer" : "Add Customer"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Customer Name"
            value={formData.customerName}
            onChange={(e) => handleChange("customerName", e.target.value)}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Customer Code"
            value={formData.customerCode}
            onChange={(e) => handleChange("customerCode", e.target.value)}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Mobile"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
          <TextField
            fullWidth
            margin="dense"
            label="PAN Number"
            value={formData.pan}
            onChange={(e) => handleChange("pan", e.target.value)}
          />
          <TextField
            fullWidth
            margin="dense"
            label="GST Number"
            value={formData.gstin}
            onChange={(e) => handleChange("gstin", e.target.value)}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Aadhar Number"
            value={formData.aadhar}
            onChange={(e) => handleChange("aadhar", e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <OrderPaymentHistoryDialog
        open={openOrderPaymentDialog}
        onClose={() => {
          setFormData(defaultCustomer || {});
          setOpenOrderPaymentDialog(false);
        }}
        customerId={formData?.customerId}
        buyerName={formData?.customerName}
        partyType="CUSTOMER"
      />
    </PageWrapper>
  );
}

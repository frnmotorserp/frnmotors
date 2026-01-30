import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import Edit from "@mui/icons-material/Edit";
import Visibility from "@mui/icons-material/Visibility";
import dayjs from "dayjs";
import PageWrapper from "../layouts/PageWrapper";
import { useUI } from "../context/UIContext";
import { getAllVendorsService } from "../services/vendorService";
import { getInvoicesByFilterService } from "../services/invoicePaymentsService";
import { listAllPOsByVendorService } from "../services/purchaseOrderService";
import { getAcceessMatrix } from "../utils/loginUtil";
import { getAllProductsService } from "../services/productService";
import InvoiceForm from "../features/purchase-invoice/InvoiceForm";
import PaymentDialog from "../features/purchase-invoice/PaymentDialog";
import ViewPurchaseInvoiceDialog from "../features/purchase-invoice/ViewPurchaseInvoiceDialog";
import { softDeleteInvoiceService } from "../services/invoicePaymentsService";

// import PaymentDialog from '../features/invoice/PaymentDialog'; // Create this for payment tracking

const InvoiceManagement = () => {
  const { showSnackbar, showLoader, hideLoader } = useUI();

  const [vendorList, setVendorList] = useState([]);
  const [poList, setPoList] = useState([]);
  const [invoiceList, setInvoiceList] = useState([]);
  const [accessMatrix, setAccessMatrix] = useState({});
  const [filters, setFilters] = useState({
    vendorId: "",
    vendorName: "",
    poId: "",
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [mode, setMode] = useState("create");
  const [productList, setProductList] = useState([]);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  useEffect(() => {
    fetchVendors();
    const access = getAcceessMatrix(
      "Inventory Management",
      "Purchase Invoices and Payments"
    );
    setAccessMatrix(access);
  }, []);

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete?.invoice_id) return;

    try {
      showLoader();
      await softDeleteInvoiceService(invoiceToDelete.invoice_id);
      showSnackbar("Invoice deleted successfully", "success");
      setOpenDeleteDialog(false);
      setInvoiceToDelete(null);
      fetchInvoices(); // refresh list
    } catch (err) {
      showSnackbar(err?.message || "Failed to delete invoice", "error");
    } finally {
      hideLoader();
    }
  };

  const handleDialogOpen = (invoice = null) => {
    setEditingInvoice(invoice); // null for Add, invoice for Edit
    setOpenInvoiceDialog(true);
  };

  const handleDialogClose = () => {
    setEditingInvoice(null);
    setOpenInvoiceDialog(false);
  };

  const fetchVendors = () => {
    showLoader();
    getAllVendorsService()
      .then((res) => {
        if (res?.length) {
          setVendorList(res);
        } else {
          showSnackbar("No vendors found", "warning");
        }
      })
      .catch(() => showSnackbar("Failed to fetch vendors", "error"))
      .finally(() => {
        hideLoader();
        getProductListAPICall(true);
      });
  };
  const fetchALLPOsByVendors = (vendorId, vendorName) => {
    showLoader();
    listAllPOsByVendorService(vendorId)
      .then((res) => {
        if (res?.length) {
          const posWithAll = [
            { po_id: "", po_number: "All POs" },
            ...(res || []),
          ];
          setPoList(posWithAll);
        } else {
          setPoList([]);
          showSnackbar(`No PO found under ${vendorName}`, "warning");
        }
      })
      .catch(() => {
        setPoList([]);
        showSnackbar(`Failed to fetch POs under ${vendorName}`, "error");
      })
      .finally(() => {
        hideLoader();
      });
  };

  const getProductListAPICall = (hideSnackbar) => {
    showLoader();
    getAllProductsService()
      .then((res) => {
        if (res && res.length > 0) {
          setProductList(res);
          !hideSnackbar &&
            showSnackbar("Products fetched successfully!", "success");
        } else {
          setProductList([]);
          !hideSnackbar && showSnackbar("No Products found!", "warning");
        }
        hideLoader();
      })
      .catch((error) => {
        console.error("Error fetching Products:", error);
        setProductList([]);
        hideLoader();
        !hideSnackbar && showSnackbar("Failed to fetch Products!", "error");
      });
  };
  const fetchInvoices = () => {
    if (!filters.vendorId || !filters.startDate || !filters.endDate) {
      setError("Vendor and date range are required");
      return;
    }

    if (dayjs(filters.endDate).isBefore(filters.startDate)) {
      setError("End date cannot be before start date");
      return;
    }

    setError("");
    showLoader();
    getInvoicesByFilterService(
      filters.startDate,
      filters.endDate,
      filters.vendorId,
      filters.poId || 0
    )
      .then((res) => {
        setInvoiceList(res || []);
        if (!res?.length) showSnackbar("No invoices found", "warning");
      })
      .catch(() => showSnackbar("Failed to fetch invoices", "error"))
      .finally(() => hideLoader());
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const openPaymentForm = (invoice, mode) => {
    setSelectedInvoice(invoice);
    setOpenPaymentDialog(true);
    setMode(mode);
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: "Create Invoice",
      buttonCallback: () => {
        handleDialogOpen();
      },
      buttonIcon: <AddIcon fontSize="small" />,
      access: accessMatrix?.create ?? false,
    },
  ];
  return (
    <PageWrapper
      title="Purchase Invoice Management"
      actionButtons={ActionButtonsArr}
    >
      <Box m={2}>
        <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item>
              <Autocomplete
                size="small"
                options={vendorList}
                getOptionLabel={(o) => o.vendorName || ""}
                value={
                  vendorList.find((v) => v.vendorId === filters.vendorId) ||
                  null
                }
                onChange={(_, newValue) => {
                  handleFilterChange("vendorId", newValue?.vendorId || "");
                  handleFilterChange("vendorName", newValue?.vendorName || "");
                  handleFilterChange("poId", "");
                  handleFilterChange("poNumber", "");

                  newValue?.vendorId &&
                    fetchALLPOsByVendors(
                      newValue?.vendorId,
                      newValue?.vendorName
                    );
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Vendor" />
                )}
                sx={{ minWidth: 180 }}
              />
            </Grid>
            <Grid item>
              <Autocomplete
                size="small"
                options={poList}
                getOptionLabel={(o) => o.po_number || ""}
                value={poList.find((p) => p.po_id === filters.poId) || null}
                onChange={(_, newValue) => {
                  handleFilterChange("poId", newValue?.po_id || "");
                  handleFilterChange("poNumber", newValue?.po_number || "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="PO Number" />
                )}
                sx={{ minWidth: 180 }}
              />
            </Grid>
            <Grid item>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item>
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={fetchInvoices}>
                Get Invoices
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Box mt={2} width="100%" maxWidth="600px">
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
        </Box>

        {invoiceList.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "end", mb: 2, mr: 1 }}>
            <TextField
              size="small"
              placeholder="Search Invoice No."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ minWidth: 200 }}
            />
          </Box>
        )}

        <Grid container spacing={2}>
          {invoiceList
            ?.filter((inv) =>
              inv.invoice_number
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase())
            )
            ?.map((inv, idx) => (
              <Grid item xs={12} sm={6} md={4} key={inv.invoice_id}>
                <Card
                  elevation={6}
                  sx={{
                    borderRadius: 4,
                    transition: "transform 0.25s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.03)",
                      boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.15)",
                    },
                    background:
                      "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="text.secondary"
                      gutterBottom
                    >
                      #{idx + 1} — Invoice:{" "}
                      <strong>{inv.invoice_number}</strong>
                    </Typography>

                    <Typography
                      variant="h5"
                      fontWeight={800}
                      color="primary"
                      sx={{ mb: 1 }}
                    >
                      ₹{" "}
                      {Math.round(
                        Number(inv.total_invoice_amount || 0)
                      )?.toLocaleString()}
                    </Typography>

                    <Box mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Vendor: <strong>{inv.vendor_name}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        PO Number: <strong>{inv.po_number}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {dayjs(inv.invoice_date).format("DD MMM YYYY")}
                      </Typography>
                    </Box>

                    <Box
                      mt={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      {/* <Chip
                        size="small"
                        label={inv.payment_status}
                        color={
                          inv.payment_status === "PAID"
                            ? "success"
                            : inv.payment_status === "PARTIAL"
                            ? "warning"
                            : inv.payment_status === "OVERPAID"
                            ? "error"
                            : "default"
                        }
                        variant="filled"
                      /> */}
                      <Typography variant="caption" color="text.secondary">
                        Tax: ₹ {inv.total_tax_amount}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions
                    sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}
                  >
                    {accessMatrix?.create && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<Edit />}
                        onClick={() => handleDialogOpen(inv)}
                      >
                        Edit
                      </Button>
                    )}
                    {accessMatrix?.create && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => handleDeleteClick(inv)}
                      >
                        Delete
                      </Button>
                    )}

                    {/* <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                      }}
                      onClick={() => openPaymentForm(inv, 'create')}
                    >
                      Add/Edit Payments
                    </Button> */}
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<Visibility />}
                      onClick={() => openPaymentForm(inv, "view")}
                    >
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
        </Grid>
        <ViewPurchaseInvoiceDialog
          open={openPaymentDialog}
          invoice={selectedInvoice}
          onClose={() => setOpenPaymentDialog(false)}
        />

        {/*openPaymentDialog && (
          <Dialog
            open={openPaymentDialog}
            onClose={() => setOpenPaymentDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Invoice & Payment Details
              <IconButton
                onClick={() => setOpenPaymentDialog(false)}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <DialogContent dividers>
                <PaymentDialog
                  mode={mode}
                  invoice={selectedInvoice}
                  onClose={() => setOpenPaymentDialog(false)}
                />
              </DialogContent>
            </DialogContent>
          </Dialog>
        )*/}

        {openInvoiceDialog && (
          <Dialog
            open={openInvoiceDialog}
            //onClose={handleDialogClose}
            maxWidth="xl"
            fullWidth
          >
            <DialogTitle>
              {editingInvoice ? "Edit Invoice" : "Create Invoice"}
              <IconButton
                onClick={handleDialogClose}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <InvoiceForm
                vendorList={vendorList}
                productList={productList || []}
                invoice={editingInvoice}
                onClose={handleDialogClose}
                onSaved={() => {
                  fetchInvoices(true); // reload list
                  handleDialogClose();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </Box>
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Confirm Delete
          <IconButton
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete invoice{" "}
            <strong>{invoiceToDelete?.invoice_number}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            This action is reversible only from database.
          </Typography>
        </DialogContent>

        <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
          <Button variant="outlined" onClick={() => setOpenDeleteDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </CardActions>
      </Dialog>
    </PageWrapper>
  );
};

export default InvoiceManagement;

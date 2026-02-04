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
import { getGRNsByFilterService } from "../services/grnService";
import { listAllPOsByVendorService } from "../services/purchaseOrderService";
import { getAcceessMatrix } from "../utils/loginUtil";
import { getAllLocationListService } from "../services/locationService";
import { getAllCompanyDetailsService } from "../services/locationService";

import GRNForm from "../features/grn/GRNForm";
import GRNItemManagement from "../features/grn/GRNItemManagement";

// import GRNItemManagement from '../features/invoice/GRNItemManagement'; // Create this for payment tracking

const GrnManagement = () => {
  const { showSnackbar, showLoader, hideLoader } = useUI();

  const [vendorList, setVendorList] = useState([]);
  const [poList, setPoList] = useState([]);
  const [grnList, setGrnList] = useState([]);
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
  const [openGrnItemManager, setOpenGrnItemManager] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);

  const [openGRNDialog, setOpenGRNDialog] = useState(false);
  const [editingGRN, setEditingGRN] = useState(null);
  const [mode, setMode] = useState("create");
  const [locationList, setLocationList] = useState([]);
  const [companyDetails, setCompanyDetails] = useState(null);

  useEffect(() => {
    fetchVendors();
    getLocationListAPICall(true);
    getAllCompanyDetailsAPICall(true);
    const access = getAcceessMatrix(
      "Inventory Management",
      "Goods Received Note"
    );
    setAccessMatrix(access);
  }, []);

  const handleDialogOpen = (invoice = null, mode) => {
    setEditingGRN(invoice); // null for Add, invoice for Edit
    setOpenGRNDialog(true);
    setMode(mode);
  };

  const handleDialogClose = () => {
    setEditingGRN(null);
    setOpenGRNDialog(false);
  };

  const getAllCompanyDetailsAPICall = (hideSnackbar) => {
    showLoader();
    getAllCompanyDetailsService()
      .then((res) => {
        if (res && res.length > 0) {
          setCompanyDetails(res[0]);
          console.log(res);
          !hideSnackbar &&
            showSnackbar("Company Details fetched successfully!", "success");
        } else {
          setCompanyDetails(null);
          !hideSnackbar && showSnackbar("No Company Details found!", "warning");
        }
        hideLoader();
      })
      .catch((error) => {
        console.error("Error fetching Company Details:", error);
        setCompanyDetails(null);
        hideLoader();
        !hideSnackbar &&
          showSnackbar("Failed to fetch Company Details!", "error");
      });
  };

  const getLocationListAPICall = (hideSnackbar) => {
    showLoader();
    getAllLocationListService()
      .then((res) => {
        if (res && res.length > 0) {
          setLocationList(res);
          !hideSnackbar &&
            showSnackbar("Locations fetched successfully!", "success");
        } else {
          setLocationList([]);
          !hideSnackbar && showSnackbar("No Locations found!", "warning");
        }
        hideLoader();
      })
      .catch((error) => {
        console.error("Error fetching Locations!", error);
        setLocationList([]);
        hideLoader();
        showSnackbar("Failed to fetch Locations!", "error");
      });
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
      .finally(() => hideLoader());
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
    getGRNsByFilterService(
      filters.vendorId,
      filters.poId || 0,
      filters.startDate,
      filters.endDate
    )
      .then((res) => {
        setGrnList(res || []);
        if (!res?.length) showSnackbar("No GRN found", "warning");
      })
      .catch(() => showSnackbar("Failed to fetch GRNs", "error"))
      .finally(() => hideLoader());
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const openPaymentForm = (invoice, mode) => {
    setSelectedGRN(invoice);
    setOpenGrnItemManager(true);
    setMode(mode);
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: "Create GRN",
      buttonCallback: () => {
        handleDialogOpen(null, "create");
      },
      buttonIcon: <AddIcon fontSize="small" />,
      access: accessMatrix?.create ?? false,
    },
  ];
  return (
    <PageWrapper title="Goods Received Note" actionButtons={ActionButtonsArr}>
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
                Get GRNs
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Box mt={2} width="100%" maxWidth="600px">
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
        </Box>

        {grnList.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "end", mb: 2, mr: 1 }}>
            <TextField
              size="small"
              placeholder="Search GRN No."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ minWidth: 200 }}
            />
          </Box>
        )}

        <Grid container spacing={2}>
          {grnList
            ?.filter((grn) =>
              grn.grn_number?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            ?.map((grn, idx) => (
              <Grid item xs={12} sm={6} md={4} key={grn.grn_id}>
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
                      "linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="text.secondary"
                      gutterBottom
                    >
                      #{idx + 1} — GRN: <strong>{grn.grn_number}</strong>
                    </Typography>

                    <Typography
                      variant="h6"
                      fontWeight={800}
                      color="primary"
                      sx={{ mb: 1 }}
                    >
                      PO Number: {grn.po_number}
                    </Typography>

                    <Box mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Vendor: <strong>{grn.vendor_name}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {dayjs(grn.grn_date).format("DD MMM YYYY")}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Remarks: <i>{grn.remarks || "-"}</i>
                      </Typography>
                    </Box>

                    {/* <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        GRN ID: {grn.grn_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Loc ID: {grn.location_id}
                      </Typography>
                    </Box> */}
                  </CardContent>

                  <CardActions
                    sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}
                  >
                    {/*accessMatrix?.create && <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<Edit />}
                      onClick={() => handleDialogOpen(grn, 'edit')}
                    >
                      Edit
                    </Button>*/}
                    {/* <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                      }}
                      onClick={() => handleDialogOpen(grn, 'create')}
                    >
                      Add/Edit Items
                    </Button>*/}
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<Visibility />}
                      onClick={() => handleDialogOpen(grn, "view")}
                    >
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
        </Grid>

        {/*openGrnItemManager && (
          <Dialog open={openGrnItemManager} onClose={() => setOpenGrnItemManager(false)} maxWidth="md" fullWidth>
            <DialogTitle>
             GRN Item Management
              <IconButton onClick={() => setOpenGrnItemManager(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <DialogContent dividers>

                <GRNItemManagement mode={mode} invoice={selectedGRN} onClose={() => setOpenGrnItemManager(false)} />

              </DialogContent>
            </DialogContent>
          </Dialog>
        )*/}

        {openGRNDialog && (
          <Dialog
            open={openGRNDialog}
            onClose={handleDialogClose}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {mode === "view" ? "View GRN" : "Create GRN"}
              <IconButton
                onClick={handleDialogClose}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <GRNForm
                companyDetails={companyDetails}
                vendorList={vendorList}
                locationList={locationList}
                grn={editingGRN}
                onClose={handleDialogClose}
                mode={mode}
                onSaved={() => {
                  fetchInvoices(true); // reload list
                  handleDialogClose();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </Box>
    </PageWrapper>
  );
};

export default GrnManagement;

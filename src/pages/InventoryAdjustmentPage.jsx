import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Autocomplete from "@mui/material/Autocomplete";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import PageWrapper from "../layouts/PageWrapper";
import { useUI } from "../context/UIContext";
import { getAllProductsService } from "../services/productService";
import { getInventoryAdjustmentsByFilterService } from "../services/inventoryServices";
import InventoryAdjustmentTable from "../features/inventory/InventoryAdjustmentTable";
import BulkAdjustmentDialog from "../features/inventory/BulkAdjustmentDialog";
import InventoryMoveDialog from "../features/inventory/InventoryMoveDialog";
import { getAllLocationListService } from "../services/locationService";
import { getAcceessMatrix } from "../utils/loginUtil";
import AddIcon from "@mui/icons-material/Add";
import EmojiTransportationIcon from "@mui/icons-material/EmojiTransportation";

function InventoryAdjustmentPage() {
  const { showLoader, hideLoader, showSnackbar } = useUI();

  const [productList, setProductList] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [startDate, setStartDate] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogOpenMove, setDialogOpenMove] = useState(false);
  const [locationList, setLocationList] = useState([]);
  const [accessMatrix, setAccessMatrix] = useState({});

  useEffect(() => {
    fetchAllProducts();
    getLocationListAPICall(true);
    let access = getAcceessMatrix("Inventory Management", "Modify Inventory");
    setAccessMatrix(access);
  }, []);

  const fetchAllProducts = () => {
    showLoader();
    getAllProductsService()
      .then((res) => {
        if (res && res.length) {
          setProductList(res);
        } else {
          setProductList([]);
          showSnackbar("No products found", "warning");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        showSnackbar("Failed to fetch products", "error");
      })
      .finally(() => hideLoader());
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
        !hideSnackbar && showSnackbar("Failed to fetch Locations!", "error");
      });
  };

  const fetchAdjustments = () => {
    if (!selectedProductId || !startDate || !endDate) {
      showSnackbar("Please select product and date range", "warning");
      return;
    }

    showLoader();
    getInventoryAdjustmentsByFilterService({
      productId: selectedProductId,
      startDate,
      endDate,
    })
      .then((res) => {
        if (Array.isArray(res)) {
          console.log(res);
          setAdjustments(res);
          showSnackbar("Adjustments fetched successfully", "success");
        } else {
          setAdjustments([]);
          showSnackbar("No adjustments found", "info");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch adjustments:", err);
        showSnackbar("Error fetching adjustments", "error");
      })
      .finally(() => hideLoader());
  };
  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: "Modify Product Stock",
      buttonCallback: () => {
        setDialogOpen(true);
      },
      buttonIcon: <AddIcon fontSize="small" />,
      access: accessMatrix?.create ?? false,
    },
    {
      showHeaderButton: true,
      buttonText: "Move Product Stock",
      buttonCallback: () => {
        setDialogOpenMove(true);
      },
      buttonIcon: <EmojiTransportationIcon fontSize="small" />,
      access: accessMatrix?.create ?? false,
    },
  ];

  return (
    <PageWrapper title="Inventory Adjustments" actionButtons={ActionButtonsArr}>
      <Box sx={{ m: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={productList}
              getOptionLabel={(option) =>
                `${option.productName} (${option?.productCategoryName})` || ""
              }
              value={
                productList.find((p) => p.productId === selectedProductId) ||
                null
              }
              onChange={(event, newValue) =>
                setSelectedProductId(newValue ? newValue.productId : "")
              }
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Product"
                  variant="outlined"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button variant="contained" onClick={fetchAdjustments} fullWidth>
              Filter
            </Button>
          </Grid>
        </Grid>
      </Box>

      <InventoryAdjustmentTable adjustments={adjustments} />
      <BulkAdjustmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => {}}
        products={productList}
        locations={locationList}
        currentUserId={0}
      />
      <InventoryMoveDialog
        open={dialogOpenMove}
        onClose={() => setDialogOpenMove(false)}
        onSubmit={() => {}}
        products={productList}
        locations={locationList}
        currentUserId={0}
      />
    </PageWrapper>
  );
}

export default InventoryAdjustmentPage;

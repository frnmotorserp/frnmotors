import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  Autocomplete,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";

import { useUI } from "../../context/UIContext";
import { adjustInventoryService } from "../../services/inventoryServices";
import { getAllLocationListService } from "../../services/locationService";
import { getAllInventoryService } from "../../services/inventoryServices";
import { getProductCategoryListService } from "../../services/productCategoryServices";
import { getProductSerialsService } from "../../services/inventoryServices";

export default function InventoryMoveDialog({
  open,
  onClose,
  onSubmitSuccess,
}) {
  const { showLoader, hideLoader, showSnackbar } = useUI();

  /* ---------------- MASTER DATA ---------------- */
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  /* ---------------- FORM STATE ---------------- */
  const [moveDate, setMoveDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);

  const [items, setItems] = useState([
    {
      category: null,
      product: null,
      quantity: "",
      serialNumbers: [],
      serialOptions: [],
    },
  ]);

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    if (!open) return;

    const fetchInitialData = async () => {
      showLoader();
      try {
        const [inventory, locationList, categoryList] = await Promise.all([
          getAllInventoryService(),
          getAllLocationListService(),
          getProductCategoryListService(),
        ]);

        setProducts(inventory || []);
        setLocations(locationList || []);
        setCategories(categoryList || []);
      } catch (e) {
        console.error(e);
        showSnackbar("Failed to load inventory data", "error");
      } finally {
        hideLoader();
      }
    };

    fetchInitialData();
  }, [open]);

  /* ---------------- HELPERS ---------------- */

  const resetAndClose = () => {
    setMoveDate(dayjs().format("YYYY-MM-DD"));
    setFromLocation(null);
    setToLocation(null);
    setItems([
      {
        category: null,
        product: null,
        quantity: "",
        serialNumbers: [],
        serialOptions: [],
      },
    ]);
    onClose();
  };

  const handleItemChange = async (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    const current = updated[index];

    if (field === "category") {
      current.product = null;
      current.quantity = "";
      current.serialNumbers = [];
      current.serialOptions = [];
    }

    if (field === "product" || field === "quantity") {
      current.serialNumbers = [];
      current.serialOptions = [];

      if (
        current?.product?.serial_no_applicable &&
        Number(current.quantity) > 0 &&
        fromLocation
      ) {
        try {
          showLoader();
          const serials = await getProductSerialsService({
            productId: current.product.product_id,
            status: "in_stock",
          });
          hideLoader();

          const filtered = serials.filter(
            (s) => s.location_id === fromLocation.locationId
          );

          updated[index].serialOptions = filtered.map((s) => ({
            id: s.serial_id,
            serial_number: s.serial_number,
          }));

          if (!filtered.length) {
            showSnackbar("No in-stock serials at source location", "warning");
          }
        } catch (e) {
          hideLoader();
          console.error(e);
        }
      }
    }

    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        category: null,
        product: null,
        quantity: "",
        serialNumbers: [],
        serialOptions: [],
      },
    ]);
  };

  const removeItem = (idx) => {
    if (items.length === 1) return;
    const updated = [...items];
    updated.splice(idx, 1);
    setItems(updated);
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    if (!fromLocation || !toLocation) {
      showSnackbar("Select From and To locations", "warning");
      return;
    }

    const validItems = items.filter((i) => i.product && Number(i.quantity) > 0);

    if (!validItems.length) {
      showSnackbar("Add at least one valid item", "warning");
      return;
    }
    console.log(validItems);

    for (const it of validItems) {
      if (Number(it.quantity) > Number(it.product.quantity)) {
        showSnackbar(
          `Insufficient stock for ${it.product.product_name}`,
          "error"
        );
        return;
      }

      if (
        it.product.serial_no_applicable &&
        it.serialNumbers.length !== Number(it.quantity)
      ) {
        showSnackbar(
          `Serial count mismatch for ${it.product.product_name}`,
          "error"
        );
        return;
      }
    }

    const payload = validItems.flatMap((it) => {
      const qty = Number(it.quantity);

      return [
        {
          productId: it.product.product_id,
          locationId: fromLocation.locationId,
          quantityChange: -qty,
          reason: `Inventory Move to ${toLocation.locationName}. ${it.reason}`,
          adjustmentDate: moveDate,
          serialNumbersRemove: it.serialNumbers.map((s) => s.id),
          serialNumbersAdd: [],
        },
        {
          productId: it.product.product_id,
          locationId: toLocation.locationId,
          quantityChange: qty,
          reason: `Inventory Move from ${fromLocation.locationName}. ${it.reason}`,
          adjustmentDate: moveDate,
          serialNumbersRemove: [],
          serialNumbersAdd: it.serialNumbers.map((s) => s.serial_number),
        },
      ];
    });

    try {
      showLoader();
      const res = await adjustInventoryService(payload);
      if (res?.status) {
        showSnackbar("Inventory moved successfully", "success");
        resetAndClose();
        onSubmitSuccess?.();
      } else {
        showSnackbar(res?.message || "Move failed", "error");
      }
    } catch (e) {
      console.error(e);
      showSnackbar("Failed to move inventory", "error");
    } finally {
      hideLoader();
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <Dialog open={open} /*onClose={resetAndClose}*/ maxWidth="lg" fullWidth>
      <DialogTitle>
        Move Inventory
        <IconButton
          onClick={resetAndClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              type="date"
              label="Move Date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={locations}
              getOptionLabel={(o) => o.locationName || ""}
              value={fromLocation}
              onChange={(e, v) => {
                setFromLocation(v);
                setItems([
                  {
                    category: null,
                    product: null,
                    quantity: "",
                    serialNumbers: [],
                    serialOptions: [],
                  },
                ]);
              }}
              renderInput={(p) => <TextField {...p} label="Move From" />}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={locations}
              getOptionLabel={(o) => o.locationName || ""}
              value={toLocation}
              onChange={(e, v) => setToLocation(v)}
              renderInput={(p) => <TextField {...p} label="Move To" />}
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2 }}>
          Stock will be deducted from source and added to destination.
        </Alert>

        {items.map((item, idx) => (
          <Box
            key={idx}
            sx={{ mt: 3, p: 2, bgcolor: "#fafafa", borderRadius: 2 }}
          >
            <Typography fontWeight="bold" sx={{ m: 2 }}>
              Item {idx + 1}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={categories}
                  getOptionLabel={(o) => o.productCategoryName || ""}
                  value={item.category}
                  onChange={(e, v) => handleItemChange(idx, "category", v)}
                  renderInput={(p) => <TextField {...p} label="Category" />}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={products.filter(
                    (p) =>
                      p.location_id === fromLocation?.locationId &&
                      (!item.category ||
                        p.product_category_id ===
                          item.category.productCategoryId)
                  )}
                  getOptionLabel={(o) => o.product_name || ""}
                  value={item.product}
                  onChange={(e, v) => handleItemChange(idx, "product", v)}
                  renderInput={(p) => <TextField {...p} label="Product" />}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  type="number"
                  label="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(idx, "quantity", e.target.value)
                  }
                  fullWidth
                  helperText={
                    item.product
                      ? `Available: ${item.product.quantity} ${item.product.unit}`
                      : ""
                  }
                  InputProps={{
                    endAdornment: item.product?.unit ? (
                      <InputAdornment position="end">
                        {item.product.unit}
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={1}>
                <Button
                  color="error"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                >
                  ✕
                </Button>
              </Grid>
              <Grid item xs={12} sm={12}>
                <TextField
                  label="Reason"
                  value={item.reason}
                  onChange={(e) =>
                    handleItemChange(idx, "reason", e.target.value)
                  }
                  fullWidth
                />
              </Grid>

              {item.product?.serial_no_applicable && (
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={item.serialOptions}
                    getOptionLabel={(o) => o.serial_number}
                    value={item.serialNumbers}
                    onChange={(e, v) =>
                      handleItemChange(idx, "serialNumbers", v)
                    }
                    renderInput={(p) => (
                      <TextField
                        {...p}
                        label="Select Serial Numbers"
                        error={
                          Number(item.quantity) > 0 &&
                          item.serialNumbers.length !== Number(item.quantity)
                        }
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        ))}

        <Button sx={{ mt: 2 }} variant="outlined" onClick={addItem}>
          + Add Item
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={resetAndClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Move Inventory
        </Button>
      </DialogActions>
    </Dialog>
  );
}

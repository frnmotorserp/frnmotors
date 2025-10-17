import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CloseIcon from "@mui/icons-material/Close";
import { getProductSerialsService } from "../../services/inventoryServices";
import { useUI } from "../../context/UIContext";
import { adjustInventoryService } from "../../services/inventoryServices";

export default function BulkAdjustmentDialog({
  open,
  onClose,
  onSubmit,
  products,
  locations,
  currentUserId,
}) {
  const { showLoader, hideLoader, showSnackbar } = useUI();
  const [adjustments, setAdjustments] = useState([
    {
      productId: "",
      locationId: "",
      quantityChange: "",
      reason: "",
      adjustmentDate: dayjs(),
      serialNumbersAdd: "",
      serialNumbers: [],
       serialOptions: [],
       selectedCategory: ""
    }
  ]);

  const clearAndClose = () => {
    setAdjustments(
      [ {
      productId: "",
      locationId: "",
      quantityChange: "",
      reason: "",
      adjustmentDate: dayjs(),
      serialNumbersAdd: "",
      serialNumbers: [],
       serialOptions: [],
       selectedCategory: ""
    }]

    )
    onClose()
    
  }
  /*
  const handleChange = (index, field, value) => {
    const updated = [...adjustments];
    updated[index][field] = value;
    setAdjustments(updated);
  };
  */

  const handleChange = async (index, field, value) => {
  const updated = [...adjustments];
  if(field === "quantityChange" || field === "productId" || field === "locationId"){
    updated[index]["serialNumbersAdd"] = "";
    updated[index]["serialNumbers"] = [];
    updated[index]["serialOptions"] = [];
  }
 
   

     updated[index][field] = value;

  const current = updated[index];

  // Fetch serial numbers if needed
  if (
    (field === "quantityChange" || field === "productId" || field === "locationId") &&
    Number(current.quantityChange) < 0 && current.locationId && 
    products?.find((p) => p.productId === current.productId)?.serialNoApplicable
  ) {
    try {
      showLoader()
      const serials = await getProductSerialsService({
        productId: current.productId,
        status: "in_stock",
      });
      hideLoader()
      serials?.filter(x => x.location_id === current.locationId)?.length === 0 && showSnackbar('No instock serial found!', 'error')
      updated[index].serialOptions = serials?.filter(x =>  x.location_id === current.locationId)?.map((s) => {
        return {
          "serial_number" :  s.serial_number,
          "id" : s.serial_id
        }
       
      });
    } catch (err) {
      console.error("Failed to fetch serials", err);
      updated[index].serialOptions = [];
       hideLoader()
    }
  }

  setAdjustments(updated);
};

  const handleAddRow = () => {
    setAdjustments((prev) => [
      ...prev,
      {
        productId: "",
        locationId: "",
        quantityChange: "",
        reason: "",
        adjustmentDate: dayjs(),
        serialNumbersAdd: "",
      serialNumbers: [],
       serialOptions: [],
       selectedCategory: ""
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    const updated = [...adjustments];
    updated.splice(index, 1);
    setAdjustments(updated);
  };

  const handleSubmit = async () => {

     let hasError = false;
  let errorMsg = "";

  for (let i = 0; i < adjustments.length; i++) {
    const a = adjustments[i];

    const product = products.find(p => p.productId === a.productId);
    const quantity = Number(a.quantityChange);

    if (!a.productId || !a.locationId || !a.reason || isNaN(quantity)) {
      hasError = true;
      errorMsg = `Row ${i + 1}: Please fill all required fields correctly.`;
      break;
    }

    if (quantity === 0) {
      hasError = true;
      errorMsg = `Row ${i + 1}: Quantity cannot be 0.`;
      break;
    }

    if (product?.serialNoApplicable) {
      if (quantity > 0) {
        const serialArray = (a.serialNumbersAdd || "")
          .split(",")
          .map(s => s.trim())
          .filter(s => s.length > 0);

        if (serialArray.length !== quantity) {
          hasError = true;
          errorMsg = `Row ${i + 1}: Serial numbers count must match quantity (${quantity}).`;
          break;
        }
      }

      if (quantity < 0) {
        if ((a.serialNumbers?.length || 0) !== Math.abs(quantity)) {
          hasError = true;
          errorMsg = `Row ${i + 1}: You must select exactly ${Math.abs(quantity)} serial number(s).`;
          break;
        }
      }
    }
  }

  if (hasError) {
    showSnackbar(errorMsg, "error");
    return;
  }

    const formatted = adjustments.map((a) => {
      const rawInput = a.serialNumbersAdd || "";
    const serialNumbersArray = rawInput
      .split(",")                        // Split by comma
      .map(s => s.trim())                // Trim whitespace
      .filter(s => s.length > 0) || [];   
      const serialNumberIdsRemove = a.serialNumbers.map(x => x.id)
      return {
      ...a,
      quantityChange: Number(a.quantityChange || 0),
      serialNumbersAdd: serialNumbersArray || [],
       serialNumbersRemove: serialNumberIdsRemove || [],
      adjustmentDate: a.adjustmentDate.format("YYYY-MM-DD"),
    }});
    console.log("formatted", formatted)
    
    showLoader()
    adjustInventoryService(formatted)
  .then((res) => {
    if (res.status) {
      showSnackbar("Inventory adjusted successfully", "success");
      setAdjustments([
      {
        productId: "",
        locationId: "",
        quantityChange: "",
        reason: "",
        adjustmentDate: dayjs(),
        serialNumbersAdd: "",
      serialNumbers: [],
      
       serialOptions: [],
      },
    ]);
    onClose();
    } else {
      showSnackbar(res.message || "Something went wrong", "error");
    }
  })
  .catch((err) => {
    console.error(err);
    showSnackbar("Failed to adjust inventory", "error");
  })
  .finally(() => {
    hideLoader(false);
  });
   /* setAdjustments([
      {
        productId: "",
        locationId: "",
        quantityChange: "",
        reason: "",
        adjustmentDate: dayjs(),
        serialNumbersAdd: "",
      serialNumbers: [],
      
       serialOptions: [],
      },
    ]);
    */
    //onClose();
  };

  return (
    <Dialog open={open} onClose={clearAndClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        Bulk Inventory Adjustment
        <IconButton
          onClick={clearAndClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
   <DialogContent dividers>
  {adjustments.map((adj, index) => (
    <Box
      key={index}
      sx={{
        border: '1px solid #ddd',
        borderRadius: 2,
        p: 2,
        mb: 2,
        boxShadow: 1,
        backgroundColor: '#fafafa',
        position: "relative",
      }}
    >
     <Box
      sx={{
        position: "absolute",
        top: -10,
        left: -10,
        backgroundColor: "primary.main",
        color: "white",
        borderRadius: "50%",
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: "0.9rem",
      }}
    >
      {index + 1}
    </Box>
      <Grid container spacing={2} alignItems="center">
        
              {/* Category Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={[
                    ...new Map(products.map((p) => [p.productCategoryId, p])).values(),
                  ]}
                  getOptionLabel={(option) => option.productCategoryName || "-"}
                  value={
                    adj.selectedCategory
                      ? {
                          productCategoryId: adj.selectedCategory,
                          productCategoryName:
                            products.find((p) => p.productCategoryId === adj.selectedCategory)
                              ?.productCategoryName || "-",
                        }
                      : null
                  }
                  onChange={(e, newValue) => {
                    handleChange(index, "selectedCategory", newValue?.productCategoryId || "");
                    handleChange(index, "productId", ""); // Reset product if category changes
                  }}
                  renderInput={(params) => <TextField {...params} label="Category" />}
                />
              </Grid>
    
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            size="small"
            fullWidth
            options={products.filter(
                    (p) => !adj.selectedCategory || p.productCategoryId === adj.selectedCategory
                  )}
            getOptionLabel={(option) =>
              `${option.productName || "-"} (${option.productCategoryName || "-"})`
            }
            value={products.find((p) => p.productId === adj.productId) || null}
            onChange={(e, newValue) =>
              handleChange(index, "productId", newValue ? newValue.productId : "")
            }
            renderInput={(params) => <TextField {...params} label="Product" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            size="small"
            fullWidth
            options={locations}
            getOptionLabel={(option) => option.locationName || ""}
            value={locations.find((l) => l.locationId === adj.locationId) || null}
            onChange={(e, newValue) =>
              handleChange(index, "locationId", newValue ? newValue.locationId : "")
            }
            renderInput={(params) => <TextField {...params} label="Location" />}
          />
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <TextField
            size="small"
            fullWidth
            label="Qty Change"
            type="number"
            value={adj.quantityChange}
            onChange={(e) => handleChange(index, "quantityChange", e.target.value)}
              InputProps={{
                                endAdornment: products?.find((p) => p.productId === adj.productId)?.unit ? (
                                <InputAdornment position="end">{products?.find((p) => p.productId === adj.productId)?.unit }</InputAdornment>
                                ) : null
                            }}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={4}>
          <TextField
            size="small"
            fullWidth
            label="Reason"
            value={adj.reason}
            onChange={(e) => handleChange(index, "reason", e.target.value)}
          />
        </Grid>

        {/* <Grid item xs={12} sm={6} md={2}>
          <Button fullWidth variant="outlined" size="small">
            Fetch BOM
          </Button>
          <Typography>{products?.find((p) => p.productId === adj.productId)?.serialNoApplicable ? 'Yes' : 'No'}</Typography>
        </Grid> */}
        {(products.find(p => p.productId === adj.productId)?.serialNoApplicable === true && Number(adj.quantityChange) < 0)  && (
           <Grid item xs={12}>
    <Autocomplete
      multiple
      size="small"
      fullWidth
      getOptionLabel={(o) => o.serial_number || []}
      options={adj.serialOptions || []}
      value={adj.serialNumbers || []}
      onChange={(e, newValue) => handleChange(index, "serialNumbers", newValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Serial Numbers"
          error={
            !!adj.quantityChange &&
            (adj.serialNumbers?.length !== Math.abs(Number(adj.quantityChange)))
          }
          helperText={
            !!adj.quantityChange &&
            (adj.serialNumbers?.length !== Math.abs(Number(adj.quantityChange))
              ? `You must select exactly ${Math.abs(Number(adj.quantityChange))} serial number(s)`
              : "")
          }
        />
      )}
    />
  </Grid>
        )
         } 
  {(products.find(p => p.productId === adj.productId)?.serialNoApplicable === true && Number(adj.quantityChange) > 0)  &&(
  <Grid item xs={12} sm={12} md={12}>
    <TextField
      multiline
      minRows={3}
      label="Serial Numbers (comma separated)"
      fullWidth
      size="small"
      value={adj.serialNumbersAdd || ""}
      onChange={(e) => handleChange(index, "serialNumbersAdd", e.target.value)}
      error={
        !!adj.quantityChange &&
        (adj.serialNumbersAdd?.split(",").filter(s => s.trim()).length !== Number(adj.quantityChange))
      }
      helperText={
        !!adj.quantityChange &&
        (adj.serialNumbersAdd?.split(",").filter(s => s.trim()).length !== Number(adj.quantityChange)
          ? `Serial numbers count must match quantity (${adj.quantityChange})`
          : `Enter ${adj.quantityChange || 0} serial number(s)`)
      }
    />
  </Grid>
)}

        {adjustments.length > 1 && (
          <Grid item xs={12}>
            <Button
              onClick={() => handleRemoveRow(index)}
              color="error"
              size="small"
              sx={{ mt: 1 }}
            >
              Remove
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  ))}

  <Button
    onClick={handleAddRow}
    color="primary"
    variant="text"
    sx={{ fontWeight: 'bold', mb: 2 }}
    size="small"
  >
    + Add Adjustment
  </Button>
</DialogContent>

      <DialogActions>
        <Button onClick={clearAndClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

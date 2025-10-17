import React, { useEffect, useState, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Autocomplete from "@mui/material/Autocomplete";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useUI } from "../../context/UIContext";

import {
  getBOMByProductIdService,
  saveOrUpdateBOMService,
} from "../../services/bomServices";
import * as XLSX from "xlsx";

function ManageBOMDialog({ open, handleClose, product, allProducts = [] }) {
  const [bomList, setBOMList] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [grandTotalWithGST, setGrandTotalWithGST] = useState(0);
  const { showSnackbar, showLoader, hideLoader } = useUI();
  console.log("bomList", bomList);

  const totalByUnit = useMemo(() => {
        const result = {};
        bomList.forEach((item) => {
          const unit = item.unit || "N/A";
          const qty = parseFloat(item.quantity || 0);
          if (!result[unit]) {
            result[unit] = 0;
          }
          result[unit] += qty;
        });
        return result; // e.g., { kg: 15, pcs: 5 }
}, [bomList]);

  const handleExportToExcel = () => {
    const productName = product?.productName || "N/A";
    const productCode = product?.productCode || "N/A";
    const todayDate = new Date().toLocaleDateString();

    const totalItems = bomList?.length || 0;

    const worksheetHeader = [
      ["Product Name", productName],
      ["Product Code", productCode],
      ["Grand Total", grandTotal],
      ["GST", (Number(grandTotalWithGST) - Number(grandTotal)).toFixed(2)],
      ["Grand Total With GST", grandTotalWithGST],
      ["Total Items Needed", totalItems],
      ["Date", todayDate],
      [], // Empty row for spacing
    ];

    const worksheetColumns = [
      [
        "Component Name",
        "Product Code",
        "Quantity",
        "Unit",
        "Unit Price (Rs.)",
        "GST (%)",
        "Total Price Without GST (Rs.)",
        "Total Price With GST (Rs.)",
      ],
    ];

    const worksheetData = bomList?.map((item) => {
      const product =
        allProducts?.find(
          (p) => p.productId === Number(item.componentProductId)
        ) || {};
      return [
        product.productName || "N/A",
        product.productCode || "N/A",
        item.quantity,
        item.unit || "",
        item.unitPrice || 0,
        item.purchaseGstPercentage || 0,
        (
          parseFloat(item.unitPrice || 0) * parseFloat(item.quantity || 0)
        ).toFixed(2),
        (
          parseFloat(item.unitPrice || 0) * parseFloat(item.quantity || 0) * (1+ 0.01*parseFloat(item.purchaseGstPercentage ||0 ))
        ).toFixed(2)
      ];
    });

    const finalSheet = [
      ...worksheetHeader,
      ...worksheetColumns,
      ...worksheetData,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(finalSheet);

    // Set column widths for better display
    worksheet["!cols"] = [
      { wch: 30 }, // Component Name
      { wch: 20 }, // Product Code
      { wch: 10 }, // Quantity
      { wch: 10 }, // Unit
      { wch: 20 }, // Unit Price
      { wch: 15 }, // Total Price
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BOM");

    XLSX.writeFile(workbook, `BOM_${productName.replace(/\s+/g, "_")}.xlsx`);
  };

  useEffect(() => {
    if (open && product?.productId) {
      fetchBOM(product.productId);
    }
  }, [open, product]);
  useEffect(() => {
    const totalCost = bomList?.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice || 0);
      const qty = parseFloat(item.quantity || 0);
      return sum + price * qty;
    }, 0);
    const totalCostWithGST = bomList?.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice || 0);
      const qty = parseFloat(item.quantity || 0);
      const gst = 1 + 0.01*parseFloat(item.purchaseGstPercentage || 0);
      return sum + price * qty * gst;
    }, 0);

    const roundedTotal = totalCost.toFixed(2);
    setGrandTotal(roundedTotal || 0);
    setGrandTotalWithGST(totalCostWithGST.toFixed(2) || 0);
  }, [open, bomList]);

  const fetchBOM = async (productId) => {
    try {
      showLoader();
      const res = await getBOMByProductIdService(productId);
      const processed = (res || []).map((item) => ({
        tempId: Date.now() + Math.random(),
        componentProductId: item.componentProductId,
        quantity: item.quantity,
        ...item,
      }));
      setBOMList(processed);
      hideLoader();
    } catch {
      hideLoader();
      setBOMList([]);
      showSnackbar("Failed to fetch BOM List", "error");
    }
  };

  const handleAdd = () => {
    setBOMList((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        componentProductId: "",
        quantity: 1,
      },
    ]);
  };

  const handleChange = (tempId, field, value) => {
    setBOMList((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDelete = (tempId) => {
    setBOMList((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleSave = async () => {
    showLoader();
    const bomDTO = {
      productId: product.productId,
      bomName: `BOM-${product.productId}`,
      componentList: bomList.map((c) => ({
        componentProductId: Number(c.componentProductId),
        quantity: Number(c.quantity),
        parentComponentId: null,
      })),
    };

    try {
      await saveOrUpdateBOMService(bomDTO);
      handleClose();
      hideLoader();
    } catch (err) {
      hideLoader();
      showSnackbar("Failed to save BOM", "error");
      console.error("Error saving BOM:", err);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth fullScreen>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">
            Manage BOM for {product?.productName}
          </Typography>
          <Button
            variant="outlined"
            onClick={handleExportToExcel}
            disabled={bomList?.length === 0}
            startIcon={<FileDownloadIcon />}
            sx={{ mb: 2 }}
          >
            Download Excel
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
          <Box>
          <Button
            variant="outlined"
            onClick={handleAdd}
            startIcon={<AddCircleOutlineIcon />}
            sx={{ mb: 2 }}
          >
            Add Component
          </Button>
          </Box>
          <Box sx={{display: 'flex', gap: 2}}>
                <Box
  sx={{
    mb: 2,
    p: 3,
    border: "2px solid #1976d2",
    borderRadius: 3,
    background: "linear-gradient(145deg, #f9f9f9, #e3f2fd)",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
    maxWidth: 400,
    ml: "auto",
  }}
>
  <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
    Product Summary
  </Typography>
  <Divider sx={{ mb: 1 }} />

  {/* Materials Used (Qty per Unit) */}
  <Box sx={{ mb: 1 }}>
    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
      Materials Used:
    </Typography>
    {Object.entries(totalByUnit).map(([unit, qty]) => (
      <Typography key={unit} variant="body2" fontWeight={500} color="text.primary">
        {qty} {unit}
      </Typography>
    ))}
  </Box>

 
</Box>

          
         
<Box
  sx={{
    mb: 2,
    p: 2,
    border: "2px solid #1976d2",
    borderRadius: 3,
    background: "linear-gradient(145deg, #f9f9f9, #e3f2fd)",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    textAlign: "right",
    maxWidth: 350,
    ml: "auto",
  }}
>
  <Typography variant="h6" fontWeight={600} color="text.primary">
    Grand Total
  </Typography>
  <Divider sx={{ my: 1 }} />
  <Typography variant="subtitle1" fontWeight={500} color="text.secondary">
    Without GST: <b>₹ {grandTotal}</b>
  </Typography>
  <Typography
    variant="h6"
    fontWeight={700}
    color="success.main"
    sx={{ mt: 1 }}
  >
    With GST: ₹ {grandTotalWithGST}
  </Typography>
</Box>
          </Box>
         
        </Box>

        {bomList.length > 0 ? (
          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Component</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell width={160}>Unit Price (Rs.)</TableCell>
                  <TableCell width={160}>Total Price (Rs.)</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bomList.map((row) => {
                  console.log("row", row);
                  return (
                    <TableRow key={row.tempId}>
                      <TableCell>
                        {/*<TextField
                          select
                          fullWidth
                          size="small"
                          value={row.componentProductId || ""}
                          onChange={(e) => {
                            let selectedProduct =
                              allProducts?.find(
                                (x) => x.productId === e.target.value
                              ) || {};
                            handleChange(
                              row.tempId,
                              "componentProductId",
                              e.target.value
                            );
                            handleChange(
                              row.tempId,
                              "unit",
                              selectedProduct?.unit
                            );
                            handleChange(
                              row.tempId,
                              "unitPrice",
                              selectedProduct?.unitPrice
                            );
                          }}
                        >
                          <MenuItem value="">-- Select --</MenuItem>
                          {allProducts.map((p) => (
                            <MenuItem
                              key={p.productId}
                              value={p.productId}
                              unit={p.unit}
                            >
                              {p.productName} ({p.productCode})
                            </MenuItem>
                          ))}
                        </TextField>*/}
                        <Autocomplete
                          sx={{width: 270}}
                          size="small"
                          options={allProducts}
                          getOptionLabel={(option) =>
                            option?.productName && option?.productCode
                              ? `${option.productName} (${option.productCode})`
                              : ""
                          }
                          value={
                            allProducts.find(
                              (x) => x.productId === row.componentProductId
                            ) || null
                          }
                          onChange={(event, newValue) => {
                            handleChange(
                              row.tempId,
                              "componentProductId",
                              newValue?.productId || ""
                            );
                            handleChange(
                              row.tempId,
                              "unit",
                              newValue?.unit || ""
                            );
                            handleChange(
                              row.tempId,
                              "unitPrice",
                              newValue?.unitPrice || ""
                            );
                            handleChange(
                              row.tempId,
                              "purchaseGstPercentage",
                              newValue?.gstPercentagePurchase || ""
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Component Product"
                              variant="outlined"
                            />
                          )}
                          isOptionEqualToValue={(option, value) =>
                            option.productId === value.productId
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={row.quantity || ""}
                          onChange={(e) =>
                            handleChange(row.tempId, "quantity", e.target.value)
                          }
                          slotProps={{
                            input: {
                              endAdornment: (
                                <Typography sx={{ fontSize: "0.7rem", p: 1 }}>
                                  {row.unit}
                                </Typography>
                              ),
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display={'flex'} flexDirection={'column'}>
                          <Typography  variant="caption"><b>Without GST: </b>{row.unitPrice || ""}</Typography>
                          <Typography  variant="caption"><b>With GST: </b>{(Number(row.unitPrice || 0)*(1 + 0.01*Number((row.purchaseGstPercentage || 0))))?.toFixed(2)}</Typography>
                          <Typography  variant="caption"><b>GST: </b>{row.purchaseGstPercentage || "Not Available"}%</Typography>
                        </Box>
                        {/* <TextField
                          type="number"
                          size="small"
                          fullWidth
                          disabled
                          value={row.unitPrice || ""}
                          //onChange={(e) => handleChange(row.tempId, 'quantity', e.target.value)}
                        /> */}
                      </TableCell>
                      <TableCell>
                        <Box display={'flex'} flexDirection={'column'}>
                          <Typography variant="caption"><b>Without GST: </b>{ (Number(row.unitPrice) || 0) *
                            (Number(row.quantity) || 0)?.toFixed(2) || ""}</Typography>
                          <Typography  variant="caption"><b>With GST: </b>{(Number(row.unitPrice || 0)*(1 + 0.01*Number((row.purchaseGstPercentage || 0)))*Number((row.quantity) || 0))?.toFixed(2)}</Typography>
                        </Box>
                        {/* <TextField
                          type="number"
                          size="small"
                          fullWidth
                          disabled
                          value={
                            (parseFloat(row.unitPrice) || 0) *
                            (parseFloat(row.quantity) || 0).toFixed(2)
                          }
                          //onChange={(e) => handleChange(row.tempId, 'quantity', e.target.value)}
                        /> */}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(row.tempId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        ) : (
          <Typography>No BOM defined.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save BOM
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManageBOMDialog;

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import { saveOrUpdateInvoiceService } from "../../services/invoicePaymentsService";
import { useUI } from "../../context/UIContext";
import { listAllPOsByVendorService } from "../../services/purchaseOrderService";
import { getInvoiceWithItemsService } from "../../services/invoicePaymentsService";
import { getPOItemsByPOIdService } from "../../services/purchaseOrderService";

const mapPOItemsToInvoiceItems = (poItems = []) => {
  return poItems.map((item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.unit_price || 0);
    const discount = parseFloat(item.discount || 0);

    const taxable = qty * price - discount;
    const cgst = taxable * ((parseFloat(item.cgst_percent) || 0) / 100);
    const sgst = taxable * ((parseFloat(item.sgst_percent) || 0) / 100);
    const igst = taxable * ((parseFloat(item.igst_percent) || 0) / 100);

    return {
      product_id: item.product_id,
      hsn_code: item.hsn_code || "",
      uom: item.uom || "",
      quantity: qty,
      unit_price: price,
      discount: discount,

      taxable_value: taxable.toFixed(2),

      cgst_percent: parseFloat(item.cgst_percent || 0),
      sgst_percent: parseFloat(item.sgst_percent || 0),
      igst_percent: parseFloat(item.igst_percent || 0),

      cgst_amount: cgst.toFixed(2),
      sgst_amount: sgst.toFixed(2),
      igst_amount: igst.toFixed(2),

      line_total: (taxable + cgst + sgst + igst).toFixed(2),
    };
  });
};

const InvoiceForm = ({
  invoice,
  onClose,
  onSaved,
  vendorList,
  productList,
}) => {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [poList, setPoList] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);

  const [form, setForm] = useState({
    invoiceNumber: "",
    invoiceDate: dayjs().format("YYYY-MM-DD"),
    vendorId: "",
    poId: "",
    invoiceAmount: "",
    cgstAmount: "",
    sgstAmount: "",
    igstAmount: "",
    totalTaxAmount: "",
    totalInvoiceAmount: "",
    remarks: "",
    items: [],
  });

  useEffect(() => {
    if (invoice) {
      showLoader();
      getInvoiceWithItemsService(invoice.invoice_id)
        .then((res) => {
          console.log("RES:::::::", res);
          setForm({
            invoiceNumber: invoice.invoice_number,
            invoiceDate: dayjs(invoice.invoice_date).format("YYYY-MM-DD"),
            vendorId: invoice.vendor_id,
            poId: invoice.po_id,
            invoiceAmount: invoice.invoice_amount,
            cgstAmount: invoice.cgst_amount,
            sgstAmount: invoice.sgst_amount,
            igstAmount: invoice.igst_amount,
            totalTaxAmount: invoice.total_tax_amount,
            totalInvoiceAmount: invoice.total_invoice_amount,
            remarks: invoice.remarks || "",
            items: res?.items || [],
          });
        })
        .catch((error) => {
          console.log("Error", error);
          setForm({
            invoiceNumber: invoice.invoice_number,
            invoiceDate: dayjs(invoice.invoice_date).format("YYYY-MM-DD"),
            vendorId: invoice.vendor_id,
            poId: invoice.po_id,
            invoiceAmount: invoice.invoice_amount,
            cgstAmount: invoice.cgst_amount,
            sgstAmount: invoice.sgst_amount,
            igstAmount: invoice.igst_amount,
            totalTaxAmount: invoice.total_tax_amount,
            totalInvoiceAmount: invoice.total_invoice_amount,
            remarks: invoice.remarks || "",
            items: [],
          });
        })
        .finally(() => {
          hideLoader();
        });

      if (invoice.vendor_id) {
        fetchALLPOsByVendors(invoice.vendor_id);
      }
    }
  }, [invoice]);

  // auto-calc totals
  useEffect(() => {
    const subtotal = form.items.reduce(
      (sum, i) => sum + (parseFloat(i.taxable_value) || 0),
      0
    );
    // const discountTotal = form.items.reduce(
    //   (sum, i) => sum + (parseFloat(i.discount) || 0),
    //   0
    // );
    const cgst = form.items.reduce(
      (sum, i) => sum + (parseFloat(i.cgst_amount) || 0),
      0
    );
    const sgst = form.items.reduce(
      (sum, i) => sum + (parseFloat(i.sgst_amount) || 0),
      0
    );
    const igst = form.items.reduce(
      (sum, i) => sum + (parseFloat(i.igst_amount) || 0),
      0
    );

    const totalTax = cgst + sgst + igst;
    const totalInvoice = subtotal + totalTax;

    setForm((prev) => ({
      ...prev,
      invoiceAmount: subtotal.toFixed(2),
      cgstAmount: cgst.toFixed(2),
      sgstAmount: sgst.toFixed(2),
      igstAmount: igst.toFixed(2),
      totalTaxAmount: totalTax.toFixed(2),
      totalInvoiceAmount: totalInvoice.toFixed(2),
    }));
  }, [form.items]);

  const fetchALLPOsByVendors = (vendorId) => {
    showLoader();
    listAllPOsByVendorService(vendorId)
      .then((res) => setPoList(res || []))
      .catch(() => showSnackbar("Failed to fetch PO list", "error"))
      .finally(() => hideLoader());
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  //  ITEM HANDLERS
  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: "",
          hsn_code: "",
          uom: "",
          quantity: 1,
          unit_price: 0,
          discount: 0,
          taxable_value: 0,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 0,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          line_total: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, key, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [key]: value };
    //console.log(items)

    // recalc line totals
    const qty = parseFloat(items[index].quantity) || 0;
    const price = parseFloat(items[index].unit_price) || 0;
    const discount = parseFloat(items[index].discount) || 0;
    const taxable = qty * price - discount;

    const cgst = taxable * ((parseFloat(items[index].cgst_percent) || 0) / 100);
    const sgst = taxable * ((parseFloat(items[index].sgst_percent) || 0) / 100);
    const igst = taxable * ((parseFloat(items[index].igst_percent) || 0) / 100);

    items[index].taxable_value = taxable.toFixed(2);
    items[index].cgst_amount = cgst.toFixed(2);
    items[index].sgst_amount = sgst.toFixed(2);
    items[index].igst_amount = igst.toFixed(2);
    items[index].line_total = (taxable + cgst + sgst + igst).toFixed(2);

    setForm((prev) => ({ ...prev, items }));
  };

  const handleSubmit = () => {
    const {
      invoiceNumber,
      vendorId,
      poId,
      totalInvoiceAmount,
      totalTaxAmount,
    } = form;

    if (!invoiceNumber || !vendorId || !poId) {
      showSnackbar(
        "Please fill required fields - invoice number, vendor, po number",
        "error"
      );
      return;
    }

    if (parseFloat(totalInvoiceAmount || 0) <= 0) {
      showSnackbar("Total Invoice Amount can not be zero!", "error");
      return;
    }

    if (parseFloat(totalTaxAmount || 0) < 0) {
      showSnackbar("Total Tax Amount can not be negative!", "error");
      return;
    }

    showLoader();
    saveOrUpdateInvoiceService({
      ...form,
      invoiceId: invoice?.invoice_id || null,
    })
      .then(() => {
        showSnackbar("Invoice saved successfully", "success");
        onSaved?.();
      })
      .catch(() => showSnackbar("Failed to save invoice", "error"))
      .finally(() => hideLoader());
  };

  return (
    <Box mt={2}>
      <Grid container spacing={2}>
        {/* VENDOR + PO */}
        <Grid item xs={6}>
          <Autocomplete
            size="small"
            options={vendorList}
            getOptionLabel={(o) => o.vendorName || ""}
            value={vendorList.find((v) => v.vendorId === form.vendorId) || null}
            onChange={(_, newValue) => {
              handleChange("vendorId", newValue?.vendorId || "");
              handleChange("poId", "");
              fetchALLPOsByVendors(newValue?.vendorId);
            }}
            renderInput={(params) => <TextField {...params} label="Vendor" />}
          />
        </Grid>
        <Grid item xs={6}>
          <Autocomplete
            size="small"
            options={poList}
            getOptionLabel={(o) => o.po_number || ""}
            value={poList.find((p) => p.po_id === form.poId) || null}
            onChange={(_, newValue) => {
              handleChange("poId", newValue?.po_id || "");
              if (newValue?.po_id) {
                setSelectedPO(poList.find((p) => p.po_id === newValue.po_id));
              }
              console.log("RRRRR", newValue?.po_id, !newValue?.po_id);
              if (!newValue?.po_id) {
                setForm((prev) => ({ ...prev, items: [] }));
                return;
              }

              showLoader();
              getPOItemsByPOIdService(newValue?.po_id)
                .then((items) => {
                  const mappedItems = mapPOItemsToInvoiceItems(items || []);
                  setForm((prev) => ({ ...prev, items: mappedItems }));
                })
                .catch(() => {
                  showSnackbar("Failed to load PO items", "error");
                  setForm((prev) => ({ ...prev, items: [] }));
                })
                .finally(() => hideLoader());
            }}
            renderInput={(params) => (
              <TextField {...params} label="PO Number" />
            )}
          />
        </Grid>

        {/* INVOICE MASTER */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Invoice Number"
            value={form.invoiceNumber}
            onChange={(e) => handleChange("invoiceNumber", e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Invoice Date"
            value={form.invoiceDate}
            onChange={(e) => handleChange("invoiceDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* INVOICE ITEMS */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Invoice Items
          </Typography>

          {form?.items?.map((item, idx) => (
            <Card
              key={idx}
              variant="outlined"
              sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: 1 }}
            >
              <Grid container spacing={2} alignItems="center">
                {/* Product */}
                <Grid item xs={3}>
                  <Autocomplete
                    size="small"
                    options={productList}
                    getOptionLabel={(p) => p.productName || ""}
                    value={
                      productList?.find(
                        (p) => p.productId === item.product_id
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setForm((prev) => {
                        const items = [...prev.items];
                        items[idx] = {
                          ...items[idx],
                          product_id: newValue?.productId || "",
                          uom: newValue?.unit || "",
                          hsn_code: newValue?.hsnCode || "",
                        };
                        return { ...prev, items };
                      });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Product"
                        size="small"
                        fullWidth
                      />
                    )}
                  />
                </Grid>

                {/* Qty, Price, Disc */}
                <Grid item xs={2}>
                  <TextField
                    size="small"
                    label="Qty"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, "quantity", e.target.value)
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    size="small"
                    label="Price"
                    type="number"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(idx, "unit_price", e.target.value)
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    size="small"
                    label="Disc."
                    type="number"
                    value={item.discount}
                    onChange={(e) =>
                      updateItem(idx, "discount", e.target.value)
                    }
                    fullWidth
                  />
                </Grid>

                {/* Tax */}
                <Grid item xs={1.5}>
                  <TextField
                    size="small"
                    label="CGST %"
                    type="number"
                    value={item.cgst_percent}
                    onChange={(e) =>
                      updateItem(idx, "cgst_percent", e.target.value)
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={1.5}>
                  <TextField
                    size="small"
                    label="SGST %"
                    type="number"
                    value={item.sgst_percent}
                    onChange={(e) =>
                      updateItem(idx, "sgst_percent", e.target.value)
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={1.5}>
                  <TextField
                    size="small"
                    label="IGST %"
                    type="number"
                    value={item.igst_percent}
                    onChange={(e) =>
                      updateItem(idx, "igst_percent", e.target.value)
                    }
                    fullWidth
                  />
                </Grid>

                {/* Readonly Fields */}
                <Grid item xs={2}>
                  <TextField
                    size="small"
                    label="HSN Code"
                    value={item.hsn_code}
                    disabled
                    fullWidth
                  />
                </Grid>
                <Grid item xs={1.5}>
                  <TextField
                    size="small"
                    label="Unit"
                    value={item.uom}
                    disabled
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    size="small"
                    label="Line Total"
                    value={item.line_total}
                    disabled
                    fullWidth
                  />
                </Grid>

                {/* Delete Button */}
                <Grid item xs={0.5}>
                  <IconButton color="error" onClick={() => removeItem(idx)}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Card>
          ))}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addItem}
            sx={{ mt: 1, borderRadius: 2 }}
          >
            Add Item
          </Button>
        </Grid>

        {/* TOTALS */}
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Total Tax"
            value={form.totalTaxAmount}
            disabled
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Total Invoice"
            value={Math.round(Number(form.totalInvoiceAmount || 0))}
            disabled
          />
          <Typography variant="caption">
            Note: Determined by rounding: {form.totalInvoiceAmount}{" "}
          </Typography>
        </Grid>

        {/* REMARKS */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="Remarks"
            value={form.remarks}
            onChange={(e) => handleChange("remarks", e.target.value)}
          />
        </Grid>
        {/* SUMMARY */}
        <Grid item xs={12}>
          <Box
            sx={{
              mt: 3,
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #f5f7fa, #e4ecf7)",
              boxShadow: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
            >
              Invoice Summary
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography color="text.secondary">Total Before Tax</Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography fontWeight={600}>₹ {form.invoiceAmount}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography color="text.secondary">CGST</Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography fontWeight={600}>₹ {form.cgstAmount}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography color="text.secondary">SGST</Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography fontWeight={600}>₹ {form.sgstAmount}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="text.secondary">IGST</Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography fontWeight={600}>₹ {form.igstAmount}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography color="text.secondary">Total Tax</Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography fontWeight={700}>
                  ₹ {form.totalTaxAmount}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    mt: 1,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "primary.main",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography fontWeight={700}>Grand Total</Typography>
                  <Typography fontSize={20} fontWeight={800}>
                    ₹ {Math.round(Number(form.totalInvoiceAmount || 0))}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* ACTION */}
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button variant="contained" onClick={handleSubmit}>
            {invoice ? "Update" : "Create"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceForm;

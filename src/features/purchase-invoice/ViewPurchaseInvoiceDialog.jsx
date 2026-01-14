import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Typography,
  Divider,
  Button,
  Card,
} from "@mui/material";
import dayjs from "dayjs";
import { getInvoiceWithItemsService } from "../../services/invoicePaymentsService";
import { useUI } from "../../context/UIContext";

const Value = ({ children }) => (
  <Typography fontWeight={600}>{children}</Typography>
);

const Label = ({ children }) => (
  <Typography color="text.secondary">{children}</Typography>
);

const ViewPurchaseInvoiceDialog = ({ open, invoice, onClose }) => {
  const { showLoader, hideLoader } = useUI();
  const [data, setData] = useState(null);
  const printRef = useRef();

  const handleDownload = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = `
      <html>
        <head>
          <title>Invoice ${data.invoice_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              font-size: 12px;
            }
            th {
              background: #f5f5f5;
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `;

    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  useEffect(() => {
    if (!open || !invoice?.invoice_id) return;

    showLoader();
    getInvoiceWithItemsService(invoice.invoice_id)
      .then((res) => {
        setData({
          ...invoice,
          items: res?.items || [],
        });
      })
      .finally(() => hideLoader());
  }, [open, invoice]);

  if (!data) return null;

  return (
    <Dialog open={open} /*onClose={onClose}*/ maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Purchase Invoice Details
      </DialogTitle>

      <DialogContent dividers>
        {/* ================= HEADER ================= */}
        <Box ref={printRef}>
          <Card sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Label>Invoice Number</Label>
                <Value>{data.invoice_number}</Value>
              </Grid>
              <Grid item xs={4}>
                <Label>Invoice Date</Label>
                <Value>{dayjs(data.invoice_date).format("DD MMM YYYY")}</Value>
              </Grid>
              <Grid item xs={4}>
                <Label>PO Number</Label>
                <Value>{data.po_number || "-"}</Value>
              </Grid>

              <Grid item xs={6}>
                <Label>Vendor</Label>
                <Value>{data.vendor_name}</Value>
              </Grid>
              <Grid item xs={6}>
                <Label>Remarks</Label>
                <Value>{data.remarks || "-"}</Value>
              </Grid>
            </Grid>
          </Card>

          {/* ================= ITEMS ================= */}
          <Typography variant="h6" fontWeight={700} mb={1}>
            Invoice Items
          </Typography>

          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={1} sx={{ fontWeight: 700 }}>
                <Grid item xs={2}>
                  Product
                </Grid>
                <Grid item xs={1}>
                  Qty
                </Grid>
                <Grid item xs={1}>
                  Price
                </Grid>
                <Grid item xs={1}>
                  Disc
                </Grid>
                <Grid item xs={1}>
                  CGST%
                </Grid>
                <Grid item xs={1}>
                  SGST%
                </Grid>
                <Grid item xs={1}>
                  IGST%
                </Grid>
                <Grid item xs={2}>
                  HSN
                </Grid>
                <Grid item xs={2} textAlign="right">
                  Total
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              {data.items.map((item, idx) => (
                <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
                  <Grid item xs={2}>
                    <Typography>{item.product_name}</Typography>
                  </Grid>
                  <Grid item xs={1}>
                    {item.quantity}
                  </Grid>
                  <Grid item xs={1}>
                    ₹ {item.unit_price}
                  </Grid>
                  <Grid item xs={1}>
                    ₹ {item.discount}
                  </Grid>
                  <Grid item xs={1}>
                    {item.cgst_percent}%
                  </Grid>
                  <Grid item xs={1}>
                    {item.sgst_percent}%
                  </Grid>
                  <Grid item xs={1}>
                    {item.igst_percent}%
                  </Grid>
                  <Grid item xs={2}>
                    {item.hsn_code}
                  </Grid>
                  <Grid item xs={2} textAlign="right">
                    ₹ {item.line_total}
                  </Grid>
                </Grid>
              ))}
            </Box>
          </Card>

          {/* ================= SUMMARY ================= */}
          <Card
            sx={{
              p: 3,
              borderRadius: 2,
              background: "linear-gradient(135deg, #f5f7fa, #e4ecf7)",
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={2}>
              Invoice Summary
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Label>Total Before Tax</Label>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Value>₹ {data.invoice_amount}</Value>
              </Grid>

              <Grid item xs={6}>
                <Label>CGST</Label>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Value>₹ {data.cgst_amount}</Value>
              </Grid>

              <Grid item xs={6}>
                <Label>SGST</Label>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Value>₹ {data.sgst_amount}</Value>
              </Grid>

              <Grid item xs={6}>
                <Label>IGST</Label>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Value>₹ {data.igst_amount}</Value>
              </Grid>

              <Grid item xs={6}>
                <Label>Total Tax</Label>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Value>₹ {data.total_tax_amount}</Value>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "primary.main",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography fontWeight={700}>Grand Total</Typography>
                  <Typography fontSize={20} fontWeight={800}>
                    ₹ {Math.round(Number(data.total_invoice_amount || 0))}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleDownload} variant="contained">
          Download PDF
        </Button>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewPurchaseInvoiceDialog;

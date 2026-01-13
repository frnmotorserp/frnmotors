import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import dayjs from "dayjs";
import { useUI } from "../../context/UIContext";
import {
  getPaymentsByInvoiceIdService,
  syncInvoicePaymentsService,
} from "../../services/invoicePaymentsService";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

const paymentModes = [
  "CASH",
  "BANK_TRANSFER",
  "NEFT",
  "RTGS",
  "CHEQUE",
  "UPI",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "NET_BANKING",
  "OTHERS",
];

const PaymentDialog = ({ invoice, onClose, mode }) => {
  const { showLoader, hideLoader, showSnackbar } = useUI();
  const [paymentList, setPaymentList] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const [formData, setFormData] = useState({
    payment_date: dayjs().format("YYYY-MM-DD"),
    payment_amount: "",
    payment_mode: "",
    transaction_reference: "",
    payment_notes: "",
  });

  useEffect(() => {
    if (invoice?.invoice_id) {
      //fetchPayments(invoice.invoice_id);
    }
  }, [invoice]);

  const fetchPayments = (invoiceId) => {
    showLoader();
    getPaymentsByInvoiceIdService(invoiceId)
      .then((res) => setPaymentList(res || []))
      .catch(() => showSnackbar("Failed to fetch payment details", "error"))
      .finally(() => hideLoader());
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const {
      payment_date,
      payment_amount,
      payment_mode,
      transaction_reference,
      payment_notes,
    } = formData;

    if (
      !payment_amount ||
      Number(payment_amount) <= 0 ||
      !payment_mode ||
      !transaction_reference ||
      !payment_notes
    ) {
      showSnackbar("Please fill all payment fields properly", "warning");
      return;
    }

    const newPayment = {
      ...formData,
      payment_id:
        editingIndex != null
          ? paymentList[editingIndex]?.payment_id
          : undefined,
    };

    const updatedList = [...paymentList];
    if (editingIndex != null) {
      updatedList[editingIndex] = newPayment;
    } else {
      updatedList.push(newPayment);
    }

    setPaymentList(updatedList);
    setFormData({
      payment_date: dayjs().format("YYYY-MM-DD"),
      payment_amount: "",
      payment_mode: "",
      transaction_reference: "",
      payment_notes: "",
    });
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    setFormData(paymentList[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    const updated = [...paymentList];
    updated.splice(index, 1);
    setPaymentList(updated);
  };

  const handleSyncPayments = () => {
    if (
      !invoice.invoice_id ||
      !invoice.vendor_id ||
      !invoice.total_invoice_amount
    ) {
      showSnackbar(
        "Something went wrong. Not able to determine Invoice Id, Vendor Id or Total Invoice Amount"
      );
      return;
    }
    showLoader();
    syncInvoicePaymentsService(
      invoice.invoice_id,
      invoice.vendor_id,
      invoice.total_invoice_amount,
      paymentList,
      invoice.invoice_number
    )
      .then(() => showSnackbar("Payments synced successfully", "success"))
      .catch(() => showSnackbar("Failed to sync payments", "error"))
      .finally(() => hideLoader());
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Invoice Summary */}
      <Typography variant="h6" gutterBottom>
        Invoice Summary
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Typography>
            <strong>Invoice No:</strong> {invoice.invoice_number}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography>
            <strong>Invoice Date:</strong>{" "}
            {dayjs(invoice.invoice_date).format("DD MMM YYYY")}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography>
            <strong>Vendor:</strong> {invoice.vendor_name}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography>
            <strong>PO No:</strong> {invoice.po_number}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography>
            <strong>Invoice Amount:</strong> ₹
            {Math.round(Number(invoice.invoice_amount || 0))}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography>
            <strong>Total Tax:</strong> ₹{invoice.total_tax_amount}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography>
            <strong>Total Amount:</strong> ₹{invoice.total_invoice_amount}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography>
            <strong>Payment Status:</strong> {invoice.payment_status}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography>
            <strong>Remarks:</strong> {invoice.remarks}
          </Typography>
        </Grid>
      </Grid>
      {/* Payment Summary */}
      {/* <Box
                sx={{
                    p: 2,
                    mb: 3,
                    mt:2,
                    background: '#f0f4f8',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Total Paid
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'green' }}>
                        ₹{paymentList.reduce((sum, p) => sum + Number(p.payment_amount), 0).toFixed(2)}
                    </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ mx: 2, display: { xs: 'none', sm: 'block' } }} />

                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Remaining Amount
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'red' }}>
                        ₹{(Math.round(Number(invoice.total_invoice_amount || 0)) - paymentList.reduce((sum, p) => sum + Number(p.payment_amount), 0)).toFixed(2)}
                    </Typography>
                </Box>
            </Box> */}

      <Divider sx={{ my: 3 }} />

      {/* Add/Edit Payment */}
      {mode != "view" && (
        <Typography variant="h6" gutterBottom>
          {editingIndex != null ? "Edit Payment" : "Add Payment"}
        </Typography>
      )}
      {mode != "view" && (
        <Paper
          sx={{ p: 2, mb: 3, backgroundColor: "#f9f9f9" }}
          variant="outlined"
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                size="small"
                label="Payment Date"
                type="date"
                fullWidth
                required
                value={formData.payment_date}
                onChange={(e) => handleChange("payment_date", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                size="small"
                label="Amount"
                type="number"
                fullWidth
                required
                value={formData.payment_amount}
                onChange={(e) => handleChange("payment_amount", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth required size="small">
                <InputLabel>Mode</InputLabel>
                <Select
                  value={formData.payment_mode}
                  label="Mode"
                  onChange={(e) => handleChange("payment_mode", e.target.value)}
                >
                  {paymentModes.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                size="small"
                label="Reference(UTR/UTI/Cheque No.)"
                fullWidth
                required
                value={formData.transaction_reference}
                onChange={(e) =>
                  handleChange("transaction_reference", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                size="small"
                label="Notes"
                fullWidth
                required
                value={formData.payment_notes}
                onChange={(e) => handleChange("payment_notes", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
              >
                {editingIndex != null ? "Update Payment" : "Add Payment"}
              </Button>
              <Typography mt={1} fontSize={"0.6rem"} color="info">
                **This is just to visualise. Click on Final Save Payment List to
                save the payments.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Payment History */}

      {/* <Typography variant="h6" gutterBottom>
        Payment History
      </Typography> */}
      {/*<Box>
        {paymentList.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Notes</TableCell>
                {mode != "view" && (
                  <TableCell align="center">Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentList.map((p, idx) => (
                <TableRow key={p.payment_id || idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    {dayjs(p.payment_date).format("DD MMM YYYY")}
                  </TableCell>
                  <TableCell>₹ {p.payment_amount}</TableCell>
                  <TableCell>{p.payment_mode?.replace(/_/g, " ")}</TableCell>
                  <TableCell>{p.transaction_reference}</TableCell>
                  <TableCell>{p.payment_notes}</TableCell>
                  {mode != "view" && (
                    <TableCell align="center">
                    
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(idx)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No payments recorded yet.
          </Typography>
        )}
    </Box>*/}

      {mode != "view" && (
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="success"
            onClick={handleSyncPayments}
          >
            <SaveIcon /> Final Save Payment List
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PaymentDialog;

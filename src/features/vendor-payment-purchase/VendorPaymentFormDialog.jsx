import React, { useState } from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import dayjs from "dayjs";
import { createVendorPaymentService } from "../../services/invoicePaymentsService";
import { useUI } from "../../context/UIContext";

const paymentMethods = ["CASH", "BANK"];
const modeOfTransactions = [
  "UPI",
  "NEFT",
  "RTGS",
  "CHEQUE",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "NET_BANKING",
  "OTHERS",
];

export default function VendorPaymentFormDialog({
  open,
  onClose,
  onSave,
  allBanks = [],
  initialData,
  vendorId,
  vendorName,
  fetchVendorPayments,
}) {
  const [paymentDate, setPaymentDate] = useState(
    initialData?.paymentDate
      ? dayjs(initialData.paymentDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD")
  );
  const [paymentAmount, setPaymentAmount] = useState(
    initialData?.paymentAmount || ""
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialData?.paymentMethod || "CASH"
  );
  const [bankId, setBankId] = useState(initialData?.bankId || "");
  const [transactionReference, setTransactionReference] = useState(
    initialData?.transactionReference || ""
  );
  const [notes, setNotes] = useState(
    initialData?.paymentNotes ||
      (vendorName ? `Payment made to Vendor - ${vendorName}. ` : "")
  );
  const [modeOfTransaction, setModeOfTransaction] = useState(
    initialData?.modeOfTransaction || ""
  );

  const { showSnackbar, showLoader, hideLoader } = useUI();

  /* ===================== RESET FORM ===================== */
  const resetForm = () => {
    setPaymentDate(dayjs().format("YYYY-MM-DD"));
    setPaymentAmount("");
    setPaymentMethod("CASH");
    setBankId("");
    setTransactionReference("");
    setNotes(vendorName ? `Payment made to Vendor - ${vendorName}. ` : "");
    setModeOfTransaction("");
  };

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async () => {
    // Basic Validation
    if (!paymentDate || !paymentAmount || !paymentMethod) {
      showSnackbar("Payment Date, Amount and Method are required", "error");
      return;
    }

    if (paymentMethod === "BANK" && !bankId) {
      showSnackbar("Bank ID is required for bank payments", "error");
      return;
    }

    if (dayjs(paymentDate).isAfter(dayjs(), "day")) {
      showSnackbar("Payment date cannot be in the future", "error");
      return;
    }

    showLoader();
    try {
      await createVendorPaymentService({
        vendorId,
        paymentDate,
        paymentAmount: parseFloat(paymentAmount || 0),
        paymentMethod,
        bankId: paymentMethod === "BANK" ? bankId : null,
        transactionReference,
        notes,
        modeOfTransaction:
          paymentMethod === "BANK" ? modeOfTransaction : "CASH",
      });

      showSnackbar("Vendor payment saved successfully!", "success");
      resetForm();
      onClose();
      fetchVendorPayments?.();
      onSave?.();
    } catch (err) {
      console.error(err);
      showSnackbar(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save vendor payment",
        "error"
      );
    }
    hideLoader();
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? "Edit Vendor Payment" : "Add Vendor Payment"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: dayjs().format("YYYY-MM-DD") }}
            fullWidth
          />

          <TextField
            label="Payment Amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            fullWidth
          >
            {paymentMethods.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>

          {paymentMethod === "BANK" && (
            <>
              <TextField
                select
                label="Select Bank Account"
                size="small"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                fullWidth
              >
                {allBanks?.map((bank) => (
                  <MenuItem key={bank.bank_id} value={bank.bank_id}>
                    {bank.bank_name} - {bank.account_number}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Mode of Transaction"
                value={modeOfTransaction}
                onChange={(e) => setModeOfTransaction(e.target.value)}
                fullWidth
              >
                {modeOfTransactions.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {mode}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Transaction Reference"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                fullWidth
              />
            </>
          )}

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => {
            onClose();
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          {initialData ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

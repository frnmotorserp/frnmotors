import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
} from "@mui/material";
import dayjs from "dayjs";
import { createPartyPaymentService } from "../../services/salesService";
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

export default function PartyPaymentFormDialog({
  open,
  onClose,
  onSave,
  allBanks = [],
  initialData,
  partyType,
  partyId,
  buyerName,
  fetchPartyPayments,
}) {
  const [paymentDate, setPaymentDate] = useState(
    dayjs(initialData?.paymentDate).format("YYYY-MM-DD") || ""
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
    initialData?.notes || `Sales Payment Received for ${buyerName}. ` || ""
  );
  const [modeOfTransaction, setModeOfTransaction] = useState(
    initialData?.modeOfTransaction || ""
  );

  const { showSnackbar, showLoader, hideLoader } = useUI();

  // Set all states to their initial values as they would be on mount/reset
  const resetForm = () => {
    setPaymentDate(
      initialData?.paymentDate
        ? dayjs(initialData.paymentDate).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD")
    );
    setPaymentAmount(initialData?.paymentAmount || "");
    setPaymentMethod(initialData?.paymentMethod || "CASH");
    setBankId(initialData?.bankId || "");
    setTransactionReference(initialData?.transactionReference || "");
    setNotes(
      initialData?.notes ||
        (buyerName ? `Sales Payment Received for ${buyerName}. ` : "")
    );
    setModeOfTransaction(initialData?.modeOfTransaction || "");
  };

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
      //console.log(partyType, "partyType");
      await createPartyPaymentService({
        partyType: partyType,
        customerId: partyType === "CUSTOMER" ? partyId : null,
        dealerId: partyType === "DEALER" ? partyId : null,
        paymentDate,
        paymentAmount: parseFloat(paymentAmount || 0),
        paymentMethod,
        bankId: paymentMethod === "BANK" ? bankId : null,
        transactionReference,
        notes,
        //createdBy: currentUserId,
        modeOfTransaction:
          paymentMethod === "BANK" ? modeOfTransaction : "CASH",
      });
      showSnackbar("Payment saved successfully!", "success");
      //onSave();
      resetForm();
      onClose();
      fetchPartyPayments();
    } catch (err) {
      console.error(err);
      showSnackbar(
        err?.response?.data?.message || err.message || "Failed to save payment",
        "error"
      );
    }
    hideLoader();
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? "Edit Party Payment" : "Add Party Payment"}
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
              {/* <TextField
                label="Bank ID"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                fullWidth
              /> */}
              <TextField
                select
                label="Select Bank Account"
                size="small"
                placeholder="Please select bank"
                sx={{ minWidth: 220 }}
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                fullWidth
              >
                {allBanks?.map((bank) => (
                  <MenuItem key={bank.bank_id} value={bank.bank_id}>
                    {bank?.bank_name} - {bank?.account_number}
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

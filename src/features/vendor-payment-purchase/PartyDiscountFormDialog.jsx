import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import dayjs from "dayjs";

import { createVendorDiscountService } from "../../services/invoicePaymentsService";
import { useUI } from "../../context/UIContext";

export default function VendorDiscountFormDialog({
  open,
  onClose,
  initialData,
  vendorId,
  vendorName,
  fetchVendorDiscounts, // callback to refresh list after save
}) {
  const [discountDate, setDiscountDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [discountAmount, setDiscountAmount] = useState("");
  const [reason, setReason] = useState("");

  const { showSnackbar, showLoader, hideLoader } = useUI();

  /* ===================== RESET ===================== */
  const resetForm = () => {
    setDiscountDate(
      initialData?.discount_date
        ? dayjs(initialData.discount_date).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD")
    );
    setDiscountAmount(initialData?.discount_amount || "");
    setReason(
      initialData?.reason ||
        (vendorName ? `Discount given to ${vendorName}.` : "")
    );
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open]);

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async () => {
    if (!discountDate || !discountAmount) {
      showSnackbar("Discount date and amount are required", "error");
      return;
    }

    if (Number(discountAmount) <= 0) {
      showSnackbar("Discount amount must be greater than zero", "error");
      return;
    }

    if (dayjs(discountDate).isAfter(dayjs(), "day")) {
      showSnackbar("Discount date cannot be in the future", "error");
      return;
    }

    showLoader();
    try {
      await createVendorDiscountService({
        vendorId,
        discountDate,
        discountAmount: parseFloat(discountAmount),
        reason,
      });

      showSnackbar("Vendor discount saved successfully!", "success");
      resetForm();
      onClose();
      fetchVendorDiscounts && fetchVendorDiscounts();
    } catch (err) {
      console.error(err);
      showSnackbar(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save vendor discount",
        "error"
      );
    }
    hideLoader();
  };

  /* ===================== UI ===================== */
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? "Edit Vendor Discount" : "Add Vendor Discount"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Discount Date"
            type="date"
            value={discountDate}
            onChange={(e) => setDiscountDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: dayjs().format("YYYY-MM-DD") }}
            fullWidth
          />

          <TextField
            label="Discount Amount"
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
            fullWidth
          />

          <TextField
            label="Reason / Notes"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
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

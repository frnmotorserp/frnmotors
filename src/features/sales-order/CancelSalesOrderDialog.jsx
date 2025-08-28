import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  TextField,
  Button,
  Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { cancelSalesOrderService } from "../../services/salesService";
import { useUI } from "../../context/UIContext";

export default function CancelSalesOrderDialog({ salesOrderCode, open, onClose, salesOrderId, onCancelled }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSnackbar, showLoader, hideLoader } = useUI();

  const handleCancelOrder = async () => {
    if (!reason.trim()) {
      showSnackbar("Please provide a cancellation reason", "warning");
      return;
    }

    setLoading(true);
    showLoader();
    try {
      await cancelSalesOrderService(salesOrderId, reason);
      showSnackbar("Sales order cancelled successfully!", "success");

      if (onCancelled) onCancelled(); // refresh list or summary
      onClose();
    } catch (err) {
      console.error("Cancel order failed:", err);
      showSnackbar(err?.message || "Failed to cancel order", "error");
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Cancel Sales Order</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" my={2} gutterBottom>
          Are you sure you want to cancel this sales order - <b>{salesOrderCode}</b>?
        </Typography>

        <TextField
          label="Cancellation Reason"
          fullWidth
          multiline
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for cancellation"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Close</Button>
        <Button
          onClick={handleCancelOrder}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Cancelling..." : "Confirm Cancel"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

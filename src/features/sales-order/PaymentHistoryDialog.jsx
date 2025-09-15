import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Typography,
  Stack,
  MenuItem,
  Paper,
  Card,
  CardContent,
  Grid,
  Box
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaidIcon from "@mui/icons-material/Paid";
import MoneyOffCsredIcon from "@mui/icons-material/MoneyOffCsred";
import { Add, Edit, Delete } from "@mui/icons-material";
import dayjs from "dayjs";
import {
  deletePaymentService,
  getPaymentsBySalesOrderIdService,
  saveOrUpdateOrderPaymentService
} from "../../services/salesService";
import { useUI } from "../../context/UIContext";

const paymentModes = [
  'CASH', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'CHEQUE', 'UPI',
  'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'OTHERS'
];

export default function PaymentHistoryDialog({
  open,
  onClose,
  salesOrderId,
  orderAmount = 0,
  currentUserId = 0,
  salesOrderCode = "",
  orderStatus
}) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { showLoader, hideLoader, showSnackbar } = useUI();

  useEffect(() => {
    if (open && salesOrderId) {
      fetchPayments();
    }
  }, [open, salesOrderId]);

  const fetchPayments = async () => {
    showLoader(true);
    try {
      const res = await getPaymentsBySalesOrderIdService(salesOrderId);
      setPayments(res || []);
    } catch (err) {
      console.error(err);
    }
    hideLoader(false);
  };

  const handleAdd = () => {
    setEditData(null);
    setOpenPaymentDialog(true);
  };

  const handleEdit = (payment) => {
    console.log(payment)
    setEditData(payment);
    setOpenPaymentDialog(true);
  };

  const handleDelete = (paymentId) => {
    setDeleteId(paymentId);
    setOpenDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    showLoader()
    try {
      await deletePaymentService(deleteId, salesOrderId);
      setOpenDeleteConfirm(false);
      showSnackbar("Payment deleted successfully!", "success")
      fetchPayments();
    } catch (err) {
      showSnackbar("Payment deletion failed!", "error")
      console.error(err);
    }
    hideLoader()
  };

  const savePayment = async (paymentData) => {
    const { paymentDate, paymentMode, paymentAmount, paymentNotes, paymentReceivedAccountNo } = paymentData
    console.log(paymentDate, paymentMode, paymentAmount, paymentNotes, paymentReceivedAccountNo)
    if (!paymentDate || !paymentMode || !paymentAmount || !paymentNotes || !paymentReceivedAccountNo) {
      showSnackbar("All fields are required", "error");
      return;
    }

    // If paymentDate is in the future
    if (dayjs(paymentDate).isAfter(dayjs(), 'day')) {
      showSnackbar("Payment date cannot be in the future", "error");
      return;
    }

    showLoader()
    try {
      //console.log(salesOrderId)
      await saveOrUpdateOrderPaymentService({
        ...paymentData,
        salesOrderId,
        userId: currentUserId
      });
      showSnackbar("Payment saved successfully!", "success")
      setOpenPaymentDialog(false);
      fetchPayments();
    } catch (err) {
      showSnackbar("Payment saving failed!", "error")
      console.error(err);
    }
    hideLoader()
  };

  return (
    <>
      {/* Payment History Dialog */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Payment History</DialogTitle>
        <DialogContent>
          {/* Order Summary Section */}


          <Card
            elevation={3}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #f5f7fa 0%, #e4ecf7 100%)",
            }}
          >
            <CardContent>
              <Grid container spacing={3}>
                {/* Row 1: Order ID */}
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <ReceiptLongIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Order ID: {salesOrderCode}
                    </Typography>
                  </Box>
                </Grid>

                {/* Row 2: Amounts */}
                <Grid item xs={12}>
                  <Grid container spacing={3}>
                    {/* Total */}
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1} >
                          <AccountBalanceWalletIcon sx={{ color: "#1976d2", fontWeight: 500, fontSize: '0.8rem' }} />
                          <Typography variant="body2" sx={{ color: "#1976d2", fontWeight: 500 }}>
                            Order Total
                          </Typography>
                        </Box>

                        <Typography
                          variant="h5"
                          sx={{ fontWeight: "bold", fontSize: "1.8rem", color: "#1976d2" }}
                        >
                          ₹{parseFloat(orderAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Paid */}
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1} >
                          <PaidIcon sx={{ color: "green", fontWeight: 500, fontSize: '0.8rem' }} />
                          <Typography variant="body2" sx={{ color: "green", fontWeight: 500 }}>
                            Paid
                          </Typography>
                        </Box>

                        <Typography
                          variant="h5"
                          sx={{ fontWeight: "bold", fontSize: "1.8rem", color: "green" }}
                        >
                          ₹
                          {payments.reduce((sum, p) => sum + Number(p.paymentAmount || 0), 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Remaining */}
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1} >
                          <MoneyOffCsredIcon sx={{ color: "red", fontWeight: 500, fontSize: '0.8rem' }} />
                          <Typography variant="body2" sx={{ color: "red", fontWeight: 500 }}>
                            Remaining
                          </Typography>
                        </Box>

                        <Typography
                          variant="h5"
                          sx={{ fontWeight: "bold", fontSize: "1.8rem", color: "red" }}
                        >
                          ₹
                          {(orderAmount -
                            payments.reduce((sum, p) => sum + Number(p.paymentAmount || 0), 0)
                          ).toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>





          <Stack direction="row" justifyContent="flex-end" mb={2}>
            {orderStatus !== "CANCELLED" && <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Add Payment
            </Button>}
          </Stack>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Account No</TableCell>
                  <TableCell>Transaction Ref</TableCell>
                  <TableCell>Notes</TableCell>
                  {/* <TableCell>Updated By</TableCell> */}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.paymentId}>
                    <TableCell>
                      {dayjs(p.paymentDate).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell>{p.paymentAmount}</TableCell>
                    <TableCell>{p.paymentMode}</TableCell>
                    <TableCell>{p.paymentReceivedAccountNo || "-"}</TableCell>
                    <TableCell>{p.transactionReference || "-"}</TableCell>
                    <TableCell>{p.paymentNotes || "-"}</TableCell>
                    {/* <TableCell>{p.updatedByName || "-"}</TableCell> */}
                    {/*<TableCell>
                      {dayjs().diff(dayjs(p.paymentDate), "day") <= 7  && <IconButton onClick={() => handleEdit(p)}>
                        <Edit />
                      </IconButton>}
                      { dayjs().diff(dayjs(p.paymentDate), "day") <= 7 && <IconButton
                        color="error"
                        onClick={() => handleDelete(p.paymentId)}
                      >
                        <Delete />
                      </IconButton>}
                    </TableCell>*/}
                     <TableCell>
                      <IconButton onClick={() => handleEdit(p)}>
                        <Edit />
                      </IconButton>
                     <IconButton
                        color="error"
                        onClick={() => handleDelete(p.paymentId)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No payments found
                    </TableCell>
                  </TableRow>
                )}
                {payments.length > 0 && <TableRow>
                    <TableCell colSpan={8} sx={{color: 'red'}} align="center">
                      <b>Note:</b> Edit or Delete Payment only allowed till 7 days after payment date! Please be extra cautions while adding the payment details!
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Payment Dialog */}
      {openPaymentDialog && (
        <PaymentFormDialog
          open={openPaymentDialog}
          onClose={() => setOpenPaymentDialog(false)}
          onSave={savePayment}

          initialData={editData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this payment?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function PaymentFormDialog({ open, onClose, onSave, initialData }) {
  const [paymentDate, setPaymentDate] = useState(
    dayjs(initialData?.paymentDate).format('YYYY-MM-DD') || ""
  );
  const [paymentAmount, setPaymentAmount] = useState(
    initialData?.paymentAmount || ""
  );
  const [paymentMode, setPaymentMode] = useState(
    initialData?.paymentMode || ""
  );
  const [paymentReceivedAccountNo, setPaymentReceivedAccountNo] = useState(
    initialData?.paymentReceivedAccountNo || ""
  );
  const [transactionReference, setTransactionReference] = useState(
    initialData?.transactionReference || ""
  );
  const [paymentNotes, setPaymentNotes] = useState(
    initialData?.paymentNotes || ""
  );

  const handleSubmit = () => {
    onSave({
      paymentId: initialData?.paymentId || 0,
      paymentDate,
      paymentAmount,
      paymentMode,
      paymentReceivedAccountNo,
      transactionReference,
      paymentNotes
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle>
        {initialData ? "Edit Payment" : "Add Payment"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1} width={300}>
          <TextField
            label="Payment Date"
            type="date"
            value={dayjs(paymentDate).format('YYYY-MM-DD')}
            onChange={(e) => setPaymentDate(dayjs(e.target.value).format('YYYY-MM-DD'))}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: dayjs().format('YYYY-MM-DD') // prevent selecting future dates
            }}
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
            label="Payment Mode"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            fullWidth
          >
            {paymentModes.map((mode) => (
              <MenuItem key={mode} value={mode}>
                {mode.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Account No"
            value={paymentReceivedAccountNo}
            onChange={(e) => setPaymentReceivedAccountNo(e.target.value)}
            fullWidth
          />
          <TextField
            label="Transaction Reference"
            value={transactionReference}
            onChange={(e) => setTransactionReference(e.target.value)}
            fullWidth
          />
          <TextField
            minRows={2}
            label="Payment Notes"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            fullWidth
            multiline
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {initialData ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

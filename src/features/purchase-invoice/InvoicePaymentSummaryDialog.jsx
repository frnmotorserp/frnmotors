// InvoicePaymentSummaryDialog with Tabs (Payment / Discount / Order)

import React, { useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import VendorPaymentFormDialog from "../vendor-payment-purchase/VendorPaymentFormDialog";
import VendorDiscountFormDialog from "../vendor-payment-purchase/PartyDiscountFormDialog";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinearProgress from "@mui/material/LinearProgress";
import { deleteVendorPaymentService } from "../../services/invoicePaymentsService";

import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import DiscountIcon from "@mui/icons-material/Discount";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HistoryIcon from "@mui/icons-material/History";
import BackupTableIcon from "@mui/icons-material/BackupTable";

import { getAllBanks } from "../../services/invoicePaymentsService";
import { getVendorPaymentsService } from "../../services/invoicePaymentsService";
import { getVendorDiscountsService } from "../../services/invoicePaymentsService";
import { useUI } from "../../context/UIContext";

import dayjs from "dayjs";
import * as XLSX from "xlsx";

const autoFitColumns = (data) => {
  const colWidths = [];

  data.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const cellValue = cell ? cell.toString() : "";
      const cellLength = cellValue.length;

      if (!colWidths[colIndex]) {
        colWidths[colIndex] = cellLength;
      } else {
        colWidths[colIndex] = Math.max(colWidths[colIndex], cellLength);
      }
    });
  });

  return colWidths.map((width) => ({
    wch: Math.min(width + 2, 40), // padding + max width cap
  }));
};

function stringToPastelColor(text, alpha = 0.2) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = ((hash & 0xff) % 128) + 64;
  const g = (((hash >> 8) & 0xff) % 128) + 64;
  const b = (((hash >> 16) & 0xff) % 128) + 64;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Props expected:
 * open, onClose
 * orders: []                // order list
 * discounts: []             // party discounts
 * vendorName: string
 */
export default function InvoicePaymentSummaryDialog({
  open,
  onClose,
  orders = [],

  vendorName = "",
  vendorId,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [allBanks, setAllBanks] = useState([]);
  const [openInvoicePaymentSummaryDialog, setOpenInvoicePaymentSummaryDialog] =
    useState(false);

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [openVendorDiscountDialog, setOpenVendorDiscountDialog] =
    useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showSnackbar } = useUI();

  useEffect(() => {
    if (!open) {
      setActiveTab(0);
      setPaymentSearch("");
    }
    if (open && vendorId) {
      fetchBankswithBalance();
      fetchVendorPayments();
      fetchVendorDiscounts();
    }
  }, [open, vendorId]);

  const fetchVendorDiscounts = () => {
    if (!vendorId) return;

    setLoadingDiscounts(true);
    getVendorDiscountsService({ vendorId })
      .then((res) => {
        setDiscounts(res || []);
      })
      .catch(() => {
        showSnackbar("Failed to fetch vendor discounts", "error");
        setDiscounts([]);
      })
      .finally(() => setLoadingDiscounts(false));
  };

  const fetchVendorPayments = () => {
    setLoadingPayments(true);

    getVendorPaymentsService({
      vendorId,
    })
      .then((res) => {
        setPayments(res || []);
      })
      .catch(() => {
        showSnackbar("Failed to fetch vendor payments", "error");
        setPayments([]);
      })
      .finally(() => {
        setLoadingPayments(false);
      });
  };

  const fetchBankswithBalance = () => {
    //showLoader();
    getAllBanks()
      .then((res) => {
        setAllBanks(res?.data || []);
        console.log("Banks::::", res?.data);
      })
      .catch(() => {
        showSnackbar("Failed to fetch banks with balance", "error");
        setAllBanks([]);
      })
      .finally(() => {
        //hideLoader();
      });
  };

  const handleDeletePayment = (payment) => {
    setDeleteTarget(payment);
  };

  const confirmDeletePayment = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      const deleteStatus = await deleteVendorPaymentService(
        deleteTarget.vendor_payment_id
      );
      console.log(deleteStatus);
      showSnackbar("Payment deleted successfully", "success");

      setDeleteTarget(null);
      fetchVendorPayments();
    } catch (err) {
      showSnackbar(err?.message || "Failed to delete vendor payment", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ===================== SUMMARY ===================== */
  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalOrderValue = orders.reduce(
      (sum, o) => sum + Number(o.total_invoice_amount || 0),
      0
    );
    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.payment_amount || 0),
      0
    );
    const totalDiscount = discounts.reduce(
      (sum, d) => sum + Number(d.discount_amount || 0),
      0
    );

    return {
      totalOrders,
      totalOrderValue,
      totalPaid,
      totalDiscount,
      totalRemaining: totalOrderValue - totalPaid - totalDiscount,
    };
  }, [orders, payments, discounts]);

  /* ===================== FILTERED PAYMENTS ===================== */
  const filteredPayments = useMemo(() => {
    if (!paymentSearch) return payments;

    const q = paymentSearch.toLowerCase();
    return payments.filter((p) =>
      [
        p.payment_method,
        p.bank_name,
        p.transaction_reference,
        p.payment_amount,
        p.account_number,
        p.payment_date,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [payments, paymentSearch]);

  /* ===================== EXPORT ===================== */
  const exportToExcel = () => {
    const wsSummary = [
      ["Order & Payment Summary"],
      [],
      ["Vendor Name", vendorName],
      [],
      [
        "Total Orders",
        "Total Order Value",
        "Total Paid",
        "Total Discount",
        "Total Remaining",
      ],
      [
        summary.totalOrders,
        summary.totalOrderValue.toFixed(2),
        summary.totalPaid.toFixed(2),
        summary.totalDiscount.toFixed(2),
        summary.totalRemaining.toFixed(2),
      ],
    ];

    const wsPayments = [
      [
        "Date",
        "Method",
        "Bank / Cash",
        "Account",
        "Reference",
        "Amount",
        "Notes",
      ],
    ];

    payments.forEach((p) => {
      wsPayments.push([
        dayjs(p.payment_date).format("DD-MM-YYYY"),
        p.payment_method,
        p.payment_method === "BANK" ? p.bank_name : "Cash",
        p.account_number || "-",
        p.transaction_reference || "-",
        Number(p.payment_amount).toFixed(2),
        p.payment_notes || "-",
      ]);
    });
    const wsDiscounts = [["SL. No.", "Date", "Reason", "Amount"]];
    discounts.forEach((d, i) => {
      wsDiscounts.push([
        i + 1,

        dayjs(d.discount_date).format("DD-MM-YYYY"),
        d.reason,
        Number(d.discount_amount).toFixed(2),
      ]);
    });

    const wsOrders = [
      ["SL. No.", "PO Number", "Invoice Number", "Invoice Date", "Grand Total"],
    ];
    orders.forEach((o, i) => {
      wsOrders.push([
        i + 1,
        o.po_number,
        o.invoice_number,
        dayjs(o.invoice_date).format("DD-MM-YYYY"),
        Number(o.total_invoice_amount).toFixed(2),
      ]);
    });

    const wb = XLSX.utils.book_new();
    const sheetSummary = XLSX.utils.aoa_to_sheet(wsSummary);
    sheetSummary["!cols"] = autoFitColumns(wsSummary);

    const sheetPayments = XLSX.utils.aoa_to_sheet(wsPayments);
    sheetPayments["!cols"] = autoFitColumns(wsPayments);

    const sheetDiscounts = XLSX.utils.aoa_to_sheet(wsDiscounts);
    sheetDiscounts["!cols"] = autoFitColumns(wsDiscounts);

    const sheetOrders = XLSX.utils.aoa_to_sheet(wsOrders);
    sheetOrders["!cols"] = autoFitColumns(wsOrders);

    XLSX.utils.book_append_sheet(wb, sheetSummary, "Summary");
    XLSX.utils.book_append_sheet(wb, sheetPayments, "Payments");
    XLSX.utils.book_append_sheet(wb, sheetDiscounts, "Discounts");
    XLSX.utils.book_append_sheet(wb, sheetOrders, "Orders");
    XLSX.writeFile(
      wb,
      `Order_Payment_Summary_${vendorName}_${dayjs(new Date()).format(
        "DD-MM-YYYY"
      )}.xlsx`
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      {/* ===================== HEADER ===================== */}
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box display="flex" gap={2} alignItems="center">
          Invoice & Payment Summary
          {(orders.length > 0 || payments.length > 0) && (
            <Button
              variant="outlined"
              startIcon={<BackupTableIcon />}
              onClick={exportToExcel}
            >
              Export
            </Button>
          )}
          <Button
            color="warning"
            variant="outlined"
            onClick={() => setOpenVendorDiscountDialog(true)}
          >
            + Add Discount
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenInvoicePaymentSummaryDialog(true);
            }}
          >
            + Add Payment
          </Button>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: "#fafafa" }}>
        {/* ===================== SUMMARY CARDS ===================== */}
        <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Grid container spacing={2}>
            {[
              {
                label: "Total Orders",
                value: summary.totalOrders,
                icon: <ShoppingCartIcon color="primary" />,
              },
              {
                label: "Total Order Value",
                value: `₹${summary.totalOrderValue.toLocaleString()}`,
                icon: <AttachMoneyIcon sx={{ color: "green" }} />,
              },
              {
                label: "Total Paid",
                value: `₹${summary.totalPaid.toLocaleString()}`,
                icon: <PaymentIcon sx={{ color: "teal" }} />,
              },
              {
                label: "Total Discount by Vendor",
                value: `₹${summary.totalDiscount.toLocaleString()}`,
                icon: <DiscountIcon sx={{ color: "green" }} />,
              },
              {
                label: "Total Remaining",
                value: `₹${summary.totalRemaining.toLocaleString()}`,
                icon: <AccountBalanceWalletIcon sx={{ color: "red" }} />,
              },
            ].map((item, i) => (
              <Grid
                item
                xs={12}
                sm={i === 4 ? 12 : 6}
                md={i === 4 ? 8 : 4}
                key={i}
              >
                <Box
                  sx={{
                    p: 2,
                    background: "#fff",
                    borderRadius: 2,
                    boxShadow: 1,
                    textAlign: "center",
                  }}
                >
                  {item.icon}
                  <Typography variant="h6" mt={1}>
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* ===================== TABS ===================== */}
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} centered>
            <Tab icon={<PaymentIcon />} label="Payments" />
            <Tab icon={<DiscountIcon />} label="Discounts" />
            <Tab icon={<ReceiptLongIcon />} label="Orders" />
          </Tabs>
        </Paper>

        <Box sx={{ p: 3 }}>
          {/* ===================== PAYMENTS TAB ===================== */}
          {activeTab === 0 && (
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Payment History</Typography>
                <TextField
                  size="small"
                  placeholder="Search payments..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />

              {loadingPayments ? (
                <Box textAlign="center" py={6}>
                  <Typography>Loading payments...</Typography>
                </Box>
              ) : filteredPayments.length === 0 ? (
                <Box textAlign="center" py={6} opacity={0.6}>
                  <HistoryIcon sx={{ fontSize: 48 }} />
                  <Typography>No payments found</Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Bank / Cash</TableCell>
                      <TableCell>Account</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPayments.map((p) => (
                      <TableRow key={p.party_payment_id} hover>
                        <TableCell>
                          {dayjs(p.payment_date).format("DD-MM-YYYY")}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={p.payment_method}
                            color={
                              p.payment_method === "BANK" ? "info" : "success"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {p.payment_method === "BANK" ? p.bank_name : "Cash"}
                        </TableCell>
                        <TableCell>{p.account_number || "-"}</TableCell>
                        <TableCell>{p.transaction_reference || "-"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{Number(p.payment_amount).toLocaleString()}
                        </TableCell>
                        <TableCell>{p.payment_notes || "-"}</TableCell>
                        <TableCell>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeletePayment(p)}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          )}

          {/* ===================== DISCOUNTS TAB ===================== */}
          {activeTab === 1 &&
            (loadingDiscounts ? (
              <Box textAlign="center" py={6}>
                <Typography>Loading discounts...</Typography>
              </Box>
            ) : discounts.length === 0 ? (
              <Typography>No discount records found</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {discounts?.map((d) => (
                    <TableRow key={d.sales_party_discount_id}>
                      <TableCell>
                        {dayjs(d.discount_date).format("DD-MM-YYYY")}
                      </TableCell>
                      <TableCell>{d.reason || "-"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        ₹{Number(d.discount_amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}

          {/* ===================== ORDERS TAB ===================== */}
          {activeTab === 2 && (
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={60}>SL No</TableCell>
                    <TableCell>PO Number</TableCell>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Invoice Date</TableCell>
                    <TableCell align="right">Invoice Amount</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {orders.map((o, index) => (
                    <TableRow
                      key={`${o.po_number}-${o.invoice_number}`}
                      sx={{ background: stringToPastelColor(o.po_number) }}
                      hover
                    >
                      <TableCell>{index + 1}</TableCell>

                      <TableCell sx={{ fontWeight: 600 }}>
                        {o.po_number || "-"}
                      </TableCell>

                      <TableCell>{o.invoice_number || "-"}</TableCell>

                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CalendarMonthIcon fontSize="small" />
                          {dayjs(o.invoice_date).format("DD-MM-YYYY")}
                        </Box>
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        ₹{Number(o.total_invoice_amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <VendorPaymentFormDialog
        open={openInvoicePaymentSummaryDialog}
        onClose={() => {
          setOpenInvoicePaymentSummaryDialog(false);
        }}
        allBanks={allBanks}
        vendorId={vendorId}
        vendorName={vendorName}
        fetchVendorPayments={fetchVendorPayments}
      />
      <VendorDiscountFormDialog
        open={openVendorDiscountDialog}
        onClose={() => setOpenVendorDiscountDialog(false)}
        vendorId={vendorId}
        vendorName={vendorName}
        fetchVendorDiscounts={fetchVendorDiscounts}
      />
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Payment</DialogTitle>

        <DialogContent dividers>
          {deleting && <LinearProgress color="error" />}
          <Typography gutterBottom>
            Are you sure you want to delete this payment?
          </Typography>

          {deleteTarget && (
            <Box mt={1}>
              <Typography variant="body2">
                <strong>Amount:</strong> ₹
                {Number(deleteTarget.payment_amount).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong>{" "}
                {dayjs(deleteTarget.payment_date).format("DD-MM-YYYY")}
              </Typography>
              <Typography variant="body2">
                <strong>Method:</strong> {deleteTarget.payment_method}
              </Typography>
            </Box>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            mt={2}
            display="block"
          >
            This action will reverse the linked cash/bank entry if any.
          </Typography>
        </DialogContent>

        <Box display="flex" justifyContent="flex-end" gap={1} p={2}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={confirmDeletePayment}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </Box>
      </Dialog>
    </Dialog>
  );
}

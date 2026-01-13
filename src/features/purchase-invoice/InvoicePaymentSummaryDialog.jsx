import React, { useEffect, useState } from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

export default function InvoicePaymentSummaryDialog({ open, onClose, data = [],  buyerName = "" }) {
  const [groupedData, setGroupedData] = useState({});

  useEffect(() => {
    if (open && data?.length) {
      const grouped = data.reduce((acc, item) => {
        if (!acc[item.po_number]) acc[item.po_number] = [];
        acc[item.po_number].push(item);
        return acc;
      }, {});
      setGroupedData(grouped);
    }
  }, [open, data]);

  const getFinancialYearText = () => {
    const today = dayjs();
    const fyStart = today.month() >= 3 ? today.year() : today.year() - 1;
    return `${fyStart}-${fyStart + 1}`;
  };

  const exportToExcel = () => {
    const wsData = [];
    const fy = getFinancialYearText();

    wsData.push([`Details till today`]); 
    wsData.push([`Buyer/Vendor: ${buyerName}`]);
    wsData.push([]);
    wsData.push(["PO Number", "Invoice Number", "Invoice Date", "Total Invoice", "Total Paid", "Remaining", "Payment Date", "Payment Amount", "Payment Mode", "Reference", "Notes"]);

    data.forEach(inv => {
      if (inv.payments && inv.payments.length) {
        inv.payments.forEach(p => {
          wsData.push([
            inv.po_number,
            inv.invoice_number,
            dayjs(inv.invoice_date).format("YYYY-MM-DD"),
            parseFloat(inv.total_invoice_amount).toFixed(2),
            parseFloat(inv.total_paid).toFixed(2),
            parseFloat(inv.total_remaining).toFixed(2),
            p.payment_date,
            p.payment_amount,
            p.payment_mode,
            p.transaction_reference,
            p.payment_notes
          ]);
        });
      } else {
        wsData.push([
          inv.po_number,
          inv.invoice_number,
          dayjs(inv.invoice_date).format("YYYY-MM-DD"),
          parseFloat(inv.total_invoice_amount).toFixed(2),
          parseFloat(inv.total_paid).toFixed(2),
          parseFloat(inv.total_remaining).toFixed(2),
          "",
          "",
          "",
          "",
          ""
        ]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice Payment Summary");
    XLSX.writeFile(wb, `Invoice Payment Summary till today.xlsx`);
  };

  const summary = (() => {
    const totalInvoice = data.reduce((sum, d) => sum + Number(d.total_invoice_amount || 0), 0);
    const totalPaid = data.reduce((sum, d) => sum + Number(d.total_paid || 0), 0);
    const totalRemaining = totalInvoice - totalPaid;
    return { totalInvoice, totalPaid, totalRemaining };
  })();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box display="flex" gap={2} alignItems="center">
          Invoice & Payment Summary for {buyerName} (till today)
          {data?.length > 0 && (
            <Button variant="outlined" onClick={exportToExcel} startIcon={<FileDownloadIcon />}>
              Download Excel
            </Button>
          )}
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ background: "#fafafa" }}>
        {data.length === 0 ? (
          <Typography>No data available</Typography>
        ) : (
          <>
            {/* Summary Cards */}
            <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: 2, background: "#fff" }}>
              <Grid container spacing={2}>
                {[
                  {
                    label: "Total Invoices",
                    value: data.length,
                    icon: <ShoppingCartIcon color="primary" fontSize="large" />
                  },
                  {
                    label: "Total Invoice Amount",
                    value: `₹${summary.totalInvoice.toLocaleString()}`,
                    icon: <AttachMoneyIcon sx={{ color: "green" }} fontSize="large" />
                  },
                  {
                    label: "Total Paid",
                    value: `₹${summary.totalPaid.toLocaleString()}`,
                    icon: <PaymentIcon sx={{ color: "teal" }} fontSize="large" />
                  },
                  {
                    label: "Total Remaining",
                    value: `₹${summary.totalRemaining.toLocaleString()}`,
                    icon: <AccountBalanceWalletIcon sx={{ color: "red" }} fontSize="large" />
                  }
                ].map((item, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Box
                      sx={{
                        p: 2, borderRadius: 2, background: "#f9f9f9", boxShadow: 1,
                        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"
                      }}
                    >
                      {item.icon}
                      <Typography variant="h6" sx={{ mt: 1 }}>{item.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {Number(summary.totalRemaining) < 0 &&<Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: 2, background: "#fdcdcdff" }}>
                    You have overpaid this vendor! Please check your account correctly!
                </Paper>}

            {/* Accordion for each PO */}
            {Object.entries(groupedData).map(([po, invoices]) => (
              <Accordion key={po} sx={{ mb: 1, borderRadius: 2, boxShadow: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="caption" fontWeight="bold">
                    Purchase Order No: {po}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {invoices.map((inv, i) => (
                    <Paper key={i} sx={{ mb: 2, p: 2, borderRadius: 2, 
                        background: Number(inv?.total_remaining || 0) === 0 ? "#edffe8ff"  : Number(inv?.total_remaining || 0) < 0 ? "#f5d8caff" : "#ffe8e8ff", 
                    boxShadow: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography fontWeight="bold">Invoice: {inv.invoice_number}</Typography>
                          <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                            <CalendarMonthIcon fontSize="small" />
                            <Typography variant="body2">{dayjs(inv.invoice_date).format("DD-MM-YYYY")}</Typography>
                          </Box>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2" color="text.secondary">Invoice Total</Typography>
                          <Typography variant="h6" color="primary">₹{Number(inv.total_invoice_amount).toLocaleString()}</Typography>
                        </Box>
                        <Box textAlign="right" ml={2}>
                          <Typography variant="body2" color="text.secondary">Paid</Typography>
                          <Typography variant="h6" color="success.main">₹{Number(inv.total_paid).toLocaleString()}</Typography>
                        </Box>
                        <Box textAlign="right" ml={2}>
                          <Typography variant="body2" color="text.error">Remaining</Typography>
                          <Typography variant="h6" color="error.main">₹{Number(inv.total_remaining).toLocaleString()}</Typography>
                        </Box>
                      </Box>

                      <Table size="small" sx={{ mt: 2 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell align="right"><strong>Amount</strong></TableCell>
                            <TableCell><strong>Mode</strong></TableCell>
                            <TableCell><strong>Reference</strong></TableCell>
                            <TableCell><strong>Notes</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {inv.payments?.filter(p => p.payment_id)?.length > 0 ? (
                            inv.payments.map(p => (
                              <TableRow key={p.payment_id}>
                                <TableCell>{dayjs(p.payment_date).format("DD-MM-YYYY")}</TableCell>
                                <TableCell align="right" sx={{ color: "#2e7d32", fontWeight: "bold" }}>₹{p.payment_amount?.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {p.payment_mode === "BANK_TRANSFER" ? <AccountBalanceIcon fontSize="small" /> : <PaymentIcon fontSize="small" />}
                                    <Typography>{p.payment_mode}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{p.transaction_reference}</TableCell>
                                <TableCell>{p.payment_notes}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <Typography variant="body2" color="text.secondary">No payments recorded.</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Paper>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Accordion,
  AccordionSummary, AccordionDetails, Box, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Paper, Grid, Button
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import * as XLSX from "xlsx";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import dayjs from "dayjs";
import { getSalesOrdersWithPaymentsService } from "../../services/salesService";
import { useUI } from "../../context/UIContext";

const exportToExcel = (data, buyer, financialYear) => {
  if (!financialYear) {
    const now = dayjs();
    const fyStartMonth = 3;
    const startYear = now.month() >= fyStartMonth ? now.year() : now.year() - 1;
    financialYear = `${startYear}-${startYear + 1}`;
  }

  const totalOrders = data.length;
  const totalOrderValue = data.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);
  const totalPayment = data.reduce((sum, o) => sum + parseFloat(o.total_paid || 0), 0);
  const totalRemaining = totalOrderValue - totalPayment;

  const wsData = [];

  wsData.push(['Data from 2021-04-01 till Today']);
  wsData.push([]);
  wsData.push(['Dealer/Customer Name', buyer]);
    wsData.push([]);

  wsData.push([
    "Total Orders",
    "Total Order Value",
    "Total Payment",
    "Total Remaining Amount"
  ]);
  wsData.push([
    totalOrders,
    totalOrderValue.toFixed(2),
    totalPayment.toFixed(2),
    totalRemaining.toFixed(2)
  ]);
  wsData.push([]);

  wsData.push([
    "Order Code",
    "Order Date",
    "Order Type",
    "Grand Total",
    "Payment Status",
    "Total Paid",
    "Payment ID",
    "Payment Date",
    "Payment Amount",
    "Payment Mode",
    "Transaction Reference",
    "Payment Notes",
    "Payment Received Account No"
  ]);

  data.forEach(order => {
    if (order.payment_details && order.payment_details.length > 0) {
      order.payment_details.forEach(payment => {
        wsData.push([
          order.sales_order_code,
          dayjs(order.order_date).format("YYYY-MM-DD"),
          order.order_type,
          parseFloat(order.grand_total).toFixed(2),
          order.payment_status,
          parseFloat(order.total_paid).toFixed(2),
          payment.payment_id,
          payment.payment_date,
          payment.payment_amount,
          payment.payment_mode,
          payment.transaction_reference,
          payment.payment_notes,
          payment.payment_received_account_no
        ]);
      });
    } else {
      wsData.push([
        order.sales_order_id,
        order.sales_order_code,
        dayjs(order.order_date).format("YYYY-MM-DD"),
        order.order_type,
        parseFloat(order.grand_total).toFixed(2),
        order.payment_status,
        parseFloat(order.total_paid).toFixed(2),
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      ]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = [
  { wch: 30 }, // Column B width
  { wch: 20 },  
  { wch: 20 }, 
  { wch: 20 },  
  { wch: 10 },  
  { wch: 20 },  
  { wch: 10 },  
  { wch: 10 },  
  { wch: 20 },  
  { wch: 20 },  
  { wch: 20 },  
  { wch: 20 },  
  { wch: 20 },  
];
ws['!cols'] = colWidths;



// Add borders to all cells
Object.keys(ws).forEach(cell => {
  if (cell[0] === '!') return; // skip special keys like !ref
  if (!ws[cell].s) ws[cell].s = {};
  ws[cell].s.border = {
    top:    { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left:   { style: "thin", color: { rgb: "000000" } },
    right:  { style: "thin", color: { rgb: "000000" } }
  };
});
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Order & Payment History");

  XLSX.writeFile(wb, `Order_Payment_History_2021-04-01_till_today.xlsx`);
};





export default function OrderPaymentHistoryDialog({ open, onClose, customerId, dealerId, buyerName }) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const { showSnackbar, showLoader, hideLoader } = useUI();

  // Calculate current financial year range
  const getFinancialYearText = () => {
    const today = dayjs();
    const fyStart = today.month() >= 3 ? today.year() : today.year() - 1;
    return `${fyStart}-${fyStart + 1}`;
  };

  useEffect(() => {
    if (open && (customerId || dealerId)) {
      
      fetchData();
      
    }
  }, [open, customerId, dealerId]);

  const fetchData = async () => {
    showLoader();
    try {
      setLoading(true);
      const data = await getSalesOrdersWithPaymentsService(null, null, customerId, dealerId);
      setOrders(data?.orders || []);
      if (!data?.orders?.length) {
        showSnackbar("No Order and Payment details found!", "warning");
      } else {
        showSnackbar("Order and Payment details fetched successfully!", "success");
      }
    } catch (err) {
      setOrders([]);
      console.error("Error fetching orders with payments:", err);
      showSnackbar("Order and Payment details fetching failed!", "error");
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "FULL PAID": return "success";
      case "PAID PARTIALLY": return "warning";
      case "OVERPAID": return "info";
      default: return "error";
    }
  };

  


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box display={'flex'} gap={2} alignItems={'center'}>
            Order & Payment History from 1st April 2021 till today
        { orders?.length > 0 && <Button variant="outlined"  onClick={() => {exportToExcel(orders || [], buyerName || "")}}  startIcon={<FileDownloadIcon />}>
                     Download Excel
        </Button> }
        </Box>
        
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: "#fafafa" }}>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : orders.length === 0 ? (
          <Typography>No data available</Typography>
        ) : (
          <>
            <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: 2, background: "#fafafa" }}>
              {(() => {
                const totalOrders = orders.length;
                const totalOrderValue = orders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
                const totalPaid = orders.reduce((sum, o) => sum + Number(o.total_paid || 0), 0);
                const totalRemaining = totalOrderValue - totalPaid;

                const summaryItems = [
                  {
                    label: "Total Orders",
                    value: totalOrders,
                    icon: <ShoppingCartIcon fontSize="large" color="primary" />,
                    color: "primary.main",
                  },
                  {
                    label: "Total Order Value",
                    value: `₹${totalOrderValue.toLocaleString()}`,
                    icon: <AttachMoneyIcon fontSize="large" sx={{ color: "green" }} />,
                    color: "green",
                  },
                  {
                    label: "Total Paid",
                    value: `₹${totalPaid.toLocaleString()}`,
                    icon: <PaymentIcon fontSize="large" sx={{ color: "teal" }} />,
                    color: "teal",
                  },
                  {
                    label: "Total Remaining",
                    value: `₹${totalRemaining.toLocaleString()}`,
                    icon: <AccountBalanceWalletIcon fontSize="large" sx={{ color: "red" }} />,
                    color: "red",
                  },
                ];

                return (
                  <Grid container spacing={2}>
                    {summaryItems.map((item, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: "white",
                            boxShadow: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                          }}
                        >
                          {item.icon}
                          <Typography variant="h5" fontWeight="bold" sx={{ mt: 1, color: item.color }}>
                            {item.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                );
              })()}
            </Paper>
            { orders.map((o) => (
            <Accordion key={o.sales_order_id} sx={{ mb: 1, borderRadius: 2, boxShadow: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {o.sales_order_code}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CalendarMonthIcon fontSize="small" />
                      <Typography variant="body2">{dayjs(o.order_date).format("DD-MM-YYYY")}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={o.order_type}
                      color={o.order_type === "DEALER" ? "info" : "primary"}
                    />
                  </Box>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">Grand Total</Typography>
                  <Typography variant="h6" color="primary">₹{Number(o.grand_total).toLocaleString()}</Typography>
                </Box>

                <Box sx={{ textAlign: "right", ml: 2 }}>
                  <Typography variant="body2" color="text.secondary">Paid</Typography>
                  <Typography variant="h6" color="success.main">₹{Number(o.total_paid).toLocaleString()}</Typography>
                </Box>

                 {Number(Number(o.grand_total) - Number(o.total_paid)) > 0 && <Box sx={{ textAlign: "right", ml: 2 }}>
                  <Typography variant="body2" color="text.error">Remaining</Typography>
                  <Typography variant="h6" color="error.main">₹{Number(Number(o.grand_total) - Number(o.total_paid)).toLocaleString()}</Typography>
                </Box>}


                <Box sx={{ ml: 2, mr:2 }}>
                  <Chip
                    label={o.payment_status}
                    color={getPaymentStatusColor(o.payment_status)}
                    variant="filled"
                  />
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                {o.payment_details?.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                        <TableCell align="center"><strong>Mode</strong></TableCell>
                        <TableCell><strong>Ref</strong></TableCell>
                        <TableCell><strong>Received AC No.</strong></TableCell>
                        <TableCell><strong>Notes</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {o.payment_details.map((p) => (
                        <TableRow key={p.payment_id}>
                          <TableCell>{dayjs(p.payment_date).format("DD-MM-YYYY")}</TableCell>
                          <TableCell align="right" style={{ color: "#2e7d32", fontWeight: "bold" }}>
                            ₹{p.payment_amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Box display={'flex'} alignItems={'center'} justifyContent={'center'} gap={0.5}>
                                 {p.payment_mode === "BANK_TRANSFER" ? <AccountBalanceIcon fontSize="small" /> : <PaymentIcon fontSize="small" />}
                            &nbsp;<Typography>{p.payment_mode?.replace(/_/g, ' ')}</Typography>

                            </Box>
                           
                          </TableCell>
                          <TableCell>{p.transaction_reference}</TableCell>
                          <TableCell>{p.payment_received_account_no}</TableCell>
                          <TableCell>{p.payment_notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant="body2" color="text.secondary">No payments recorded.</Typography>
                )}
              </AccordionDetails>
            </Accordion>
          )) }
          </>  
         
        )}
      </DialogContent>
    </Dialog>
  );
}

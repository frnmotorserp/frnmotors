import React, { useEffect, useState, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import DialogActions from "@mui/material/DialogActions";
import DeleteIcon from "@mui/icons-material/Delete";

import DiscountIcon from "@mui/icons-material/Discount";

import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaymentIcon from "@mui/icons-material/Payment";

import HistoryIcon from "@mui/icons-material/History";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import History from "@mui/icons-material/History";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import * as XLSX from "xlsx";

import { softDeletePartyPaymentService } from "../../services/salesService";

import dayjs from "dayjs";
import {
  getSalesOrdersWithPaymentsService,
  getPartyPaymentsService,
  getYearWiseProductOrderCountService,
  getSalesPartyDiscountsService,
} from "../../services/salesService";
import { useUI } from "../../context/UIContext";
import PartyPaymentFormDialog from "../party-payment-sales/PartyPaymentFormDialog";
import { getAllBanks } from "../../services/invoicePaymentsService";
import PartyDiscountFormDialog from "../party-payment-sales/PartyDiscountFormDialog";

const exportToExcel = (
  orders = [],
  payments = [],
  discounts = [],
  buyer = "",
  financialYear
) => {
  if (!financialYear) {
    const now = dayjs();
    const fyStartMonth = 3;
    const startYear = now.month() >= fyStartMonth ? now.year() : now.year() - 1;
    financialYear = `${startYear}-${startYear + 1}`;
  }

  // ===== SUMMARY =====
  const totalOrders = orders.length;
  const totalOrderValue = orders.reduce(
    (sum, o) => sum + Number(o.grand_total || 0),
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
  const totalRemaining = totalOrderValue - totalPaid - totalDiscount;

  const wsSummaryData = [
    ["Order and Payment Summary"],
    [],
    ["Dealer/Customer Name", buyer],
    [],
    [
      "Total Orders",
      "Total Order Value",
      "Total Paid",
      "Total Discount",
      "Total Remaining",
    ],
    [
      totalOrders,
      totalOrderValue.toFixed(2),
      totalPaid.toFixed(2),
      totalDiscount.toFixed(2),
      totalRemaining.toFixed(2),
    ],
  ];

  const wsPaymentsData = [
    ["Date", "Mode", "Bank / Cash", "Account", "Reference", "Amount", "Notes"],
  ];
  payments.forEach((p) => {
    wsPaymentsData.push([
      dayjs(p.payment_date).format("DD-MM-YYYY"),
      p.payment_method,
      p.payment_method === "BANK" ? p.bank_name : "Cash",
      p.account_number || "-",
      p.transaction_reference || "-",
      Number(p.payment_amount).toFixed(2),
      p.notes || "-",
    ]);
  });

  /* ===================== DISCOUNTS ===================== */
  const wsDiscountsData = [["Date", "Discount Amount", "Reason / Notes"]];

  discounts.forEach((d) => {
    wsDiscountsData.push([
      dayjs(d.discount_date).format("DD-MM-YYYY"),
      Number(d.discount_amount).toFixed(2),
      d.reason || "-",
    ]);
  });

  const wsOrdersData = [["Order Code", "Order Date", "Grand Total"]];
  orders.forEach((o) => {
    wsOrdersData.push([
      o.sales_order_code,
      dayjs(o.order_date).format("DD-MM-YYYY"),
      Number(o.grand_total).toFixed(2),
    ]);
  });

  // ===== CREATE SHEETS =====
  const wb = XLSX.utils.book_new();

  const createSheet = (data, sheetName) => {
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Column widths based on content
    const colWidths = data[0].map((_, i) => {
      let maxLen = data.reduce((max, row) => {
        const val = row[i] ? String(row[i]) : "";
        return val.length > max ? val.length : max;
      }, 10);
      return { wch: maxLen + 5 }; // extra padding
    });
    ws["!cols"] = colWidths;

    // Add borders
    Object.keys(ws).forEach((cell) => {
      if (cell[0] === "!") return; // skip special keys
      ws[cell].s = ws[cell].s || {};
      ws[cell].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };
      ws[cell].s.alignment = {
        vertical: "center",
        horizontal: "left",
        wrapText: true,
      };
      ws[cell].s.font = { name: "Arial", sz: 10 };
    });

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  createSheet(wsSummaryData, "Summary");
  createSheet(wsPaymentsData, "Payments");
  createSheet(wsDiscountsData, "Discounts");
  createSheet(wsOrdersData, "Orders");

  XLSX.writeFile(wb, `Order_Payment_History.xlsx`);
};

const transformProductSummary = (data) => {
  const yearSet = new Set();
  const productMap = {};

  data.forEach(({ product_id, product_name, order_year, total_quantity }) => {
    yearSet.add(order_year);

    if (!productMap[product_id]) {
      productMap[product_id] = {
        product_id,
        product_name,
        total: 0,
      };
    }

    const qty = Number(total_quantity);
    productMap[product_id][order_year] = qty;
    productMap[product_id].total += qty;
  });

  return {
    years: Array.from(yearSet).sort(), // [2024, 2025, ...]
    rows: Object.values(productMap),
  };
};
const exportProductSummaryToExcel = (
  pivotYears,
  pivotRows,
  buyerName,
  partyType
) => {
  if (!pivotRows.length) return;

  const wsData = [];

  // Header info
  wsData.push([`${partyType} Product Order Summary`]);
  wsData.push(["Party Name", buyerName]);
  wsData.push([]);

  // Table header
  wsData.push([
    "Product Name",
    ...pivotYears.map((y) => y.toString()),
    "Total",
  ]);

  // Rows
  pivotRows.forEach((row) => {
    wsData.push([
      row.product_name,
      ...pivotYears.map((y) => row[y] ?? 0),
      row.total,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto column widths
  ws["!cols"] = [
    { wch: 40 },
    ...pivotYears.map(() => ({ wch: 15 })),
    { wch: 15 },
  ];

  // Borders
  Object.keys(ws).forEach((cell) => {
    if (cell.startsWith("!")) return;
    ws[cell].s = {
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Product Order Summary");

  XLSX.writeFile(wb, `Product_Order_Summary_${buyerName || "Party"}.xlsx`);
};

export default function OrderPaymentHistoryDialog({
  open,
  onClose,
  customerId,
  dealerId,
  buyerName,
  partyType,
}) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [allBanks, setAllBanks] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentFetchLoadingLocal, setPaymentFetchLoadingLocal] =
    useState(false);

  const [productSummary, setProductSummary] = useState([]);
  const [productSummaryLoading, setProductSummaryLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [openCreatePartyPaymentDialog, setOpenCreatePartyPaymentDialog] =
    useState(false);
  const { showSnackbar, showLoader, hideLoader } = useUI();
  //console.log(customerId, dealerId, buyerName, partyType);

  const [pivotYears, setPivotYears] = useState([]);
  const [pivotRows, setPivotRows] = useState([]);

  const [openCreatePartyDiscountDialog, setOpenCreatePartyDiscountDialog] =
    useState(false);

  const [discounts, setDiscounts] = useState([]);
  const [discountFetchLoading, setDiscountFetchLoading] = useState(false);

  const resetAllStates = () => {
    setLoading(false);
    setOrders([]);
    setPayments([]);
    setDiscounts([]);
    setPaymentSearch("");
    setActiveTab(0);

    setProductSummary([]);
    setPivotYears([]);
    setPivotRows([]);

    setOpenCreatePartyPaymentDialog(false);
    setOpenCreatePartyDiscountDialog(false);
  };

  const fetchPartyDiscounts = async () => {
    try {
      setDiscountFetchLoading(true);

      const res = await getSalesPartyDiscountsService({
        partyType,
        customerId,
        dealerId,
        fromDate: "2020-01-01",
        toDate: dayjs().format("YYYY-MM-DD"),
      });

      setDiscounts(res || []);
    } catch (err) {
      console.error("Failed to fetch party discounts", err);
      showSnackbar("Failed to load discount history", "error");
      setDiscounts([]);
    } finally {
      setDiscountFetchLoading(false);
    }
  };

  const fetchProductOrderSummary = async () => {
    try {
      setProductSummaryLoading(true);

      const res = await getYearWiseProductOrderCountService({
        partyType,
        customerId,
        dealerId,
      });

      setProductSummary(res || []);

      if (!res?.length) {
        showSnackbar("No product order summary found", "info");
      }
    } catch (err) {
      console.error("Failed to fetch product order summary", err);
      showSnackbar("Failed to load product order summary", "error");
      setProductSummary([]);
    } finally {
      setProductSummaryLoading(false);
    }
  };

  const filteredPayments = useMemo(() => {
    if (!paymentSearch) return payments;

    const q = paymentSearch.toLowerCase();

    return payments.filter((p) =>
      [
        p.payment_method,
        p.bank_name,
        p.transaction_reference,
        p.notes,
        p.account_number,
        p.payment_date,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [payments, paymentSearch]);

  const fetchPartyPayments = async () => {
    try {
      //showLoader();
      setPaymentFetchLoadingLocal(true);
      const res = await getPartyPaymentsService({
        partyType,
        customerId,
        dealerId,
        // optional date range
        fromDate: "2020-01-01",
        toDate: dayjs().format("YYYY-MM-DD"),
      });

      setPayments(res || []);

      if (!res?.length) {
        showSnackbar("No payment history found", "info");
      }
    } catch (err) {
      console.error("Failed to fetch party payments", err);
      showSnackbar("Failed to load payment history", "error");
      setPayments([]);
    } finally {
      setPaymentFetchLoadingLocal(false);
      //hideLoader();
    }
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

  // Helper to determine financial year (April to March) ---- To be used later
  const getFinancialYear = (date) => {
    const d = dayjs(date);
    const year = d.year();
    const isAfterMarch = d.month() >= 3; // 0-indexed, 3 is April
    return isAfterMarch ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };
  // Grouping logic ---- To be used later
  const groupedOrders = useMemo(() => {
    const groups = {};
    orders.forEach((order) => {
      const fy = getFinancialYear(order.order_date);
      if (!groups[fy]) groups[fy] = [];
      groups[fy].push(order);
    });
    // Sort years descending
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [orders]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Tab index 2 = Product Order Summary
    if (newValue === 3 && productSummary.length === 0) {
      fetchProductOrderSummary();
    }
  };

  // Calculate current financial year range
  const getFinancialYearText = () => {
    const today = dayjs();
    const fyStart = today.month() >= 3 ? today.year() : today.year() - 1;
    return `${fyStart}-${fyStart + 1}`;
  };

  useEffect(() => {
    if (open && (customerId || dealerId)) {
      fetchData();
      fetchBankswithBalance();
      fetchPartyPayments();
      fetchPartyDiscounts();
    }
  }, [open, customerId, dealerId]);

  useEffect(() => {
    if (productSummary.length > 0) {
      const { years, rows } = transformProductSummary(productSummary);
      setPivotYears(years);
      setPivotRows(rows);
    }
  }, [productSummary]);

  const fetchData = async () => {
    showLoader();
    try {
      setLoading(true);
      const data = await getSalesOrdersWithPaymentsService(
        null,
        null,
        customerId,
        dealerId
      );
      setOrders(data?.orders || []);
      if (!data?.orders?.length) {
        showSnackbar("No Order and Payment details found!", "warning");
      } else {
        showSnackbar(
          "Order and Payment details fetched successfully!",
          "success"
        );
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
      case "FULL PAID":
        return "success";
      case "PAID PARTIALLY":
        return "warning";
      case "OVERPAID":
        return "info";
      default:
        return "error";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box display={"flex"} gap={2} alignItems={"center"}>
          Order & Payment History (Till Today)
          {(orders?.length > 0 || payments?.lenght > 0) && (
            <Button
              variant="outlined"
              onClick={() => {
                exportToExcel(orders, payments, discounts, buyerName || "");
              }}
              startIcon={<BackupTableIcon />}
            >
              Export
            </Button>
          )}
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              setOpenCreatePartyDiscountDialog(true);
            }}
          >
            + Add Discount
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenCreatePartyPaymentDialog(true);
            }}
          >
            + Add Payment
          </Button>
        </Box>

        <IconButton
          onClick={() => {
            resetAllStates();
            onClose();
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: "#fafafa" }}>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : orders.length === 0 ? (
          <Typography>No data available</Typography>
        ) : (
          <>
            <Paper
              elevation={3}
              sx={{ p: 2, mb: 2, borderRadius: 2, background: "#fafafa" }}
            >
              {(() => {
                const totalOrders = orders.length;
                const totalOrderValue = orders.reduce(
                  (sum, o) => sum + Number(o.grand_total || 0),
                  0
                );
                const totalPaid = payments.reduce(
                  (sum, o) => sum + Number(o.payment_amount || 0),
                  0
                );
                const totalDiscount = discounts.reduce(
                  (sum, d) => sum + Number(d.discount_amount || 0),
                  0
                );

                const totalRemaining =
                  totalOrderValue - totalPaid - totalDiscount;

                // const totalRemaining = totalOrderValue - totalPaid;

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
                    icon: (
                      <AttachMoneyIcon
                        fontSize="large"
                        sx={{ color: "green" }}
                      />
                    ),
                    color: "green",
                  },
                  {
                    label: "Total Paid",
                    value: `₹${totalPaid.toLocaleString()}`,
                    icon: (
                      <PaymentIcon fontSize="large" sx={{ color: "teal" }} />
                    ),
                    color: "teal",
                  },
                  {
                    label: "Total Discount",
                    value: `₹${totalDiscount.toLocaleString()}`,
                    icon: (
                      <DiscountIcon fontSize="large" sx={{ color: "orange" }} />
                    ),
                    color: "orange",
                  },

                  {
                    label: "Total Remaining",
                    value: `₹${totalRemaining.toLocaleString()}`,
                    icon: (
                      <AccountBalanceWalletIcon
                        fontSize="large"
                        sx={{ color: "red" }}
                      />
                    ),
                    color: "red",
                  },
                ];

                return (
                  <Grid container spacing={2}>
                    {summaryItems.map((item, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={index === summaryItems?.length - 1 ? 12 : 6}
                        md={index === summaryItems?.length - 1 ? 8 : 4}
                        key={index}
                      >
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
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            sx={{ mt: 1, color: item.color }}
                          >
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
            {/* Centered Modern Tabs */}
            <Box
              sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "white" }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                centered
                sx={{
                  "& .MuiTab-root": { py: 2, fontWeight: "600" },
                }}
              >
                <Tab
                  icon={<PaymentIcon fontSize="small" />}
                  iconPosition="start"
                  label="Payment Details"
                />
                <Tab
                  icon={<DiscountIcon fontSize="small" />}
                  iconPosition="start"
                  label="Discount Details"
                />
                <Tab
                  icon={<ReceiptLongIcon fontSize="small" />}
                  iconPosition="start"
                  label="Order Details"
                />
                <Tab
                  icon={<History fontSize="small" />}
                  iconPosition="start"
                  label="Product Order Summery"
                />
              </Tabs>
            </Box>

            {/* Tab Content Area */}
            <Box sx={{ p: 3 }}>
              {paymentFetchLoadingLocal && (
                <Box display={"flex"} justifyContent={"center"}>
                  <Typography> Updating Latest Payments...</Typography>
                </Box>
              )}
              {activeTab === 0 &&
                (payments?.length === 0 ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    sx={{ py: 8, opacity: 0.6 }}
                  >
                    <HistoryIcon
                      sx={{ fontSize: 64, mb: 2, color: "text.disabled" }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      No History Found
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      There are no payment records for this selection.
                    </Typography>
                  </Box>
                ) : (
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {/* Header + Search */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="h6" fontWeight="600">
                        Payment History
                      </Typography>

                      <TextField
                        size="small"
                        placeholder="Search by bank, ref, notes..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        sx={{ width: 280 }}
                      />
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Table */}
                    {filteredPayments.length === 0 ? (
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        py={6}
                        opacity={0.6}
                      >
                        <HistoryIcon sx={{ fontSize: 48, mb: 1 }} />
                        <Typography>No payment records found</Typography>
                      </Box>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <b>Date</b>
                            </TableCell>
                            <TableCell>
                              <b>Mode</b>
                            </TableCell>
                            <TableCell>
                              <b>Bank / Cash</b>
                            </TableCell>
                            <TableCell>
                              <b>Account</b>
                            </TableCell>
                            <TableCell>
                              <b>Reference</b>
                            </TableCell>
                            <TableCell align="right">
                              <b>Amount</b>
                            </TableCell>
                            <TableCell>
                              <b>Notes</b>
                            </TableCell>
                            <TableCell align="center">
                              <b>Action</b>
                            </TableCell>
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
                                    p.payment_method === "BANK"
                                      ? "info"
                                      : "success"
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                {p.payment_method === "BANK"
                                  ? p.bank_name
                                  : "Cash"}
                              </TableCell>

                              <TableCell>{p.account_number || "-"}</TableCell>

                              <TableCell>
                                {p.transaction_reference || "-"}
                              </TableCell>

                              <TableCell align="right" sx={{ fontWeight: 700 }}>
                                ₹{Number(p.payment_amount).toLocaleString()}
                              </TableCell>

                              <TableCell>{p.notes || "-"}</TableCell>
                              <TableCell align="center">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => {
                                    setDeleteTarget({
                                      type: "PAYMENT",
                                      id: p.party_payment_id,
                                    });
                                    setConfirmOpen(true);
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Paper>
                ))}
              {activeTab === 1 && (
                <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Discount History
                  </Typography>

                  {discounts.length === 0 ? (
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
                        {discounts.map((d) => (
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
                  )}
                </Paper>
              )}

              {activeTab === 2 && (
                <Box>
                  {" "}
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#ffffff" }}>
                        <TableCell
                          sx={{ fontWeight: "bold", color: "text.secondary" }}
                        >
                          Order Code
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: "bold", color: "text.secondary" }}
                        >
                          Order Date
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: "bold", color: "text.secondary" }}
                        >
                          Grand Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!orders && <TableRow>No Orders Found!</TableRow>}
                      {orders?.map((o) => (
                        <TableRow key={o.sales_order_id} hover>
                          <TableCell
                            sx={{ fontWeight: "600", color: "primary.main" }}
                          >
                            {o.sales_order_code}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <CalendarMonthIcon
                                fontSize="inherit"
                                sx={{ color: "text.disabled" }}
                              />
                              {dayjs(o.order_date).format("DD-MM-YYYY")}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: "700" }}>
                            ₹{Number(o.grand_total).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/*<Box>
                  {orders.map((o) => (
                    <Accordion
                      key={o.sales_order_id}
                      sx={{ mb: 1, borderRadius: 2, boxShadow: 2 }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {o.sales_order_code}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <CalendarMonthIcon fontSize="small" />
                              <Typography variant="body2">
                                {dayjs(o.order_date).format("DD-MM-YYYY")}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={o.order_type}
                              color={
                                o.order_type === "DEALER" ? "info" : "primary"
                              }
                            />
                          </Box>
                        </Box>

                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="body2" color="text.secondary">
                            Grand Total
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ₹{Number(o.grand_total).toLocaleString()}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "right", ml: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Paid
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            ₹{Number(o.total_paid).toLocaleString()}
                          </Typography>
                        </Box>

                        {Number(Number(o.grand_total) - Number(o.total_paid)) >
                          0 && (
                          <Box sx={{ textAlign: "right", ml: 2 }}>
                            <Typography variant="body2" color="text.error">
                              Remaining
                            </Typography>
                            <Typography variant="h6" color="error.main">
                              ₹
                              {Number(
                                Number(o.grand_total) - Number(o.total_paid)
                              ).toLocaleString()}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ ml: 2, mr: 2 }}>
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
                                <TableCell>
                                  <strong>Date</strong>
                                </TableCell>
                                <TableCell align="right">
                                  <strong>Amount</strong>
                                </TableCell>
                                <TableCell align="center">
                                  <strong>Mode</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>Ref</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>Received AC No.</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>Notes</strong>
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {o.payment_details.map((p) => (
                                <TableRow key={p.payment_id}>
                                  <TableCell>
                                    {dayjs(p.payment_date).format("DD-MM-YYYY")}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    style={{
                                      color: "#2e7d32",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    ₹{p.payment_amount.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Box
                                      display={"flex"}
                                      alignItems={"center"}
                                      justifyContent={"center"}
                                      gap={0.5}
                                    >
                                      {p.payment_mode === "BANK_TRANSFER" ? (
                                        <AccountBalanceIcon fontSize="small" />
                                      ) : (
                                        <PaymentIcon fontSize="small" />
                                      )}
                                      &nbsp;
                                      <Typography>
                                        {p.payment_mode?.replace(/_/g, " ")}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    {p.transaction_reference}
                                  </TableCell>
                                  <TableCell>
                                    {p.payment_received_account_no}
                                  </TableCell>
                                  <TableCell>{p.payment_notes}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No payments recorded.
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box> */}
                </Box>
              )}
              {activeTab === 3 && (
                <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                  {/* Header */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="h6" fontWeight={600}>
                      Product Order Summary (Year-wise)
                    </Typography>

                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={fetchProductOrderSummary}
                        startIcon={<HistoryIcon />}
                        disabled={productSummaryLoading}
                      >
                        Refresh
                      </Button>

                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<FileDownloadIcon />}
                        disabled={!pivotRows.length}
                        onClick={() =>
                          exportProductSummaryToExcel(
                            pivotYears,
                            pivotRows,
                            buyerName,
                            partyType
                          )
                        }
                      >
                        Download Excel
                      </Button>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {productSummaryLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <Typography>Loading product summary...</Typography>
                    </Box>
                  ) : productSummary.length === 0 ? (
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      py={6}
                      opacity={0.6}
                    >
                      <HistoryIcon sx={{ fontSize: 48, mb: 1 }} />
                      <Typography>No product summary found</Typography>
                    </Box>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <b>Product Name</b>
                          </TableCell>

                          {pivotYears.map((year) => (
                            <TableCell key={year} align="right">
                              <b>{year}</b>
                            </TableCell>
                          ))}

                          <TableCell align="right">
                            <b>Total</b>
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {pivotRows.map((row) => (
                          <TableRow key={row.product_id} hover>
                            <TableCell>{row.product_name}</TableCell>

                            {pivotYears.map((year) => (
                              <TableCell key={year} align="right">
                                {row[year] ?? 0}
                              </TableCell>
                            ))}

                            <TableCell align="right">
                              <b>{row.total}</b>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Paper>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      <PartyPaymentFormDialog
        open={openCreatePartyPaymentDialog}
        allBanks={allBanks || []}
        partyType={partyType}
        partyId={partyType === "DEALER" ? dealerId : customerId}
        buyerName={buyerName}
        onClose={() => {
          setOpenCreatePartyPaymentDialog(false);
        }}
        fetchPartyPayments={fetchPartyPayments}
      />
      <PartyDiscountFormDialog
        open={openCreatePartyDiscountDialog}
        partyType={partyType}
        partyId={partyType === "DEALER" ? dealerId : customerId}
        buyerName={buyerName}
        onClose={() => setOpenCreatePartyDiscountDialog(false)}
        fetchPartyDiscounts={fetchPartyDiscounts}
      />
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete this record? This action cannot be
            undone.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>

          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              showLoader();
              try {
                if (deleteTarget?.type === "PAYMENT") {
                  await softDeletePartyPaymentService(deleteTarget.id);
                  hideLoader();
                  fetchPartyPayments();
                }

                showSnackbar("Deleted successfully", "success");
              } catch (err) {
                hideLoader();
                showSnackbar("Delete failed", "error");
              } finally {
                setConfirmOpen(false);
                setDeleteTarget(null);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

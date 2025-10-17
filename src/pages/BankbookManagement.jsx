import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CachedIcon from "@mui/icons-material/Cached";
import dayjs from "dayjs";
import { useUI } from "../context/UIContext";
import PageWrapper from "../layouts/PageWrapper";
import * as XLSX from "xlsx";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { getAcceessMatrix } from "../utils/loginUtil";
import {
  createBankTransactionService,
  listBankTransactionsService,
  fetchBankBalanceService,
  getAllBanks,
} from "../services/invoicePaymentsService";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PaymentsIcon from "@mui/icons-material/Payments";
import { listAllExpenseCategories } from "../services/invoicePaymentsService";

const BankTransactionForm = ({
  transaction,
  onClose,
  onSaved,
  allBanks = [],
  expenseCategoryList = [],
}) => {
  console.log("expenseCategoryList", expenseCategoryList);
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [form, setForm] = useState({
    bank_id: transaction?.bank_id || "",
    transaction_date:
      transaction?.transaction_date || dayjs().format("YYYY-MM-DD"),
    transaction_type: transaction?.transaction_type || "IN",
    reference_no: transaction?.reference_no || "",
    //narration: transaction?.narration || "",
    amount: transaction?.amount || "",
    mode_of_transaction: transaction?.mode_of_transaction,
    remarks: transaction?.remarks || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.bank_id) newErrors.bank_id = "Bank is required";
    if (!form.transaction_date)
      newErrors.transaction_date = "Transaction date is required";
    if (!form.transaction_date)
      newErrors.transaction_date = "Transaction date is required";
    if (!form.expense_category)
      newErrors.expense_category = "Payment category is required";
    if (!form.reference_no)
      newErrors.reference_no = "Reference no. is required";
    if (!form.amount) newErrors.amount = "Amount is required";
    else if (isNaN(form.amount))
      newErrors.amount = "Amount must be a valid number";
    if (!form.mode_of_transaction)
      newErrors.mode_of_transaction = "Mode of transaction is required";
    if (!form.remarks) newErrors.remarks = "Remarks are required";
    console.log(Object.values(newErrors));
    Object.keys(newErrors).length > 0 &&
      showSnackbar(Object.values(newErrors), "error");
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
    if (!form.amount || isNaN(form.amount) || parseInt(form?.amount) <= 0) {
      showSnackbar("Amount must be a valid positive number", "error");
      return;
    }

    showLoader();
    try {
      if (transaction) {
        await createBankTransactionService({ ...form });
        showSnackbar("Bank transaction updated", "success");
      } else {
        await createBankTransactionService(form);
        showSnackbar("Bank transaction added", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to save transaction", "error");
    } finally {
      hideLoader();
    }
  };

  const modes = ["Cash", "Cheque", "NEFT", "RTGS", "IMPS", "UPI", "DD"];
  return (
    <Box display="flex" flexDirection="column" gap={2} mt={1}>
      <TextField
        label="Transaction Date"
        type="date"
        name="transaction_date"
        size="small"
        value={form.transaction_date}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <TextField
        select
        label="Bank"
        size="small"
        placeholder="Please select bank"
        sx={{ minWidth: 220 }}
        name="bank_id"
        value={form.bank_id}
        onChange={handleChange}
        fullWidth
      >
        {allBanks?.map((bank) => (
          <MenuItem key={bank.bank_id} value={bank.bank_id}>
            {bank?.bank_name} - {bank?.account_number}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Transaction Type"
        name="transaction_type"
        size="small"
        select
        value={form.transaction_type}
        onChange={handleChange}
        fullWidth
      >
        <MenuItem value="IN" sx={{ color: "green", fontWeight: "bold" }}>
          Credit
        </MenuItem>
        <MenuItem value="OUT" sx={{ color: "red", fontWeight: "bold" }}>
          Debit
        </MenuItem>
      </TextField>
      <TextField
        label="Payment Category"
        name="expense_category"
         sx={{ minWidth: 200 }}
        size="small"
        select
        value={form.expense_category}
        onChange={handleChange}
        fullWidth
      >
        {expenseCategoryList?.map((cat) => (
          <MenuItem
            value={cat.expenseCategoryId}
            sx={{ color: "green", fontWeight: "bold" }}
          >
            {cat.expenseCategoryName}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Reference No. (UTR/Check No/Transaction Id)"
        name="reference_no"
        size="small"
        value={form.reference_no}
        onChange={handleChange}
        fullWidth
      />
      {/* <TextField
                label="Narration"
                name="narration"
                size="small"
                multiline
                minRows={2}
                value={form.narration}
                onChange={handleChange}
                fullWidth
            /> */}
      <TextField
        label="Amount"
        name="amount"
        size="small"
        type="number"
        value={form.amount}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        label="Mode of transaction"
        name="mode_of_transaction"
        size="small"
        select
        value={form.mode_of_transaction}
        onChange={handleChange}
        fullWidth
      >
        {modes.map((mode) => (
          <MenuItem key={mode} value={mode}>
            {mode}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Remarks"
        name="remarks"
        size="small"
        multiline
        minRows={3}
        value={form.remarks}
        onChange={handleChange}
        fullWidth
      />

      <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {transaction ? "Update" : "Add"}
        </Button>
      </Box>
    </Box>
  );
};

const BankCardList = ({ banks = [], fetchBankswithBalance }) => {
  if (!banks.length)
    return (
      <Typography variant="body1" sx={{ textAlign: "center", mt: 3 }}>
        No bank accounts found.
      </Typography>
    );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value || 0);

  const getGradient = (accountType) => {
    return accountType === "Current"
      ? "linear-gradient(135deg, #1b5e20, #4caf50)" // Deep green → light green
      : "linear-gradient(135deg, #2e7d32, #81c784)"; // Medium green → mint
  };

  return (
    <Grid container spacing={4}>
      {banks.map((bank) => (
        <Grid item xs={12} sm={4} md={4} key={bank.bank_id}>
          <Card
            sx={{
              borderRadius: 3,
              color: "white",
              width: 300,
              background: getGradient(bank.account_type),
              boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <AccountBalanceIcon sx={{ color: "white" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {bank.bank_name}
                  </Typography>
                  <CachedIcon
                    sx={{
                      fontSize: "1rem",
                      cursor: "pointer",
                      color: "lightgreen",
                    }}
                    onClick={() => {
                      fetchBankswithBalance();
                    }}
                  />
                </Box>
                <Chip
                  label={bank.account_type}
                  sx={{
                    backgroundColor:
                      bank.account_type === "Current"
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.2)",
                    color: "white",
                    fontWeight: 600,
                  }}
                  size="small"
                />
              </Box>

              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {bank.branch_name}
              </Typography>

              <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.3)" }} />

              <Box display="flex" alignItems="center" gap={1}>
                <PaymentsIcon fontSize="small" sx={{ color: "white" }} />
                <Typography variant="body2">
                  <strong>Account No:</strong> {bank.account_number}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <AccountCircleIcon fontSize="small" sx={{ color: "white" }} />
                <Typography variant="body2">
                  <strong>IFSC:</strong> {bank.ifsc_code}
                </Typography>
              </Box>

              <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.3)" }} />

              <Tooltip title="Current Ledger Balance">
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color:
                      parseFloat(bank.current_balance) >= 0
                        ? "#b9f6ca"
                        : "#ffccbc",
                  }}
                >
                  {formatCurrency(bank.current_balance)}
                </Typography>
              </Tooltip>

              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.8)" }}
              >
                Last updated:{" "}
                {bank.last_update
                  ? new Date(bank.last_update).toLocaleString()
                  : "Not available"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const BankbookManagement = () => {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [transactions, setTransactions] = useState([]);
  const [allBanks, setAllBanks] = useState([]);
  const [balance, setBalance] = useState(0);
  const [expenseCategoryList, setExpenseCategoryList] = useState([]);
  const [filters, setFilters] = useState({
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
    bankId: "",
    expenseCategoryId: 0,
    expenseCategoryName: 'All'
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [accessMatrix, setAccessMatrix] = useState({});

  const getExpenseCategoryListAPICall = (hideSnackbar) => {
    showLoader();
    listAllExpenseCategories()
      .then((res) => {
        if (res && res.length > 0) {
          setExpenseCategoryList(res);
          !hideSnackbar &&
            showSnackbar("Expense Categories fetched successfully!", "success");
        } else {
          setExpenseCategoryList([]);
          !hideSnackbar &&
            showSnackbar("No Expense Categories found!", "warning");
        }
        hideLoader();
      })
      .catch((err) => {
        console.error("Error fetching Expense Categories:", err);
        setExpenseCategoryList([]);
        hideLoader();
        !hideSnackbar &&
          showSnackbar("Failed to fetch Expense Categories!", "error");
      });
  };

  const handleExcelDownload = () => {
    if (!transactions.length) {
      showSnackbar("No transactions to export", "error");
      return;
    }

    const selectedBank = allBanks.find((b) => b.bank_id === filters.bankId);
    const bankName = selectedBank
      ? `${selectedBank.bank_name} (${selectedBank.account_number})`
      : "Unknown Bank";

    //  Compute totals
    const totalCredit = transactions
      .filter((t) => t.transaction_type === "IN")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const totalDebit = transactions
      .filter((t) => t.transaction_type === "OUT")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Prepare Excel Data
    const excelData = [
      ["Bankbook Report"],
      [`Bank: ${bankName}`],
      [`From: ${filters.startDate} To: ${filters.endDate}`],
      [`Payment Category: ${filters.expenseCategoryName}`],
      [""],
      ["Total Credit", totalCredit],
      ["Total Debit", totalDebit],
      [""],
      ["#", "Date", "Reference No", "Remarks", "Type", "Amount (₹)"],
      ...transactions.map((t, i) => [
        i + 1,
        dayjs(t.transaction_date).format("DD MMM YYYY"),
        t.reference_no,
        t.remarks,
        t.transaction_type === "IN" ? "Credit" : "Debit",
        parseFloat(t.amount || 0),
      ]),
      [""],
      ["Total Credit", totalCredit],
      ["Total Debit", totalDebit],
    ];

    // Create sheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    ws["!cols"] = [
      { wch: 5 }, // #
      { wch: 15 }, // Date
      { wch: 20 }, // Reference No
      { wch: 35 }, // Remarks
      { wch: 10 }, // Type
      { wch: 15 }, // Amount
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bankbook");

    // Download File
    const fileName = `Bankbook_${selectedBank?.bank_name || "Bank"}_${
      filters.startDate
    }_to_${filters.endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  useEffect(() => {
    //fetchTransactions();
    //fetchBalance();
    fetchBankswithBalance();
    getExpenseCategoryListAPICall();
    const access = getAcceessMatrix(
      "Inventory Management",
      "Bankbook Management"
    );
    setAccessMatrix(access);
  }, []);

  const fetchTransactions = () => {
    if (!filters.startDate || !filters.endDate || !filters.bankId) return;

    showLoader();
    listBankTransactionsService(
      filters.bankId,
      filters.startDate,
      filters.endDate,
      filters.expenseCategoryId
    )
      .then((res) => {
        console.log("res", res);
        setTransactions(res?.data || []);
      })
      .catch(() => {
        setTransactions([]);
        showSnackbar("Failed to fetch transactions", "error");
      })
      .finally(() => hideLoader());
  };

  const fetchBalance = () => {
    if (!filters.bankId) return;
    fetchBankBalanceService(filters.bankId)
      .then((res) => setBalance(res))
      .catch(() => showSnackbar("Failed to fetch balance", "error"));
  };
  const fetchBankswithBalance = () => {
    showLoader();
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
        hideLoader();
      });
  };

  const handleDialogOpen = (transaction = null) => {
    setEditingTransaction(transaction);
    setOpenFormDialog(true);
  };

  const handleDialogClose = () => {
    setEditingTransaction(null);
    setOpenFormDialog(false);
  };
  const getBankTransactions = () => {
    if (!filters.bankId) {
      showSnackbar("Please select bank for transactions", "error");
      return;
    }
    if (!filters.startDate) {
      showSnackbar("Please select start date for transactions", "error");
      return;
    }
    if (!filters.endDate) {
      showSnackbar("Please select end date for transactions", "error");
      return;
    }
    fetchTransactions();
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: "Add Transaction",
      buttonCallback: () => handleDialogOpen(),
      buttonIcon: <AddIcon fontSize="small" />,
      access: accessMatrix?.create ?? false,
    },
  ];

  return (
    <PageWrapper title="Bankbook Management" actionButtons={ActionButtonsArr}>
      <Box
        m={2}
        display="flex"
        flexDirection={"column"}
        alignItems="center"
        justifyContent="center"
      >
        {/* Filters */}
        <Box>
          <BankCardList
            banks={allBanks || []}
            fetchBankswithBalance={fetchBankswithBalance}
          />
        </Box>

        <Box display="flex" flexDirection="column" alignItems="center" mt={6}>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item>
              <TextField
                select
                label="Bank"
                size="small"
                placeholder="Please select bank"
                sx={{ minWidth: 220 }}
                value={filters.bankId}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, bankId: e.target.value }))
                }
                fullWidth
              >
                {allBanks?.map((bank) => (
                  <MenuItem key={bank.bank_id} value={bank.bank_id}>
                    {bank?.bank_name} - {bank?.account_number}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item>
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item>
              <TextField
                select
                label="Payment Category"
                type="date"
                size="small"
                value={filters.expenseCategoryId}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    expenseCategoryId: e.target.value,
                    expenseCategoryName: expenseCategoryList?.find(x => x.expenseCategoryId === e.target.value)?.expenseCategoryName || "All"
                  }))
                }
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value={0} sx={{ color: "green", fontWeight: "bold" }}>
                  All
                </MenuItem>

                {expenseCategoryList?.map((cat) => (
                  <MenuItem
                    value={cat.expenseCategoryId}
                    sx={{ color: "green", fontWeight: "bold" }}
                  >
                    {cat.expenseCategoryName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={getBankTransactions}>
                Get Transactions
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Balance */}
        {/* <Box
          sx={{
            p: 2,
            background: parseFloat(balance || 0) > 0 ? "linear-gradient(135deg, #4CAF50, #81C784)" : "linear-gradient(135deg, #f86d6dff, #e61c1cff)",
            borderRadius: 3,
            textAlign: "center",
            boxShadow: "0px 4px 15px rgba(0,0,0,0.2)",
            mt: 3
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>Current Balance</Typography>
          <Typography variant="h5" sx={{ fontWeight: "900", color: "white", mt: 1 }}>₹ {balance.toLocaleString()}</Typography>
        </Box> */}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 4,
            width: "100%",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {/* Search */}
          {transactions.length > 0 && (
            <TextField
              size="small"
              placeholder="Search Remarks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ minWidth: 200 }}
            />
          )}
          {transactions && transactions?.length > 0 && (
            <Button
              variant="outlined"
              color="success"
              onClick={handleExcelDownload}
              disabled={!transactions.length}
              startIcon={<FileDownloadIcon />}
            >
              Download Excel
            </Button>
          )}
        </Box>

        {/* Table */}
        <TableContainer
          component={Paper}
          elevation={4}
          sx={{ borderRadius: 3, mt: 2 }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>#</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Reference No.</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions
                ?.filter((tx) =>
                  tx.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                ?.map((row, idx) => (
                  <TableRow
                    key={row.transaction_id}
                    sx={{
                      backgroundColor:
                        row.transaction_type === "IN"
                          ? "rgba(76, 175, 80, 0.08)"
                          : "rgba(244, 67, 54, 0.08)",
                      "&:hover": {
                        backgroundColor:
                          row.transaction_type === "IN"
                            ? "rgba(76, 175, 80, 0.15)"
                            : "rgba(244, 67, 54, 0.15)",
                      },
                    }}
                  >
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      {dayjs(row.transaction_date).format("DD MMM YYYY")}
                    </TableCell>
                    <TableCell>{row.remarks}</TableCell>
                    <TableCell>{row.reference_no}</TableCell>
                    <TableCell>{row.expense_category_name}</TableCell>
                    <TableCell>
                      {row.transaction_type === "IN" ? "Credit" : "Debit"}
                    </TableCell>
                    <TableCell align="right">
                      ₹ {parseFloat(row.amount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              {transactions?.length > 0 && (
                <TableRow
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.05)",
                    fontWeight: "bold",
                  }}
                >
                  <TableCell colSpan={3}></TableCell>
                  <TableCell
                    colSpan={2}
                    align="center"
                    sx={{ fontWeight: "bold", color: "green" }}
                  >
                    Total Credit: ₹{" "}
                    {transactions
                      .filter((tx) => tx.transaction_type === "IN")
                      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    align="center"
                    sx={{ fontWeight: "bold", color: "red" }}
                  >
                    Total Debit: ₹{" "}
                    {transactions
                      .filter((tx) => tx.transaction_type === "OUT")
                      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
                      .toLocaleString()}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Dialog */}
        {openFormDialog && (
          <Dialog
            open={openFormDialog}
            onClose={handleDialogClose}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
              <IconButton
                onClick={handleDialogClose}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <BankTransactionForm
                expenseCategoryList={expenseCategoryList || []}
                allBanks={allBanks || []}
                transaction={editingTransaction}
                onClose={handleDialogClose}
                onSaved={() => {
                  fetchTransactions();
                  fetchBankswithBalance();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </Box>
    </PageWrapper>
  );
};

export default BankbookManagement;

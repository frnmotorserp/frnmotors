import React, { useEffect, useState } from 'react';
import {
  Box, Grid, TextField, Button, Typography, Alert, Dialog,
  DialogTitle, DialogContent, IconButton, Table, TableHead,
  TableRow, TableCell, TableBody, Paper, TableContainer, MenuItem
} from '@mui/material';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { getAcceessMatrix } from '../utils/loginUtil';
import PageWrapper from '../layouts/PageWrapper';
import { useUI } from '../context/UIContext';
import { addCashEntryService, updateCashEntryService, getCashEntriesService, deleteCashEntryService, getCashBalanceService } from '../services/invoicePaymentsService';
import * as XLSX from "xlsx";
import { listAllExpenseCategories } from '../services/invoicePaymentsService';

// Inside CashbookManagement component, just above the return statement
const CashEntryForm = ({ entry, onClose, onSaved, expenseCategoryList = [] }) => {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [form, setForm] = useState({
    entry_date: entry?.entry_date || dayjs().format("YYYY-MM-DD"),
    description: entry?.description || "",
    amount: entry?.amount || "",
    entry_type: entry?.entry_type || "IN",
    expense_category: entry?.expense_category_id || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.amount || isNaN(form.amount)) {
      showSnackbar("Amount must be a valid number", "error");
      return;
    }
    if (!form.description.trim()) {
      showSnackbar("Description is required", "error");
      return;
    }
    if (!form.expense_category) {
      showSnackbar("Payment Category is required", "error");
      return;
    }

    showLoader();
    try {
      if (entry) {
        // Edit existing entry
        await updateCashEntryService({ ...form, id: entry.id });
        showSnackbar("Cash entry updated", "success");
      } else {
        // Add new entry
        await addCashEntryService(form);
        showSnackbar("Cash entry added", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to save cash entry", "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={2} mt={1}>
      <TextField
        label="Date"
        type="date"
        name="entry_date"
        size="small"
        value={form.entry_date}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <TextField
        label="Description"
        name="description"
        size="small"
        multiline
        minRows={3}
        value={form.description}
        onChange={handleChange}
        fullWidth
      />
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
        label="Type"
        name="entry_type"
        size="small"
        select
        value={form.entry_type}
        onChange={handleChange}
        fullWidth
      >
        <MenuItem value="IN">
          <Typography color="success.main" fontWeight={600}>
            Cash In
          </Typography>
        </MenuItem>
        <MenuItem value="OUT">
          <Typography color="error.main" fontWeight={600}>
            Cash Out
          </Typography>
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

      <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
        <Button onClick={onClose} variant="outlined" color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {entry ? "Update" : "Add"}
        </Button>
      </Box>
    </Box>
  );
};



const CashbookManagement = () => {
  const { showSnackbar, showLoader, hideLoader } = useUI();

  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [expenseCategoryList, setExpenseCategoryList] = useState([]);
  const [filters, setFilters] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
    expenseCategoryId: 0,
    expenseCategoryName: 'All'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
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

  useEffect(() => {
    fetchEntries();
    fetchBalance();
    getExpenseCategoryListAPICall(true)
    const access = getAcceessMatrix('Inventory Management', 'Cashbook Management');
    setAccessMatrix(access);
  }, []);


  const handleExcelDownload = () => {
  if (!entries.length) return;

  //  Compute opening and closing balances
  const totalIn = entries
    .filter(e => e.entry_type === "IN")
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalOut = entries
    .filter(e => e.entry_type === "OUT")
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);



  // Prepare data for Excel
  const excelData = [
    ["Cashbook Report"],
    [`From: ${filters.startDate} To: ${filters.endDate}`],
    [`Payment Category: ${filters.expenseCategoryName}`],
    [""],
    ["Total In", totalIn],
    ["Total Out", totalOut],
    [""],
    ["#", "Date", "Description", "Type", "Amount (₹)"],
    ...entries.map((e, i) => [
      i + 1,
      dayjs(e.entry_date).format("DD MMM YYYY"),
      e.description,
      e.entry_type === "IN" ? "Cash In" : "Cash Out",
      e.amount
    ]),
    [""],
    ["Total Cash In", totalIn],
    ["Total Cash Out", totalOut],
  ];

  // Create worksheet & workbook
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cashbook");

  // Download file
  XLSX.writeFile(wb, `Cashbook_${filters.startDate}_to_${filters.endDate}.xlsx`);
};

  const fetchEntries = () => {
    if (!filters.startDate || !filters.endDate) {
      setError('Date range is required');
      return;
    }
    if (dayjs(filters.endDate).isBefore(filters.startDate)) {
      setError('End date cannot be before start date');
      return;
    }

    setError('');
    showLoader();
    getCashEntriesService(filters.startDate, filters.endDate, filters.expenseCategoryId)
      .then(res => setEntries(res || []))
      .catch(() => {
        setEntries([])
        showSnackbar('Failed to fetch entries', 'error')
      })
      .finally(() => hideLoader());
  };

  const fetchBalance = () => {
    getCashBalanceService()
      .then(res => setBalance(res))
      .catch(() => showSnackbar('Failed to fetch balance', 'error'));
  };

  const handleDialogOpen = (entry = null) => {
    setEditingEntry(entry);
    setOpenFormDialog(true);
  };

  const handleDialogClose = () => {
    setEditingEntry(null);
    setOpenFormDialog(false);
  };

  const handleDelete = (entry) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    showLoader();
    deleteCashEntryService(entry.id)
      .then(() => {
        showSnackbar('Entry deleted', 'success');
        fetchEntries();
        fetchBalance();
      })
      .catch(() => showSnackbar('Failed to delete entry', 'error'))
      .finally(() => hideLoader());
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: 'Add Entry',
      buttonCallback: () => handleDialogOpen(),
      buttonIcon: <AddIcon fontSize='small' />,
      access: accessMatrix?.create ?? false,
    }
  ];



  return (
    <PageWrapper title="Cashbook Management" actionButtons={ActionButtonsArr}>
      <Box m={2} >
        <Box display="flex" justifyContent={"space-between"} alignItems="center">
            {/* Filters */}
        <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
          <Grid container spacing={2} alignItems="center" justifyContent="center">
            <Grid item>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item>
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
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
              <Button variant="contained" onClick={fetchEntries}>
                Get Entries
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Box mt={2} width="100%" maxWidth="600px">
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
        </Box>

        {/* Balance + Search */}
        <Box display="flex" flexDirection="column" gap={2} justifyContent="end" alignItems="end" mt={3} mb={2}>
          {/* <Typography variant="h6">Current Balance: ₹ {balance.toLocaleString()}</Typography> */}
          

          <Box
            sx={{
              p: 2,
              background: parseFloat(balance || 0) > 0 ?  "linear-gradient(135deg, #4CAF50, #81C784)" :  "linear-gradient(135deg, #f86d6dff, #e61c1cff)" ,
              borderRadius: 3,
              textAlign: "center",
              boxShadow: "0px 4px 15px rgba(0,0,0,0.2)"
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "white",
                textShadow: "1px 1px 3px rgba(0,0,0,0.3)"
              }}
            >
              Current Balance
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "900",
                color: "white",
                mt: 1,
                letterSpacing: 1
              }}
            >
              ₹ {balance.toLocaleString()}
            </Typography>
          </Box>

          
        </Box>

        </Box>
      
        <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 2}}>
         {entries.length > 0 &&
            <TextField
              size="small"
              placeholder="Search Description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ minWidth: 200 }}
            />}

             {entries && entries?.length > 0 &&  <Button
            variant="outlined"
            color="success"
            onClick={handleExcelDownload}
            disabled={!entries.length}
            sx={{ mb: 2 }}
            startIcon={<FileDownloadIcon />}
          >
            Download Excel
          </Button>}

        </Box>

        {/* Table View */}
        <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>#</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                 <TableCell align="right">Category</TableCell>
                <TableCell align="right">Type</TableCell>
               
                <TableCell align="right">Amount (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries
                ?.filter(ent =>
                  ent.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                ?.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      backgroundColor:
                        row.entry_type === "IN" ? "rgba(76, 175, 80, 0.08)" : "rgba(244, 67, 54, 0.08)",
                      "&:hover": {
                        backgroundColor:
                          row.entry_type === "IN" ? "rgba(76, 175, 80, 0.15)" : "rgba(244, 67, 54, 0.15)",
                      },
                    }}
                  >
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{dayjs(row.entry_date).format("DD MMM YYYY")}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.expense_category_name}</TableCell>
                    <TableCell align="right">
                      <Typography
                        fontWeight={600}
                        color={row.entry_type === "IN" ? "success.main" : "error.main"}
                      >
                        {row.entry_type === "IN" ? "Cash In" : "Cash Out"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        fontWeight={700}
                        color={row.entry_type === "IN" ? "success.main" : "error.main"}
                      >
                        ₹ {row.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              {/* Totals row */}
              <TableRow >
                <TableCell colSpan={4} />

                <TableCell
                  align="right"
                  sx={{
                    backgroundColor: "#e8f5e9", // light green
                    color: "#2e7d32", // dark green
                    fontWeight: "bold",
                    fontSize: "1rem",
                    border: '2px solid #2e7d32'
                  }}
                >
                  Total Cash In: ₹{" "}
                  {entries
                    .filter(e => e.entry_type === "IN")
                    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                    .toLocaleString()}
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    backgroundColor: "#ffebee", // light red
                    color: "#c62828", // dark red
                    fontWeight: "bold",
                    fontSize: "1rem",
                    border: '2px solid #c62828'
                  }}
                >
                  Total Cash Out: ₹{" "}
                  {entries
                    .filter(e => e.entry_type === "OUT")
                    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                    .toLocaleString()}
                </TableCell>
              </TableRow>

            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Form Dialog */}
        {openFormDialog && (
          <Dialog open={openFormDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingEntry ? 'Edit Cash Entry' : 'Add Cash Entry'}
              <IconButton onClick={handleDialogClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <CashEntryForm
                expenseCategoryList={expenseCategoryList || []}
                entry={editingEntry}
                onClose={handleDialogClose}
                onSaved={() => {
                  fetchEntries();
                  fetchBalance();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </Box>
    </PageWrapper>
  );
};

export default CashbookManagement;

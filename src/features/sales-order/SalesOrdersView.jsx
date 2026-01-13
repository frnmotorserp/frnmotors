import React, { useState } from "react";
import {
  Box,
  Grid,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SalesOrderCard from "./SalesOrderCard"; // Your existing card component
import * as XLSX from "xlsx";

export default function SalesOrdersView({
  salesList,
  fetchSalesOrderItems,
  getStatusColor,
  userIDUserNameMap,
  dealerIDNameMap,
  customerIDNameMap,
  handlePaymentDialogOpen,
  handleViewDialogOpen,
  handleCancelOrderDialogOpen,
  handleDownloadEInvoice,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("ALL");
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // card | table

  const filteredOrders = salesList
    ?.filter((o) => selectedTab === "ALL" || o.status === selectedTab)
    ?.filter((o) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();

      const codeMatch = o.sales_order_code?.toLowerCase().includes(query);
      const amountMatch = o.grand_total_rounded?.toString().includes(query);

      const dealerMatch =
        o.dealer_name?.toLowerCase().includes(query) ||
        o.customer_name?.toLowerCase().includes(query);

      return codeMatch || amountMatch || dealerMatch;
    })
    ?.filter(
      (o) =>
        !selectedDealer ||
        !selectedDealer?.dealerId ||
        o.dealer_id === selectedDealer?.dealerId
    );

  // Table Columns
  const columns = [
    { field: "sales_order_code", headerName: "Order Code", flex: 1 },
    {
      field: "grand_total_rounded",
      headerName: "Amount",
      flex: 1,
      valueFormatter: (params) => `₹ ${params.value ?? "-"}`,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <span style={{ color: getStatusColor(params.value) }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "order_date",
      headerName: "Order Date",
      flex: 1,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "-",
    },
    {
      field: "customer_name",
      headerName: "Customer",
      flex: 1,
      valueGetter: (params) =>
        params.row.order_type === "DEALER"
          ? dealerIDNameMap?.[params.row.dealer_id] || "-"
          : customerIDNameMap?.[params.row.customer_id] || "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.5,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handlePaymentDialogOpen(params.row)}
          >
            Payments
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              fetchSalesOrderItems(params.row.sales_order_id);
              handleViewDialogOpen(params.row);
            }}
          >
            Invoice
          </Button>
        </Box>
      ),
    },
  ];

  const exportToExcel = () => {
    const wsData = filteredOrders.map((o) => ({
      "Order Code": o.sales_order_code,
      Amount: o.grand_total_rounded,
      Status: o.status,
      "Order Date": new Date(o.order_date).toLocaleDateString(),
      Customer:
        o.order_type === "DEALER"
          ? dealerIDNameMap?.[o.dealer_id] || "-"
          : customerIDNameMap?.[o.customer_id] || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Orders");
    XLSX.writeFile(wb, "SalesOrders.xlsx");
  };

  return (
    <Box m={2}>
      {/* View Mode Toggle + Export */}
      <Box
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, value) => value && setViewMode(value)}
        >
          <ToggleButton value="card">Card View</ToggleButton>
          <ToggleButton value="table">Table View</ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={exportToExcel}
        >
          Export Excel
        </Button>
      </Box>

      {/* Search Input */}
      <Box mb={2}>
        <input
          type="text"
          placeholder="Search by Order Code, Amount, Customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
      </Box>

      {viewMode === "card" ? (
        <Grid container spacing={3}>
          {filteredOrders.map((o, index) => (
            <SalesOrderCard
              key={index}
              o={o}
              index={index}
              fetchSalesOrderItems={fetchSalesOrderItems}
              getStatusColor={getStatusColor}
              userIDUserNameMap={userIDUserNameMap}
              dealerIDNameMap={dealerIDNameMap}
              customerIDNameMap={customerIDNameMap}
              handlePaymentDialogOpen={handlePaymentDialogOpen}
              handleViewDialogOpen={handleViewDialogOpen}
              handleCancelOrderDialogOpen={handleCancelOrderDialogOpen}
              handleDownloadEInvoice={handleDownloadEInvoice}
            />
          ))}
        </Grid>
      ) : (
        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={filteredOrders}
            columns={columns}
            getRowId={(row) => row.sales_order_id}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
          />
        </Box>
      )}
    </Box>
  );
}

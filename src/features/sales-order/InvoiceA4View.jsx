import React, { forwardRef, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import bmlogo from "../../assets/bmlogo.jpeg";

// --- Style Definitions ---

const itemsTableHeadCellStyle = {
  border: "1px solid #e3e6f2",
  padding: "8px",
  fontSize: "13px",
  fontWeight: "600",
  backgroundImage: "linear-gradient(90deg, #f6faff 70%, #f0f6ff 100%)",
  color: "#3978b6",
  letterSpacing: "0.5px",
};

const itemsTableBodyCellStyle = {
  border: "1px solid #e3e6f2",
  padding: "8px",
  fontSize: "12px",
  verticalAlign: "top",
};

const totalsTableCellStyle = {
  border: "1px solid #e3e6f2",
  padding: "8px",
  fontSize: "12px",
};

const totalsLabelCellStyle = {
  ...totalsTableCellStyle,
  fontWeight: "600",
  backgroundImage: "linear-gradient(90deg, #c6e6fa 60%, #e4f3fe 100%)",
  color: "#317292",
};

const totalsValueCellStyle = {
  ...totalsTableCellStyle,
  textAlign: "right",
  backgroundColor: "#f7fbfc",
};

const boldTotalsValueCellStyle = {
  ...totalsValueCellStyle,
  fontWeight: "700",
  fontSize: "14px",
  color: "#2c6c4a",
  backgroundColor: "#e8fff2",
};

// A style for sticky header/table section
const printStickyHeaderStyle = {
  position: "sticky",
  top: 0,
  background: "linear-gradient(90deg, #d1e9ff 60%, #e4f3fe 100%)",
  zIndex: 10,
  borderTop: "2px solid #3c80b2",
};

// --- Component ---

const InvoiceA4View = forwardRef(
  (
    { salesOrder = {}, items = [], companyList, dealerList, customerList },
    ref
  ) => {
    const [companyDetails, setCompanyDetails] = useState({});
    const [buyerDetails, setBuyerDetails] = useState({});

    useEffect(() => {
      if (salesOrder && salesOrder?.company_id) {
        let details = companyList?.find(
          (x) => x.companyId === salesOrder?.company_id
        );
        setCompanyDetails(details || {});
      }
      if (salesOrder && salesOrder?.order_type === "DEALER") {
        let details = dealerList?.find(
          (x) => x.dealerId === salesOrder?.dealer_id
        );
        if (details) {
          setBuyerDetails({
            buyerName: details.dealerName,
            phone: details.phone,
            gstin: details.gstin,
            pan: details.pan,
            email: details.email,
          });
        }
      }
      if (salesOrder && salesOrder?.order_type === "CUSTOMER") {
        let details = customerList?.find(
          (x) => x.customerId === salesOrder?.customer_id
        );
        if (details) {
          setBuyerDetails({
            buyerName: details.customerName,
            phone: details.phone,
            gstin: details.gstin,
            pan: details.pan,
            aadhar: details.aadhar,
            email: details.email,
          });
        }
      }
    }, [salesOrder, companyList, dealerList, customerList]);

    // Header (logo + details) repeated for print page-break
    const InvoiceHeader = (
      <Grid container spacing={2} sx={{ mb: 2, alignItems: "center" }}>
        {/* Logo */}
        <Grid item xs={4}>
          <Box
            className="invoice-header"
            sx={{
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              pl: 2,
              borderRadius: "6px",
              background: "linear-gradient(90deg, #e1eaff 60%, #f6faff 100%)",
              boxShadow: "0 2px 8px rgba(62,152,229,0.04)",
            }}
          >
            <img
              src={bmlogo}
              alt="Company Logo"
              style={{
                height: "64px",
                objectFit: "contain",
                borderRadius: "7px",
                border: "1px solid #e9eefc",
                background: "#fff",
                boxShadow: "0 1px 6px rgba(30,60,100,0.06)",
              }}
            />
          </Box>
        </Grid>
        {/* Company Details */}
        <Grid item xs={8} sx={{ textAlign: "right" }}>
          <Typography variant="h5" sx={{
            fontWeight: "700",
            color: "#2787d5",
            fontFamily: '"Montserrat", Helvetica, Arial, sans-serif',
          }}>
            {companyDetails?.businessName || "Company Name"}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "13px", color: "#245b7a" }}>
            {companyDetails?.address || "123 Main Street, City, State"},{" "}
            {companyDetails?.pincode || "12345"}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "13px", mt: 0.5 }}>
            <strong>GSTIN:</strong> {companyDetails?.gstin || "N/A"}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "13px" }}>
            <strong>Contact:</strong> 8653200285, 9883349500
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "13px" }}>
            <strong>E-Mail:</strong> frnmotorsnadia@gmail.com
          </Typography>
        </Grid>
      </Grid>
    );

    // Table head with sticky for print/page-break
    const TableHeader = (
      <TableHead>
        <TableRow style={printStickyHeaderStyle}>
          <TableCell sx={itemsTableHeadCellStyle}>#</TableCell>
          <TableCell sx={itemsTableHeadCellStyle}>Product Details</TableCell>
          {/* <TableCell sx={itemsTableHeadCellStyle}>HSN</TableCell> */}
          <TableCell sx={itemsTableHeadCellStyle}>Qty</TableCell>
          <TableCell sx={itemsTableHeadCellStyle}>Unit Price</TableCell>
          <TableCell sx={itemsTableHeadCellStyle}>Discount</TableCell>
          <TableCell sx={itemsTableHeadCellStyle}>Taxable Value</TableCell>
          <TableCell sx={itemsTableHeadCellStyle}>CGST</TableCell>
          <TableCell sx={itemsTableHeadCellStyle}>SGST</TableCell>
          <TableCell sx={itemsTableHeadCellStyle}>IGST</TableCell>
          <TableCell
            sx={itemsTableHeadCellStyle}
            style={{ minWidth: "90px" }}
          >
            Line Total
          </TableCell>
        </TableRow>
      </TableHead>
    );

    return (
      <Box
        className="invoice-page"
        ref={ref}
        sx={{
          width: "210mm",
          minHeight: "297mm",
          padding: "12mm",
          boxSizing: "border-box",
          fontFamily: '"Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif',
          color: "#244962",
          background: "linear-gradient(153deg, #fdfcff 95%, #f2f9ff 100%)",
          // Add a subtle shadow for screen view, removed for printing
          "@media screen": {
            boxShadow: "0 0 16px rgba(80,160,255,0.13)",
            margin: "20px auto",
          },
          "@media print": {
            boxShadow: "none",
            margin: 0,
          },
          borderRadius: { xs: "10px", print: "0px" }
        }}
      >
        {/* Sticky Header for Table/page-break print */}
        <div className="print-header" style={{
          position: "relative",
          zIndex: 11,
          "@media print": {
            position: "fixed",
            top: 0, left: 0, right: 0,
            boxShadow: "none",
            margin: 0,
            background: "#fff",
          }
        }}>
          {InvoiceHeader}
          <Divider sx={{ my: 2, borderColor: "#2787d5" }} />
        </div>
        {/* Title */}
        <Typography
          variant="h5"
          align="center"
          sx={{
            fontWeight: "bold",
            my: 3,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "#2387d6",
            background:
              "linear-gradient(90deg, #e4f3fe 80%, #c6e6fa 100%)",
            py: 1,
            borderRadius: "5px",
            boxShadow: "0 2px 12px rgba(62,152,229,0.04)",
            fontFamily: '"Montserrat", Helvetica, Arial, sans-serif',
          }}
        >
          Tax Invoice
        </Typography>
        {/* Buyer & Invoice Info */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Buyer Details Box */}
          <Grid item xs={7}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                height: "100%",
                minHeight: "130px", // ensure same height
                borderRadius: 2,
                border: "1px solid #d1e9ff",
                background: "linear-gradient(90deg, #f6faff 70%, #e1f6ff 100%)",
                boxShadow: "0 2px 6px rgba(62,152,229,0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="subtitle2" sx={{
                fontWeight: 600, mb: 0.5, color: "#2093c9"
              }}>
                Bill To:
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {buyerDetails?.buyerName || "N/A"}
                </Typography>
                {buyerDetails?.aadhar && (
                  <Typography variant="body2" color="text.secondary" fontSize={13}>
                    Aadhar: {buyerDetails.aadhar}
                  </Typography>
                )}
                {buyerDetails?.gstin ? (
                  <Typography variant="body2" color="text.secondary" fontSize={13}>
                    GST: {buyerDetails.gstin}
                  </Typography>
                ) : (
                  buyerDetails?.pan && (
                    <Typography variant="body2" color="text.secondary" fontSize={13}>
                      PAN: {buyerDetails.pan}
                    </Typography>
                  )
                )}
                <Typography variant="body2" color="text.secondary" fontSize={13}>
                  Phone: {buyerDetails?.phone || "N/A"}
                </Typography>
                {buyerDetails?.email && (
                  <Typography variant="body2" color="text.secondary" fontSize={13}>
                    Email: {buyerDetails.email}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" fontSize={13}>
                Billing Address: {salesOrder?.billing_address}, PIN: {salesOrder?.billing_pincode}
              </Typography>
            </Paper>
          </Grid>
          {/* Invoice Details Box */}
          <Grid item xs={5}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                height: "100%",
                minHeight: "130px",
                borderRadius: 2,
                border: "1px solid #d1e9ff",
                background: "linear-gradient(90deg, #f6faff 50%, #cbe5fa 100%)",
                boxShadow: "0 2px 6px rgba(62,152,229,0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {[
                { label: "Invoice No:", value: salesOrder?.sales_order_code },
                {
                  label: "Invoice Date:",
                  value: salesOrder?.order_date
                    ? new Date(salesOrder.order_date).toLocaleDateString()
                    : "N/A",
                },
                { label: "Payment Terms:", value: salesOrder?.payment_terms },
              ].map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: idx < 2 ? 1 : 0,
                    fontSize: 14,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: "#4285a0" }}>{item.label}</Typography>
                  <Typography color="text.secondary">{item.value || "N/A"}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
        {/* Items Table */}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: "6px",
            boxShadow: "0 6px 18px rgba(30,120,230,0.05)",
            background: "linear-gradient(90deg, #f5fcff 70%, #d1e9ff 100%)"
          }}
        >
          <Table size="small" stickyHeader>
            {TableHeader}
            <TableBody>
              {Array.isArray(items) &&
                items?.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={itemsTableBodyCellStyle}>
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={itemsTableBodyCellStyle}>
                      <Typography sx={{ fontWeight: "600", fontSize: "12px" }}>
                        {item?.productName ||
                          item?.product_name ||
                          item?.productId}
                      </Typography>
                      <Typography sx={{ fontWeight: "400", fontSize: "12px" }}>
                        HSN: {item?.hsn_code}
                      </Typography>
                      {(item.isFinalVeichle || item.is_final_veichle) && (
                        <Box
                          display="flex"
                          flexDirection="column"
                          sx={{ mt: 0.5 }}
                        >
                          {(item.chasisNo || item.chasis_no) && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Chassis No: {item.chasisNo || item.chasis_no}
                            </Typography>
                          )}
                          {(item.motorNo || item.motor_no) && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Motor No: {item.motorNo || item.motor_no}
                            </Typography>
                          )}
                          {(item.controllerNo || item.controller_no) && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Controller No:{" "}
                              {item.controllerNo || item.controller_no}
                            </Typography>
                          )}
                          {(item.charger || item.charger_sl_no) && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Charger: {item.charger}
                              {item.charger && item.charger_sl_no ? " - " : ""}
                              {item.charger_sl_no}
                            </Typography>
                          )}
                          {(item.productColor || item.product_color) && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Color: {item.productColor || item.product_color}
                            </Typography>
                          )}
                          {(item.battery || item.battery_sl_no) && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Battery: {item.battery}
                              {item.battery && item.battery_sl_no ? " - " : ""}
                              {item.battery_sl_no}
                            </Typography>
                          )}
                        </Box>
                      )}
                      {item.serial_no_applicable && (
                        <Typography
                          variant="caption"
                          fontWeight={500}
                          color="text.secondary"
                          sx={{ mt: 0.5, display: "block" }}
                        >
                          Serials: {item.serial_no}
                        </Typography>
                      )}
                    </TableCell>
                    {/* <TableCell sx={itemsTableBodyCellStyle}>
                    <Typography variant="caption">{item.hsn_code}</Typography>
                  </TableCell> */}
                    <TableCell sx={itemsTableBodyCellStyle} align="right">
                      <Typography sx={{ fontSize: "12px" }}>
                        {Number(item.quantity || 0).toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", textTransform: "uppercase" }}
                      >
                        {item.uom}
                      </Typography>
                    </TableCell>
                    <TableCell sx={itemsTableBodyCellStyle} align="right">
                      {Number(item.unit_price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={itemsTableBodyCellStyle} align="right">
                      <Typography sx={{ fontSize: "12px" }}>
                        {Number(item.discount || 0).toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        ({Number(item.discount_percentage || 0).toFixed(2)}%)
                      </Typography>
                    </TableCell>
                    <TableCell sx={itemsTableBodyCellStyle} align="right">
                      {Number(item.taxable_value || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={itemsTableBodyCellStyle} align="right">
                      <Typography sx={{ fontSize: "12px" }}>
                        {Number(item.cgst_amount || 0).toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        ({Number(item.cgst_percentage || 0).toFixed(2)}%)
                      </Typography>
                    </TableCell>
                    <TableCell sx={itemsTableBodyCellStyle} align="right">
                      <Typography sx={{ fontSize: "12px" }}>
                        {Number(item.sgst_amount || 0).toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        ({Number(item.sgst_percentage || 0).toFixed(2)}%)
                      </Typography>
                    </TableCell>
                    <TableCell sx={itemsTableBodyCellStyle} align="right">
                      <Typography sx={{ fontSize: "12px" }}>
                        {Number(item.igst_amount || 0).toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        ({Number(item.igst_percentage || 0).toFixed(2)}%)
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={itemsTableBodyCellStyle}
                      align="right"
                      style={{ fontWeight: 600 }}
                    >
                      {Number(item.line_total || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Summary & Remarks */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Left Column: Remarks, Transport */}
          <Grid item xs={7}>
            <Typography variant="body2" sx={{
              fontSize: "13px", mt: 1, color: "#267f6c"
            }}>
              <strong>Remarks:</strong> {salesOrder?.remarks || "N/A"}
            </Typography>
            {/* Transport Details */}
            {(salesOrder?.shipping_address ||
              salesOrder?.vehicle_no ||
              salesOrder?.transport_mode ||
              salesOrder?.transporter_name) && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  border: "1px solid #e3e6f2",
                  borderRadius: "6px",
                  background: "linear-gradient(90deg, #f6faff 60%, #e1f6ff 100%)",
                  boxShadow: "0 1px 6px rgba(85,227,216,0.05)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, fontSize: "14px", mb: 1, color: "#1757a0" }}
                >
                  Transport Details:
                </Typography>
                {salesOrder?.shipping_address && (
                  <Typography variant="body2" sx={{ fontSize: "13px" }}>
                    <strong>Shipping Address:</strong>{" "}
                    {salesOrder.shipping_address}
                  </Typography>
                )}
                {salesOrder?.distance_km &&
                  parseInt(salesOrder?.distance_km, 10) !== 0 && (
                    <Typography variant="body2" sx={{ fontSize: "13px" }}>
                      <strong>Distance (km):</strong> {salesOrder.distance_km}
                    </Typography>
                  )}
                {salesOrder?.vehicle_no && (
                  <Typography variant="body2" sx={{ fontSize: "13px" }}>
                    <strong>Vehicle No:</strong> {salesOrder.vehicle_no}
                  </Typography>
                )}
                {salesOrder?.transport_mode && (
                  <Typography variant="body2" sx={{ fontSize: "13px" }}>
                    <strong>Transport Mode:</strong> {salesOrder.transport_mode}
                  </Typography>
                )}
                {salesOrder?.transporter_name && (
                  <Typography variant="body2" sx={{ fontSize: "13px" }}>
                    <strong>Transporter Name:</strong>{" "}
                    {salesOrder.transporter_name}
                  </Typography>
                )}
              </Box>
            )}

            <Box
              sx={{
                border: "1px solid #72d2f5",
                p: 1,
                mt: 3,
                borderRadius: "6px",
                background: "linear-gradient(90deg, #f2fcfc 90%, #eafefa 100%)",
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontStyle: "italic", fontSize: "11px", color: "#3288bf" }}
              >
                This is an electronically generated invoice — no signature required.
              </Typography>
            </Box>
          </Grid>
          {/* Right Column: Totals */}
          <Grid item xs={5}>
            <TableContainer
              className="print-section"
              component={Paper}
              variant="outlined"
              sx={{
                borderRadius: "6px",
                background: "linear-gradient(90deg, #e9faff 75%, #d5f6ff 100%)",
                boxShadow: "0 1px 10px rgba(62,152,229,0.04)"
              }}
            >
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={totalsLabelCellStyle}>Subtotal</TableCell>
                    <TableCell sx={totalsValueCellStyle}>
                      {Number(salesOrder?.subtotal || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={totalsLabelCellStyle}>Discount</TableCell>
                    <TableCell sx={totalsValueCellStyle}>
                      {Number(salesOrder?.discount_amount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={totalsLabelCellStyle}>
                      Taxable Amount
                    </TableCell>
                    <TableCell sx={totalsValueCellStyle}>
                      {Number(salesOrder?.taxable_amount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={totalsLabelCellStyle}>CGST</TableCell>
                    <TableCell sx={totalsValueCellStyle}>
                      {Number(salesOrder?.cgst_amount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={totalsLabelCellStyle}>SGST</TableCell>
                    <TableCell sx={totalsValueCellStyle}>
                      {Number(salesOrder?.sgst_amount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={totalsLabelCellStyle}>IGST</TableCell>
                    <TableCell sx={totalsValueCellStyle}>
                      {Number(salesOrder?.igst_amount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={totalsLabelCellStyle}
                      style={{ borderBottom: 0 }}
                    >
                      Total (Before Rounding)
                    </TableCell>
                    <TableCell
                      sx={totalsValueCellStyle}
                      style={{ borderBottom: 0 }}
                    >
                      {Number(salesOrder?.grand_total || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={totalsLabelCellStyle}
                      style={{ borderBottom: 0 }}
                    >
                      Rounding
                    </TableCell>
                    <TableCell
                      sx={totalsValueCellStyle}
                      style={{ borderBottom: 0 }}
                    >
                      {Number(salesOrder?.rounding_difference || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={totalsLabelCellStyle}
                      style={{ borderBottom: 0 }}
                    >
                      Grand Total (Rs.)
                    </TableCell>
                    <TableCell
                      sx={boldTotalsValueCellStyle}
                      style={{ borderBottom: 0 }}
                    >
                      {Number(salesOrder?.grand_total_rounded || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Box>
    );
  }
);

export default InvoiceA4View;

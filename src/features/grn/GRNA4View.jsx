import React, { forwardRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
const tableCellStyle = {
  border: "1px solid #ccc",
  padding: "6px",
  fontSize: "12px",
};

const GRNA4View = forwardRef(({ grnData, companyDetails = null }, ref) => {
  const {
    vendorDetails,
    locationDetails,
    grnDetails,
    items = [],
    cgstAmount = 0,
    sgstAmount = 0,
    igstAmount = 0,
    totalAmount = 0,
  } = grnData || {};

  return (
    <Box
      ref={ref}
      sx={{
        p: 3,
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        fontSize: "12px",
      }}
    >
      <Box sx={{ mb: 2, borderBottom: "1px solid #000", pb: 1 }}>
        <Typography variant="h6" align="center" gutterBottom>
          <strong>{companyDetails.businessName}</strong>
        </Typography>

        <Typography variant="body2" align="center">
          {companyDetails.address}
          {companyDetails.pincode ? ` - ${companyDetails.pincode}` : ""}
        </Typography>

        <Typography variant="body2" align="center">
          GSTIN: {companyDetails.gstin}
        </Typography>

        {/*companyDetails.departmentCodeType &&
          companyDetails.natureOfBusiness && (
            <Typography variant="body2" align="center">
              Department: {companyDetails.departmentCodeType} | Nature of
              Business: {companyDetails.natureOfBusiness}
            </Typography>
          )*/}

        {companyDetails.contact && (
          <Typography variant="body2" align="center">
            Contact: {companyDetails.contact}
          </Typography>
        )}
      </Box>

      <Typography variant="h6" align="center" gutterBottom>
        Goods Receipt Note (GRN)
      </Typography>

      {/* Vendor & GRN Info */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 2, mt: 2 }}
      >
        <Box width="45%">
          <Typography variant="subtitle2">
            <strong>Vendor:</strong> {vendorDetails?.name}
          </Typography>
          <Typography variant="body2">
            <strong>GST:</strong> {vendorDetails?.gst}
          </Typography>
          <Typography variant="body2">
            <strong>Mobile:</strong> {vendorDetails?.mobile}
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {vendorDetails?.email}
          </Typography>
          <Typography variant="body2">
            <strong>Address:</strong> {vendorDetails?.billingAddress}
          </Typography>
        </Box>
        <Box width="45%">
          <Typography variant="body2">
            <strong>GRN Number:</strong> {grnDetails?.grnNumber}
          </Typography>
          <Typography variant="body2">
            <strong>GRN Date:</strong> {grnDetails?.grnDate}
          </Typography>
          <Typography variant="body2">
            <strong>Received At:</strong>{" "}
            {`${locationDetails?.locationName}, ${locationDetails?.locationAddress}`}
          </Typography>
          <Typography variant="body2">
            <strong>Remarks:</strong> {grnDetails?.remarks || "-"}
          </Typography>
          <Typography variant="body2">
            <strong>Linked PO Number:</strong> {grnDetails?.poNumber}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Items Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={tableCellStyle}>#</TableCell>
              <TableCell sx={tableCellStyle}>Product</TableCell>
              <TableCell sx={tableCellStyle}>Qty Received</TableCell>
              <TableCell sx={tableCellStyle}>Unit Price</TableCell>
              <TableCell sx={tableCellStyle}>CGST</TableCell>
              <TableCell sx={tableCellStyle}>SGST</TableCell>
              <TableCell sx={tableCellStyle}>IGST</TableCell>
              <TableCell sx={tableCellStyle}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell sx={tableCellStyle}>{idx + 1}</TableCell>
                <TableCell sx={tableCellStyle}>{item.pName}</TableCell>
                <TableCell sx={tableCellStyle}>
                  <Box display="flex" flexDirection="column">
                    <Typography>
                      {(item.receivedQuantity || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.uom}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(item.unitPrice || 0).toFixed(2)}
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <Box display="flex" flexDirection="column">
                    <Typography>{(item.cgstAmount || 0).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(item.cgstPercent || 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <Box display="flex" flexDirection="column">
                    <Typography>{(item.sgstAmount || 0).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(item.sgstPercent || 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <Box display="flex" flexDirection="column">
                    <Typography>{(item.igstAmount || 0).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(item.igstPercent || 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(item.totalAmount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      {/* Summary */}
      <Box display="flex" justifyContent="flex-end">
        <Box width="50%">
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={tableCellStyle}>
                  <strong>Total Before Tax</strong>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(totalAmount - cgstAmount - sgstAmount - igstAmount).toFixed(
                    2
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}>
                  <strong>CGST</strong>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(cgstAmount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}>
                  <strong>SGST</strong>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(sgstAmount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}>
                  <strong>IGST</strong>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {(igstAmount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}>
                  <strong>Total Amount (Rs.)</strong>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <strong>{(totalAmount || 0).toFixed(2)}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
});

export default GRNA4View;

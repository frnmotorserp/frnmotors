import React, { forwardRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Divider from '@mui/material/Divider';

const tableCellStyle = {
  border: '1px solid #ccc',
  padding: '6px',
  fontSize: '12px'
};
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

const POA4View = forwardRef(({ poData }, ref) => {
  console.log("poData:::::",poData)
  const {
    vendorDetails,
    deliveryAddress,
    poDetails,
    deliveryTerm,
    paymentTerm,
    items,
    totalAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
  } = poData || {};





  return (
    <Box ref={ref} sx={{ p: 3, width: '210mm', minHeight: '297mm', boxSizing: 'border-box', fontSize: '12px' }}>
      <Box sx={{ mb: 2, borderBottom: '1px solid #000', pb: 1 }}>
        <Typography variant="h6" align="center" gutterBottom>
          <strong>FRN MOTORS PRIVATE LIMITED</strong>
        </Typography>
        <Typography variant="body2" align="center">
          SHYAMNAGAR PARA SENPUR, West Bengal - 741102
        </Typography>
        <Typography variant="body2" align="center">
          GSTIN: 19AAECF8786F1Z3
        </Typography>
        {/* <Typography variant="body2" align="center">
    Department: KRISHNANAGAR, WB063, WA1105, RANGE-V | Nature of Business: Factory / Manufacturing
  </Typography> */}
        <Typography variant="body2" align="center">
          Contact: 8653200285
        </Typography>
      </Box>
      <Typography variant="h6" align="center" gutterBottom>Purchase Order</Typography>

      {/* PO and Vendor Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt:2 }}>
        <Box width={'40%'}>
          <Typography variant="subtitle2"><strong>Vendor Name:</strong> {vendorDetails?.name}</Typography>
          <Typography variant="body2"><strong>GST:</strong> {vendorDetails?.gst}</Typography>
          <Typography variant="body2"><strong>Mobile:</strong> {vendorDetails?.mobile}</Typography>
          <Typography variant="body2"><strong>Email:</strong> {vendorDetails?.email}</Typography>
          <Typography variant="body2"><strong>Address:</strong> {vendorDetails?.billingAddress}</Typography>
        </Box>
        <Box  width={'40%'}>
          <Typography variant="body2"><strong>PO Number:</strong> {poDetails?.poNumber}</Typography>
          <Typography variant="body2"><strong>PO Date:</strong> {poDetails?.poDate}</Typography>
          <Typography variant="body2"><strong>Delivery Address:</strong> {deliveryAddress}</Typography>
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
              {/* <TableCell sx={tableCellStyle}>HSN</TableCell> */}
              <TableCell sx={tableCellStyle}>Qty</TableCell>
              <TableCell sx={tableCellStyle}>Unit Rate</TableCell>
              <TableCell sx={tableCellStyle}>Before Tax</TableCell>

              <TableCell sx={tableCellStyle}>CGST</TableCell>
              <TableCell sx={tableCellStyle}>SGST</TableCell>
              <TableCell sx={tableCellStyle}>IGST</TableCell>
              <TableCell sx={tableCellStyle}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items?.map((item, idx) => (
              <TableRow key={idx} >
                <TableCell sx={tableCellStyle}>{idx + 1}</TableCell>
                <TableCell sx={tableCellStyle}>{item.productName}</TableCell>
                {/* <TableCell sx={tableCellStyle}>{item.hsn}</TableCell> */}
                <TableCell sx={tableCellStyle}> 
                  <Box display="flex" flexDirection="column">
                    <Typography>{Number(item.qty || 0).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.uom}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>{Number(item.rate || 0).toFixed(2)}</TableCell>
                <TableCell sx={tableCellStyle}>{Number(parseFloat(item.rate || 0) * parseFloat(item.qty ||0)).toFixed(2)}</TableCell>

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
                <TableCell sx={tableCellStyle}>{(item.totalAmount || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />
      <Box display={'flex'}  justifyContent={'space-between'}>
        <Box sx={{ my: 2 }}>


          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Delivery Term:</strong> {deliveryTerm || "N/A"}
          </Typography>

          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>Payment Term:</strong> {paymentTerm || "N/A"}
          </Typography>
          <Box sx={{border: '1px solid black', p:1, mt:1, mr: 1}}>
              <Typography variant="caption" sx={{ mt: 0.5 }}>
           **Electronically generated Purchase Order — no signature required.
          </Typography>
          </Box>
        </Box>
        {/* Summary */}
        <Box sx={{ ml: 'auto', width: '50%' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>Total Before Tax</strong></TableCell>
                <TableCell sx={tableCellStyle}>{((totalAmount - cgstAmount - sgstAmount - igstAmount) || 0).toFixed(2)}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell sx={tableCellStyle}><strong>CGST</strong></TableCell>
                <TableCell sx={tableCellStyle}>{(cgstAmount || 0).toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>SGST</strong></TableCell>
                <TableCell sx={tableCellStyle}>{(sgstAmount || 0).toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>IGST</strong></TableCell>
                <TableCell sx={tableCellStyle}>{(igstAmount || 0).toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>Total Amount (Rs.) </strong></TableCell>
                <TableCell sx={tableCellStyle} ><b>{(totalAmount || 0).toFixed(2)}</b></TableCell>
              </TableRow>
              {/* <TableRow>
              <TableCell sx={tableCellStyle}><strong>Grand Total</strong></TableCell>
              <TableCell sx={tableCellStyle}><strong>{grandTotal}</strong></TableCell>
            </TableRow> */}
            </TableBody>
          </Table>
        </Box>

      </Box>


    </Box>
  );
});

export default POA4View;

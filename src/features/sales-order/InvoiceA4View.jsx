import React, { forwardRef, useEffect, useState } from 'react';
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

const InvoiceA4View = forwardRef(({ salesOrder = {}, items = [], companyList, dealerList, customerList }, ref) => {


  const [companyDetails, setCompanyDetails] = useState({})
  const [buyerDetails, setBuyerDetails] = useState({})

  useEffect(() => {
    if (salesOrder && salesOrder?.company_id) {
      let details = companyList?.find(x => x.companyId == salesOrder?.company_id);
      setCompanyDetails(details || {})
    }
    if (salesOrder && salesOrder?.order_type === "DEALER") {
      let details = dealerList?.find(x => x.dealerId == salesOrder?.dealer_id);

      details && setBuyerDetails({
        buyerName: details.dealerName,
        phone: details.phone,
        gstin: details.gstin,
        pan: details.pan,
        email: details.email

      })
    }
    if (salesOrder && salesOrder?.order_type === "CUSTOMER") {
      let details = customerList?.find(x => x.customerId == salesOrder?.customer_id);
      details && setBuyerDetails({
        buyerName: details.customerName,
        phone: details.phone,
        gstin: details.gstin,
        pan: details.pan,
        aadhar: details.aadhar,
        email: details.email

      })
      console.log("DETAILS", details)
    }

  }, [salesOrder])

  return (
    <Box
      ref={ref}
      sx={{
        p: 3,
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        fontSize: '12px'
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2, borderBottom: '1px solid #000', pb: 1 }}>
        <Typography variant="h6" align="center" gutterBottom>
          <strong>{companyDetails?.businessName || "No Company Found"}</strong>
        </Typography>
        <Typography variant="body2" align="center">
          {companyDetails?.address || "No Address Found"},  {companyDetails?.pincode || "No Pincode Found"}
        </Typography>
        <Typography variant="body2" align="center">
          GSTIN: {companyDetails?.gstin || "No GST Found"}
        </Typography>
        <Typography variant="body2" align="center">
          Contact: 8653200285
        </Typography>
      </Box>

      <Typography variant="h6" align="center" gutterBottom>
        Tax Invoice
      </Typography>

      {/* Buyer & Invoice Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 2 }}>
        <Box width={'45%'}>
          <Typography variant="subtitle2">
            <strong>Buyer Name:</strong> {buyerDetails?.buyerName || 'N/A'}
          </Typography>
          {buyerDetails?.aadhar && <Typography variant="body2">
            <strong>Aadhar No.:</strong> {buyerDetails?.aadhar || 'N/A'}
          </Typography>}

          {buyerDetails?.gstin && <Typography variant="body2">
            <strong>GST:</strong> {buyerDetails?.gstin || 'N/A'}
          </Typography>}
          {!buyerDetails?.gstin && buyerDetails?.pan && <Typography variant="body2">
            <strong>PAN:</strong> {buyerDetails?.pan || 'N/A'}
          </Typography>}
          <Typography variant="body2">
            <strong>Phone:</strong> {buyerDetails?.phone || 'N/A'}
          </Typography>
          {buyerDetails?.email && <Typography variant="body2">
            <strong>Email:</strong> {buyerDetails?.email || 'N/A'}
          </Typography>}
          <Typography variant="body2">
            <strong>Billing Address:</strong> {salesOrder?.billing_address}, PIN: {
              salesOrder.billing_pincode
            }
          </Typography>

        </Box>
        <Box width={'45%'}>
          <Typography variant="body2">
            <strong>Invoice No:</strong> {salesOrder?.sales_order_code}
          </Typography>
          <Typography variant="body2">
            <strong>Invoice Date:</strong> {new Date(salesOrder?.order_date).toLocaleDateString()}
          </Typography>
          <Typography variant="body2">
            <strong>Payment Terms:</strong> {salesOrder?.payment_terms}
          </Typography>
          {/* <Typography variant="body2">
            <strong>State Code:</strong> {salesOrder?.billing_state_code}
          </Typography> */}
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
              <TableCell sx={tableCellStyle}>HSN</TableCell>
              <TableCell sx={tableCellStyle}>Qty</TableCell>
              <TableCell sx={tableCellStyle}>Unit Price</TableCell>
              <TableCell sx={tableCellStyle}>Total Discount</TableCell>
              <TableCell sx={tableCellStyle}>Taxable Value</TableCell>
              <TableCell sx={tableCellStyle}>CGST</TableCell>
              <TableCell sx={tableCellStyle}>SGST</TableCell>
              <TableCell sx={tableCellStyle}>IGST</TableCell>
              <TableCell sx={tableCellStyle}>Line Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(items) && items?.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell sx={tableCellStyle}>{idx + 1}</TableCell>
                <TableCell sx={tableCellStyle}>
                  <Typography>{item?.productName || item?.product_name || item?.productId}</Typography>

                  {(item.isFinalVeichle || item.is_final_veichle) && (
                    <Box display="flex" flexDirection="column">
                      {(item.chasisNo || item.chasis_no) && (
                        <Typography variant="caption" color="text.secondary">
                          Chassis No: {item.chasisNo || item.chasis_no}
                        </Typography>
                      )}
                      {(item.motorNo || item.motor_no) && (
                        <Typography variant="caption" color="text.secondary">
                          Motor No: {item.motorNo || item.motor_no}
                        </Typography>
                      )}
                      {(item.controllerNo || item.controller_no) && (
                        <Typography variant="caption" color="text.secondary">
                          Controller No: {item.controllerNo || item.controller_no}
                        </Typography>
                      )}
                      {(item.charger || item.charger_sl_no) && (
                        <Typography variant="caption" color="text.secondary">
                          Charger: {item.charger}
                          {item.charger && item.charger_sl_no ? " - " : ""}
                          {item.charger_sl_no}
                        </Typography>
                      )}
                      {(item.productColor || item.product_color) && (
                        <Typography variant="caption" color="text.secondary">
                          Color: {item.productColor || item.product_color}
                        </Typography>
                      )}
                      {(item.battery || item.battery_sl_no) && (
                        <Typography variant="caption" color="text.secondary">
                          Battery: {item.battery}
                          {item.battery && item.battery_sl_no ? " - " : ""}
                          {item.battery_sl_no}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box>
                    {( item.serial_no_applicable) &&
                        <Typography variant="caption" fontWeight={500} color="text.secondary">
                          Serials: {item.serial_no}
                        </Typography>
                      }
                  </Box>
                </TableCell>

                <TableCell sx={tableCellStyle}>
                  <Typography  variant="caption"> {item.hsn_code}</Typography>
                 </TableCell>
                <TableCell sx={tableCellStyle}>
                  <Box display="flex" flexDirection="column">
                    <Typography>{Number(item.quantity || 0).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.uom}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(item.unit_price || 0).toFixed(2)}
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <Box display="flex" flexDirection="column">
                    <Typography>{Number(item.discount || 0).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Number(item.discount_percentage || 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(item.taxable_value || 0).toFixed(2)}
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <Box display="flex" flexDirection="column">
                    <Typography>{Number(item.cgst_amount || 0).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Number(item.cgst_percentage || 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <Box display="flex" flexDirection="column">
                    <Typography>{Number(item.sgst_amount || 0).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Number(item.sgst_percentage || 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  <Box display="flex" flexDirection="column">
                    <Typography>{Number(item.igst_amount || 0).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Number(item.igst_percentage || 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(item.line_total || 0).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      {/* Summary */}
      <Box display={'flex'} justifyContent={'space-between'}>

        <Box sx={{ my: 2 }}>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Remarks:</strong> {salesOrder?.remarks || "N/A"}
          </Typography>

          {/* Transport Details */}
          {(salesOrder?.distance_km || salesOrder?.vehicle_no || salesOrder?.transport_mode || salesOrder?.transporter_name) && (
            <Box sx={{ mt: 1 }}>
              {salesOrder?.shipping_address && <Typography variant="body2">
                <strong>Shipping Address:</strong> {salesOrder?.shipping_address}
              </Typography>}
              {salesOrder?.distance_km && parseInt(salesOrder?.distance_km) != 0 && (
                <Typography variant="body2">
                  <strong>Distance (km):</strong> {salesOrder.distance_km}
                </Typography>
              )}
              {salesOrder?.vehicle_no && (
                <Typography variant="body2">
                  <strong>Vehicle No:</strong> {salesOrder.vehicle_no}
                </Typography>
              )}
              {salesOrder?.transport_mode && (
                <Typography variant="body2">
                  <strong>Transport Mode:</strong> {salesOrder.transport_mode}
                </Typography>
              )}
              {salesOrder?.transporter_name && (
                <Typography variant="body2">
                  <strong>Transporter Name:</strong> {salesOrder.transporter_name}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ border: '1px solid black', p: 1, mt: 1, mr: 2 }}>
            <Typography variant="caption">
              **This is an electronically generated invoice — no signature required.
            </Typography>
          </Box>
        </Box>


        <Box sx={{ ml: 'auto', width: '50%' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>Subtotal</strong></TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(salesOrder?.subtotal || 0).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>Discount</strong></TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(salesOrder?.discount_amount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>Taxable Amount</strong></TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(salesOrder?.taxable_amount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>CGST</strong></TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(salesOrder?.cgst_amount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>SGST</strong></TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(salesOrder?.sgst_amount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>IGST</strong></TableCell>
                <TableCell sx={tableCellStyle}>
                  {Number(salesOrder?.igst_amount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={tableCellStyle}><strong>Grand Total (Rs.)</strong></TableCell>
                <TableCell sx={tableCellStyle}>
                  <b>{Number(salesOrder?.grand_total || 0).toFixed(2)}</b>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
});

export default InvoiceA4View;

import React, { useState } from "react";
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
import dayjs from "dayjs";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PaymentsIcon from "@mui/icons-material/Payments";
import ErrorIcon from "@mui/icons-material/Error";


// Helper to get chip style by status
const getPaymentStatusChip = (status) => {
  switch (status) {
    case "FULL PAID":
      return (
        <Chip
          label="Full Paid"
          color="success"
          icon={<CheckCircleIcon />}
          variant="filled"
          sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
        />
      );
    case "PAID PARTIALLY":
      return (
        <Chip
          label="Partially Paid"
          color="warning"
          icon={<PaymentsIcon />}
          variant="filled"
          sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
        />
      );
    case "OVERPAID":
      return (
        <Chip
          label="Overpaid"
          color="info"
          icon={<PaymentsIcon />}
          variant="filled"
          sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
        />
      );
    default: // UNPAID
      return (
        <Chip
          label="Unpaid"
          color="error"
          icon={<HourglassEmptyIcon />}
          variant="filled"
          sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
        />
      );
  }
};

const SalesOrderCard = ({ o, index, getStatusColor,handlePaymentDialogOpen, userIDUserNameMap, customerIDNameMap, dealerIDNameMap, fetchSalesOrderItems, handleViewDialogOpen, handleCancelOrderDialogOpen  }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Grid item xs={12} sm={6} md={4} key={o.sales_order_id}>
      <Card
        sx={{
          background: "linear-gradient(135deg, #e3f2fd, #fce4ec)",
          border: "1px solid #bbdefb",
          borderRadius: 3,
          boxShadow: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          "&:hover": { boxShadow: 6, transform: "translateY(-3px)" },
          transition: "0.3s"
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Top Row */}
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="overline">#{index + 1}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {o.sales_order_code}
            </Typography>
          </Box>

          {/* Amount + Status */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="h6"
              sx={{ color: "#1565c0", fontWeight: 600 }}
            >
              ₹ {o.grand_total ?? "—"}
            </Typography>
            <Chip
              size="small"
              color={getStatusColor(o.status)}
              label={o.status}
            />
          </Box>

         

          {/* Collapsible Details */}
          <Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>Order Date:</strong>{" "}
              {new Date(o.order_date).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {o.order_type == "DEALER" ? <><strong>Dealer Name:</strong> {dealerIDNameMap?.[o.dealer_id] || "-"}</> : <><strong>Customer Name:</strong> {customerIDNameMap?.[o.customer_id] || "-"} </> }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Billing Address:</strong> {o.billing_address}
            </Typography>
            {/* {o.shipping_address && (
              <Typography variant="body2" color="text.secondary">
                <strong>Shipping Address:</strong> {o.shipping_address}
              </Typography>
            )} */}
            <Typography variant="body2" color="text.secondary">
              <strong>Payment Terms:</strong> {o.payment_terms}
            </Typography>
           
            <Typography variant="body2" color="text.secondary">
              <strong>Salesman Name:</strong> { (userIDUserNameMap &&  userIDUserNameMap[o?.booked_by_user_id]) || "-"}
            </Typography>
             <Box display="flex" alignItems="center" gap={1} mt={1}>
              <strong>Payment Status:</strong> {getPaymentStatusChip(o.payment_status)}
            </Box>
          </Box>
        </CardContent>
        <CardActions sx={{display: 'flex', justifyContent: 'flex-end'}}>
             {o.status !== "CANCELLED" && 
                dayjs().isBefore(dayjs(o.created_at).add(3, "day"))  && <Button variant="outlined" color="error" startIcon={<DisabledByDefaultIcon size= 'small' />} onClick={()=> { handleCancelOrderDialogOpen(o)}}>
                Cancel
            </Button>}
             <Button variant="outlined" startIcon={<AccountBalanceIcon size= 'small' />} onClick={()=> { handlePaymentDialogOpen(o)}}>
                Payments
            </Button>
            <Button variant="outlined" startIcon={<ReceiptIcon size= 'small' />} onClick={()=> {fetchSalesOrderItems(o.sales_order_id), handleViewDialogOpen(o)}}>
                Invoice
            </Button>
         


        </CardActions>
      </Card>
    </Grid>
  );
};

export default SalesOrderCard;

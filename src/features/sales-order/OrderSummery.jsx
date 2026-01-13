import { Card, CardContent, Grid, Typography, Divider, Box } from "@mui/material";

const OrderSummary = ({ orderData }) => {
  const summaryItems = [
    { label: "Subtotal", value: orderData.subtotal },
    { label: "Discount", value: orderData.discountAmount },
    { label: "Taxable Amount", value: orderData.taxableAmount },
    { label: "CGST", value: orderData.cgstAmount },
    { label: "SGST", value: orderData.sgstAmount },
    { label: "IGST", value: orderData.igstAmount },
    { label: "Total Tax", value: orderData.totalTax },
    { label: "Total Before Round", value: orderData.grandTotal },
    { label: "Round Difference", value: Math.round(Number(orderData.grandTotal || 0)) - Number(orderData.grandTotal || 0) },
    { label: "Grand Total", value: Math.round(Number(orderData.grandTotal || 0)), highlight: true },
  ];

  return (
    <Card sx={{ mt: 3, boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Invoice Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {summaryItems.map((item, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: item.highlight ? "primary.main" : "grey.50",
                  color: item.highlight ? "#fff" : "text.primary",
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {item.label}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: item.highlight ? 700 : 500 }}
                >
                  ₹ {Number(item.value || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;

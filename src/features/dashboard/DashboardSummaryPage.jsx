import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Tooltip,
  Skeleton,
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import PinDropIcon from "@mui/icons-material/PinDrop";
import { getDashboardSummaryService } from "../../services/dashboardService";

// Format numbers with commas
const formatNumber = (num) => num?.toLocaleString("en-IN") ?? 0;

// Get percentage change with safe handling
const getChange = (current, previous) => {
  if (!previous || previous === 0) {
    return { diff: current > 0 ? 100 : 0, isUp: current > 0 };
  }
  const diff = (((current - previous) / previous) * 100).toFixed(1);
  return { diff, isUp: current >= previous };
};

// Animated Card Style
const animatedCardStyle = {
  height: 200,
  borderRadius: "18px",
  overflow: 'auto',
  transition: "transform 0.3s, box-shadow 0.3s",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-10px) scale(1.02)",
    boxShadow: 8,
  },
};

export default function DashboardSummaryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getDashboardSummaryService();
        setSummaryData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard summary:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  const todayChange =
    summaryData &&
    getChange(summaryData.today.totalOrderValue, summaryData.yesterday.totalOrderValue);
  const monthChange =
    summaryData &&
    getChange(
      summaryData.thisMonth.totalOrderValue,
      summaryData.prevMonth.totalOrderValue
    );

  // Skeleton Loader (grid with placeholder cards)
  if (loading) {
    return (
      <Box sx={{ p: 4, background: "#f9fafc", minHeight: "90vh"  }} >
        <Typography variant="h4" gutterBottom>
          Dashboard Summary
        </Typography>
        <Grid container spacing={4}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{  ...animatedCardStyle, p:4 }}>
                <Skeleton variant="text" width="60%" height={30} />
                <Skeleton variant="rectangular" width="80%" height={60} />
                <Skeleton variant="text" width="40%" height={30} />
                <Skeleton variant="text" width="70%" height={20} />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, background: "#f9fafc", minHeight: "90vh" }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Dashboard Summary
      </Typography>

      {summaryData && (
        <Grid container spacing={4}>
          {/* Today's Orders */}
          <Grid item xs={12} sm={6} md={4}>
            <Tooltip title="Click for detailed view" arrow>
              <Card
                onClick={() => navigate("/sales/orders")}
                sx={{ ...animatedCardStyle, background: "linear-gradient(135deg,#42a5f5,#1e88e5)", color: "#fff" }}
              >
                <CardContent>
                  <Typography variant="h6">Today's Orders</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {summaryData.today.totalOrders}
                  </Typography>
                  <Typography variant="subtitle1">
                    Value: ₹{formatNumber(summaryData.today.totalOrderValue)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: todayChange.isUp ? "#c8e6c9" : "#ffcdd2",
                      mt: 1,
                    }}
                  >
                    {todayChange.isUp ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                    {todayChange.diff}% vs Yesterday
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>

          {/* This Month's Orders */}
          <Grid item xs={12} sm={6} md={4}>
            <Tooltip title="Click for detailed view" arrow>
              <Card
                onClick={() => navigate("/report/monthly-sales-report")}
                sx={{ ...animatedCardStyle, background: "linear-gradient(135deg,#66bb6a,#388e3c)", color: "#fff" }}
              >
                <CardContent>
                  <Typography variant="h6">This Month's Orders</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {summaryData.thisMonth.totalOrders}
                  </Typography>
                  <Typography variant="subtitle1">
                    Value: ₹{formatNumber(summaryData.thisMonth.totalOrderValue)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: monthChange.isUp ? "#c8e6c9" : "#ffcdd2",
                      mt: 1,
                    }}
                  >
                    {monthChange.isUp ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                    {monthChange.diff}% vs Last Month
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>

          {/* Low Stock */}
          <Grid item xs={12} sm={6} md={4}>
            <Tooltip title="Click for detailed view" arrow>
              <Card
                onClick={() => navigate("/inventoryManagemnt/inventory")}
                sx={{ ...animatedCardStyle, background: "linear-gradient(135deg,#ff9800,#f57c00)", color: "#fff" }}
              >
                <CardContent>
                  <Typography variant="h6">Low Stock Products</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {summaryData.inventory.lowStockProducts}
                  </Typography>
                  <Typography variant="subtitle1">
                    Products below threshold
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>

          {/* Dealers */}
          <Grid item xs={12} sm={6} md={4}>
            <Tooltip title="Click for detailed view" arrow>
              <Card
                onClick={() => navigate("/dealer-customer/dealerManagement")}
                sx={{ ...animatedCardStyle, background: "linear-gradient(135deg,#26c6da,#00838f)", color: "#fff" }}
              >
                <CardContent>
                  <Typography variant="h6">Total Dealers</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {summaryData.dealerCount}
                  </Typography>
                  <Typography variant="subtitle1">Number of Dealers</Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>

          {/* Vendors */}
          <Grid item xs={12} sm={6} md={4}>
            <Tooltip title="Click for detailed view" arrow>
              <Card
                onClick={() => navigate("/inventoryManagemnt/vendor")}
                sx={{ ...animatedCardStyle, background: "linear-gradient(135deg,#ab47bc,#6a1b9a)", color: "#fff" }}
              >
                <CardContent>
                  <Typography variant="h6">Total Vendors</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {summaryData.vendorCount}
                  </Typography>
                  <Typography variant="subtitle1">Number of Vendors</Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>

          {/* Locations */}
          <Grid item xs={12} sm={6} md={4}>
            <Tooltip title="Click for detailed view" arrow>
              <Card
                onClick={() => navigate("/bs/location")}
                sx={{ ...animatedCardStyle, background: "linear-gradient(135deg,#ec407a,#c2185b)", color: "#fff" }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <PinDropIcon sx={{ mr: 1 }} /> Locations
                  </Typography>
                  {summaryData.locations.locationWiseCount.map((loc, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {loc.location_name}
                      </Typography>
                      {index <
                        summaryData.locations.locationWiseCount.length - 1 && (
                        <Divider sx={{ my: 1, backgroundColor: "rgba(255,255,255,0.3)" }} />
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

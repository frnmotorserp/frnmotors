import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Typography,
  Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutorenewIcon from '@mui/icons-material/Autorenew';
import dayjs from "dayjs";
import { getUserDailyTotalTimeService } from "../../services/dashboardService";
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';


const formatTime = (minutes) => {
  if (Number(minutes) >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins > 0 ? Math.round(mins) + " min" : ""}`;
  }
  return `${minutes} min`;
};

function UserTimeTable({ userTimeList, fetchUserTimeSpentData }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDailyData, setUserDailyData] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  const handleOpenDialog = async (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
    setDailyLoading(true);
    try {
      const res = await getUserDailyTotalTimeService(user.user_id);
      setUserDailyData(res || []);
    } catch (err) {
      console.error("Error fetching user daily time:", err);
      setUserDailyData([]);
    } finally {
      setDailyLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setUserDailyData([]);
  };

  return (
    <>
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "primary.main" }}>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Sl.</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>User Name</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Time Spent Today</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userTimeList.length > 0 ? (
              userTimeList.map((user, index) => (
                <TableRow
                  key={user.user_id}
                  sx={{
                    "&:nth-of-type(odd)": { backgroundColor: "grey.100" },
                    "&:hover": { backgroundColor: "primary.light", color: "white" },
                    transition: "0.3s"
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{user.full_name}</TableCell>
                  <TableCell sx={{color: Number(user.total_minutes_spent) < 120 ? 'red' :  'black'}}>{formatTime(user.total_minutes_spent)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(user)}
                      startIcon={<HistoryToggleOffIcon />}
                    >
                      View History
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <> 
               <TableRow>
                <TableCell colSpan={4} align="center">
                  No data available
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} align="center">
                   <Button startIcon={<AutorenewIcon />} onClick={fetchUserTimeSpentData}> Refresh </Button>
                </TableCell>
              </TableRow>
              </>
             
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            backgroundColor: "primary.main",
            color: "white",
            fontWeight: "bold"
          }}
        >
          {selectedUser?.full_name} - Date Wise Time Spent
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: "absolute", right: 8, top: 8, color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
    <DialogContent dividers>
  {dailyLoading ? (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
      <CircularProgress color="secondary" />
    </Box>
  ) : userDailyData.length > 0 ? (
    <>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: "secondary.light" }}>
            <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Total Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {userDailyData.map((row, i) => (
            <TableRow
              key={i}
              sx={{
                "&:nth-of-type(odd)": { backgroundColor: "grey.100" },
                "&:hover": { backgroundColor: "grey.200" }
              }}
            >
              <TableCell>{dayjs(row.activity_date).format("DD MMM YYYY")}</TableCell>
              <TableCell>{formatTime(row.total_minutes_spent || 0)}</TableCell>
            </TableRow>
          ))}

          {/* Summary rows */}
          <TableRow sx={{ backgroundColor: "lightgreen" }}>
            <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>
              {formatTime(userDailyData.reduce((sum, r) => Number(sum) + Number(r.total_minutes_spent), 0)?.toFixed(2) || 0)}
            </TableCell>
          </TableRow>
          <TableRow sx={{ backgroundColor: "lightyellow" }}>
            <TableCell sx={{ fontWeight: "bold" }}>Average</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>
              {formatTime((
                userDailyData.reduce((sum, r) => Number(sum) + Number(r.total_minutes_spent), 0) /
                userDailyData.length
              ).toFixed(2) || 0)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  ) : (
    <Typography align="center" sx={{ mt: 2 }}>
      No history available
    </Typography>
  )}
</DialogContent>

      </Dialog>
    </>
  );
}

export default UserTimeTable;

import React, { useState, useEffect } from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import CloseIcon from "@mui/icons-material/Close";
import { getProductSerialsService } from "../../services/inventoryServices";
import { useUI } from "../../context/UIContext";
import dayjs from "dayjs";

const TabPanel = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box pt={2}>{children}</Box>}
    </div>
  );
};

const SerialNumberDialog = ({ open, onClose, product }) => {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [tab, setTab] = useState(0);
  const [serials, setSerials] = useState([]);

  const tabToStatus = ['in_stock', 'out_of_stock'];

  const fetchSerials = async (status) => {
    if (!product?.product_id) return;

    showLoader();
    try {
      const result = await getProductSerialsService({
        productId: product.product_id,
        status: status,
      });

      if (!result?.length) {
        showSnackbar(`No ${status.replace('_', ' ')} serials found!`, "warning");
      }

      setSerials(result || []);
    } catch (err) {
      console.error("Failed to fetch serials:", err);
      showSnackbar("Failed to fetch serials", "error");
      setSerials([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    if (open && product?.product_id) {
      fetchSerials(tabToStatus[tab]);
    }
  }, [open, tab, product]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6">{product?.product_name}</Typography>
          <Typography variant="body2" color="text.secondary">
            View Serial numbers
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Tabs value={tab} onChange={(_, newTab) => setTab(newTab)} variant="fullWidth">
          <Tab label="In Stock" />
          <Tab label="Out of Stock" />
        </Tabs>
        <TabPanel value={tab} index={0}>
          {serials.length === 0 ? (
            <Typography color="text.secondary">
              No in-stock serials found.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {serials.map((serial, idx) => (
                <Paper
                  key={idx}
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#fdfdfd",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    borderLeft: "4px solid rgb(10, 138, 67)", // orange tone for "out_of_stock"
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>
                      Serial: {serial.serial_number}
                    </Typography>
                    <Chip
                      label={serial.status.replace(/_/g, " ").toUpperCase()}
                      size="small"
                      color="success"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Added: {dayjs(serial.added_date).add(5.5, "hour").format("DD MMM YYYY, hh:mm A")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {dayjs(serial.last_updated).add(5.5, "hour").format("DD MMM YYYY, hh:mm A")}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </TabPanel>


        <TabPanel value={tab} index={1}>
          {serials.length === 0 ? (
            <Typography color="text.secondary">
              No out-of-stock serials found.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {serials.map((serial, idx) => (
                <Paper
                  key={idx}
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#fdfdfd",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    borderLeft: "4px solid #ffa726", // orange tone for "out_of_stock"
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>
                      Serial: {serial.serial_number}
                    </Typography>
                    <Chip
                      label={serial.status.replace(/_/g, " ").toUpperCase()}
                      size="small"
                      color="warning"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Added: {dayjs(serial.added_date).add(5.5, "hour").format("DD MMM YYYY, hh:mm A")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {dayjs(serial.last_updated).add(5.5, "hour").format("DD MMM YYYY, hh:mm A")}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </TabPanel>


      </DialogContent>
    </Dialog>
  );
};

export default SerialNumberDialog;

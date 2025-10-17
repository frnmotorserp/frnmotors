import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Visibility from '@mui/icons-material/Visibility';
import Button from "@mui/material/Button";
import { getAllProductsService, saveOrUpdateProductService } from '../services/productService';
import SerialNumberDialog from "../features/inventory/SerialNumberDialog";
import { getProductCategoryListService } from "../services/productCategoryServices";
import CircularProgress from "@mui/material/CircularProgress";
import InventoryStockTable from "../features/inventory/InventoryStockTable";
import { getAllInventoryService } from "../services/inventoryServices";
import { useUI } from "../context/UIContext";
import { getAllLocationListService } from "../services/locationService";
import InventorySummary from "../features/inventory/InventorySummary";
import MissingProductsDialog from "../features/inventory/MissingProductsDialog";
import { getProductSerialsService } from "../services/inventoryServices";

const InventoryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationList, setLocationList] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [serialNumberOnly, setSerialNumberOnly] = useState(false);
  const [availableForSale, setAvailableForSale] = useState(false);
  const [productCategoryList, setProductCategoryList] = useState([]);
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [productList, setProductList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSerialNumberDialog, setOpenSerailNumberDialog] = useState(false);
  const [serialNumberProduct, setSerialNumberProduct] = useState({});

  const handleOpenMissingProductsDialog = () => {

    setOpenDialog(true);
  };


  const handleOpenSerialNumberDialog = (rowItem) => {
    setSerialNumberProduct(rowItem || {})
    setOpenSerailNumberDialog(true);
  };

  const getProductCategoryListAPICall = () => {
    showLoader();
    getProductCategoryListService()
      .then(res => {
        if (res && res.length > 0) {
          setProductCategoryList(res);
          //showSnackbar('Product Categories fetched successfully!', 'success');
        } else {
          setProductCategoryList([]);
          showSnackbar('No Product Categories found!', 'warning');
        }
        hideLoader();
      })
      .catch(err => {
        console.error('Error fetching Product Categories:', err);
        setProductCategoryList([]);
        hideLoader();
        showSnackbar('Failed to fetch Product Categories!', 'error');
      });
  };


  const getProductListAPICall = (hideSnackbar) => {
    showLoader();
    getAllProductsService()
      .then(res => {
        if (res && res.length > 0) {
          setProductList(res);
          !hideSnackbar && showSnackbar('Products fetched successfully!', 'success');
        } else {
          setProductList([]);
          !hideSnackbar && showSnackbar('No Products found!', 'warning');
        }
        hideLoader();
      })
      .catch(error => {
        console.error('Error fetching Products:', error);
        setProductList([]);
        hideLoader();
        !hideSnackbar && showSnackbar('Failed to fetch Products!', 'error');
      });
  };


  useEffect(() => {
    getLocationListAPICall(true);
    getProductCategoryListAPICall()
    fetchInventory();
  }, []);

  const getLocationListAPICall = (hideSnackbar) => {
    showLoader();
    getAllLocationListService()
      .then((res) => {
        if (res && res.length > 0) {
          setLocationList([
            {
              locationId: 0,
              locationName: "All Locations",
              address: "",
              stateName: "",
              districtName: "",
              pincode: "",
              locationTypeNames: [],
            },
            ...res,
          ]);
          !hideSnackbar &&
            showSnackbar("Locations fetched successfully!", "success");
        } else {
          setLocationList([]);
          !hideSnackbar && showSnackbar("No Locations found!", "warning");
        }
        hideLoader();
      })
      .catch((error) => {
        console.error("Error fetching Locations!", error);
        setLocationList([]);
        hideLoader();
        !hideSnackbar && showSnackbar("Failed to fetch Locations!", "error");
      });
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await getAllInventoryService(); // Fetch all inventory
      setInventory(response || []);
      setFiltered(response || []);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filteredData = inventory.filter(
      (item) =>
        item.product_name?.toLowerCase().includes(query) ||
        item.location_name?.toLowerCase().includes(query)
    );
    setFiltered(filteredData);
  };

  return (
    <Box m={3}>
      <Typography variant="h5" gutterBottom>
        Inventory Stock
      </Typography>

      {/* <TextField
        label="Search by Product or Location"
        value={searchQuery}
        onChange={handleSearch}
        fullWidth
        margin="normal"
      /> */}
      {/* Summary Section */}
      <InventorySummary filtered={filtered || []} />

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight="bold">
            Filter Inventory
          </Typography>

          <Autocomplete
            options={locationList}
            getOptionLabel={(option) => option.locationName}
            isOptionEqualToValue={(option, value) =>
              option.locationId === value.locationId
            }
            value={selectedLocation}
            onChange={(event, newValue) => setSelectedLocation(newValue)}
            renderOption={(props, option) => (
              <Box
                key={option.locationId}
                component="li"
                {...props}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {option.locationName}
                </Typography>
                {option.locationId !== 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {option.address}, {option.districtName}, {option.stateName} -{" "}
                      {option.pincode}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Type: {option.locationTypeNames?.join(", ")}
                    </Typography>
                  </>
                )}
              </Box>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Filter by Location" fullWidth />
            )}
          />
          <Autocomplete
  options={productCategoryList}
  getOptionLabel={(option) => option.productCategoryName || ""}
  isOptionEqualToValue={(option, value) => option.productCategoryId === value.productCategoryId}
  value={selectedCategory}
  onChange={(event, newValue) => setSelectedCategory(newValue)}
  renderInput={(params) => <TextField {...params} label="Filter by Category" fullWidth />}
/>


          <FormGroup row>

            <FormControlLabel
              control={
                <Checkbox
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                />
              }
              label="Low Stock Only"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={serialNumberOnly}
                  onChange={(e) => setSerialNumberOnly(e.target.checked)}
                />
              }
              label="Serial Number Applicable"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={availableForSale}
                  onChange={(e) => setAvailableForSale(e.target.checked)}
                />
              }
              label="Available for Sale"
            />
            <Button variant="outlined" size="small" onClick={handleOpenMissingProductsDialog} startIcon={<Visibility />}>View Products not stocked yet</Button>
          </FormGroup>

        </Stack>
      </Paper>


      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (

        <InventoryStockTable
          handleOpenSerialNumberDialog={handleOpenSerialNumberDialog}
          getInventoryStockListAPICall={fetchInventory}
          inventoryList={inventory?.filter((item) => {
            const locationMatch =
              !selectedLocation ||
              selectedLocation?.locationId === 0 ||
              item.location_id === selectedLocation?.locationId;

               const categoryMatch =
    !selectedCategory || item.product_category_id === selectedCategory.productCategoryId;

            const lowStockMatch =
              !lowStockOnly ||
              Number(item.quantity) <= Number(item.low_stock_threshold);

            const serialMatch =
              !serialNumberOnly || item.serial_no_applicable === true;

            const availableForSaleMatch =
              !availableForSale || item.is_available_for_sale === true;

            return (
              locationMatch &&
              lowStockMatch &&
              serialMatch &&
              availableForSaleMatch &&
              categoryMatch
            );
          })}
        />
      )}

      <MissingProductsDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        inventoryList={inventory}
        productList={productList}
        getProductListAPICall={getProductListAPICall}

      />
      <SerialNumberDialog
        open={openSerialNumberDialog}
        onClose={() => setOpenSerailNumberDialog(false)}
        product={serialNumberProduct}
        serials={[]}
      />

    </Box>
  );
};

export default InventoryPage;

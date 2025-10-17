import React, { useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import PageWrapper from '../layouts/PageWrapper';
import { useUI } from '../context/UIContext';
import { getProductCategoryListService } from '../services/productCategoryServices';

import { getAllProductsService } from '../services/productService';
import { getAllLocationListService } from '../services/locationService';
import { getAllInventoryIssuesService } from '../services/inventoryServices';
import { getAllInventoryService } from '../services/inventoryServices';
import AddIcon from '@mui/icons-material/Add';
import InventoryIssueTable from '../features/inventory/InventoryIssueTable';
import InventoryIssueDialog from '../features/inventory/InventoryIssueDialog';
import { getAcceessMatrix } from '../utils/loginUtil';

function InventoryIssuePage() {
  const { showLoader, hideLoader, showSnackbar } = useUI();
  const [productList, setProductList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [issues, setIssues] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productCategoryList, setProductCategoryList] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [accessMatrix, setAccessMatrix] = useState({});
  const [productIdUnitMap, setProductIdUnitMap] = useState({});

  useEffect(() => {
    fetchInitialData();
    const access = getAcceessMatrix('Inventory Management', 'Issue Inventory');
    setAccessMatrix(access);
  }, []);

  const uniqueProductOptions = useMemo(() => {
  const map = new Map();
  productList.forEach((product) => {
    if (product?.product_id && !map.has(product.product_id)) {
      map.set(product.product_id, product);
    }
  });
  return Array.from(map.values());
}, [productList]);

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

  const fetchInitialData = async () => {
    showLoader();
    try {
      const [products, locations] = await Promise.all([
       // getAllProductsService(),
       getAllInventoryService(),
        getAllLocationListService(),
      ]);
      setProductList(products || []);
      const productUnitMap = products?.reduce((map, product) => {
        map[product?.product_id] = product?.unit;
        return map;
      }, {});
      setProductIdUnitMap(productUnitMap || {})
      setLocationList(locations || []);
    } catch (error) {
      console.error(error);
      showSnackbar('Failed to load initial data', 'error');
    } finally {
      hideLoader();
      getProductCategoryListAPICall()
    }
  };

  const fetchIssues = async () => {
    if (!startDate || !endDate) {
      showSnackbar('Select valid date range', 'warning');
      return;
    }

    showLoader();
    try {
      const result = await getAllInventoryIssuesService(
        startDate,
        endDate,
      );
      //console.log(result, "vvv")
      setIssues(result || []);
    } catch (error) {
      console.error(error);
      showSnackbar('Failed to fetch issues', 'error');
    } finally {
      hideLoader();
    }
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: 'Issue Inventory',
      buttonCallback: () => setDialogOpen(true),
      buttonIcon: <AddIcon fontSize="small" />,
      access: accessMatrix?.create ?? false,
    },
  ];

  return (
    <PageWrapper title="Inventory Issues" actionButtons={ActionButtonsArr}>
      <Box sx={{ m: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* <Grid item xs={12} sm={4}>
            <Autocomplete
              options={uniqueProductOptions}
              getOptionLabel={(option) => option.product_name || ''}
              value={productList.find(p => p.product_id === selectedProductId) || null}
              onChange={(e, newVal) => setSelectedProductId(newVal?.product_id || '')}
              renderInput={(params) => <TextField {...params} label="Filter by Product" size="small" />}
            />
          </Grid> */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button variant="contained" onClick={fetchIssues} fullWidth>
              Filter
            </Button>
          </Grid>
        </Grid>
      </Box>

      <InventoryIssueTable issues={issues} productIdUnitMap={productIdUnitMap}/>

      <InventoryIssueDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        products={productList}
        productCategoryList={productCategoryList}
        locations={locationList}
        onSubmitSuccess={() => {
          fetchInitialData()
          fetchIssues()
        }}
      />
    </PageWrapper>
  );
}

export default InventoryIssuePage;

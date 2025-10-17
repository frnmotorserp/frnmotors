import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { getProductSerialsService } from "../../services/inventoryServices";


import { createInventoryIssueService } from '../../services/inventoryServices';
import { useUI } from '../../context/UIContext';


const generateIssueNumber = () => {
  const now = new Date();

  const pad = (n) => n.toString().padStart(2, '0');

  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase(); // 4-char alphanumeric

  return `ISS-${datePart}-${timePart}-${randomPart}`;
};

export default function InventoryIssueDialog({ open, onClose, products = [], locations, onSubmitSuccess, productCategoryList = [] }) {
  const { showLoader, hideLoader, showSnackbar } = useUI();
  const [issueDate, setIssueDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [location, setLocation] = useState(null);
  const [issuedTo, setIssuedTo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState([{ category: null, product: null,  quantity: '', serialNumbers: [], serialOptions: [] }]);

  const handleAddItem = () => {
    setItems([...items, { product: null, category: null, quantity: '' }]);
  };

  const handleRemoveItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleItemChange = async (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
     const current = updated[index];
     console.log("current", current, location)
        // Reset dependent fields
    if (field === 'category') {
      updated[index].product = null;
      updated[index].serialNumbers = [];
      updated[index].serialOptions = [];
      updated[index].quantity = '';
    }
    if(field === 'product' || field === 'quantity' ){
      console.log("current?.product?.serial_no_applicable", current,  current?.product?.serial_no_applicable)
      if(current?.product?.product_id && Number(current?.quantity || 0) > 0 && location && current?.product?.serial_no_applicable === true && !current?.serialOptions?.length){
         try {
            showLoader()
            const serials = await getProductSerialsService({
              productId: current?.product?.product_id,
              status: "in_stock",
            });
            hideLoader()
            serials?.filter(x => x.location_id === location.locationId)?.length === 0 && showSnackbar('No instock serial found!', 'error')
            updated[index].serialOptions = serials?.filter(x =>  x.location_id === location.locationId)?.map((s) => {
              return {
                "serial_number" :  s.serial_number,
                "id" : s.serial_id
              }
             
            });
          } catch (err) {
            console.error("Failed to fetch serials", err);
            updated[index].serialOptions = [];
             hideLoader()
          }

      }
     
    }
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (!location || !issueDate || items.length === 0 || !issuedTo || !remarks) {
      showSnackbar("Please fill required fields - Issue Date, Location, Issued To, Remarks!", "warning");
      return;
    }

    const validItems = items.filter(it => it.product && it.quantity > 0);
    if (validItems.length === 0) {
      showSnackbar("Add at least one valid item", "warning");
      return;
    }

      const invalidProduct = items.filter(it => !it.product);
     if(invalidProduct?.length > 0 ){
       showSnackbar("You should select product for all the items!", "warning");
      return;
    }  

    const invalidProductQantity = items.filter(it => Number(it.quantity || 0 ) <= 0);
     if(invalidProductQantity?.length > 0 ){
       showSnackbar("You should input positive quantity for all the items!", "warning");
      return;
    }  

    const itemHaveSerialNumbersMismatch = items.filter(it =>  it?.product?.serial_no_applicable && it?.serialNumbers?.length != Number(it?.quantity || 0 ))

    
    if(itemHaveSerialNumbersMismatch?.length > 0 ){
       showSnackbar("For Items has serial number the count of selected serial numbers should be exactly same as item quantity!", "warning");
      return;
    }
    

    const requestBody = {

      issueData : {
        issueNumber: generateIssueNumber(),
         issueDate,
        locationId: location?.locationId,
      issuedTo,
      remarks,

      },
     
      issueItems: validItems.map(it => ({
        productId: it?.product?.product_id,
        quantityIssued: Number(it?.quantity),
        locationId: location?.locationId,
        serialNumbersRemove: it.serialNumbers?.map(x => x.id) || []

      })),
    };

    console.log("requestBody::::", requestBody)
  

    showLoader();
    try {
      await createInventoryIssueService(requestBody);
      showSnackbar("Inventory Issued Successfully", "success");
      handleDialogClose();
      onSubmitSuccess();
    } catch (error) {
      console.error(error);
      showSnackbar("Failed to create issue", "error");
    } finally {
      hideLoader();
    }
  };

  const handleDialogClose = () => {
    setIssueDate(dayjs().format('YYYY-MM-DD'));
    setLocation(null);
    setIssuedTo('');
    setRemarks('');
    setItems([{ product: null, quantity: '', serialNumbers: [], serialOptions: [], category: null, }]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Issue Inventory
        <IconButton onClick={handleDialogClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={locations}
              getOptionLabel={(opt) => opt.locationName || ''}
              value={location}
              onChange={(e, val) => { 
                setLocation(val)
                setItems([{ product: null, quantity: '' }])
             }}
              renderInput={(params) => <TextField {...params} label="Select Location" />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Issued To"
              value={issuedTo}
              onChange={(e) => setIssuedTo(e.target.value)}
               
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Grid>
        </Grid>

        <Typography sx={{ mt: 2, mb: 1, fontWeight: 500 }}>Items</Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
  <strong>Note:</strong> Do not enter negative numbers. Issuing 1 unit means 1 unit will be deducted from stock. Negative values (e.g., -1) are invalid and not allowed.
</Alert>

        {!location ? <Typography variant='caption' color='error'>Please select a location first!</Typography> : 
        <Grid container spacing={2}>
          {items.map((item, idx) => (
            <Box sx={{p:2, pt:0, my:2, backgroundColor: 'rgba(245, 245, 245, 1)', width: '100%', borderRadius: 2, ml: 2 }}>
               <Typography variant='overline' fontWeight={'bold'}>Sl. {idx+1}</Typography>
               <Grid container spacing={2} >

              <Grid item xs={6}>
                <Autocomplete
                  size='small'
                  options={productCategoryList}
                  getOptionLabel={(opt) => opt.productCategoryName || ''}
                  value={item.category}
                  onChange={(e, val) => handleItemChange(idx, 'category', val)}
                  renderInput={(params) => <TextField {...params} label="Category" />}
                />
              </Grid>

              <Grid item xs={6}>
                <Autocomplete
                 size={'small'}
                 options={products.filter(p => p.location_id === location.locationId && (!item.category || p.product_category_id === item.category.productCategoryId))}
                  getOptionLabel={(opt) => opt.product_name || ''}
                  value={item.product}
                  onChange={(e, val) => handleItemChange(idx, 'product', val)}
                  renderInput={(params) => <TextField {...params} label="Product" />}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size={'small'}
                  type="number"
                  label="Quantity"
                  fullWidth
                  inputProps={{ min: 0 }}
                  value={item.quantity}
                  InputProps={{
                    endAdornment: item?.product?.unit ? (
                    <InputAdornment position="end">{item?.product?.unit}</InputAdornment>
                    ) : null
                }}
                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  helperText ={ item?.product ? `Available Stock : ${item?.product?.quantity || 0} ${item?.product?.unit}` : ''}
                />
              </Grid>
              
              {item?.product?.serial_no_applicable && <Grid item xs={10}>
                
                 <Autocomplete
                       multiple
                       size="small"
                       fullWidth
                       getOptionLabel={(o) => o.serial_number || []}
                       options={item.serialOptions || []}
                       value={item.serialNumbers || []}
                       onChange={(e, newValue) => handleItemChange(idx, "serialNumbers", newValue)}
                       renderInput={(params) => (
                         <TextField
                           {...params}
                           label="Select Serial Numbers"
                           error={
                             !!item.quantity &&
                             (item.serialNumbers?.length !== Math.abs(Number(item.quantity)))
                           }
                           helperText={
                             !!item.quantity &&
                             (item.serialNumbers?.length !== Math.abs(Number(item.quantity))
                               ? `You must select exactly ${Math.abs(Number(item.quantity))} serial number(s)`
                               : "")
                           }
                         />
                       )}
                     />
              </Grid>}
              <Grid item xs={2}>
                <Button
                  onClick={() => handleRemoveItem(idx)}
                  color="error"
                  variant="outlined"
                  fullWidth
                  disabled={items.length === 1}
                >
                  Remove
                </Button>
              </Grid>
              
            </Grid>

            </Box>
            
          ))}
        </Grid>}

          {location && <Button sx={{ mt: 2 }} variant="outlined" onClick={handleAddItem}>
          Add Another Item
        </Button>}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleSubmit} variant="contained">Submit</Button>
      </DialogActions>
    </Dialog>
  );
}

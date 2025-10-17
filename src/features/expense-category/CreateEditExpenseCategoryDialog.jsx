import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Slide,
  DialogContent,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { useUI } from '../../context/UIContext';

import { saveOrUpdateExpenseCategory } from '../../services/invoicePaymentsService';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function CreateEditExpenseCategoryDialog({
  open,
  handleClose,
  mode,
  getExpenseCategoryListAPICall,
  currentItemForEdit,
  expenseCategoryList
}) {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [expenseCategoryId, setExpenseCategoryId] = useState(0);
  const [expenseCategoryName, setExpenseCategoryName] = useState('');
  const [expenseCategoryType, setExpenseCategoryType] = useState();
  const [description, setDescription] = useState('');
  const [activeFlag, setActiveFlag] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && currentItemForEdit) {
      setExpenseCategoryId(currentItemForEdit.expenseCategoryId || 0);
      setExpenseCategoryName(currentItemForEdit.expenseCategoryName || '');
      setExpenseCategoryType(currentItemForEdit.expenseType || '');
      setDescription(currentItemForEdit.description || '');
      setActiveFlag(currentItemForEdit.activeFlag === 'Y');
    } else {
      setExpenseCategoryId(0);
      setExpenseCategoryName('');
      setExpenseCategoryType('')
      setDescription('');
      setActiveFlag(true);
    }
  }, [mode, currentItemForEdit, open]);

  const validateBeforeSave = () => {
    const newErrors = {};
    if (!expenseCategoryName.trim()) {
      newErrors.expenseCategoryName = 'Expense Category Name is required';
    } else if (
      mode === 'create' &&
      expenseCategoryList?.some(
        x => x.expenseCategoryName?.toLowerCase() === expenseCategoryName?.trim().toLowerCase()
      )
    ) {
      newErrors.expenseCategoryName = 'Expense Category Name already exists';
    }

    if (!description.trim()) {
      newErrors.description = 'Expense Category description is required';
    }
    if (!expenseCategoryType.trim()) {
      newErrors.expenseCategoryType = 'Expense Category Type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrUpdateExpenseCategoryAPI = () => {
    const expenseCategoryDTO = {
      expenseCategoryId: expenseCategoryId || 0,
      expenseCategoryName: expenseCategoryName.trim(),
      expenseType: expenseCategoryType || 'DIRECT',
      description: description.trim(),
      activeFlag: activeFlag ? 'Y' : 'N'
    };

    showLoader();
    saveOrUpdateExpenseCategory(expenseCategoryDTO)
      .then(res => {
        hideLoader();
        if (res.status) {
          showSnackbar(`Payment Category ${mode === 'edit' ? 'updated' : 'created'} successfully!`, 'success');
          getExpenseCategoryListAPICall(true);
          clearAndCloseDialog();
        } else {
          showSnackbar(res.message || 'Operation failed', 'error');
        }
      })
      .catch(() => {
        hideLoader();
        showSnackbar(`Payment Category ${mode === 'edit' ? 'updation' : 'creation'} failed!`, 'error');
        getExpenseCategoryListAPICall(true);
        clearAndCloseDialog();
      });
  };

  const saveButtonOnClick = () => {
    if (validateBeforeSave()) {
      createOrUpdateExpenseCategoryAPI();
    } else {
      showSnackbar('Please provide valid input!', 'error');
    }
  };

  const clearAndCloseDialog = () => {
    setExpenseCategoryType('')
    setExpenseCategoryName('');
    setDescription('');
    setActiveFlag(true);
    setErrors({});
    handleClose();
  };

  return (
    <Dialog open={open} onClose={clearAndCloseDialog} TransitionComponent={Transition}>
      <AppBar sx={{ position: 'relative', backgroundColor: 'primary.lighter' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={clearAndCloseDialog} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h5" component="div">
            {mode === 'edit' ? 'Edit Expense Category' : 'Create Expense Category'}
          </Typography>
          {mode !== 'view' && (
            <Button sx={{ ml: 4 }} autoFocus variant="contained" onClick={saveButtonOnClick}>
              <SaveAsIcon fontSize="small" sx={{ mr: 1 }} /> Save
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <DialogContent
        sx={{
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          justifyContent: 'start',
          alignItems: 'center'
        }}
      >
        <TextField
          error={!!errors.expenseCategoryName}
          value={expenseCategoryName}
          onChange={(e) => setExpenseCategoryName(e.target.value)}
          size="small"
          label="Payment Category Name*"
          placeholder="Enter Expense Category Name"
          sx={{ width: 300 }}
          helperText={errors?.expenseCategoryName || ''}
        />
        <TextField
          error={!!errors.expenseCategoryType}
          select
          value={expenseCategoryType}
          onChange={(e) => setExpenseCategoryType(e.target.value)}
          size="small"
          label="Payment Category Type*"
          placeholder="Select Expense Category Type"
          sx={{ width: 300 }}
          helperText={errors?.expenseCategoryType || ''}
        >
          <MenuItem value={"DIRECT EXPENSE"}>
          DIRECT EXPENSE
          </MenuItem>
          <MenuItem  value={"INDIRECT EXPENSE"}>
          INDIRECT EXPENSE
          </MenuItem>
          <MenuItem  value={"SALES INCOME"}>
          SALES INCOME
          </MenuItem>
        </TextField>
        
        <TextField
          error={!!errors.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          size="small"
          label="Payment Category Description*"
          placeholder="Enter description"
          sx={{ width: 300 }}
          helperText={errors?.description || ''}
        />
        <FormControlLabel
          control={<Switch checked={activeFlag} onChange={() => setActiveFlag(!activeFlag)} />}
          label={activeFlag ? 'Active' : 'Inactive'}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CreateEditExpenseCategoryDialog;

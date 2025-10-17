import React, { useEffect, useState } from 'react';
import PageWrapper from '../layouts/PageWrapper';
import { useUI } from '../context/UIContext';
import { getProductCategoryListService, saveOrUpdateProductCategoryService } from '../services/productCategoryServices';
import CreateEditProductCategoryDialog from '../features/product/CreateEditProductCategoryDialog';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import ProductCategoryTable from '../features/product/ProductCategoryTable';
import { getAcceessMatrix } from '../utils/loginUtil';
import CreateEditExpenseCategoryDialog from '../features/expense-category/CreateEditExpenseCategoryDialog';
import ExpenseCategoryTable from '../features/expense-category/ExpenseCategoryTable';
import { listAllExpenseCategories } from '../services/invoicePaymentsService';

function ExpenseCategory() {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [expenseCategoryList, setExpenseCategoryList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState('create');
  const [currentItemForEdit, setCurrentItemForEdit] = useState({});
    const [accessMatrix, setAccessMatrix] = useState({});

  useEffect(() => {
    let access = getAcceessMatrix('Product', 'Product Category');
    setAccessMatrix(access);
    getExpenseCategoryListAPICall();
  }, []);


  const getExpenseCategoryListAPICall = (hideSnackbar) => {
    showLoader();
    listAllExpenseCategories()
      .then(res => {
        if (res && res.length > 0) {
          setExpenseCategoryList(res);
          !hideSnackbar && showSnackbar('Payment Categories fetched successfully!', 'success');
        } else {
          setExpenseCategoryList([]);
          !hideSnackbar && showSnackbar('No Payment Categories found!', 'warning');
        }
        hideLoader();
      })
      .catch(err => {
        console.error('Error fetching Payment Categories:', err);
        setExpenseCategoryList([]);
        hideLoader();
        !hideSnackbar && showSnackbar('Failed to fetch Payment Categories!', 'error');
      });
  };

  const handleOpenCreateDialog = () => {
    setMode('create');
    setCurrentItemForEdit({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleEditClick = (item) => {
    setMode('edit');
    setCurrentItemForEdit(item);
    setOpenDialog(true);
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: 'Create New Payment Category',
      buttonCallback: handleOpenCreateDialog,
      buttonIcon: <AddIcon fontSize='small' />,
      access: true,  // adjust if you need role-based access control
    },
  ];

  return (
    <PageWrapper title={"Payment Category"} actionButtons={ActionButtonsArr}>
      <Box sx={{ m: 2 }} />
      <ExpenseCategoryTable
        expenseCategoryList={expenseCategoryList}
        onClickEdit={handleEditClick}
      />
      <CreateEditExpenseCategoryDialog 
        open={openDialog}
        handleClose={handleCloseDialog}
        mode={mode}
        currentItemForEdit={currentItemForEdit}
        getExpenseCategoryListAPICall={getExpenseCategoryListAPICall}
      />
    </PageWrapper>
  );
}

export default ExpenseCategory;

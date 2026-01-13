import React, { useEffect, useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';

import Button from '@mui/material/Button';

import Fab from '@mui/material/Fab';
import GetAppIcon from '@mui/icons-material/GetApp';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { useUI } from '../../context/UIContext';

import InvoiceA4View from './InvoiceA4View';
import { Typography } from '@mui/material';
import Close from '@mui/icons-material/Close';








const ViewDownloadInvoice = ({ open, handleClose, salesOrder, items, companyList, dealerList, customerList }) => {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const printRef = useRef(null);
  
    const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: salesOrder?.sales_order_code || 'Invoice',
      
      
      removeAfterPrint: true,
    });


  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{display: 'flex', justifyContent: 'space-between'}}>
        <Typography fontWeight={'bold'} variant='h6'>View Invoice</Typography>
        <Close fontSize={'small'} onClick={handleClose} />

      </DialogTitle>
      <DialogContent dividers style={{ maxHeight: '80vh', backgroundColor: 'rgba(216, 216, 216, 0.63)' }}>
        <Box sx={{ position: 'relative' }}>
          <Fab
            color="warning"
            aria-label="download"
            sx={{
              position: 'fixed', bottom: 16,
              right: 16,
              zIndex: 1300
            }}
            onClick={() => handlePrint()}
          >
            <GetAppIcon />
          </Fab>
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Box sx={{ width: 'fit-content', mx: 'auto' }}>
              <InvoiceA4View ref={printRef} salesOrder={salesOrder || {}} items={items || []}
                companyList={companyList || []}
                customerList={customerList || []}
                dealerList={dealerList || []} />
            </Box>
          </Box>
        </Box>

      </DialogContent>

      <DialogActions>
        {/* <Button onClick={handleClose}>Cancel</Button> */}
      </DialogActions>
    </Dialog>
  );
};

export default ViewDownloadInvoice;

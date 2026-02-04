import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Typography from "@mui/material/Typography";
import Fab from '@mui/material/Fab';
import GetAppIcon from '@mui/icons-material/GetApp';
import dayjs from "dayjs";
import { useUI } from "../../context/UIContext";
import { listAllPOsByVendorService } from "../../services/purchaseOrderService";
import {
  saveOrUpdateGRNService,
  getGRNItemsService,
} from "../../services/grnService"; // Assume this exists
import { getPOItemsByPOIdService } from "../../services/purchaseOrderService";
import GrnItemManager from "./GrnItemManager";
import GRNA4View from "./GRNA4View";
import { useReactToPrint } from 'react-to-print';

const GRNForm = ({
  grn,
  onClose,
  onSaved,
  vendorList,
  locationList = [],
  mode,
  companyDetails
}) => {
  const printRef = useRef(null);
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [poList, setPoList] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [viewData, setViewData] = useState({})

  const [form, setForm] = useState({
    grnId: "",
    grnNumber: "",
    grnDate: dayjs().format("YYYY-MM-DD"),
    vendorId: "",
    poId: "",
    locationId: "",
    remarks: "",
  });


  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: form?.grnNumber || 'GRN',


    removeAfterPrint: true,
  });


  useEffect(() => {
    if (grn) {
      setForm({
        grnId: grn.grn_id || "",
        grnNumber: grn.grn_number || "",
        grnDate: dayjs(grn.grn_date).format("YYYY-MM-DD"),
        vendorId: grn.vendor_id || "",
        poId: grn.po_id || "",
        locationId: grn.location_id || "",
        remarks: grn.remarks || "",
      });

      if (grn.vendor_id) {
        fetchALLPOsByVendors(grn.vendor_id);
      }
      if (grn.po_id && mode == "create") {
        fetchLinkedPOItems(grn.po_id);
      }
      if (grn.grn_id && mode == "view") {
        fetchLinkedGRNItems(grn.grn_id);
      }
    }
  }, [grn]);

  useEffect(() => {
    if (grn) {
      let calData = getGRNA4Payload() || {}
      setViewData(calData)
    }

  }, [grn, poItems, poList])

  const fetchLinkedPOItems = (poId) => {
    showLoader();
    getPOItemsByPOIdService(poId)
      .then((items) => {
        //setPoItems(items); // You must have a useState for `poItems`

        const mappedItems =
          items?.map((item) => ({
            productId: item.product_id,
            poItemId: item.po_item_id,
            poId: item.po_id,
            pName: item.product_name,
            isSerialNumberApplicable: item.serial_no_applicable,
            quantity: parseFloat(item.quantity || 0),
            receivedQuantity: parseFloat(item.quantity || 0),

            unitPrice: parseFloat(item.unit_price || 0),
            uom: item.uom,
            cgstPercent: parseFloat(item.cgst_percent || 0),
            sgstPercent: parseFloat(item.sgst_percent || 0),
            igstPercent: parseFloat(item.igst_percent || 0),
            cgstAmount: parseFloat(item.cgst_amount || 0),
            sgstAmount: parseFloat(item.sgst_amount || 0),
            igstAmount: parseFloat(item.igst_amount || 0),
            totalAmount: parseFloat(item.total_amount || 0),
            productDescription: item.product_description || "",
          })) || [];
        //console.log("mappedItems", mappedItems)
        setPoItems(mappedItems);
        //console.log(mappedItems)
        //!hideLoader && showSnackbar("Available PO Items fetched!", "success");
      })
      .catch((error) => {
        console.error("Failed to load PO items", error);
        showSnackbar("Failed to load items linked to PO!", "error");
        setPoItems([]);
      })
      .finally(() => {
        hideLoader();
      });
  };

  const fetchLinkedGRNItems = (grnId) => {
    showLoader();
    getGRNItemsService(grnId)
      .then((items) => {
        //setPoItems(items); // You must have a useState for `poItems`

        const mappedItems =
          items?.map((item) => ({
            productId: item.product_id,
            poItemId: item.po_item_id,
            poId: item.po_id,
            pName: item.product_name,
            isSerialNumberApplicable:  item.serial_no_applicable,
            quantity: parseFloat(item.quantity || 0),
            receivedQuantity: parseFloat(item.quantity_received || 0),
            unitPrice: parseFloat(item.unit_price || 0),
            uom: item.uom,
            cgstPercent: parseFloat(item.cgst_percent || 0),
            sgstPercent: parseFloat(item.sgst_percent || 0),
            igstPercent: parseFloat(item.igst_percent || 0),
            cgstAmount: parseFloat(item.cgst_amount || 0),
            sgstAmount: parseFloat(item.sgst_amount || 0),
            igstAmount: parseFloat(item.igst_amount || 0),
            totalAmount: parseFloat(item.total_amount || 0),
            productDescription: item.product_description || "",
          })) || [];
        //console.log("mappedItems", mappedItems)
        setPoItems(mappedItems);
        //console.log(mappedItems)
        //!hideLoader && showSnackbar("Available PO Items fetched!", "success");
      })
      .catch((error) => {
        console.error("Failed to load GRN items", error);
        showSnackbar("Failed to load items linked to GRN!", "error");
        setPoItems([]);
      })
      .finally(() => {
        hideLoader();
      });
  };

  const fetchALLPOsByVendors = (vendorId) => {
    showLoader();
    listAllPOsByVendorService(vendorId)
      .then((res) => setPoList(res || []))
      .catch(() => showSnackbar("Failed to fetch PO list", "error"))
      .finally(() => hideLoader());
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getGRNA4Payload = () => {
    const vendor = vendorList.find((v) => v.vendorId === form.vendorId) || {};
    const po = poList.find((p) => p.po_id === form.poId) || {};
    const location =
      locationList.find((l) => l.locationId === form.locationId) || {};

    console.log(po, 'vl')
    const totalCgst = poItems.reduce(
      (acc, item) => acc + parseFloat(item.cgstAmount || 0),
      0
    );
    const totalSgst = poItems.reduce(
      (acc, item) => acc + parseFloat(item.sgstAmount || 0),
      0
    );
    const totalIgst = poItems.reduce(
      (acc, item) => acc + parseFloat(item.igstAmount || 0),
      0
    );
    const totalAmount = poItems.reduce(
      (acc, item) => acc + parseFloat(item.totalAmount || 0),
      0
    );

    return {
      vendorDetails: {
        name: vendor.vendorName || "",
        gst: vendor.gstin || "-",
        pan: vendor.pan || "-",
        mobile: vendor.phone || "-",
        email: vendor.email || "-",
        billingAddress: po.billing_address || "",
      },
      locationDetails: {
        locationName: location.locationName || "",
        locationAddress: [location.address, location.districtName, location.pincode, location.stateName].filter(x => x).join(', ') || ""
      },
      grnDetails: {
        grnNumber: form.grnNumber,
        grnDate: form.grnDate,
        remarks: form.remarks,
        poNumber: po.po_number
      },
      items: poItems,
      cgstAmount: parseFloat(totalCgst.toFixed(2)),
      sgstAmount: parseFloat(totalSgst.toFixed(2)),
      igstAmount: parseFloat(totalIgst.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  };

  const handleSubmit = () => {
    // console.log(form, poItems, "Submit")

    const { grnNumber, vendorId, poId, locationId, grnDate } = form;

    if (!grnNumber || !vendorId || !poId || !locationId || !grnDate) {
      showSnackbar(
        "Please fill required fields - GRN Number, Vendor, PO, Location, Received Date",
        "error"
      );
      return;
    }
    if (!poItems || poItems.length === 0) {
      showSnackbar("You can not save without grn items!", "error");
      return;
    }

    console.log("poItems", poItems)


    const numericFields = [
      'receivedQuantity',
      'unitPrice',
      'cgstPercent',
      'sgstPercent',
      'igstPercent',
      'cgstAmount',
      'sgstAmount',
      'igstAmount',
      'totalAmount'
    ];

    const negativeFields = [];

     const serialNumbersNotAddedProperly = [];

    poItems?.forEach((item, index) => {
      numericFields.forEach((field) => {
        const value = parseFloat(item[field]);
        if (!isNaN(value) && value < 0) {
          negativeFields.push(`Row ${index + 1}: ${field}`);
        }
      });

       if(item.isSerialNumberApplicable &&
                    Number(item.receivedQuantity) !== (item.serialNumbers
                      ? item.serialNumbers?.split(',')?.filter(sn => sn.trim() !== '')?.length
                      : 0)){

                        let err = `You entered ${(item.serialNumbers
                      ? item.serialNumbers.split(',').filter(sn => sn.trim() !== '').length
                      : 0)} serial number(s), but received quantity is ${item.receivedQuantity} for ${ item.pName}`
                        serialNumbersNotAddedProperly.push(err)
                      }

    });

    if (serialNumbersNotAddedProperly.length > 0) {
      showSnackbar(
       serialNumbersNotAddedProperly,
        'error'
      );
      return;
    }
      if (negativeFields.length > 0) {
      showSnackbar(
        `All numerical values must be positive. Found negative in: ${[...new Set(negativeFields)].join(', ')}`,
        'error'
      );
      return;
    }


    const grnItemList =
      poItems &&
      poItems.length > 0 &&
      poItems.map((item) => {
        return {
          poItemId: item.poItemId,
          productId: item.productId,
          quantityReceived: parseFloat(item.receivedQuantity || 0).toFixed(2),
          unitPrice: parseFloat(item.unitPrice || 0).toFixed(2),
          uom: item.uom,
          cgstPercent: parseFloat(item.cgstPercent || 0).toFixed(2),
          sgstPercent: parseFloat(item.sgstPercent || 0).toFixed(2),
          igstPercent: parseFloat(item.igstPercent || 0).toFixed(2),
          cgstAmount: parseFloat(item.cgstAmount || 0).toFixed(2),
          sgstAmount: parseFloat(item.sgstAmount || 0).toFixed(2),
          igstAmount: parseFloat(item.igstAmount || 0).toFixed(2),
          totalAmount: parseFloat(item.totalAmount || 0).toFixed(2),
          batchNumber: item.batchNumber || null,
          expiryDate: item.expiryDate || null,
          serialNumbersAdd : item.serialNumbers?.split(',')?.filter(sn => sn.trim() !== '') || []
        };
      });

    showLoader();
    saveOrUpdateGRNService({
      ...form,
      grnId: form.grnId || null,
      items: grnItemList,
    })
      .then(() => {
        showSnackbar("GRN saved successfully", "success");
        onSaved?.();
      })
      .catch(() => showSnackbar("Failed to save GRN", "error"))
      .finally(() => hideLoader());
  };

  return (
    <Box mt={2}>
      {
        mode === 'view' ? (<Box sx={{ position: 'relative' }}>
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
              <GRNA4View ref={printRef} grnData={viewData}  companyDetails={companyDetails} />
            </Box>
          </Box>
        </Box>

        ) : (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Autocomplete
                size="small"
                options={vendorList}
                getOptionLabel={(o) => o.vendorName || ""}
                value={
                  vendorList.find((v) => v.vendorId === form.vendorId) || null
                }
                onChange={(_, newValue) => {
                  handleChange("vendorId", newValue?.vendorId || "");
                  handleChange("poId", "");
                  fetchALLPOsByVendors(newValue?.vendorId);
                  setSelectedPO(null);
                }}
                renderInput={(params) => <TextField {...params} label="Vendor" />}
              />
            </Grid>

            <Grid item xs={6}>
              <Autocomplete
                size="small"
                options={poList}
                getOptionLabel={(o) => o.po_number || ""}
                value={poList.find((p) => p.po_id === form.poId) || null}
                onChange={(_, newValue) => {
                  handleChange("poId", newValue?.po_id || "");
                  if (newValue?.po_id) {
                    setSelectedPO(poList.find((p) => p.po_id === newValue.po_id));
                    fetchLinkedPOItems(newValue?.po_id);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="PO Number" />
                )}
              />
            </Grid>
            {selectedPO &&
              typeof selectedPO === "object" &&
              Object.keys(selectedPO).length > 0 && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                      p: 2,
                      background: "#f9f9f9",
                      boxShadow: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Selected Purchase Order
                    </Typography>

                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          PO Number
                        </Typography>
                        <Typography variant="body1">
                          {selectedPO.po_number}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Typography variant="body1">
                          {selectedPO.status}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Amount
                        </Typography>
                        <Typography variant="body1">
                          ₹ {parseFloat(selectedPO.total_amount).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Payment Terms
                        </Typography>
                        <Typography variant="body1">
                          {selectedPO.payment_terms}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={12}>
                        <Typography variant="body2" color="text.secondary">
                          Delivery Address as Mentioned in PO
                        </Typography>
                        <Typography variant="body1">
                          {selectedPO.shipping_address}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              )}

            <Grid item xs={12}>
              <Autocomplete
                size="small"
                options={locationList}
                getOptionLabel={(o) =>
                  o?.locationName
                    ? `${o.locationName} (${(o.locationTypeNames || []).join(
                      ", "
                    )})`
                    : ""
                }
                value={
                  locationList.find(
                    (loc) => loc.locationId === form.locationId
                  ) || null
                }
                onChange={(_, newValue) => {
                  handleChange("locationId", newValue?.locationId || "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Location(Goods Received)" />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="GRN Number"
                value={form.grnNumber}
                onChange={(e) => handleChange("grnNumber", e.target.value)}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Good Received Date"
                type="date"
                value={form.grnDate}
                onChange={(e) => handleChange("grnDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                size="small"
                rows={2}
                label="Remarks"
                value={form.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Box mt={3}>
                <GrnItemManager
                  productList={[]}
                  taxTypeOrg={selectedPO?.tax_type || null}
                  poItems={poItems}
                  setPoItems={setPoItems}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning">
                <strong>Please be careful!</strong> Double check all GRN details before submitting. Once created, it will
                automatically update your inventory and <strong>cannot be edited later</strong>.
              </Alert>
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button variant="contained" onClick={handleSubmit}>
                {grn ? "Update GRN" : "Create GRN"}
              </Button>
            </Grid>
          </Grid>
        )}
    </Box>
  );
};

export default GRNForm;

// DealerManagementPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tabs,
  Tab,
  IconButton,
  MenuItem,
  Chip,
  Avatar,
  Divider,
} from "@mui/material";
import PageWrapper from "../layouts/PageWrapper";
import { useUI } from "../context/UIContext";
import { Add, Edit, Delete, Visibility, Search } from "@mui/icons-material";
import {
  getAllDealersService,
  saveOrUpdateDealerService,
} from "../services/dealerService";
import { getDistrictListService } from "../services/districtServices";
import { getStateListService } from "../services/stateServices";
import { fetchUserListService } from "../services/userServices";
import { getAcceessMatrix } from "../utils/loginUtil";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PublicIcon from "@mui/icons-material/Public";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import OrderPaymentHistoryDialog from "../features/sales-order/OrderPaymentHistoryDialog";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const initialDealerState = {
  dealerId: null,
  dealerCode: "",
  dealerName: "",
  dealerType: "",
  gstin: "",
  pan: "",
  email: "",
  phone: "",
  website: "",
  status: true,
  reportingToUserId: null,
  addresses: [],
  contacts: [],
  bankDetails: [],
};

const dealerAddressTypes = [
  { id: "PRIMARY ADDRESS", label: "PRIMARY ADDRESS" },
  { id: "REGISTERED OFFICE ADDRESS", label: "REGISTERED OFFICE ADDRESS" },
  { id: "BILLING ADDRESS", label: "BILLING ADDRESS" },
  { id: "REMITTANCE ADDRESS", label: "REMITTANCE ADDRESS" },
  { id: "SHIPPING FROM ADDRESS", label: "SHIPPING FROM ADDRESS" },
  { id: "RETURN ADDRESS", label: "RETURN ADDRESS" },
  { id: "BRANCH ADDRESS", label: "BRANCH ADDRESS" },
  {
    id: "CUSTOMER SERVICE CONTACT ADDRESS",
    label: "CUSTOMER SERVICE CONTACT ADDRESS",
  },
  { id: "OTHER ADDRESS", label: "OTHER ADDRESS" },
];

export default function DealerManagementPage() {
  const { showSnackbar, showLoader, hideLoader } = useUI();
  const [dealerList, setDealerList] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState(initialDealerState);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [userList, setUserList] = useState([]);
  const [userIDUserNameMap, setUserIDUserNameMap] = useState({});
  const [isViewMode, setIsViewMode] = useState(false);
  const [stateDropDown, setStateDropDown] = useState([]);
  const [errors, setErrors] = useState({});
  const [accessMatrix, setAccessMatrix] = useState({});
  const [openOrderPaymentDialog, setOpenOrderPaymentDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    showLoader();
    fetchDealers();
    fetchUserAndLocationData();
    //hideLoader()

    const access = getAcceessMatrix(
      "Dealer and Customer Management",
      "Dealer Management"
    );
    setAccessMatrix(access);
  }, []);

  const handleCloseDialog = () => {
    setSelectedDealer(initialDealerState || {});
    setOpenDialog(false);
    setActiveTab(0);
    setIsViewMode(false);
    setErrors({});
  };

  const fetchUserAndLocationData = async () => {
    try {
      const [usersRes, stateRes] = await Promise.all([
        fetchUserListService(),
        getStateListService(),
      ]);
      setUserList(usersRes?.responseObject || []);
      if (usersRes?.responseObject) {
        const users = usersRes?.responseObject;
        const userMap = {};

        users.forEach((user) => {
          const fullName = [
            user.userFirstname,
            user.userMiddlename,
            user.userLastname,
          ]
            .filter(Boolean) // removes empty string
            .join(" ");
          userMap[user.userId] = `${fullName} - ${user.loginId}`;
        });
        setUserIDUserNameMap(userMap);
      }
      let stateD = stateRes?.map((x) => {
        return {
          id: x.stateId,
          label: x.stateName,
        };
      });
      setStateDropDown(stateD || []);
      //console.log('data', stateRes, usersRes?.responseObject)
      hideLoader();
    } catch (error) {
      showSnackbar("Failed to load user/location data", "error");
      hideLoader();
    }
  };
  const fetchDealers = async () => {
    try {
      const res = await getAllDealersService();
      setDealerList(res);
    } catch (err) {
      showSnackbar("Error fetching dealers", "error");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!selectedDealer.dealerCode?.trim())
      newErrors.dealerCode = "Dealer Code is required";
    if (!selectedDealer.dealerName?.trim())
      newErrors.dealerName = "Dealer Name is required";
    if (!selectedDealer.gstin?.trim() && !selectedDealer.pan?.trim()) {
      newErrors.gstin = "Either GSTIN or PAN is required";
      newErrors.pan = "Either GSTIN or PAN is required";
    }
    if (!selectedDealer.reportingToUserId) {
      newErrors.reportingToUserId = "Reporting user is required";
    }
    // Validate addresses (if any added)
    selectedDealer?.addresses?.forEach((addr, index) => {
      const prefix = `Address ${index + 1}`;
      if (!addr.addressType?.trim())
        newErrors[
          `addressType_${index}`
        ] = `${prefix}: Address Type is required`;
      if (!addr.addressLine1?.trim())
        newErrors[
          `addressLine1_${index}`
        ] = `${prefix}: Address Line 1 is required`;
      if (!addr.city?.trim())
        newErrors[`city_${index}`] = `${prefix}: City is required`;
      if (!addr.stateName?.trim())
        newErrors[`state_${index}`] = `${prefix}: State is required`;
      if (!addr.district?.trim())
        newErrors[`district_${index}`] = `${prefix}: District is required`;
      if (!addr.pincode?.trim())
        newErrors[`pincode_${index}`] = `${prefix}: Pincode is required`;
      if (!addr.country?.trim())
        newErrors[`country_${index}`] = `${prefix}: Country is required`;
    });

    // Contact field validations
    selectedDealer?.contacts?.forEach((contact, index) => {
      const prefix = `Contact ${index + 1}`;
      if (!contact.contactName?.trim())
        newErrors[`contactName_${index}`] = `${prefix}: Name is required`;
      if (!contact.designation?.trim())
        newErrors[
          `designation_${index}`
        ] = `${prefix}: Designation is required`;
      //if (!contact.email?.trim()) newErrors[`email_${index}`] = `${prefix}: Email is required`;
      if (!contact.phone?.trim())
        newErrors[`phone_${index}`] = `${prefix}: Phone is required`;
    });

    // Bank Details
    selectedDealer.bankDetails.forEach((bank, index) => {
      const prefix = `Bank ${index + 1}`;
      if (!bank.accountHolderName?.trim())
        newErrors[
          `accountHolderName_${index}`
        ] = `${prefix}: Account Holder Name is required`;
      if (!bank.accountNumber?.trim())
        newErrors[
          `accountNumber_${index}`
        ] = `${prefix}: Account Number is required`;
      if (!bank.ifscCode?.trim())
        newErrors[`ifscCode_${index}`] = `${prefix}: IFSC Code is required`;
      if (!bank.bankName?.trim())
        newErrors[`bankName_${index}`] = `${prefix}: Bank Name is required`;
      if (!bank.branchName?.trim())
        newErrors[`branchName_${index}`] = `${prefix}: Branch Name is required`;
    });

    Object.keys(newErrors).length > 0 &&
      showSnackbar(Object.values(newErrors), "error");
    setErrors(newErrors);
    console.log("Object.values(newErrors)", Object.values(newErrors));
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    showLoader();
    try {
      await saveOrUpdateDealerService(selectedDealer);
      showSnackbar("Dealer saved successfully", "success");
      setOpenDialog(false);
      fetchDealers();
    } catch (err) {
      showSnackbar("Error saving dealer", "error");
    }
    hideLoader();
  };

  const handleEdit = (dealer) => {
    setSelectedDealer(dealer);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleView = (dealer) => {
    setSelectedDealer(dealer);
    setOpenDialog(true);
    setIsViewMode(true);
    setActiveTab(0);
  };

  const handleAdd = () => {
    setSelectedDealer(initialDealerState);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleAddSectionItem = (key, newItem) => {
    setSelectedDealer({
      ...selectedDealer,
      [key]: [...selectedDealer[key], newItem],
    });
  };

  const handleNestedChange = (section, index, key, value) => {
    if (!isViewMode) {
      const updated = [...selectedDealer[section]];
      updated[index][key] = value;
      setSelectedDealer((prev) => ({ ...prev, [section]: updated }));
    }
  };

  const handleUpdateItem = (key, index, updatedItem) => {
    const updatedArray = [...selectedDealer[key]];
    updatedArray[index] = updatedItem;
    setSelectedDealer({ ...selectedDealer, [key]: updatedArray });
  };

  const handleRemoveSectionItem = (key, index) => {
    const updatedArray = [...selectedDealer[key]];
    updatedArray.splice(index, 1);
    setSelectedDealer({ ...selectedDealer, [key]: updatedArray });
  };

  const ActionButtonsArr = [
    {
      showHeaderButton: true,
      buttonText: "Add Dealer",
      buttonCallback: () => {
        handleAdd();
      },
      buttonIcon: <Add fontSize="small" />,
      access: accessMatrix?.create ?? false,
    },
  ];

  return (
    <PageWrapper title="Dealer Management" actionButtons={ActionButtonsArr}>
      <Box m={2}>
        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          mb={2}
          gap={1}
        >
          <Box
            sx={{
              p: 0.5,
              backgroundColor: "primary.light",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search size="small" />
          </Box>

          <TextField
            size="small"
            placeholder="Search by name or code"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 300 }}
          />
        </Box>
        <Grid container spacing={2}>
          {dealerList
            ?.filter(
              (v) =>
                v.dealerName
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                v.dealerCode.toLowerCase().includes(searchQuery.toLowerCase())
            )
            ?.map((dealer) => (
              <Grid item xs={12} md={4} key={dealer.dealerId}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderLeft: `6px solid ${dealer.status ? "green" : "red"}`,
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={1}
                    >
                      <Avatar
                        sx={{
                          bgcolor: dealer.status ? "green" : "red",
                          width: 32,
                          height: 32,
                        }}
                      >
                        <BusinessIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {dealer.dealerName}
                        </Typography>
                        <Chip
                          label={dealer.dealerCode}
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={dealer.status ? "Active" : "Inactive"}
                          size="small"
                          color={dealer.status ? "success" : "error"}
                          icon={
                            dealer.status ? <CheckCircleIcon /> : <CancelIcon />
                          }
                        />
                      </Box>
                    </Stack>

                    <Stack spacing={1} mt={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon fontSize="small" />
                        <Typography variant="body2">
                          {dealer.email || "N/A"}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon fontSize="small" />
                        <Typography variant="body2">
                          {dealer.phone || "N/A"}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2">
                          {userIDUserNameMap[dealer.reportingToUserId] || "N/A"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>

                  <CardActions
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      flexDirection: "column-reverse",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          setSelectedDealer(dealer);
                          setOpenOrderPaymentDialog(true);
                        }}
                        startIcon={<AccountBalanceWalletIcon />}
                      >
                        Order & Payments
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEdit(dealer)}
                        startIcon={<Edit />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleView(dealer)}
                        startIcon={<Visibility />}
                      >
                        View
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {isViewMode
            ? "View Dealer"
            : selectedDealer.dealerId
            ? "Edit Delaer"
            : "Add Dealer"}
        </DialogTitle>
        <DialogContent>
          {/* <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
                  <Tab label="Basic Info" />
                  <Tab label="Addresses" />
                  <Tab label="Contacts" />
                  <Tab label="Bank Details" />
                </Tabs> */}
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              px: 1,
              py: 1,
              backgroundColor: (theme) => theme.palette.primary.light, // teal[100]
              borderRadius: 2,
              minHeight: 48,
              "& .MuiTab-root": {
                fontWeight: 500,
                color: (theme) => theme.palette.primary.dark, // teal[800]
                textTransform: "none",
                borderRadius: 6,
                minHeight: 40,
                minWidth: 120,
                mx: 0.5,

                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.primary.accordian, // teal[400]
                  color: "#fff",
                },
              },
              "& .Mui-selected": {
                backgroundColor: (theme) => theme.palette.primary.tab, // teal[600]
                color: (theme) => theme.palette.primary.contrastText,
              },
              "& .MuiTabs-indicator": {
                height: 0,
                backgroundColor: (theme) => theme.palette.primary.dark,
                borderRadius: 3,
              },
            }}
          >
            <Tab label="Basic Info" />
            <Tab label="Addresses" />
            <Tab label="Contacts" />
            <Tab label="Bank Details" />
          </Tabs>

          <Box m={2}>
            {activeTab === 0 && (
              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    disabled={isViewMode}
                    label="Dealer Code"
                    fullWidth
                    value={selectedDealer.dealerCode}
                    onChange={(e) =>
                      setSelectedDealer({
                        ...selectedDealer,
                        dealerCode: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    disabled={isViewMode}
                    label="Dealer Name"
                    fullWidth
                    value={selectedDealer.dealerName}
                    onChange={(e) =>
                      setSelectedDealer({
                        ...selectedDealer,
                        dealerName: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    disabled={isViewMode}
                    label="Email"
                    fullWidth
                    value={selectedDealer.email}
                    onChange={(e) =>
                      setSelectedDealer({
                        ...selectedDealer,
                        email: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    disabled={isViewMode}
                    label="Phone"
                    fullWidth
                    value={selectedDealer.phone}
                    onChange={(e) =>
                      setSelectedDealer({
                        ...selectedDealer,
                        phone: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    disabled={isViewMode}
                    label="GSTIN"
                    fullWidth
                    value={selectedDealer.gstin}
                    onChange={(e) =>
                      setSelectedDealer({
                        ...selectedDealer,
                        gstin: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    disabled={isViewMode}
                    label="PAN"
                    fullWidth
                    value={selectedDealer.pan}
                    onChange={(e) =>
                      setSelectedDealer({
                        ...selectedDealer,
                        pan: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    disabled={isViewMode}
                    label="Reporting To"
                    fullWidth
                    value={selectedDealer.reportingToUserId || ""}
                    onChange={(e) =>
                      setSelectedDealer({
                        ...selectedDealer,
                        reportingToUserId: e.target.value,
                      })
                    }
                  >
                    {userList?.map((user) => (
                      <MenuItem key={user.userId} value={user.userId}>
                        {user.userFirstname} {user.userMiddlename}{" "}
                        {user.userLastname} ({user.loginId}) -{" "}
                        {user.roleShortname}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    disabled={isViewMode}
                    label="Status"
                    value={selectedDealer.status}
                    onChange={(e) =>
                      setSelectedDealer({
                        ...selectedDealer,
                        status: e.target.value,
                      })
                    }
                    fullWidth
                  >
                    <MenuItem key={1} value={true}>
                      Active
                    </MenuItem>
                    <MenuItem key={2} value={false}>
                      In-Active
                    </MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && (
              <Stack spacing={2} mt={2}>
                {selectedDealer.addresses.map((addr, idx) => (
                  <Stack spacing={1} key={idx} direction="row" flexWrap="wrap">
                    <Box
                      sx={{
                        border: "1px solid green",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                      p={4}
                    >
                      <Box
                        mb={2}
                        display={"flex"}
                        width={"100%"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                      >
                        <Typography
                          sx={{
                            p: 1,
                            backgroundColor: "primary.main",
                            color: "white",
                            borderRadius: 2,
                          }}
                        >{`Address ${idx + 1}`}</Typography>
                        {!isViewMode && (
                          <IconButton
                            onClick={() =>
                              handleRemoveSectionItem("addresses", idx)
                            }
                          >
                            <Delete color={"error"} />
                          </IconButton>
                        )}
                      </Box>
                      <TextField
                        size={"small"}
                        select
                        disabled={isViewMode}
                        label="Type"
                        value={addr.addressType}
                        onChange={(e) =>
                          handleNestedChange(
                            "addresses",
                            idx,
                            "addressType",
                            e.target.value
                          )
                        }
                        fullWidth
                      >
                        {dealerAddressTypes.map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Line 1"
                        value={addr.addressLine1}
                        onChange={(e) =>
                          handleNestedChange(
                            "addresses",
                            idx,
                            "addressLine1",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Line 2"
                        value={addr.addressLine2}
                        onChange={(e) =>
                          handleNestedChange(
                            "addresses",
                            idx,
                            "addressLine2",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="City"
                        value={addr.city}
                        onChange={(e) =>
                          handleNestedChange(
                            "addresses",
                            idx,
                            "city",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        select
                        size={"small"}
                        disabled={isViewMode}
                        label="State"
                        value={addr.state}
                        onChange={(e) => {
                          const selected = stateDropDown.find(
                            (s) => s.id === e.target.value
                          );
                          handleNestedChange(
                            "addresses",
                            idx,
                            "state",
                            e.target.value
                          );
                          handleNestedChange(
                            "addresses",
                            idx,
                            "stateName",
                            selected?.label || ""
                          );
                        }}
                        fullWidth
                      >
                        {stateDropDown?.map((state) => {
                          //console.log(state)
                          return (
                            <MenuItem key={state.id} value={state.id}>
                              {state.label}
                            </MenuItem>
                          );
                        })}
                      </TextField>

                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="District"
                        value={addr.district}
                        onChange={(e) => {
                          handleNestedChange(
                            "addresses",
                            idx,
                            "district",
                            e.target.value
                          );
                        }}
                        fullWidth
                      ></TextField>
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Pincode"
                        value={addr.pincode}
                        onChange={(e) =>
                          handleNestedChange(
                            "addresses",
                            idx,
                            "pincode",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Country"
                        value={addr.country}
                        onChange={(e) =>
                          handleNestedChange(
                            "addresses",
                            idx,
                            "country",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                    </Box>
                  </Stack>
                ))}
                {!isViewMode && (
                  <Button
                    onClick={() =>
                      handleAddSectionItem("addresses", {
                        addressType: "",
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        district: "",
                        state: "",
                        stateName: "",
                        pincode: "",
                        country: "",
                        isPrimary: true,
                      })
                    }
                  >
                    + Add Address
                  </Button>
                )}
              </Stack>
            )}

            {activeTab === 2 && (
              <Stack spacing={2} mt={2}>
                {selectedDealer?.contacts.map((contact, idx) => (
                  <Stack key={idx} direction="row" flexWrap="wrap">
                    <Box
                      sx={{
                        border: "1px solid green",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                      p={4}
                    >
                      <Box
                        mb={2}
                        display={"flex"}
                        width={"100%"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                      >
                        <Typography
                          sx={{
                            p: 1,
                            backgroundColor: "primary.main",
                            color: "white",
                            borderRadius: 2,
                          }}
                        >{`Contact ${idx + 1}`}</Typography>
                        {!isViewMode && (
                          <IconButton
                            onClick={() =>
                              handleRemoveSectionItem("contacts", idx)
                            }
                          >
                            <Delete color={"error"} />
                          </IconButton>
                        )}
                      </Box>

                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Name"
                        value={contact.contactName}
                        onChange={(e) =>
                          handleNestedChange(
                            "contacts",
                            idx,
                            "contactName",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Designation"
                        value={contact.designation}
                        onChange={(e) =>
                          handleNestedChange(
                            "contacts",
                            idx,
                            "designation",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Email"
                        value={contact.email}
                        onChange={(e) =>
                          handleNestedChange(
                            "contacts",
                            idx,
                            "email",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Phone"
                        value={contact.phone}
                        onChange={(e) =>
                          handleNestedChange(
                            "contacts",
                            idx,
                            "phone",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                    </Box>
                  </Stack>
                ))}

                {!isViewMode && (
                  <Button
                    onClick={() =>
                      handleAddSectionItem("contacts", {
                        contactName: "",
                        designation: "",
                        email: "",
                        phone: "",
                        isPrimary: false,
                      })
                    }
                  >
                    + Add Contact
                  </Button>
                )}
              </Stack>
            )}

            {activeTab === 3 && (
              <Stack spacing={2} mt={2}>
                {selectedDealer?.bankDetails.map((bank, idx) => (
                  <Stack spacing={1} key={idx} direction="row" flexWrap="wrap">
                    <Box
                      sx={{
                        border: "1px solid green",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                      p={4}
                    >
                      <Box
                        mb={2}
                        display={"flex"}
                        width={"100%"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                      >
                        <Typography
                          sx={{
                            p: 1,
                            backgroundColor: "primary.main",
                            color: "white",
                            borderRadius: 2,
                          }}
                        >{`Bank Info ${idx + 1}`}</Typography>
                        {!isViewMode && (
                          <IconButton
                            onClick={() =>
                              handleRemoveSectionItem("bankDetails", idx)
                            }
                          >
                            <Delete color={"error"} />
                          </IconButton>
                        )}
                      </Box>
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Account Holder"
                        value={bank.accountHolderName}
                        onChange={(e) =>
                          handleNestedChange(
                            "bankDetails",
                            idx,
                            "accountHolderName",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Account Number"
                        value={bank.accountNumber}
                        onChange={(e) =>
                          handleNestedChange(
                            "bankDetails",
                            idx,
                            "accountNumber",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="IFSC"
                        value={bank.ifscCode}
                        onChange={(e) =>
                          handleNestedChange(
                            "bankDetails",
                            idx,
                            "ifscCode",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Bank Name"
                        value={bank.bankName}
                        onChange={(e) =>
                          handleNestedChange(
                            "bankDetails",
                            idx,
                            "bankName",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        size={"small"}
                        disabled={isViewMode}
                        label="Branch"
                        value={bank.branchName}
                        onChange={(e) =>
                          handleNestedChange(
                            "bankDetails",
                            idx,
                            "branchName",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                    </Box>
                  </Stack>
                ))}
                {!isViewMode && (
                  <Button
                    onClick={() =>
                      handleAddSectionItem("bankDetails", {
                        accountHolderName: "",
                        accountNumber: "",
                        ifscCode: "",
                        bankName: "",
                        branchName: "",
                        isPrimary: true,
                      })
                    }
                  >
                    + Add Bank Detail
                  </Button>
                )}
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {!isViewMode && (
            <Button variant="contained" onClick={handleSave}>
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <OrderPaymentHistoryDialog
        open={openOrderPaymentDialog}
        onClose={() => {
          setSelectedDealer(initialDealerState || {});
          setOpenOrderPaymentDialog(false);
        }}
        dealerId={selectedDealer?.dealerId}
        buyerName={selectedDealer?.dealerName}
        partyType="DEALER"
      />
    </PageWrapper>
  );
}

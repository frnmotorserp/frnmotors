import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReportIcon from '@mui/icons-material/Assessment';
import AuditIcon from '@mui/icons-material/Work';
import SettingsIcon from '@mui/icons-material/Settings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ElectricMopedIcon from '@mui/icons-material/ElectricMoped';
import BadgeIcon from '@mui/icons-material/Badge';

export const MenuIconMap =   [
    {
      "menuName": "Dashboard",
      "id": 1,
      "icon": <SpaceDashboardIcon  sx={{ fontSize: 16 }} />
    },
    {
      "menuName": "Location Management",
      "id": 2,
      "icon": <LocationOnIcon sx={{ fontSize: 20 }}  />
    },
    {
      "menuName": "Product",
      "id": 3,
      "icon": <ElectricMopedIcon sx={{ fontSize: 20 }} />
    },
    {
      "menuName": "Inventory Management",
      "id": 4,
      "icon": <ReportIcon sx={{ fontSize: 20 }}/>
    },
  
     {
      "menuName": "Dealer and Customer Management",
      "id": 5,
      "icon": <BadgeIcon sx={{ fontSize: 20 }}/>
    },
    {
      "menuName": "Activity Tracking",
      "id": 7,
      "icon": <AuditIcon sx={{ fontSize: 20 }}/>
    },
    {
      "menuName": "Sales",
      "id": 6,
      "icon": <LocalGroceryStoreIcon sx={{ fontSize: 20 }}/>
    },
    {
      "menuName": "Report",
      "id": 8,
      "icon": <ListAltIcon sx={{ fontSize: 20 }}/>
    },
  
    {
      "menuName": "System Administration",
      "id": 9,
      "icon": <ManageAccountsIcon sx={{ fontSize: 20 }} />
    }
  ]
  

export  const subMenuRouteConfig = [
    {
      "menuName": "Location Management",
      "submenuName": "State",
      "id": 21,
      "route": "/bs/state"
    },
    {
      "menuName": "Location Management",
      "submenuName": "District",
      "id": 22,
      "route": "/bs/district"
    },
    {
      "menuName": "Location Management",
      "submenuName": "Location Type",
      "id": 23,
      "route": "/bs/locationType"
    },
    {
      "menuName": "Location Management",
      "submenuName": "Location",
      "id": 24,
      "route": "/bs/location"
    },
    {
      "menuName": "Location Management",
      "submenuName": "User Location Map",
      "id": 25,
      "route": "/bs/userLocationMap"
    },
    // {
    //   "menuName": "Branch Setup",
    //   "submenuName": "Audit",
    //   "id": 25,
    //   "route": "/bs/audit"
    // },
    // {
    //   "menuName": "Branch Setup",
    //   "submenuName": "Audit Branch Map",
    //   "id": 26,
    //   "route": "/bs/audit-branch-map"
    // },
    // {
    //   "menuName": "Branch Setup",
    //   "submenuName": "Audit Plan",
    //   "id": 26,
    //   "route": "/bs/audit-plan"
    // },
    {
      "menuName": "Product",
      "submenuName": "Product Category",
      "id": 31,
      "route": "/product/productCategory"
    },
    {
      "menuName": "Product",
      "submenuName": "Product Feature",
      "id": 32,
      "route": "/product/productFeature"
    },
    {
      "menuName": "Product",
      "submenuName": "Products",
      "id": 33,
      "route": "/product/productPage"
    },
   
    {
      "menuName": "Inventory Management",
      "submenuName": "Vendor",
      "id": 41,
      "route": "/inventoryManagemnt/vendor"
    },
    {
      "menuName": "Inventory Management",
      "submenuName": "Purchase Order",
      "id": 42,
      "route": "/inventoryManagemnt/po"
    },
      {
      "menuName": "Inventory Management",
      "submenuName": "Goods Received Note",
      "id": 43,
      "route": "/inventoryManagemnt/grn"
    },
    {
      "menuName": "Inventory Management",
      "submenuName": "Purchase Invoices and Payments",
      "id": 44,
      "route": "/inventoryManagemnt/pi"
    },
      {
      "menuName": "Inventory Management",
      "submenuName": "Inventory",
      "id": 45,
      "route": "/inventoryManagemnt/inventory"
    },

          {
      "menuName": "Inventory Management",
      "submenuName": "Modify Inventory",
      "id": 46,
      "route": "/inventoryManagemnt/modifyInventory"
    },

    
          {
      "menuName": "Inventory Management",
      "submenuName": "Issue Inventory",
      "id": 47,
      "route": "/inventoryManagemnt/issueInventory"
    },
          {
      "menuName": "Inventory Management",
      "submenuName": "Cashbook Management",
      "id": 48,
      "route": "/inventoryManagemnt/cashbook"
    },

           {
      "menuName": "Dealer and Customer Management",
      "submenuName": "Dealer Management",
      "id": 51,
      "route": "/dealer-customer/dealerManagement"
    },
    
           {
      "menuName": "Dealer and Customer Management",
      "submenuName": "Customer Management",
      "id": 52,
      "route": "/dealer-customer/customerManagement"
    },

           {
      "menuName": "Sales",
      "submenuName": "Order Management",
      "id": 61,
      "route": "/sales/orders"
    },

     {
      "menuName": "Activity Tracking",
      "submenuName": "Salesman Activity",
      "id": 91,
      "route": "activity/salesman"
    },
    
  
  
   
    {
      "menuName": "System Administration",
      "submenuName": "User Management",
      "id": 81,
      "route": "sa/user"
    },
    {
      "menuName": "System Administration",
      "submenuName": "App Version",
      "id": 82,
      "route": "/appversion"
    },
    {
      "menuName": "System Administration",
      "submenuName": "Access Management",
      "id": 83,
      "route": "sa/userrolemap"
    },


    
     {
      "menuName": "Report",
      "submenuName": "Salesman Activity Report",
      "id": 101,
      "route": "report/salesman-activity"
    },
    {
      "menuName": "Report",
      "submenuName": "Monthly Sales Report",
      "id": 102,
      "route": "report/monthly-sales-report"
    },
    {
      "menuName": "Report",
      "submenuName": "Yearly Sales Report",
      "id": 103,
      "route": "report/yearly-sales-report"
    },
  ]
  

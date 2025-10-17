import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MoreIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import ProfilePopup from '../components/ProfilePopup';

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 8,
    padding: theme.spacing(1),
    minWidth: 180,
  },
}));

export default function NavBar({ setOpenSidebar, logOut }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);
  const navigate = useNavigate();

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);
  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };
  const handleMobileMenuOpen = (event) => setMobileMoreAnchorEl(event.currentTarget);
  const handleOpenMainMenuSideBar = () => setOpenSidebar(prev => !prev);

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const renderMenu = (
    <StyledMenu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <Box
  sx={{
    position: 'relative',
    padding: 2,
    
    minWidth: 220,
    animation: 'fadeSlide 0.25s ease-out',
    '@keyframes fadeSlide': {
      from: { opacity: 0, transform: 'translateY(-10px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
  }}
>
  <IconButton
    onClick={handleMenuClose}
    size="small"
    sx={{
      position: 'absolute',
      top: 4,
      right: 4,
      color: (theme) => theme.palette.text.secondary,
      '&:hover': {
        backgroundColor: (theme) => theme.palette.action.hover,
      },
    }}
  >
    <CloseIcon fontSize="small" />
  </IconButton>

  <ProfilePopup open={anchorEl} logOut={logOut} close={handleMenuClose} />
</Box>

    </StyledMenu>
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      {/* <MenuItem>
        <IconButton size="small" color="inherit">
          <Badge badgeContent={4} color="error">
            <AssignmentTurnedInIcon fontSize="small" />
          </Badge>
        </IconButton>
        <Typography variant="caption" sx={{ ml: 1 }}>Tasks</Typography>
      </MenuItem>
      <MenuItem>
        <IconButton size="small" color="inherit">
          <Badge badgeContent={17} color="error">
            <NotificationsIcon fontSize="small" />
          </Badge>
        </IconButton>
        <Typography variant="caption" sx={{ ml: 1 }}>Notifications</Typography>
      </MenuItem> */}
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton size="small" color="inherit">
          <AccountCircle fontSize="small" />
        </IconButton>
        <Typography variant="caption" sx={{ ml: 1 }}>Profile</Typography>
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={(theme) => ({
          backgroundColor: theme.palette.topbar?.dark ,
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: '48px',
          mt:0.5
        })}
      >
        <Toolbar variant="dense" sx={{ minHeight: '44px', paddingY: 0.5 }}>
          <IconButton size="small" edge="start" color="inherit" onClick={handleOpenMainMenuSideBar} sx={{ mr: 1 }}>
            <MenuIcon fontSize="small" />
          </IconButton>

          <Box
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              backgroundColor: theme.palette.background.paper,
              px: 1,
              py: 0.3,
              borderRadius: 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            })}
            onClick={() => navigate('/dashboard')}
          >
           
            <Typography
              sx={(theme) => ({
                fontSize: theme.typography.caption.fontSize,
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: theme.palette.text.primary,
                textTransform: 'uppercase',
              })}
            >
              Audit System
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {/* <IconButton size="small" color="inherit">
              <Badge badgeContent={4} color="error">
                <AssignmentTurnedInIcon fontSize="small" />
              </Badge>
            </IconButton>
            <IconButton size="small" color="inherit">
              <Badge badgeContent={17} color="error">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton> */}
            <IconButton size="small" edge="end" onClick={handleProfileMenuOpen} color="inherit">
              <AccountCircle fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton size="small" onClick={handleMobileMenuOpen} color="inherit">
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {renderMobileMenu}
      {renderMenu}
    </Box>
  );
}

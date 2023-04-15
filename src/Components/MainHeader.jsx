import {
  Header,
  HeaderNavigation,
  HeaderGlobalBar,
  OverflowMenu,
  HeaderGlobalAction,
} from '@carbon/react';
import {
  User,
  DocumentAdd,
  InventoryManagement,
  Asleep,
  Menu,
} from '@carbon/icons-react';
import { useMediaQuery } from 'react-responsive';
import {
  CustomHeaderMenuItem,
  CustomHeaderName,
  CustomOverflowMenuItem,
} from './CustomCarbonNavigation';
import useAuth from '@/hooks/useAuth';
import useAppTheme from '@/hooks/useAppTheme';

function MainHeader({ toggleSideBar = null }) {
  const isOnMobile = useMediaQuery({ query: '(max-width: 1056px)' });
  const isOnSmallMobile = useMediaQuery({ query: '(max-width: 760px)' });

  const { user, logout } = useAuth();
  const [theme, setTheme] = useAppTheme();

  const url =
    'https://firebasestorage.googleapis.com/v0/b/arch-center.appspot.com/o/logo.png?alt=media&token=9f7ab576-c49a-40ec-879a-152942825667';
  const defaultURL =
    'https://firebasestorage.googleapis.com/v0/b/arch-center.appspot.com/o/default.png?alt=media&token=ae21c5b6-a2fc-4cd4-a83a-5ca7fb47a724';

  return (
    <Header aria-label='Amazing SwEng Project'>
      {isOnSmallMobile ? (
        <Menu
          size={24}
          style={{ marginLeft: '20px' }}
          onClick={() => {
            if (toggleSideBar) {
              toggleSideBar();
            }
          }}
        />
      ) : null}

      <CustomHeaderName href='/' prefix=''>
        <img
          alt=''
          src={url}
          style={isOnSmallMobile ? { maxWidth: '50px' } : { maxWidth: '50px', marginLeft: '15px', marginRight: '10px' }}
          onError={(event) => (event.target.style.display = defaultURL)}
        />
        {isOnSmallMobile ? null : <div>Project Showcase</div>}
      </CustomHeaderName>
      <HeaderNavigation aria-label='Amazing SwEng Project'>
        <CustomHeaderMenuItem href='/add'>
          Add new project
          <DocumentAdd
            style={{ marginLeft: '10px', top: '2px', position: 'relative' }}
          />
        </CustomHeaderMenuItem>
        {user?.isAdmin() && (
          <CustomHeaderMenuItem href='/adminpanel/dashboard'>
            Admin panel
            <InventoryManagement
              style={{ marginLeft: '10px', top: '2px', position: 'relative' }}
            />
          </CustomHeaderMenuItem>
        )}
      </HeaderNavigation>
      <HeaderGlobalBar>
        {isOnMobile && (
          <HeaderGlobalAction aria-label='Add new project' href='/add'>
            <DocumentAdd />
          </HeaderGlobalAction>
        )}
        <HeaderGlobalAction
          aria-label='Change Theme'
          onClick={() => {
            if (theme === 'white') setTheme('g100');
            else setTheme('white');
          }}
        >
          <Asleep />
        </HeaderGlobalAction>
        {user && (
          <OverflowMenu
            ariaLabel='user-options'
            size='lg'
            renderIcon={User}
            flipped={true}
            style={{ boxShadow: 'none' }}
            aria-label='My Account'
          >
            <CustomOverflowMenuItem itemText='My Account' href='/account' />
            <CustomOverflowMenuItem itemText='Log out' onClick={logout} />
          </OverflowMenu>
        )}
        {!user && (
          <HeaderNavigation aria-label='Account options'>
            <CustomHeaderMenuItem href='/signup'>Sign up</CustomHeaderMenuItem>
            <CustomHeaderMenuItem href='/login'>Log in</CustomHeaderMenuItem>
          </HeaderNavigation>
        )}
        {!user && isOnMobile && (
          <OverflowMenu
            ariaLabel='my-account'
            size='lg'
            renderIcon={User}
            flipped={true}
            style={{ boxShadow: 'none' }}
            aria-label='My Account'
          >
            <CustomOverflowMenuItem itemText='Log in' href='/login' />
            <CustomOverflowMenuItem itemText='Sign up' href='/signup' />
          </OverflowMenu>
        )}
      </HeaderGlobalBar>
    </Header>
  );
}

export default MainHeader;

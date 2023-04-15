import { NavLink } from 'react-router-dom';
import { SideNavLink } from '@carbon/react';

function CustomSideNavLink(props) {
    const { href, children, ...remainingProps } = props;

    return (
        <NavLink style={{ textDecoration: 'none' }} to={href}>
            {({ isActive }) => (
                <SideNavLink
                    style={{cursor: 'pointer'}}
                    isActive={isActive}
                    {...remainingProps}
                >
                    {children}
                </SideNavLink>
            )}
        </NavLink>
    );
}

export default CustomSideNavLink;
/* eslint-disable no-restricted-globals */
import { useNavigate } from 'react-router';
import { ClickableTile, HeaderGlobalAction, HeaderMenuItem, HeaderName, Link, OverflowMenuItem, SwitcherItem } from '@carbon/react';

function ComponentWrapper(props) {
    const { href, Component, children, ...remainingProps } = props;

    const checkDomain = url => {
        if ( url.indexOf('//') === 0 ) { 
            url = location.protocol + url; 
        }
        return url.toLowerCase().replace(/([a-z])?:\/\//,'$1').split('/')[0];
    };
    const isExternalURL = url => {
        return ((url.indexOf(':') > -1 || url.indexOf('//') > -1) && checkDomain(location.href) !== checkDomain(url));
    };

    const navigate = useNavigate();

    if(!href) {
        return <Component {...remainingProps}>{children}</Component>;
    }

    if(isExternalURL(href)) {
        return <Component href={href} {...remainingProps}>{children}</Component>;
    }

    return (
        <Component 
            onClick={() => navigate(href)}
            style={{cursor: 'pointer'}}
            {...remainingProps}
        >
            {children}
        </Component>
    );
}

export const CustomClickableTile = props => <ComponentWrapper Component={ClickableTile} {...props} />;
export const CustomHeaderGlobalAction = props => <ComponentWrapper Component={HeaderGlobalAction} {...props} />;
export const CustomHeaderMenuItem = props => <ComponentWrapper Component={HeaderMenuItem} {...props} />;
export const CustomHeaderName = props => <ComponentWrapper Component={HeaderName} {...props} />;
export const CustomLink = props => <ComponentWrapper Component={Link} {...props} />;
export const CustomSwitcherItem = props => <ComponentWrapper Component={SwitcherItem} {...props} />;
export const CustomOverflowMenuItem = props => <ComponentWrapper Component={OverflowMenuItem} {...props} />;
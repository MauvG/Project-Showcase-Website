import { forwardRef } from 'react';

import LoginFormGeneric from './LoginFormGeneric';
import { CustomLink } from './CustomCarbonNavigation';

function LoginFormPasswordStep(props, ref) {
    const { email, onSubmit, errorText, setErrorText } = props;

    const componentProps = {
        subheadingContentNode: <>Logging in as {email} <CustomLink href='/login'>Not you?</CustomLink></>,
        inputType: 'password',
        rememberIdCheckbox: false, 
        backLink: '/login',
        buttonText: 'Log in',
        onSubmit: onSubmit,
        errorText,
        setErrorText
    };

    return (
        <LoginFormGeneric {...componentProps} ref={ref} />
    );
}

export default forwardRef(LoginFormPasswordStep);
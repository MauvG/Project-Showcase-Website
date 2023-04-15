import { forwardRef } from 'react';

import LoginFormGeneric from './LoginFormGeneric';
import { CustomLink } from './CustomCarbonNavigation';

function LoginFormEmailStep(props, ref) {
    const { onSubmit } = props;

    const componentProps = {
        subheadingContentNode: <>Don't have an account? <CustomLink href='/signup'>Sign up</CustomLink></>,
        inputType: 'email',
        rememberIdCheckbox: true,
        backLink: '/',
        buttonText: 'Continue',
        onSubmit: onSubmit
    };

    return (
        <LoginFormGeneric {...componentProps} ref={ref} />
    );
}

export default forwardRef(LoginFormEmailStep);
import { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { TextInput } from '@carbon/react';

const GenericValidatedInput = forwardRef((props, ref) => {

    const { validate, validateOnChange = true, validateOnBlur = true, ...remainingProps } = props;

    const inputRef = useRef();
    useImperativeHandle(ref, () => ({
        validate: () => {
            return validate(inputRef.current.value, setInvalidText);
        },
        get value() {
            return inputRef.current.value;
        }
    }), [validate]);

    const [invalidText, setInvalidText] = useState(null);

    const validateWrapper = () => validate(inputRef.current.value, setInvalidText);

    return (
        <TextInput 
            invalid={Boolean(invalidText)}
            invalidText={invalidText}
            ref={inputRef}
            onBlur={validateOnBlur ? validateWrapper : () => {}}
            onChange={validateOnChange ? validateWrapper : () => {}}
            {...remainingProps}
        />
    );
});

const validateEmail = (value, setInvalidText) => {
    if(!value) {
        setInvalidText('Email is required');
        return false;
    }
    if(!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(value)) {
        setInvalidText('Enter a valid email address');
        return false;
    }
    setInvalidText(null);
    return true;
};

const validatePassword = (value, setInvalidText) => {
    if(!value) {
        setInvalidText('Password is required');
        return false;
    }
    if(value.length < 8) {
        setInvalidText('Password must be at least 8 characters');
        return false;
    }
    setInvalidText(null);
    return true;
};

const validateNewPassword = (value, setInvalidText) => {
    if(!value) {
        setInvalidText('Password is required');
        return false;
    }
    if(value.length < 8) {
        setInvalidText('Password must be at least 8 characters');
        return false;
    } 
    setInvalidText(null);
    return true;
};

const validateNewPasswordConfirmation = (value, setInvalidText, primaryRef) => {
    if(value !== primaryRef.current.value) {
        setInvalidText('Passwords do not match');
        return false;
    }
    setInvalidText(null);
    return true;
};

export const EmailInput = forwardRef((props, ref) => 
    <GenericValidatedInput 
        type='email'
        labelText='Email'
        validate={validateEmail}
        validateOnBlur={true}
        validateOnChange={false}
        ref={ref} 
        {...props} 
    />
);

export const PasswordInput = forwardRef((props, ref) => 
    <GenericValidatedInput 
        type='password'
        labelText='Password'
        validate={validatePassword}
        validateOnBlur={true}
        validateOnChange={false}
        ref={ref} 
        {...props} 
    />
);

export const NewPasswordInput = forwardRef((props, ref) => 
    <GenericValidatedInput 
        type='password'
        labelText='Password'
        validate={validateNewPassword}
        validateOnBlur={true}
        validateOnChange={false}
        ref={ref} 
        {...props} 
    />
);

export const NewPasswordConfirmationInput = forwardRef(({primaryRef, ...props}, ref) => 
    <GenericValidatedInput 
        type='password'
        labelText='Confirm password'
        validate={(value, setInvalidText) => {
            return validateNewPasswordConfirmation(value, setInvalidText, primaryRef);
        }}
        validateOnBlur={true}
        validateOnChange={true}
        ref={ref} 
        {...props} 
    />
);

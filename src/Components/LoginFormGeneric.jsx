import { useRef, useImperativeHandle, forwardRef } from 'react';
import { Tile, FluidForm, InlineNotification, Checkbox, Button } from '@carbon/react';
import { ArrowRight } from '@carbon/icons-react';
import styles from './LoginFormGeneric.module.scss';

import { EmailInput, PasswordInput } from './ValidatedInputs';

function LoginFormGeneric(props, ref) {
    const {subheadingContentNode, errorText, setErrorText, inputType, rememberIdCheckbox, backLink, buttonText, onSubmit} = props;

    const inputRef = useRef();
    const rememberIdCheckboxRef = useRef();
    useImperativeHandle(ref, () => ({
        validate: () => {
            return inputRef.current.validate();
        },
        get value() {
            return inputRef.current.value;
        },
        get rememberIdChecked() {
            return rememberIdCheckboxRef.current.checked;
        }
    }), []);

    const onSubmitWrapper = event => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <Tile className={styles.loginFormTile}>
            <FluidForm onSubmit={onSubmitWrapper}>
                <div className={styles.innerContainer}>
                    <p className={styles.heading}>Log in</p>
                    <p>{subheadingContentNode}</p>
                    
                    { errorText ?
                        <InlineNotification
                            title='Error:'
                            subtitle={errorText}
                            lowContrast={true}
                            className={styles.notification}
                            onCloseButtonClick={() => setErrorText(null)}
                        />
                        :
                        <div className={styles.notificationPlaceholder}></div>
                    }
                    
                    { inputType === 'email' &&
                        <EmailInput autoFocus className={styles.input} id='email' ref={inputRef} />
                    }
                    { inputType === 'password' &&
                        <PasswordInput autoFocus className={styles.input} id='password' ref={inputRef} />
                    }

                    { rememberIdCheckbox ?
                        <div><Checkbox labelText='Remember ID' id='remember-id-checkbox' defaultChecked={true} className={styles.checkbox} ref={rememberIdCheckboxRef} /></div> :
                        <div style={{visibility: 'hidden'}}><Checkbox labelText='Remember ID' id='remember-id-checkbox' className={styles.checkbox} /></div>
                    }
                    
                </div>
                <div className={styles.buttonContainer}>
                    <div className={styles.flexColumn}>
                        <Button href={backLink}>Back</Button>
                    </div>
                    <div className={styles.flexColumn}></div>
                    <div className={styles.flexColumn}>
                        <Button renderIcon={ArrowRight} className={styles.button} type='submit'>{buttonText}</Button>
                    </div>
                </div>
            </FluidForm>
        </Tile>
    );
}

export default forwardRef(LoginFormGeneric);
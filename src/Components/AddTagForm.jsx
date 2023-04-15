import { Button, Stack, TextInput } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { useRef } from 'react';

function AddTagForm(props) {
    const { onSubmit = () => { } } = props;

    const inputRef = useRef();

    const submitHandler = () => {
        if (inputRef.current.value) {
            onSubmit(inputRef.current.value);
            inputRef.current.value = '';
        }
    };

    return (
        <Stack orientation='horizontal' gap={3}>
            <TextInput id='tag-name' size='sm' labelText='Tag name' ref={inputRef} />
            <div style={{ width: 'fit-content', height: 'fit-content', marginTop: 'auto' }} >
                <Button size='sm' renderIcon={Add} hasIconOnly iconDescription='Add' onClick={submitHandler} />
            </div>
        </Stack>
    );
}

export default AddTagForm;
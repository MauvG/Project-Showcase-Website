import { Button, Stack, TextInput } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { useRef } from 'react';

function AddCategoryForm(props) {
    const { onSubmit = () => { } } = props;

    const inputRef = useRef();

    const submitHandler = () => {
        if (inputRef.current.value) {
            onSubmit(inputRef.current.value);
            inputRef.current.value = '';
        }
    };

    return (
        <div style={{ marginTop: '20px', width: '100%' }}>
            <Stack orientation='horizontal' gap={6}>
                <TextInput id='category-name' size='md' labelText='Category name' ref={inputRef} />
                <div style={{ width: 'fit-content', height: 'fit-content', marginTop: 'auto' }} >
                    <Button size='md' renderIcon={Add} hasIconOnly iconDescription='Add' onClick={submitHandler} />
                </div>
            </Stack>
        </div>
    );
}

export default AddCategoryForm;
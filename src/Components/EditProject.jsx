import axios from 'axios';
import { useEffect, useState, useRef  } from 'react';
import { Content, Form, TextInput, Stack, Tile, TextArea, Button, Tag, DatePicker, DatePickerInput, FormItem, FileUploaderDropContainer, FileUploaderItem } from '@carbon/react';
import { useNavigate } from 'react-router';
import { useMediaQuery } from 'react-responsive';

import { getUTCDateFromLocal } from '@/utils/dates';
import DocEditor from '@/Components/AsciidocEditor';
import styles from './EditProject.module.scss';

export default function EditProject({projectData, user, isEdit}) {

	const navigate = useNavigate();

	const [tags, setTags] = useState([]);
    const [date, setDate] = useState(projectData.date ? new Date(projectData.date) : getUTCDateFromLocal(new Date()));
    const tagColors = ['red', 'magenta', 'purple', 'blue', 'cyan', 'teal', 'green', 'gray', 'cool-gray', 'warm-gray', 'high-contrast'];

    const titleInputRef = useRef();
    const linkInputRef = useRef();
    const completionDateInputRef = useRef();
    const previewDescriptionInputRef = useRef();
    const contentInputRef = useRef();
    const [content, setContent] = useState(projectData.content);
    const [file, setFile] = useState();

    const isOnMobile = useMediaQuery({ query: '(max-width: 760px)' });

	useEffect(() => {
        if(!user) {
			navigate('/login', { replace: true });
		}
        try {
            axios.get('/tags').then(res => {
                const tempTags = res.data.map(categoryItem => categoryItem.tags).flat();
                if (isEdit) {
                    setTags(tempTags.map(item =>
                        (projectData.tags.some(selectedTag => selectedTag.tagId === item.tagId) ? { ...item, selected: true } : item)
                    ));
                } else {
                    setTags(tempTags);
                }
            });
        } catch (error) {
            console.error(error);
        }
    }, [navigate, user]);

    const handleFileChange = event => {
        if(event.target.files) {
          setFile(event.target.files[0]);
        }
    };

    const handleSubmit = async event => {
        event.preventDefault();
        const requestBody = {
            title: titleInputRef.current.value,
            link: linkInputRef.current.value,
            description: previewDescriptionInputRef.current.value,
            content: contentInputRef.current.value,
            completionDate: date.toISOString(),
            tags: tags.filter(item => item?.selected).map(item => item.tagId)
        };

        try {
            console.log(requestBody);
            if (isEdit) { // If editing an existing project
                //TODO image handling for edit requests, required changes in the backend
                await axios.put(`/user/project/${projectData.id}`, requestBody, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${user.accessToken}` } });
            } else {      // If creating a new project
                const formData = new FormData();
                formData.append('title', titleInputRef.current.value);
                formData.append('link', linkInputRef.current.value);
                formData.append('description', previewDescriptionInputRef.current.value);
                formData.append('content', contentInputRef.current.value);
                formData.append('completionDate', date.toISOString());
                formData.append('tags', tags.filter(item => item?.selected).map(item => item.tagId));
                if(file) formData.append('imageFile', file);
                await axios.post('/user/project', formData, { headers: { Authorization: `Bearer ${user.accessToken}` } });
            }
            navigate('/');
        } catch(error) {
            console.log(error);
        }
    };

    const handleTagAdd = tagId => {
        setTags(tags.map(item => 
            (item.tagId === tagId ? { ...item, selected: true } : item)
        ));
    };

    const handleTagRemove = tagId => {
        setTags(tags.map(item => 
            (item.tagId === tagId ? { ...item, selected: false } : item)
        ));
    };
    
    const [invalidText, setInvalidText] = useState(null);

    const validateLink = () => {
        if(!linkInputRef.current.value) {
            setInvalidText('Link is required');
            return false;
        }
        if(!/^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/.test(linkInputRef.current.value)) {
            setInvalidText('Enter a valid link');
            return false;
        }
        setInvalidText(null);
        return true;
    };

	return (
		<>
        <Content className={styles.contentBody}> 
            <Form onSubmit={handleSubmit}>
            <Stack gap={6}>
                <h1>Add New Project</h1>
                <TextInput labelText='Project Title' id='title' ref={titleInputRef} defaultValue={projectData.title} required />
                <TextInput labelText='Link to Project' placeholder='https://example.com' defaultValue={projectData.link} id='link' invalid={Boolean(invalidText)} invalidText={invalidText} ref={linkInputRef} onBlur={validateLink}/>
                {/*<TextInput labelText='Completion Date' id='date' ref={completionDateInputRef} placeholder='2023-01-01' />*/}
                <DatePicker datePickerType='single' dateFormat='d/m/Y' value={date} onChange={date => setDate(getUTCDateFromLocal(date))} style={{width: '100%'}}>
                    <DatePickerInput
                      placeholder='dd/mm/yyyy'
                      labelText='Completion Date'
                      id='date'
                      ref={completionDateInputRef}
                      style={isOnMobile? {margin: '0px', width: '85vw'}: {margin: '0px', width: '61vw'} }
                    />
                </DatePicker>

                <TextArea
                    labelText='Preview description'
                    rows={4}
                    id='previewDescription'
                    ref={previewDescriptionInputRef}
					defaultValue={projectData.description}
                    disabled={false}
                    placeholder='An omnichannel approach provides a unified customer experience across platforms, creating a single view for customers to interact with their own information.'
                />

                <Tile style={{padding: '20px'}}>
                    <h4 style={{marginBottom: '10px'}}>Add Tags</h4>
                    <div>
                        {tags.filter(item => !item?.selected).map(item => {
                            return (
                            <Tag
                                type={tagColors[item.categoryId % 10]}
                                title='Clear Filter'
                                key={item.tagId}
                                onClick={() => handleTagAdd(item.tagId)}
                            >
                                {item.tagName}
                            </Tag>
                            );
                        })}
                    </div>
                    <h4 style={{marginBottom: '10px', marginTop: '10px'}}>Currently selected</h4>
                    <div>
                        {tags.filter(item => item?.selected).map(item => {
                            return (
                            <Tag
                                type={tagColors[item.categoryId % 10]}
                                title='Clear Filter'
                                key={item.tagId}
                                onClick={() => handleTagRemove(item.tagId)}
                            >
                                {item.tagName}
                            </Tag>
                            );
                        })}
                    </div>
                </Tile>
                <Tile style={{paddingBottom: '0px', paddingTop: '10px', paddingRight: '0px'}}>
                    {/* <h4 style={{marginBottom: '10px'}}>Main Content</h4> */}
                    <DocEditor code={content} ref={contentInputRef} />
                </Tile>
                <Tile>
                {
                    file ?
                    <FileUploaderItem
                        name={file.name}
                        status='edit'
                        onDelete={() => setFile(null)}
                    />
                    :
                    <FormItem>
                        <p className='cds--file--label'>
                            Upload preview image
                        </p>
                        <p className='cds--label-description'>
                            Max file size is 50MB. Supported file types are .jpg and .png.
                        </p>
                        <FileUploaderDropContainer
                            accept={[
                                'image/jpeg',
                                'image/png'
                            ]}
                            innerRef={{
                                current: '[Circular]'
                            }}
                            labelText='Drag and drop files here or click to upload'
                            name=''
                            onAddFiles={handleFileChange}
                            onChange={handleFileChange}
                            tabIndex={0}
                            disabled={isEdit}
                        />
                        <div className='cds--file-container cds--file-container--drop' />
                    </FormItem>
                }
                </Tile>
                <Button type='submit'>Save</Button>
            </Stack>
            </Form>
        </Content>
		</>
	);
}
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Accordion, AccordionItem, Heading, Form, Stack, Dropdown, Checkbox, Button, Tag } from '@carbon/react';

import AddTagForm from '@/Components/AddTagForm';
import AddCategoryForm from '@/Components/AddCategoryForm';
import useAuth from '@/hooks/useAuth';

import styles from './ContentSettingsPage.module.scss';

function ContentSettingsPage() {

    const { user } = useAuth();

    const tagColors = ['red', 'magenta', 'purple', 'blue', 'cyan', 'teal', 'green', 'gray', 'cool-gray', 'warm-gray', 'high-contrast'];

    const items = [
        {
            id: 'everyone',
            text: 'Everyone',
        },
        {
            id: 'users',
            text: 'Users',
        },
        {
            id: 'admins',
            text: 'Admins',
        }
    ];

    const [tags, setTags] = useState([]);

    const fetchTags = () => {
        axios.get('/tags').then(res => {
            setTags(res.data);
        })
            .catch(err => {
                console.log(err);
            });
    };

    useEffect(fetchTags, []);

    const handleAddTag = async (categoryId, tagName) => {
        const newTag = {
            tagName: tagName,
            tagNameShort: tagName,
            categoryId: categoryId
        };
        const response = await axios.post('/admin/tag', newTag, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${user.accessToken}` } });
        fetchTags();
        console.log(response.data.categoryId, response.data.tagName);
    };

    const handleDeleteTag = async (tag) => {
        const currentId = tag.tagId;
        await axios.delete(`/admin/tag/${currentId}`, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${user.accessToken}` } });
        fetchTags();
        console.log('deleted tag');
    };

    const handleAddCategory = async (categoryName) => {
        const newCategory = {
            categoryName: categoryName
        };
        const response = await axios.post('/admin/category', newCategory, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${user.accessToken}` } });
        fetchTags();
        console.log(response.data.categoryId, response.data.categoryName);
    };

    const handleDeleteCategory = async (category) => {
        const currentId = category.categoryId;
        await axios.delete(`/admin/category/${currentId}`, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${user.accessToken}` } });
        fetchTags();
        console.log('deleted category');
    };

    return (
        <>
            <Heading style={{ marginBottom: '20px' }}>Content Settings</Heading>
            <Form>
                <Stack gap={5} className={styles.stackContainer}>
                    <Dropdown
                        id='inline'
                        titleText='Who can add new projects'
                        label='Who can add new projects'
                        initialSelectedItem={items[1]}
                        type='inline'
                        items={items}
                        itemToString={(item) => (item ? item.text : '')}
                        disabled={true}
                    />
                    <Checkbox
                        labelText='New projects have to be approved by an admin'
                        id='new-projects-approved-checkbox'
                        checked={true}
                        disabled={true}
                    />
                    <Checkbox
                        labelText='Project edits have to be approved by an admin'
                        id='project-edits-approved-checkbox'
                        checked={true}
                        disabled={true}
                    />
                    <Button style={{ marginTop: '10px', marginBottom: '50px' }} disabled={true}>Save</Button>
                </Stack>
            </Form>
            <Heading style={{ marginBottom: '20px' }}>Project Tags</Heading>
            <Accordion style={{ maxWidth: '400px' }}>
                {tags.map(category =>
                    <AccordionItem key={category.categoryId} title={category.categoryName}>
                        <div style={{ width: '100%' }}>
                            <Stack gap={5}>
                                <div style={{ 'fontSize': '12px' }}>Click on a tag to delete...</div>
                                <div>
                                    {category.tags.map(tag =>
                                        <Tag
                                            type={tagColors[tag.categoryId % 10]}
                                            title='Clear Filter'
                                            key={tag.tagId}
                                            onClick={() => handleDeleteTag(tag)}>
                                            {tag.tagName}
                                        </Tag>
                                    )}
                                </div>
                                <AddTagForm onSubmit={tagName => handleAddTag(category.categoryId, tagName)} />
                                <Button kind='danger' size='sm' onClick={() => handleDeleteCategory(category)}>
                                    Delete category
                                </Button>
                            </Stack>
                        </div>
                    </AccordionItem>

                )}
            </Accordion>
            <AddCategoryForm onSubmit={categoryName => handleAddCategory(categoryName)} />
        </>
    );
}

export default ContentSettingsPage;
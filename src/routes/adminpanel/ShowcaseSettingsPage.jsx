import { Heading, FileUploader, Form, Stack, Button, Tile, Modal } from '@carbon/react';
import { useState, useEffect } from 'react';
import { storage } from './../../firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { Upload, TrashCan } from '@carbon/icons-react';

import axios from 'axios';
import useAuth from '@/hooks/useAuth';

import FeaturedCard from '@/Components/FeaturedCard';

function ShowcaseSettingsPage() {

    const [headerImage, setHeaderImage] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [featuredProject, setFeaturedProject] = useState();
    const { user } = useAuth();
    const [reload, setReload] = useState(false);

    useEffect(() => {
        let flag = false;
        axios.get('/project/featured').then(res => {
            flag = true;
            setFeaturedProject(res.data);
            console.log(res.data);
        })
        .catch(err => {
            console.log(err);
        });
        if (!flag) {
            setFeaturedProject(null);
        }
    }, [reload]);

    const url = 'https://firebasestorage.googleapis.com/v0/b/arch-center.appspot.com/o/logo.png?alt=media&token=9f7ab576-c49a-40ec-879a-152942825667';
    const uploadImage = () => {
        if (headerImage == null) return;
        const imageRef = ref(storage, 'logo.png');
        uploadBytes(imageRef, headerImage).then((snapshot) => {
            window.location.reload(true);
        });
    };

    async function handleDeleteFeaturedProject() {
        const requestConfig = { 
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json', 
                'Authorization': `Bearer ${user.accessToken}` 
            } 
        };
        try {
            console.log('trying');
            await axios.delete('/project/featured', requestConfig);
        } catch(error) {
            console.log(error);
        }
        setModalOpen(false);
        setReload((reload) => !reload);
    }

    return (
        <>
        <Modal open={modalOpen}
            size='sm'
            modalHeading='Are you sure you want to remove the featured project? No featured
                          project will be visible in the showcase until you set a new one.'
            modalLabel='Remove Featured Project'
            primaryButtonText='Confirm'
            secondaryButtonText='Cancel'
            onRequestClose={() => setModalOpen(false)}
            onRequestSubmit={() => handleDeleteFeaturedProject()}
        />
        <Heading style={{marginBottom: '20px'}}>Showcase Settings</Heading>
        <Form>
            <Stack gap={5}>
                <Tile style = {{maxWidth: '500px', paddingBottom: '10px', marginBottom: '5px '}}>
                    <img alt='' src={url} style={{maxWidth: '100%', marginBottom: '10px'}} onError={(event) => event.target.style.display = 'none'} />
                    <FileUploader
                        labelTitle='Upload header image'
                        labelDescription='Max file size is 10mb. Only .png files are supported.'
                        buttonLabel='Select image'
                        buttonKind='secondary'
                        filenameStatus='edit'
                        accept={['.png']}
                        multiple={false}
                        disabled={false}
                        iconDescription='Delete file'
                        name=''
                        onChange={(event) => {
                            setHeaderImage(event.target.files[0]);
                        }}
                    />
                    <Button onClick={uploadImage} size='lg' renderIcon={Upload} style={{marginBottom: '10px'}}>Update Logo</Button>
                </Tile>
                <Heading style={{marginBottom: '10px'}}>Remove featured project</Heading>
                { featuredProject ? <Tile style = {{maxWidth: '500px', paddingBottom: '10px', marginBottom: '5px '}}>
                    <FeaturedCard project={featuredProject} />
                    <Button size='lg' renderIcon={TrashCan} kind='danger' onClick={() => setModalOpen(true)} style={{marginTop: '15px', marginBottom: '5px'}}>Remove</Button>
                </Tile> :
                <div style={{marginBottom: '20px'}}>
                    There is currently no featured project. Go to 'Manage projects' to set one.
                </div>}
            </Stack>
        </Form>
        </>
    );
}

export default ShowcaseSettingsPage;
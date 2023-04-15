import MainHeader from '@/Components/MainHeader';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import axios from 'axios';
import useAuth from '@/hooks/useAuth';
import EditProject from '../Components/EditProject';

function EditProjectPage() {

    const { user } = useAuth();
    const { projectId } = useParams();
    const isEditPage = true;

    const [isLoading, setIsLoading] = useState(true);
    const [project, setProject] = useState();

    useEffect(() => {
        axios.get(`/project/${projectId}`).then(res => {
            setProject(res.data);
            setIsLoading(false);
        })
        .catch(err => {
            console.log(err);
        });
    }, [projectId]);

    return (
        <>
        <MainHeader />
        { isLoading ? <div>Loading...</div> : 
            <EditProject projectData={project} user={user} isEdit={isEditPage}/>
        }
        </>
    );
}

export default EditProjectPage;
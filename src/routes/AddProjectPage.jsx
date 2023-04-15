import MainHeader from '@/Components/MainHeader';
import EditProject from '@/Components/EditProject';

import useAuth from '@/hooks/useAuth';

function AddProjectPage() {

    const { user } = useAuth();

    const project = {
        title: null,
        link: null,
        description: null,
        content: null,
        date: null,
        tags: []
    };

    return (
        <>
            <MainHeader />
            <EditProject projectData={project} user={user} isEdit={false}/>
        </>
    );
}

export default AddProjectPage;
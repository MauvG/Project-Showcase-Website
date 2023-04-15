//import { Heading } from '@carbon/react';
import { DataTable, TableContainer, TableToolbar, TableBatchActions, TableBatchAction, Dropdown,
    TableToolbarContent, TableToolbarSearch, Table, TableHead,
    TableHeader, TableRow, TableSelectAll, TableBody, TableSelectRow, TableCell, Pagination, Modal, Button } from '@carbon/react';
import { TrashCan, Edit, DataCheck, CheckmarkOutline, Star, StarFilled } from '@carbon/icons-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

import { useNavigate } from 'react-router';
import useAuth from '@/hooks/useAuth';

import { CustomLink } from '@/Components/CustomCarbonNavigation';



function ManageProjectsPage() {

    const [projects, setProjects] = useState([]);
    const [dangerModalOpen, setDangerModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [numberOfEntries, setNumberOfEntries] = useState();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All projects');
    const [passiveModalOpen, setPassiveModalOpen] = useState(false);
    const { user } = useAuth();



    function onLoad() {
        if(!user) {
            navigate('/login', { replace: true });
            return;
        }
        const requestConfig = { 
            params: {
                page: page,
                per_page: pageSize
            },
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json', 
                'Authorization': `Bearer ${user.accessToken}` 
            } 
        };
        axios.get('/admin/projects', requestConfig).then(res => {
            let projects = [];
            if (filter === 'All projects') {
                projects = res.data;
                setNumberOfEntries(parseInt(res.headers['x-total-count']));
            } else if (filter === 'Approved projects') {
                projects = res.data.filter((project) => project.is_live);
                setNumberOfEntries(projects.length);
            } else if (filter === 'Pending approval') {
                projects = res.data.filter((project) => !project.is_live);
                setNumberOfEntries(projects.length);
            }
            setProjects(projects);
        })
        .catch(err => {
            console.log(err);
        });
    }

    useEffect(onLoad, [navigate, user, page, pageSize, filter]);

    const headers = [
        {
            header: 'Project',
            key: 'title'
        },
        {
            header: 'Date Added',
            key: 'date'
        },
        {
            header: 'Description',
            key: 'description'
        },
        {
            header: 'Tags',
            key: 'tags'
        },
        {
            header: 'Visit Count',
            key: 'visit_count'
        },
        {
            header: 'Approval status',
            key: 'is_live'
        },
        {
            header: 'Featured',
            key: 'is_featured'
        }
    ];


    function handleCell(cell) {
        if (cell.info.header ==='date') {
            return cell.value.slice(0,10);
        } else if (cell.info.header ==='tags') {
            let first = true;
            let currentTag =''; 
            return cell.value.map(tag => {
                currentTag = first ? tag.tagName : ', ' + tag.tagName;
                first = false;
                return currentTag;
            });
        } else if (cell.info.header === 'title') {
            return <CustomLink href={`/details/${cell.id.substring(0, cell.id.indexOf(':'))}`}>{cell.value}</CustomLink>;
        } else if (cell.info.header === 'is_live')  {
            if (cell.value) {
                return <Button kind='ghost' style={{color: '#00b200'}} renderIcon={CheckmarkOutline}>Approved</Button>;
            } else {
                const newCell = {...cell,
                            id: cell.id.substring(0, cell.id.indexOf(':'))};
                return <Button kind='ghost' onClick={() => handleApproveProject([newCell])} renderIcon={DataCheck}>Approve</Button>;
            } 
        } else if (cell.info.header === 'is_featured') {
            if (cell.value) {
                return <Button kind='ghost' style={{color: '#d5a100'}} renderIcon={StarFilled}>Featured</Button>;
            } else {
                const newCell = {...cell,
                    id: cell.id.substring(0, cell.id.indexOf(':'))};
                return <Button kind='ghost' onClick={() => handleSetFeaturedProject(newCell)} renderIcon={Star}>Set as Featured</Button>;
            }
        } else return cell.value;
    }


    function handleDelete(selectedProjects) {
        const requestConfig = { 
            params: {
                page: page,
                per_page: pageSize
            },
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json', 
                'Authorization': `Bearer ${user.accessToken}` 
            } 
        };
        selectedProjects.map(async(project) => {
            const currentId = project.id;
            try {
                await axios.delete(`/user/project/${currentId}`, requestConfig);
                onLoad();
                //window.location.reload(true);
            } catch(error) {
                console.log(error);
            }
        });
        setDangerModalOpen(false);
    }

    const handlePaginationChange = event => {
        setPage(event.page);
        setPageSize(event.pageSize);
    };


    function handleModifyProject(selectedRows) {
        if (selectedRows.length === 1) {
            const projectId = selectedRows[0].id;
            navigate(`/edit/${projectId}`);
        }
    }

    function handleApproveProject(selectedProjects) {
        console.log(selectedProjects);
        const requestConfig = { 
            params: {
                page: page,
                per_page: pageSize
            },
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json', 
                'Authorization': `Bearer ${user.accessToken}` 
            } 
        };
        selectedProjects.map(async(project) => {
            const currentId = project.id;
            let toApprove = {};
            try {
                console.log(currentId);
                await axios.get(`/user/project/${currentId}`, requestConfig).then(res => {
                    toApprove = res.data;
                    console.log(toApprove);
                });
            } catch(error) {
                console.log(error);
            } if (!toApprove.is_live) {
                try {
                    await axios.put(`/user/project/${currentId}`, {is_live: true}, requestConfig);
                    onLoad();
                    //window.location.reload(true);
                } catch(error) {
                    console.log(error);
                }
            }
        });
    }

    async function handleSetFeaturedProject(selectedProject) {
        console.log(selectedProject);
        const requestConfig = { 
            params: {
                page: page,
                per_page: pageSize
            },
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json', 
                'Authorization': `Bearer ${user.accessToken}` 
            } 
        };
        try {
            console.log(selectedProject.id);
            await axios.put(`/project/featured/${selectedProject.id}`, {}, requestConfig);
            onLoad();
            //window.location.reload(true);
        } catch(error) {
            console.log(error);
        }
    }   



    return (

        <>
        <Dropdown
            id='approval-status-filter'
            label={filter}
            titleText='Choose which projects to display'
            items={['All projects', 'Approved projects', 'Pending approval']}
            size='md'
            onChange={(label) => setFilter(label.selectedItem)}
        />
        <DataTable headers={headers} rows={projects} >
            {({
                rows,
                headers,
                getHeaderProps,
                getRowProps,
                getSelectionProps,
                getToolbarProps,
                getBatchActionProps,
                onInputChange,
                selectedRows,
                getTableProps,
                getTableContainerProps,
            }) => {
            const batchActionProps = getBatchActionProps();

            return (
                <TableContainer
                title='Projects'
                description='List of all current projects'
                {...getTableContainerProps()}>

                <Modal open={dangerModalOpen}
                    danger
                    size='sm'
                    modalHeading='Are you sure you want to delete the selected projects? This action is irreversible.'
                    modalLabel='Delete Projects'
                    primaryButtonText='Delete'
                    secondaryButtonText='Cancel'
                    onRequestClose={() => setDangerModalOpen(false)}
                    onRequestSubmit={() => handleDelete(selectedRows)}
                />
                <Modal
                    open = {passiveModalOpen}
                    passiveModal
                    size='sm'
                    modalHeading='Unable to modify multiple projects at once'
                    modalLabel='Error'
                    onRequestClose={() => setPassiveModalOpen(false)}>
                    <p>Please select only one project to modify at a time.</p>
                </Modal>
                    <TableToolbar >
                        <TableBatchActions {...batchActionProps}>
                            <TableBatchAction {...getToolbarProps({onClick: () => setDangerModalOpen(modalOpen => !modalOpen)})}
                                tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                renderIcon={TrashCan}
                                >
                                Delete
                            </TableBatchAction>
                            <TableBatchAction {...getToolbarProps({onClick: () => (selectedRows.length) > 1 ? setPassiveModalOpen(true) : handleModifyProject(selectedRows)})}
                                tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                renderIcon={Edit}
                                >
                                Modify
                            </TableBatchAction>
                            <TableBatchAction {...getToolbarProps({onClick: () => handleApproveProject(selectedRows)})}
                                tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                renderIcon={CheckmarkOutline}
                                >
                                Approve
                            </TableBatchAction>
                        </TableBatchActions>
                        <TableToolbarContent aria-hidden={batchActionProps.shouldShowBatchActions}>
                            <TableToolbarSearch
                                tabIndex={batchActionProps.shouldShowBatchActions ? -1 : 0}
                                onChange={onInputChange}
                                persistent
                            />
                        </TableToolbarContent>
                    </TableToolbar>
                    
                    <Table {...getTableProps()}>
                        <TableHead>
                        <TableRow>
                            <TableSelectAll {...getSelectionProps()} />
                            {headers.map((header, i) => (
                            <TableHeader key={i} {...getHeaderProps({ header })}>
                                {header.header}
                            </TableHeader>
                            ))}
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {rows.map((row, i) => (
                            <TableRow key={rows.id} {...getRowProps({ row })}>
                            <TableSelectRow {...getSelectionProps({ row })} />
                            {row.cells.map((cell) => (
                                <TableCell key={cell.id}>
                                    {handleCell(cell)}
                                </TableCell>
                            ))}
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    <Pagination 
                        backwardText='Previous page'
                        forwardText='Next page'
                        itemsPerPageText='Items per page:'
                        onChange={handlePaginationChange}
                        page={page}
                        pageSize={pageSize}
                        pageSizes={[10, 15, 25, 50 ]}
                        size='lg'
                        totalItems={numberOfEntries}
                    />
                </TableContainer>
            );
            }}
        </DataTable>
        </>
    );
}

export default ManageProjectsPage;
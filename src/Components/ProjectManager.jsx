import { DataTable, TableContainer, TableToolbar, TableBatchActions, TableBatchAction, 
    TableToolbarContent, TableToolbarSearch, Table, TableHead, 
    TableHeader, TableRow, TableSelectAll, TableBody, TableSelectRow, TableCell, Pagination, Modal} from '@carbon/react';
import { TrashCan, Edit } from '@carbon/icons-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ProjectManager.module.scss';
import { useNavigate } from 'react-router';
import useAuth from '@/hooks/useAuth';

export default function ProjectManager({userID}) {

	const [projects, setProjects] = useState([]);
    const [dangerModalOpen, setDangerModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [numberOfEntries, setNumberOfEntries] = useState();
    const navigate = useNavigate();

    const [passiveModalOpen, setPassiveModalOpen] = useState(false);

    const { user } = useAuth();


    useEffect(() => {
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
        if (!userID) {
            axios.get('/user/projects', requestConfig).then(res => {
                const projects = res.data;
                setProjects(projects);
                setNumberOfEntries(parseInt(res.headers['x-total-count']));
            })
            .catch(err => {
                console.log(err);
            });
        } else {
            console.log('UserID received', userID);
            axios.get(`/admin/user/${userID}/projects`, requestConfig).then(res => {
                const projects = res.data;
                setProjects(projects);
                setNumberOfEntries(parseInt(res.headers['x-total-count']));
            })
            .catch(err => {
                console.log(err);
            });
        } 
    }, [navigate, user, page, pageSize, userID]);


    const headers = [
        {
            header: 'Project',
            key: 'title'
        },
        {
            header: 'ID',
            key: 'id'
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
        }
    ];


    function handleCell(cell) {
        if (cell.info.header ==='date') {
            return cell.value.slice(0,10);
        } 
        if (cell.info.header ==='tags') {
            let first = true;
            let currentTag =''; 
            return cell.value.map(tag => {
                currentTag = first ? tag.tagName : ', ' + tag.tagName;
                first = false;
                return currentTag;
            });
        } else return cell.value;
    }


    function handleDelete(selectedProjects) {
        selectedProjects.map(async(project) => {
            const currentId = project.id;
            try {
                console.log(currentId);
                await axios.delete(`/user/project/${currentId}`, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${user.accessToken}` } });
                window.location.reload(true);
            } catch(error) {
                console.log(error);
            }
        });
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

    return (

        <>
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
                className={styles.container}
                title='My Projects'
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
                                Modify Project
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
                                    {(cell.info.header==='date'||cell.info.header==='tags') ? handleCell(cell) : cell.value}
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
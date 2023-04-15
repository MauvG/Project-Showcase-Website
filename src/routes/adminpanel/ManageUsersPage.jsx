import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { Button, DataTable, TableContainer, TableToolbar, TableBatchActions, TableBatchAction, 
    TableToolbarContent, TableToolbarSearch, Table, TableHead, TableHeader, TableRow, 
    TableSelectAll, TableBody, TableSelectRow, TableCell, Pagination, Modal } from '@carbon/react';
import { Cube, TrashCan, UserRole } from '@carbon/icons-react';

import styles from './ManageUsersPage.module.scss';

import ModalBulkUserDeletion from '@/Components/ModalBulkUserDeletion';

import useAuth from '@/hooks/useAuth';
import { isAdminRole } from '@/utils/User';
import ProjectManager from '../../Components/ProjectManager';

function ManageUsersPage() {

    const headers = [
        {
            header: 'Email',
            key: 'email'
        },
        {
            header: 'Username',
            key: 'username'
        },
        {
            header: 'Signup date',
            key: 'signupDate'
        },
        {
            header: 'Role',
            key: 'role'
        },
        {
            header: 'Number of projects',
            key: 'numberOfProjects'
        },
        {
            header: 'Actions',
            key: 'actions'
        },
    ];

    const navigate = useNavigate();

    const deletionModalRef = useRef();

    const { user } = useAuth();

    const [data, setData] = useState([]);
    const [userID, setUserID] = useState();
    const [numberOfEntries, setNumberOfEntries] = useState();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [projectsModalOpen, setProjectsModalOpen] = useState(false);

   

    function onload() {
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
        axios.get('/admin/users', requestConfig).then(res => {
            const data = res.data.map(user => ({ 
                ...user, 
                signupDate: new Date(user.created_at).toISOString().substring(0, 10),
                role: isAdminRole(user.role) ? 'admin' : 'user',
                numberOfProjects: user.projects_counts.total_count,
                actions:    <> 
                            <Button kind='ghost' renderIcon={Cube} onClick={() => handleProjectsModal(user.id)}>Projects</Button>
                            <Button kind='ghost' renderIcon={UserRole} onClick={() => handleRoleChange(user)}>Change role</Button>
                            <Button kind='danger--ghost' renderIcon={TrashCan} onClick={() => handleUserDelete(user)}>Delete</Button>
                            </>
            }));
            setData(data);
            setNumberOfEntries(parseInt(res.headers['x-total-count']));
        })
        .catch(err => {
            console.log(err);
        });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(onload, [navigate, page, pageSize, user]);

    const handlePaginationChange = event => {
        setPage(event.page);
        setPageSize(event.pageSize);
    };

    const handleProjectsModal = (tempID) => {
        setUserID(tempID);
        setProjectsModalOpen(true);
        console.log(tempID);
    };

    const handleRoleChange = async selectedUser => {
        const currentID = selectedUser.id;
        try {
            if (selectedUser.role === 0) {
                await axios.put(`/user/update/${currentID}`, { role: 1 }, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${user.accessToken}` } });
            } else {
                await axios.put(`/user/update/${currentID}`, { role: 0 }, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${user.accessToken}` } });
            }
            onload();
        } catch(error) {
            console.log(error);
        }
    };

    const handleUserDelete = async selectedUser => {
        const currentID = selectedUser.id;
        try {
            await axios.delete(`/user/delete/${currentID}`, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${user.accessToken}` } });
            onload();
        } catch(error) {
            console.log(error);
        }
    };

    return (
        <>
        <DataTable headers={headers} rows={data} >
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
                title='Users'
                description='List of all currently registered users'
                {...getTableContainerProps()}>

                    <TableToolbar {...getToolbarProps()}>
                        <TableBatchActions {...batchActionProps}>
                            <TableBatchAction
                                tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                onClick={() => {
                                    deletionModalRef.current.open(selectedRows.map(row => row.id));
                                }}
                                renderIcon={TrashCan}
                                >
                                Delete
                            </TableBatchAction>
                            <TableBatchAction
                                tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                renderIcon={UserRole}
                                >
                                Change user role
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
                                header.key === 'actions' ?
                                <TableHeader key={i} {...getHeaderProps({ header })} className={styles.actionsHeaderCell}>
                                    {header.header}
                                </TableHeader> :
                                <TableHeader key={i} {...getHeaderProps({ header })}>
                                    {header.header}
                                </TableHeader>
                            ))}
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {rows.map((row, i) => (
                            <TableRow key={i} {...getRowProps({ row })}>
                            <TableSelectRow {...getSelectionProps({ row })} />
                            {row.cells.map((cell) => (
                                cell.info.header === 'actions' ?
                                <TableCell key={cell.id} className={styles.actionsCell}>{cell.value}</TableCell> :
                                <TableCell key={cell.id}>{cell.value}</TableCell>
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
        <ModalBulkUserDeletion users={data} onConfirm={selectedIds => console.log(selectedIds)} ref={deletionModalRef} />
        <Modal
            open={projectsModalOpen}
            passiveModal
            modalLabel='View Projects'
            onRequestClose={() => setProjectsModalOpen(false)}
            >
            <ProjectManager userID={userID} />
        </Modal>

        </>
    );
}

export default ManageUsersPage;
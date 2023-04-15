import { useState, useImperativeHandle, forwardRef } from 'react';
import { Modal, StructuredListWrapper, StructuredListHead, StructuredListRow, 
    StructuredListCell, StructuredListBody } from '@carbon/react';

function ModalBulkUserDeletion(props, ref) {
    const { users, onConfirm } = props;

    const [open, setOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useImperativeHandle(ref, () => ({
        open: selectedIds => {
            setOpen(true);
            setSelectedIds(selectedIds);
        }
    }), []);

    const handleClose = () => {
        setOpen(false);
        setSelectedIds([]);
    };

    const handleSubmit = () => {
        onConfirm(selectedIds);
        setOpen(false);
    };

    return (
        <Modal
            danger
            open={open} 
            onRequestClose={handleClose}
            onRequestSubmit={handleSubmit}
            modalHeading='Are you sure you want to delete the following users?'
            modalLabel='User deletion'
            primaryButtonText='Delete'
            secondaryButtonText='Cancel'
        >
            <StructuredListWrapper>
                <StructuredListHead>
                  <StructuredListRow head>
                    <StructuredListCell head noWrap>
                      Email
                    </StructuredListCell>
                    <StructuredListCell head noWrap>
                      Username
                    </StructuredListCell>
                    <StructuredListCell head noWrap>
                      Role
                    </StructuredListCell>
                  </StructuredListRow>
                </StructuredListHead>
                <StructuredListBody>
                    { users.filter(user => selectedIds.includes(user.id)).map(user => 
                        <StructuredListRow key={user.id}>
                            <StructuredListCell noWrap>{user.email}</StructuredListCell>
                            <StructuredListCell noWrap>{user.username}</StructuredListCell>
                            <StructuredListCell noWrap>{user.role}</StructuredListCell>
                        </StructuredListRow>
                    )}
                </StructuredListBody>
              </StructuredListWrapper>
        </Modal>
    );
}

export default forwardRef(ModalBulkUserDeletion);
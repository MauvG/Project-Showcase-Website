import { Content, Tile, TextInput, IconButton, Modal} from '@carbon/react';
import { Edit} from '@carbon/icons-react';
import MainHeader from '@/Components/MainHeader';
import { useNavigate } from 'react-router';
import styles from './MyAccountPage.module.scss';
import axios from 'axios';
import useAuth from '@/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { PasswordInput } from '@/Components/ValidatedInputs';
import ProjectManager from '../../Components/ProjectManager';

function MyAccountPage() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState(null);
    const [date, setDate] = useState(null);
    const [userID, setID] = useState(null);
    // const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [passwordModalOpen, setPassModalOpen] = useState(false);
    // const emailInputRef = useRef();
    const passwordInputRef = useRef();

    useEffect(() => {
        if(!user) {
            navigate('/login', { replace: true });
            const noUserEmail = 'example@example.com';
            setUserEmail(noUserEmail);
            setDate('0000-00-00');
        } else {
            axios.get('/user/info', { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${user.accessToken}` } }).then(res => {
                setUserEmail(res.data.email);
                setDate(res.data.created_at.slice(0, 10));
                setID(res.data.id);
                // console.log(res.data);
            })
            .catch(err => {
                console.log(err);
            }); 
        }

    }, [navigate, user]);

    // const handleEmailChange = (newEmail) => {
    //     try {
    //         axios.put(`/user/update/${userID}`, { email: newEmail }, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${user.accessToken}` } });
    //         logout();
    //     } catch(error) {
    //         console.log(error);
    //     }
    // };

    const handlePassChange = (newPassword) => {
        try {
            axios.put(`/user/update/${userID}`, { password: newPassword }, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${user.accessToken}` } });
            logout();
        } catch(error) {
            console.log(error);
        }
    };

    return (
        <>
            <div style={{minWidth: '440px'}}>
            <MainHeader/>
           
            <Content style={{maxWidth: '1200px', marginLeft:'auto', marginRight: 'auto'}}>
            <h1 className={styles.mainHeading}>My Account</h1>
                <Tile style={{paddingTop: '0px', paddingBottom: '40px', marginBottom: '15px'}} className={styles.mainContainer}>
                        <div className={styles.mainText}>
                            <p>Email</p>
                            <TextInput
                                labelText=''
                                id='email'
                                className={styles.textBox} 
                                defaultValue={userEmail}
                                readOnly={true}
                                size='lg'
                            />
                            {/* <IconButton className={styles.icon} label='Edit' kind='ghost' onClick={() => setEmailModalOpen(true)} >
                                Update Email<Edit style={{marginLeft: '10px'}}/>
                            </IconButton> */}
                        </div>
            
                        <div className={styles.mainText}>
                            <p>Password</p>
                            <TextInput
                                labelText=''
                                id='password'
                                className={styles.textBox} 
                                defaultValue='password'
                                readOnly={true}
                                type='password'
                                size='lg'
                            />
                            <IconButton className={styles.icon} label='Edit' kind='ghost' onClick={() => setPassModalOpen(true)} >
                                Change Password<Edit style={{marginLeft: '10px'}}/>
                            </IconButton>
                        </div>
            
                        <div className={styles.mainText}>
                            <p>Account Created Date</p>
                            <TextInput
                                labelText=''
                                id='account-created-date'
                                className={styles.textBox} 
                                defaultValue={date}
                                readOnly={true}
                                type='text'
                                size='lg'
                            />
                        </div>
                        {/* <Modal
                            open={emailModalOpen}
                            modalHeading='Change your account email'
                            modalLabel='Account Preferences'
                            primaryButtonText='Update Email'
                            secondaryButtonText='Cancel'
                            onRequestClose={() => setEmailModalOpen(false)}
                            onRequestSubmit={() => handleEmailChange(emailInputRef.current.value)}
                            >
                            <EmailInput
                              data-modal-primary-focus
                              id='text-input-1'
                              labelText='Email'
                              placeholder={userEmail}
                              ref={emailInputRef}
                            />
                        </Modal> */}
                        <Modal
                            open={passwordModalOpen}
                            modalHeading='Change your account password'
                            modalLabel='Account Preferences'
                            primaryButtonText='Update Password'
                            secondaryButtonText='Cancel'
                            onRequestClose={() => setPassModalOpen(false)}
                            onRequestSubmit={() => handlePassChange(passwordInputRef.current.value)}
                            >
                            <PasswordInput
                              data-modal-primary-focus
                              id='text-input-1'
                              labelText='Password'
                              placeholder='Enter your new password'
                              ref={passwordInputRef}
                            />
                        </Modal>
                </Tile>
                <div style={{marginBottom: '30px'}}>
                <ProjectManager/>
                </div>
                
            </Content>
            </div>
        </>
    );
}

export default MyAccountPage;

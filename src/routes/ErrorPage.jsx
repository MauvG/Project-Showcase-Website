import { Content, Heading } from '@carbon/react';
import MainHeader from '@/Components/MainHeader';
import styles from './ErrorPage.module.scss';
import { useRouteError } from 'react-router-dom';

function ErrorPage() {
    const error = useRouteError();
    // console.log(error);
    return (
        <>
         <MainHeader />
            <Content className={styles.mainContainer}>
                    <Heading className={styles.notFound}>{error.status} {error.statusText}!</Heading>
                    <p>{error.error?.message}</p>
                    <p>Please click <a href='/'>here</a> to return to the Home Page.</p>
            </Content>
        </>
    );
}

export default ErrorPage;

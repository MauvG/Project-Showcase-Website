import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import axios from 'axios';
import MainHeader from '@/Components/MainHeader';
import { Tile, Content, Grid, Column, Tag, Button } from '@carbon/react';
import { Link, Growth} from '@carbon/icons-react';
import Asciidoctor from 'asciidoctor';
import styles from './ProjectDetails.module.scss';
import { useMediaQuery } from 'react-responsive';

const asciidoctor = Asciidoctor();

function ProjectDetails() {

    const tagColors = ['red', 'magenta', 'purple', 'blue', 'cyan', 'teal', 'green', 'gray', 'cool-gray', 'warm-gray', 'high-contrast'];
    const { projectId } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [project, setProject] = useState();
    const [date, setDate] = useState(new Date());
    const isOnMobile = useMediaQuery({ query: '(max-width: 671px)' });

    useEffect(() => {
        axios.get(`/project/${projectId}`).then(res => {
            setProject(res.data);
            setDate((new Date(res.data.date)).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}));
            setIsLoading(false);
        })
        .catch(err => {
            console.log(err);
        });
    }, [projectId]);

    return (
        <>
            <MainHeader />
            <Content className={styles.contentBox}>
                { isLoading ? <div>Loading...</div> : 
                    <>
                    <Grid>
                        <Column sm={4} md={2} lg={4} className={isOnMobile ? styles.mobileGrid : styles.normalGrid}>
                        <Tile className={styles.tileContainer}>
                            <img src={`http://localhost:5297/api/v1/project/${projectId}/image`} style={{width:'100%', maxWidth: '600px',marginBottom: '15px'}} alt='Project'
                            onError={event => event.target.style.display = 'none'} />
                            <h5 style={{marginBottom: '5px'}}>Description</h5>
                            <div style={{fontSize: '100%', marginBottom: '15px'}}>{project.description}</div>
                            <h5 style={{marginBottom: '5px'}}>Completion Date</h5>
                            <div style={{fontSize: '100%', marginBottom: '15px'}}>{date}</div>
                            <h5 style={{marginBottom: '5px'}}>Tags</h5>
                            <div className='tags' style={{marginBottom: '20px'}}>
                                {project.tags.map(tagItem => 
                                    <Tag type={tagColors[tagItem.categoryId % 10]} title='Clear Filter' key={tagItem.tagId}>{tagItem.tagName}</Tag>
                                )}
                            </div>
                            <Button href={project.link} size='md' kind='tertiary' renderIcon={Link} style={{width: '100%', maxWidth: '100%'}}>Link to Project</Button>
                        </Tile>
                        </Column>
                        <Column sm={4} md={6} lg={12} style={isOnMobile ? {} : {marginLeft: '15px', marginBottom: '20px', marginRight: '0px'}} >
                            <Tile className={styles.titleBox}>
                                <h2>{project.title}</h2>
                                <Tag type='outline' renderIcon={Growth} className={isOnMobile ? styles.featuredTagMobile : styles.featuredTag}>{project.visit_count} Views</Tag>
                            </Tile>
                            
                            <div className={styles.descriptionBody} dangerouslySetInnerHTML={{ __html: asciidoctor.convert(project.content) }} />
                            
                        </Column>
                    </Grid>
                    </>
                }
            </Content>
        </>
    );
}

export default ProjectDetails;
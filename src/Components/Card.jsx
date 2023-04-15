import { Tag } from '@carbon/react';
import styles from './Card.module.scss';

import { CustomClickableTile, CustomLink } from './CustomCarbonNavigation';

export default function Card({ projectData }) {

	const tagColors = ['red', 'magenta', 'purple', 'blue', 'cyan', 'teal', 'green', 'gray', 'cool-gray', 'warm-gray', 'high-contrast'];

	return (
		<CustomClickableTile className={styles.tile} href={`./details/${projectData.id}`} >
			{/* <img src={CARD_IMG_URL + projectData.Image1Url} className='cardImage' /> */}
			<img src={`http://localhost:5297/api/v1/project/${projectData.id}/image`} alt='Project' className={styles.cardImage}
				onError={event => event.target.style.display = 'none'} />
			<CustomLink size='lg' className={styles.titleLink}>{projectData.title}</CustomLink>
			<p className={styles.description}>{projectData.description}</p>
			<div className={styles.tags}>
				{projectData.tags.map(tagItem =>
					<Tag type={tagColors[tagItem.categoryId % 10]} title='Clear Filter' style={{ marginLeft: '0px', marginRight: '5px' }} key={tagItem.tagId}>{tagItem.tagName}</Tag>
				)}
			</div>
		</CustomClickableTile>
	);
}
import { Tag } from '@carbon/react';
import styles from './Card.module.scss';
import { Star } from '@carbon/icons-react';

import { CustomClickableTile, CustomLink } from './CustomCarbonNavigation';

export default function FeaturedCard({ project, isOnMobile }) {
  const tagColors = [
    'red',
    'magenta',
    'purple',
    'blue',
    'cyan',
    'teal',
    'green',
    'gray',
    'cool-gray',
    'warm-gray',
    'high-contrast',
  ];

  return (
    <>
      <CustomClickableTile
        className={isOnMobile ? styles.featuredTileMobile : styles.featuredTile}
        href={`/details/${project.id}`}
      >
        <CustomLink size='lg' className={styles.titleLink}>
          {project.title}
        </CustomLink>
        <Tag
          type='red'
          className={isOnMobile ? styles.featuredTagMobile : styles.featuredTag}
          renderIcon={Star}
        >
          FEATURED PROJECT
        </Tag>
        <p className={styles.description}>{project.description}</p>
        <div className={styles.tags}>
          {project.tags.map((tagItem) => (
            <Tag
              type={tagColors[tagItem.categoryId % 10]}
              title='Clear Filter'
              style={{ marginLeft: '0px', marginRight: '5px' }}
              key={tagItem.tagId}
            >
              {tagItem.tagName}
            </Tag>
          ))}
        </div>
      </CustomClickableTile>
    </>
  );
}

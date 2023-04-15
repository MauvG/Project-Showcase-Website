import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import {
  SideNav,
  Stack,
  Search,
  Accordion,
  AccordionItem,
  Checkbox,
  DatePicker,
  DatePickerInput,
  Tile,
  Toggle,
  Button,
} from '@carbon/react';
import { TrashCan } from '@carbon/icons-react';
import styles from './ProjectQuerySidePanel.module.scss';
import { useMediaQuery } from 'react-responsive';

import { getUTCDateFromLocal } from '@/utils/dates';
import { filter } from 'd3';

function ProjectQuerySidePanel(props, ref) {
  const {
    menuContent,
    onChange,
    getExpandedState,
    toggleExpandedState,
    setExpandedStateToFalse,
  } = props;
  const selectedTagListRef = useRef([]);
  const [selectedTagList, setSelectedTagList] = useState([]);
  const isOnMobile = useMediaQuery({ query: '(max-width: 760px)' });

  const [startDate, setStartDate] = useState(getUTCDateFromLocal(new Date()));
  const [endDate, setEndDate] = useState(getUTCDateFromLocal(new Date()));
  const [filterDate, setFilterDate] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      get selectedTagList() {
        return selectedTagListRef.current;
      },
    }),
    []
  );

  const handleFilterChange = (event) => {
    const { checked, id } = event.target;
    if (checked) {
      const newState = [...selectedTagList, id];
      selectedTagListRef.current = newState;
      setSelectedTagList(newState);
    } else {
      const newState = selectedTagList.filter((item) => item !== id);
      selectedTagListRef.current = newState;
      setSelectedTagList(newState);
    }
    onChange();
  };

  const handleSearch = (event) => {
    onChange();
  };

  useEffect(() => {
    if (isOnMobile) {
      setExpandedStateToFalse();
    }
  }, [isOnMobile]);

  //   const applyDateFilterChanges = () => {
  //     setDateFilter({
  //       on: !filterDate,
  //       startDate: startDate,
  //       endDate: endDate,
  //     });
  //     onChange();
  //   };

  return (
    <SideNav
      className='sideNav1'
      isFixedNav
      expanded={getExpandedState()}
      isChildOfHeader={false}
      aria-label='Search and filter'
    >
      <Stack gap={5} className={styles.innerContainer}>
        {isOnMobile ? null : (
          <Search
            id='searchBox'
            labelText='Search'
            placeholder='Search'
            onChange={handleSearch}
          />
        )}

        {menuContent && (
          <Accordion>
            {menuContent.map((item, index) => (
              <AccordionItem title={item.title} key={index}>
                <fieldset className='cds--fieldset'>
                  {item.tags.map((tagItem, index) => (
                    <Checkbox
                      labelText={tagItem.name}
                      id={tagItem.id}
                      checked={selectedTagList.includes(tagItem.id)}
                      onChange={handleFilterChange}
                      key={index}
                    />
                  ))}
                </fieldset>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        <Tile style={{ border: '1px solid gray', height: '240px'}}>
          <DatePicker
            style={{ marginBottom: '20px' }}
            datePickerType='single'
            dateFormat='d/m/Y'
            value={startDate}
            onChange={(date) => {
              setStartDate(getUTCDateFromLocal(date));
              //   applyDateFilterChanges();
            }}
          >
            <DatePickerInput
              id='date-picker-input-id-start'
              placeholder='dd/mm/yyyy'
              labelText='Start date'
              size='sm'
              style={{ width: '100%' }}
            />
          </DatePicker>
          <DatePicker
            style={{ marginBottom: '20px' }}
            datePickerType='single'
            dateFormat='d/m/Y'
            value={endDate}
            onChange={(date) => {
              setEndDate(getUTCDateFromLocal(date));
              //   applyDateFilterChanges();
            }}
          >
            <DatePickerInput
              id='date-picker-input-id-finish'
              placeholder='dd/mm/yyyy'
              labelText='End date'
              size='sm'
              style={{ width: '100%' }}
            />
          </DatePicker>
          <Toggle
            labelText='Apply Date Filter'
            labelA='Off'
            labelB='On'
            id='toggle-1'
            size='sm'
            onToggle={(event) => {
              setFilterDate(event);
              //   applyDateFilterChanges();
            }}
          />
        </Tile>
      </Stack>

      <div style={{width: '100%', position: 'absolute', bottom: '0px'}}>
        <Button
          kind='secondary'
          style={isOnMobile ? {width: '50%'} : {width: '100%'}}
          renderIcon={TrashCan}
          onClick={() => {
            setSelectedTagList([]);
            selectedTagListRef.current = [];
            onChange();
          }}
        >
          Clear
        </Button>
        {isOnMobile ? (
          <Button
            style={{ width: '50%'}}
            kind='primary'
            onClick={() => {
              toggleExpandedState();
            }}
          >
            Apply
          </Button>
        ) : null}
      </div>
    </SideNav>
  );
}

export default forwardRef(ProjectQuerySidePanel);

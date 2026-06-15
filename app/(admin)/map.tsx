import React, { useEffect, useState} from 'react';
import { StyleSheet, View, Text } from 'react-native';
// 1. Import your dropdown component (Adjust the folder path to where you saved it!)
import AreaDropdown, { DropdownItem } from '@/components/areaDropdown'; 
import NodalGraph from '@/components/NodalGraph';
import { ReportButton } from '@/components/ReportButton';

import { s } from 'react-native-size-matters';

import { MOCK_DATABASE_BY_AREA, SupabaseLandmarkPayload } from '@/constants/mockData';


export default function IndexScreen() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>("area-1");
  const [mapData, setMapData] = useState<SupabaseLandmarkPayload[]>([]);

   useEffect(() => {
       if (selectedAreaId && MOCK_DATABASE_BY_AREA[selectedAreaId]) {
         // Mimics running your: const data = await fetchMapDataByArea(selectedAreaId)
         setMapData(MOCK_DATABASE_BY_AREA[selectedAreaId]);
       } else {
         setMapData([]);
       }
     }, [selectedAreaId]);
  
  // 2. Define your list data exactly matching your mockup
  const areaData: DropdownItem[] = [
    { label: 'Area 1', value: 'area_1' },
    { label: 'Area 2', value: 'area_2' },
    { label: 'Area 3', value: 'area_3' },
    { label: 'Area 4', value: 'area_4' },
    { label: 'Area 5', value: 'area_5' },
    { label: 'Area 6', value: 'area_6' },
    { label: '+ Add New', value: 'add_new' }, // Handles your add button
  ];

  // 3. Handle what happens when a user clicks an area
  const handleAreaSelect = (item: DropdownItem) => {
    if (item.value === 'add_new') {
      console.log('Open modal or prompt to add a new area!');
    } else {
      console.log('User selected:', item.label);
    }
  };

  const handleReportPress = () => console.log('Report clicked!');



  return (
    <View style={styles.container}>

        <View style = {styles.dropdownContainer}>
          {/* Dropdown Component nested*/}
                  <AreaDropdown 
                  data={areaData} 
                  placeholder="CHOOSE AREA" 
                  onSelect={handleAreaSelect} 
                  />
        </View>

        <View style = {styles.graphWindow}>
          <Text style={{ color: 'white' }}>Node and Graph Area (The Blue Square)</Text>
                  {/* PASS THE DATA STATE DOWN TO THE GRAPH COMPONENT */}
                  <NodalGraph mapData={mapData} />
        </View>

        <View style = {styles.buttonWrapper}>
          <ReportButton onPress = {handleReportPress}/>
        </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#EFFAFF', // Using the soft background color from your Figma image
    padding: 20,
  },
  dropdownContainer: {
    // CRITICAL: zIndex ensures the dropdown menu renders OVER the graph
    zIndex: 10, 
    marginBottom: 20, // Space between dropdown and graph
    justifyContent: 'center',
  },
  buttonWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,             // Spacing directly under the blue graph window
    marginBottom: 10,          // Spacing between the button and the nav bar
  },
  placeholderDropdown: {
    height: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  graphWindow: {
    flex: 1, // Fills the rest of the available space
    backgroundColor: '#B6D7E8', // The "blue square"
    borderRadius: 0,
    borderColor: '#6D6D6D',
    borderWidth: 3,
    
    // CRITICAL: This is what creates the "window" effect. 
    // Anything drawn outside the bounds of this View is clipped.
    overflow: 'hidden', 
    
    // Optional: Centering content inside for now
    justifyContent: 'center', 
    alignItems: 'center',
    margin: s(5),
  }
});

 
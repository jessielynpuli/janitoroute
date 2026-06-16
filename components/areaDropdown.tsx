import React, { useState, useEffect} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 1. Define the exact structure of a single dropdown option
export interface DropdownItem {
  label: string;
  value: string | number;
}

// 2. Define the exact types for the Component's Props
interface AreaDropdownProps {
  data: DropdownItem[];
  //value: string | null;
  placeholder: string;
  onSelect?: (item: any) => void;
  selectedValue: string | null;
}

export default function AreaDropdown({ data, placeholder, onSelect, selectedValue }: AreaDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [headerText, setHeaderText] = useState(placeholder);
  // 3. Explicitly tell the state it holds a DropdownItem object or null
  const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null);


  // Keep the display header in sync with whatever the smart screen selects
  useEffect(() => {
    if (selectedValue) {
      const activeItem = data.find(item => String(item.value) === String(selectedValue));
      if (activeItem) {
        setHeaderText(activeItem.label);
        return;
      }
    }
    setHeaderText(placeholder);
  }, [selectedValue, data]);


  const handleSelect = (item: DropdownItem) => {
    setSelectedItem(item);
    setIsOpen(false);
    if (onSelect) onSelect(item);
  };

  return (
    <View style={styles.container}>
      {/* Dropdown Header Box */}
      <TouchableOpacity 
        style={styles.dropdownHeader} 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.9}
      >
       
        <Text style={[styles.headerText, !selectedItem && styles.headerText]} >
          {selectedItem ? selectedItem.label : placeholder} 
        </Text>
         <MaterialCommunityIcons 
             name={isOpen ? "chevron-up" : "chevron-down"} 
             size={32} 
             color="#555555" 
            />
      </TouchableOpacity>

      {/* Expanded List Options */}
      {isOpen && (
        <View style={styles.dropdownListContainer}>
          <FlatList
            data={data}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }: { item: DropdownItem }) => (
              <TouchableOpacity 
                style={styles.optionItem} 
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
            nestedScrollEnabled={true} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1000, 
    marginBottom: 16,
  },
  dropdownHeader: {
    paddingVertical: 5,
    backgroundColor: '#D9D9D9',
    borderWidth: 3,
    borderColor: '#6D6D6D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  headerText: {
    fontSize: 18,
    color: '#6D6D6D',
    fontFamily: 'Dropdown-Placeholder',
    flexShrink: 1,
  },
  dropdownListContainer: {
    backgroundColor: '#B6D7E8',
    borderWidth: 3,
    borderColor: '#6D6D6D',
    borderRadius: 0,
    marginTop: 2,
    maxHeight: 200, 
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  optionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#6D6D6D',
  },
  optionText: {
    fontSize: 20,
    fontFamily: 'Dropdown-Options',
    color: '#6D6D6D',
  },
});
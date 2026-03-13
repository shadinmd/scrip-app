import React, { useState, useMemo } from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Text } from './text';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';

interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  onClose: () => void;
  visible: boolean;
  minDate?: string; // YYYY-MM
  maxDate?: string; // YYYY-MM
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthPicker = ({ value, onChange, onClose, visible, minDate, maxDate }: MonthPickerProps) => {
  const [currentYear, setCurrentYear] = useState(parseInt(value.split('-')[0]));
  const currentMonth = parseInt(value.split('-')[1]) - 1;

  const { minYear, minMonth, maxYear, maxMonth } = useMemo(() => {
    let minYear = 1900, minMonth = 0, maxYear = 2100, maxMonth = 11;
    
    if (minDate) {
      const [y, m] = minDate.split('-').map(Number);
      minYear = y!;
      minMonth = m! - 1;
    }
    if (maxDate) {
      const [y, m] = maxDate.split('-').map(Number);
      maxYear = y!;
      maxMonth = m! - 1;
    }
    
    return { minYear, minMonth, maxYear, maxMonth };
  }, [minDate, maxDate]);

  const handleSelectMonth = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, '0');
    onChange(`${currentYear}-${formattedMonth}`);
    onClose();
  };

  const isMonthDisabled = (monthIndex: number) => {
    if (currentYear < minYear || currentYear > maxYear) return true;
    if (currentYear === minYear && monthIndex < minMonth) return true;
    if (currentYear === maxYear && monthIndex > maxMonth) return true;
    return false;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose}
        className="flex-1 bg-black/60 justify-center items-center px-6"
      >
        <TouchableOpacity 
          activeOpacity={1}
          className="w-full bg-card rounded-[32px] border border-border p-6 shadow-2xl"
        >
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold">Select Month</Text>
            <TouchableOpacity onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full bg-muted">
              <XIcon size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Year Selector */}
          <View className="flex-row justify-between items-center mb-8 bg-muted/30 p-2 rounded-2xl">
            <TouchableOpacity 
              onPress={() => setCurrentYear(prev => prev - 1)}
              disabled={currentYear <= minYear}
              className={`h-10 w-10 items-center justify-center ${currentYear <= minYear ? 'opacity-20' : ''}`}
            >
              <ChevronLeftIcon size={20} color="#fff" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-primary">{currentYear}</Text>
            <TouchableOpacity 
              onPress={() => setCurrentYear(prev => prev + 1)}
              disabled={currentYear >= maxYear}
              className={`h-10 w-10 items-center justify-center ${currentYear >= maxYear ? 'opacity-20' : ''}`}
            >
              <ChevronRightIcon size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Month Grid */}
          <View className="flex-row flex-wrap gap-2 justify-between">
            {MONTHS.map((month, index) => {
              const isSelected = currentMonth === index && parseInt(value.split('-')[0]) === currentYear;
              const disabled = isMonthDisabled(index);
              
              return (
                <TouchableOpacity
                  key={month}
                  onPress={() => handleSelectMonth(index)}
                  disabled={disabled}
                  className={`w-[31%] py-4 rounded-xl items-center border ${
                    isSelected ? 'bg-primary border-primary' : 'bg-muted/20 border-transparent'
                  } ${disabled ? 'opacity-10' : ''}`}
                >
                  <Text className={`text-xs font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {month.substring(0, 3).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

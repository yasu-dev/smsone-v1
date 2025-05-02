import React, { useState, useEffect, useRef } from 'react';
import { Globe, Phone, ChevronDown, Search, X } from 'lucide-react';
import { countries, popularCountries } from '../../data/countries';
import { Country } from '../../types';
import useAuthStore from '../../store/authStore';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string, isInternational: boolean, countryCode?: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowInternational?: boolean;
  initialCountryCode?: string;
  userType?: 'domestic' | 'international' | 'both';
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  allowInternational,
  initialCountryCode = 'JP',
  userType = 'domestic'
}) => {
  const { hasPermission } = useAuthStore();
  const canUseInternational = allowInternational !== undefined ? allowInternational : hasPermission('internationalSms');

  const getPlaceholder = () => {
    if (!placeholder) {
      switch (userType) {
        case 'domestic':
          return '例: 09012345678(国内)';
        case 'international':
          return '例: +819012345678(国際)';
        case 'both':
          return '例: 09012345678(国内)、+819012345678(国際)';
        default:
          return '例: 09012345678';
      }
    }
    return placeholder;
  };

  const [inputValue, setInputValue] = useState(value);
  const [isInternational, setIsInternational] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(countries);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const japanCountry = countries.find(c => c.code === 'JP') || countries[0];
    const initialCountry = initialCountryCode ? 
      countries.find(c => c.code === initialCountryCode) || japanCountry : 
      japanCountry;
    setSelectedCountry(initialCountry);
  }, [initialCountryCode]);
  
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);
  
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCountries(countries);
      return;
    }
    
    const filtered = countries.filter(country => 
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredCountries(filtered);
  }, [searchTerm]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
        setSearchTerm('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const formattedValue = isInternational && selectedCountry 
      ? `${selectedCountry.dialCode} ${newValue}`.trim()
      : newValue;
    
    onChange(formattedValue, isInternational, selectedCountry?.code);
  };
  
  const toggleInternational = () => {
    if (!canUseInternational) return;
    
    const newIsInternational = !isInternational;
    setIsInternational(newIsInternational);
    
    if (newIsInternational && selectedCountry) {
      onChange(`${selectedCountry.dialCode} ${inputValue}`.trim(), newIsInternational, selectedCountry.code);
    } else {
      onChange(inputValue, newIsInternational);
    }
    
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };
  
  const selectCountry = (country: Country) => {
    setSelectedCountry(country);
    setCountryDropdownOpen(false);
    setSearchTerm('');
    
    if (isInternational) {
      onChange(`${country.dialCode} ${inputValue}`.trim(), true, country.code);
    }
  };
  
  const isDomesticNumber = (value: string) => {
    const japanesePhonePattern = /^0[7-9]0[0-9]{8}$|^0[7-9]0-[0-9]{4}-[0-9]{4}$/;
    return japanesePhonePattern.test(value.replace(/\s/g, ''));
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative flex">
        <input
          type="tel"
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={getPlaceholder()}
          required={required}
          disabled={disabled}
          className="form-input w-full"
        />
      </div>
      
      {isInternational && inputValue && (
        <div className="mt-1 text-xs flex items-center">
          <div className={`inline-flex items-center rounded-full px-2 py-0.5 ${
            isDomesticNumber(inputValue) ? 'bg-warning-100 text-warning-800' : 'bg-primary-100 text-primary-800'
          }`}>
            <Globe className="h-3 w-3 mr-1" />
            {selectedCountry?.name} 
            <span className="mx-1">•</span> 
            {`${selectedCountry?.dialCode} ${inputValue}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneNumberInput;
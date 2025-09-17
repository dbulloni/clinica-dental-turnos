import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Phone, FileText, X } from 'lucide-react';
import Input from '../UI/Input';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import LoadingSpinner from '../UI/LoadingSpinner';
import { usePatientSearch } from '../../hooks/usePatients';
import { useDebounce } from '../../hooks/useDebounce';
import { Patient } from '../../types';

interface PatientSearchProps {
  onSelectPatient?: (patient: Patient) => void;
  placeholder?: string;
  showFullResults?: boolean;
  className?: string;
}

const PatientSearch: React.FC<PatientSearchProps> = ({
  onSelectPatient,
  placeholder = "Buscar pacientes por nombre, documento o teléfono...",
  showFullResults = false,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { data: searchResults, isLoading } = usePatientSearch(
    debouncedQuery,
    debouncedQuery.length >= 2
  );

  const patients = searchResults?.data || [];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || patients.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < patients.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : patients.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < patients.length) {
            handleSelectPatient(patients[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, patients, selectedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(-1);
  };

  const handleSelectPatient = (patient: Patient) => {
    setQuery(`${patient.firstName} ${patient.lastName}`);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelectPatient?.(patient);
  };

  const handleClearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const formatPatientInfo = (patient: Patient) => {
    const age = patient.dateOfBirth 
      ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
      : null;
    
    return {
      name: `${patient.firstName} ${patient.lastName}`,
      info: [
        patient.document,
        patient.phone,
        age ? `${age} años` : null,
      ].filter(Boolean).join(' • '),
    };
  };

  return (
    <div ref={searchRef} className={`relative ${className || ''}`}>
      <Input
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        startIcon={<Search className="w-4 h-4" />}
        endIcon={
          query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          )
        }
        autoComplete="off"
      />

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-600">Buscando...</span>
            </div>
          ) : patients.length > 0 ? (
            <div className="py-1">
              {patients.map((patient, index) => {
                const { name, info } = formatPatientInfo(patient);
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                      ${isSelected ? 'bg-primary-50 border-l-2 border-primary-500' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {name}
                          </p>
                          <Badge 
                            variant={patient.isActive ? 'success' : 'secondary'}
                            size="sm"
                          >
                            {patient.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <FileText className="w-3 h-3" />
                            <span>{patient.document}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{patient.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : debouncedQuery.length >= 2 ? (
            <div className="px-4 py-6 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No se encontraron pacientes</p>
              <p className="text-xs mt-1">
                Intenta con otro término de búsqueda
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;
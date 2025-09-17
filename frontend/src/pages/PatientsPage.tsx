import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  RefreshCw
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import EmptyState from '../components/UI/EmptyState';
import PatientForm from '../components/Patients/PatientForm';
import PatientList from '../components/Patients/PatientList';
import PatientSearch from '../components/Patients/PatientSearch';
import PatientDetailsModal from '../components/Patients/PatientDetailsModal';
import { usePatients } from '../hooks/usePatients';
import { useDebounce } from '../hooks/useDebounce';
import { Patient, PatientFilters, PaginationParams } from '../types';

const PatientsPage: React.FC = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PatientFilters>({
    isActive: undefined,
  });
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'firstName',
    sortOrder: 'asc',
  });
  
  // Modal states
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build query parameters
  const queryParams = useMemo(() => ({
    ...pagination,
    ...filters,
    ...(debouncedSearch && { search: debouncedSearch }),
  }), [pagination, filters, debouncedSearch]);

  // Fetch patients data
  const { data, isLoading, refetch } = usePatients(queryParams);
  const patients = data?.data?.data || [];
  const paginationMeta = data?.data?.pagination;

  // Event handlers
  const handleNewPatient = () => {
    setEditingPatient(null);
    setPatientFormOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setPatientFormOpen(true);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientDetailsOpen(true);
  };

  const handlePatientFormSuccess = (patient: Patient) => {
    refetch();
    setPatientFormOpen(false);
    setEditingPatient(null);
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setPagination(prev => ({
      ...prev,
      sortBy: key,
      sortOrder: direction,
      page: 1, // Reset to first page when sorting
    }));
  };

  const handleFilterChange = (newFilters: Partial<PatientFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSearchSelect = (patient: Patient) => {
    // When a patient is selected from search, view their details
    handleViewPatient(patient);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ isActive: undefined });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = searchQuery || filters.isActive !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600">
            Gestiona la información de los pacientes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Actualizar
          </Button>
          
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleNewPatient}
          >
            Nuevo Paciente
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <Card.Body>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <PatientSearch
                  onSelectPatient={handleSearchSelect}
                  placeholder="Buscar pacientes por nombre, documento o teléfono..."
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filtros:</span>
                </div>
                
                <select
                  value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange({
                      isActive: value === 'all' ? undefined : value === 'true',
                    });
                  }}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>

              {/* Stats */}
              {paginationMeta && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    Total: <Badge variant="secondary">{paginationMeta.total}</Badge>
                  </span>
                  <span>
                    Página {paginationMeta.page} de {paginationMeta.totalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Content */}
      <Card>
        <Card.Body>
          {patients.length === 0 && !isLoading ? (
            <EmptyState
              icon={Users}
              title={hasActiveFilters ? "No se encontraron pacientes" : "No hay pacientes registrados"}
              description={
                hasActiveFilters 
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "Comienza registrando tu primer paciente para gestionar sus turnos."
              }
              action={
                hasActiveFilters 
                  ? {
                      label: "Limpiar filtros",
                      onClick: clearFilters,
                    }
                  : {
                      label: "Registrar Paciente",
                      onClick: handleNewPatient,
                    }
              }
            />
          ) : (
            <>
              <PatientList
                patients={patients}
                loading={isLoading}
                onEditPatient={handleEditPatient}
                onViewPatient={handleViewPatient}
                sortKey={pagination.sortBy}
                sortDirection={pagination.sortOrder}
                onSort={handleSort}
              />

              {/* Pagination */}
              {paginationMeta && paginationMeta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    Mostrando {((paginationMeta.page - 1) * paginationMeta.limit) + 1} a{' '}
                    {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} de{' '}
                    {paginationMeta.total} pacientes
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(paginationMeta.page - 1)}
                      disabled={!paginationMeta.hasPrev}
                    >
                      Anterior
                    </Button>
                    
                    <span className="text-sm text-gray-600">
                      {paginationMeta.page} / {paginationMeta.totalPages}
                    </span>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(paginationMeta.page + 1)}
                      disabled={!paginationMeta.hasNext}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <PatientForm
        isOpen={patientFormOpen}
        onClose={() => {
          setPatientFormOpen(false);
          setEditingPatient(null);
        }}
        patient={editingPatient}
        onSuccess={handlePatientFormSuccess}
      />

      <PatientDetailsModal
        isOpen={patientDetailsOpen}
        onClose={() => {
          setPatientDetailsOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        onEdit={(patient) => {
          setPatientDetailsOpen(false);
          handleEditPatient(patient);
        }}
      />
    </div>
  );
};

export default PatientsPage;